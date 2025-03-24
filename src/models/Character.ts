import * as THREE from "three";
import { getGltfInfoByUrl, getRandomColor } from "../util";
import { characterGroupName } from "../constant";

interface MoveState {
  target: THREE.Vector3 | null;
  speed: number;
  idleTime: number;
  waitTime: number;
}

interface PathPoint {
  position: THREE.Vector3;
  timestamp: number;
}

interface CharacterActions {
  idle: THREE.AnimationAction | null;
  walk: THREE.AnimationAction | null;
  run: THREE.AnimationAction | null;
  [key: string]: THREE.AnimationAction | null;
}

interface CharacterOptions {
  isNPC?: boolean;
  modelUrl?: string;
  color?: THREE.Color;
}

enum CharacterState {
  IDLE = "idle",
  WALKING = "walk",
  RUNNING = "run",
}

const characterPath = "models/new.glb";

export class Character extends THREE.Group {
  public isNPC: boolean;
  public name: string = "";
  public moveState: MoveState;
  public movementPath: PathPoint[];
  public maxPathLength: number;
  public pathUpdateInterval: number;
  public lastPathUpdate: number;
  private groupName: string = characterGroupName;

  // 模型相关属性
  public model: THREE.Group | null;
  public mixer: THREE.AnimationMixer | null;
  public actions: CharacterActions;
  public currentAction: THREE.AnimationAction | null;
  public color: THREE.Color;
  constructor(options: CharacterOptions = {}) {
    super();

    // 设置角色类型和颜色
    this.isNPC = options.isNPC || false;
    this.color = options.color || getRandomColor();
    // 角色状态初始化
    this.moveState = {
      target: null,
      speed: 2,
      idleTime: 0,
      waitTime: Math.random() * 2 + 1,
    };

    // 轨迹记录
    this.movementPath = [];
    this.maxPathLength = 1000; // 最大记录点数
    this.pathUpdateInterval = 0.1; // 记录间隔（秒）
    this.lastPathUpdate = 0;
    this.model = null;
    this.mixer = null;
    this.initCharacter(options);
  }

  private async initCharacter(options: CharacterOptions) {
    const { model, animations } = await getGltfInfoByUrl(characterPath);
    this.model = model;
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material.color = this.color;
      }
    });
    this.setModelAnimation(this.model, animations);
    this.add(this.model);
  }

  private updateMoveState(moveState: Partial<MoveState>) {
    this.moveState = Object.assign(this.moveState, moveState);
  }

  private setModelAnimation(
    model: THREE.Group,
    animations: THREE.AnimationClip[]
  ) {
    this.mixer = new THREE.AnimationMixer(model);
    const animationMap = new Map<string, THREE.AnimationClip>();
    animations.forEach((anim) => {
      const animName = anim.name.toLowerCase();
      switch (animName) {
        case CharacterState.IDLE:
          animationMap.set(CharacterState.IDLE, anim);
          break;
        case CharacterState.WALKING:
          animationMap.set(CharacterState.WALKING, anim);
          break;
        case CharacterState.RUNNING:
          animationMap.set(CharacterState.RUNNING, anim);
          break;
        default:
          console.warn(`Unknown animation type: ${animName}`);
      }
    });
    const actions = {
      idle: this.mixer.clipAction(animationMap.get(CharacterState.IDLE)),
      walk: this.mixer.clipAction(animationMap.get(CharacterState.WALKING)),
      run: this.mixer.clipAction(animationMap.get(CharacterState.RUNNING)),
    };
    Object.values(actions).forEach((action) => {
      action.enabled = true;
      action.setEffectiveTimeScale(1);
    });
    this.actions = actions;
    // 默认播放空闲动画
    this.currentAction = this.actions.idle;
    this.currentAction.play();
  }

  private playAnimation(name: string, fadeDuration: number = 0.2) {
    const newAction = this.actions?.[name];
    if (this.currentAction === newAction) {
      return;
    }

    const oldAction = this.currentAction;
    newAction.reset();
    newAction.play();
    newAction.setEffectiveWeight(1);
    newAction.crossFadeFrom(oldAction, fadeDuration, true);

    this.currentAction = newAction;
  }

  private recordPosition() {
    // 记录当前位置
    const position = this.position.clone();
    this.movementPath.push({
      position: position,
      timestamp: performance.now(),
    });

    // 限制轨迹长度
    if (this.movementPath.length > this.maxPathLength) {
      this.movementPath.shift();
    }
  }

  private updateNPCMovement(delta) {
    // 如果没有目标或已到达目标
    if (
      !this.moveState.target ||
      this.position.distanceTo(this.moveState.target) < 0.5
    ) {
      // 增加等待时间
      this.moveState.idleTime += delta;

      // 如果等待时间到达，选择新目标
      if (this.moveState.idleTime >= this.moveState.waitTime) {
        this.chooseNewTarget();
        this.moveState.idleTime = 0;
        this.startWalking();
      } else {
        this.stopMoving();
      }
    } else {
      // 继续向目标移动
      const direction = this.moveState.target
        .clone()
        .sub(this.position)
        .normalize();
      // 更新位置
      this.position.add(direction.multiplyScalar(this.moveState.speed * delta));
      // 更新朝向
      this.rotation.y = Math.atan2(direction.x, direction.z);
    }
  }

  private chooseNewTarget() {
    // 在限定范围内选择新的随机目标点
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 20 + 5; // 5-25的随机距离

    this.moveState.target = new THREE.Vector3(
      this.position.x + Math.cos(angle) * distance,
      0,
      this.position.z + Math.sin(angle) * distance
    );

    // 限制在场景范围内
    const maxRange = 50;
    this.moveState.target.x = Math.max(
      -maxRange,
      Math.min(maxRange, this.moveState.target.x)
    );
    this.moveState.target.z = Math.max(
      -maxRange,
      Math.min(maxRange, this.moveState.target.z)
    );
  }

  public setColor(color: THREE.Color) {
    this.color = color;
    if (this.model) {
      this.model.traverse((child) => {
        if (child.isMesh) {
          child.material.color = color;
        }
      });
    }
  }

  public update(delta) {
    // 更新动画混合器
    if (this.mixer) {
      this.mixer.update(delta);
    }

    // 轨迹记录
    if (this.isNPC) {
      // 记录位置
      this.lastPathUpdate += delta;
      if (this.lastPathUpdate >= this.pathUpdateInterval) {
        this.recordPosition();
        this.lastPathUpdate = 0;
      }
      // 移动路径
      this.updateNPCMovement(delta);
    }
  }

  public startWalking() {
    this.updateMoveState({
      speed: 2,
    });
    this.playAnimation("walk");
  }

  public startRunning() {
    this.updateMoveState({
      speed: 5,
    });
    this.playAnimation("run");
  }

  public stopMoving() {
    this.updateMoveState({
      speed: 2,
    });
    this.playAnimation("idle");
  }
  public resetParams() {
    this.moveState = {
      target: null,
      speed: 2,
      idleTime: 0,
      waitTime: Math.random() * 2 + 1,
    };
    this.setColor(getRandomColor());
    this.isNPC = true;
    this.currentAction = this.actions.idle;
    this.currentAction.play();
  }
  public setIsNpc(isNpc) {
    this.isNPC = isNpc;
  }
  public dispose() {}
}

import * as THREE from "three";
import { Character } from "../models/Character";

export class CharacterController {
  private character: Character;
  private moveSpeed: number;
  private rotationSpeed: number;
  private velocity: THREE.Vector3;
  private direction: THREE.Vector3;
  private moveForward: boolean;
  private moveBackward: boolean;
  private moveLeft: boolean;
  private moveRight: boolean;
  private running: boolean;
  constructor(character: Character) {
    this.character = character;
    this.initOptions();

    this.listenerKeyBoardControl();
  }

  initOptions() {
    this.moveSpeed = 5;
    this.rotationSpeed = 0.1;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    // 控制状态
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.running = false;
  }

  setTarget(character: Character) {
    this.initOptions();
    this.character = character;
  }

  listenerKeyBoardControl() {
    document.addEventListener("keydown", (event) => {
      switch (event.code) {
        case "KeyW":
          this.moveForward = true;
          break;
        case "KeyS":
          this.moveBackward = true;
          break;
        case "KeyA":
          this.moveLeft = true;
          break;
        case "KeyD":
          this.moveRight = true;
          break;
        case "ShiftLeft":
          this.running = true;
          break;
      }
    });
    document.addEventListener("keyup", (event) => {
      switch (event.code) {
        case "KeyW":
          this.moveForward = false;
          break;
        case "KeyS":
          this.moveBackward = false;
          break;
        case "KeyA":
          this.moveLeft = false;
          break;
        case "KeyD":
          this.moveRight = false;
          break;
        case "ShiftLeft":
          this.running = false;
          break;
      }
    });
  }

  isMoveing() {
    return (
      this.moveForward ||
      this.moveBackward ||
      this.moveLeft ||
      this.moveRight ||
      this.running
    );
  }
  updatePosition(delta: number) {
    // 计算移动方向 ,为了适应模型坐标系
    this.direction.x = -(Number(this.moveForward) - Number(this.moveBackward));
    this.direction.z = -(Number(this.moveRight) - Number(this.moveLeft));
    this.direction.normalize();

    // 计算速度
    const speed = this.running ? this.moveSpeed * 2 : this.moveSpeed;

    // 更新位置和旋转
    if (this.direction.length() > 0) {
      // 计算角色朝向
      const angle = Math.atan2(this.direction.x, this.direction.z);

      // 平滑旋转
      const currentAngle = this.character.rotation.y;
      const targetAngle = angle;
      const angleDiff = Math.atan2(
        Math.sin(targetAngle - currentAngle),
        Math.cos(targetAngle - currentAngle)
      );

      this.character.rotation.y += angleDiff * this.rotationSpeed;

      // 更新位置
      this.velocity.x = Math.sin(angle) * speed * delta;
      this.velocity.z = Math.cos(angle) * speed * delta;
      this.character.position.add(this.velocity);
    }
  }
  update(delta: number) {
    // 检查是否在移动
    const isMoving = this.isMoveing();

    // 更新角色动画状态
    if (isMoving) {
      this.running
        ? this.character.startRunning()
        : this.character.startWalking();
    } else {
      this.character.stopMoving();
    }
    this.updatePosition(delta);
  }
}

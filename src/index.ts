import * as THREE from "three";
import { DayNightCycleManager } from "./manager/DayNightCycleManager";
import { SakuraPetalsManager } from "./manager/SakuraPetalsManager";
import { CharacterManager } from "./manager/CharacterManager";
import { CollisionDetection } from "./manager/CollisionDetectionManager";
import { GrassField } from "./models/Grass";
import { CharacterController } from "./control/CharacterController";
import { ThirdPersonCamera } from "./control/ThirdPersonCamera";
import { TreeManager } from "./manager/TreeManager";
import { Character } from "./models/Character";

class SakuraForestManager {
  private render: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;
  private grassField: GrassField;
  private dayNightCycleManager: DayNightCycleManager;
  private petalManager: SakuraPetalsManager;
  private characterManager: CharacterManager;
  private collisionManager: CollisionDetection;
  private cameraController: ThirdPersonCamera;
  private playerController: CharacterController;
  private treeManager: TreeManager;
  init(id: string) {
    this.initScene(id);
    this.createGround();
    this.initManager();
    this.animate();
  }

  initScene(id: string) {
    const canvas = document.getElementById(id) as HTMLCanvasElement;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.clock = new THREE.Clock();

    this.render = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvas,
    });
    const skyColor = new THREE.Color(0x87ceeb);
    this.scene.background = skyColor;
    this.scene.fog = new THREE.Fog(skyColor, 20, 100);
    this.render.setSize(window.innerWidth, window.innerHeight);

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // 添加方向光（太阳光）
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    this.scene.add(sunLight);
    this.render.shadowMap.enabled = true;
    window.addEventListener("resize", () => this.onWindowResize(), false);
  }

  createGround() {
    // 创建基础地面
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d4424,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 添加草地
    this.grassField = new GrassField(this.scene, {
      width: 200,
      height: 200,
      density: 40000,
      minHeight: 0.3,
      maxHeight: 1.0,
      colors: [
        new THREE.Color(0x365c36), // 深绿
        new THREE.Color(0x4a7a3d), // 中绿
        new THREE.Color(0x5c9443), // 浅绿
        new THREE.Color(0x2d4424), // 暗绿
      ],
      windStrength: 0.15,
      windFrequency: 1.2,
    });
  }

  initManager() {
    // 创建日夜循环系统
    this.dayNightCycleManager = new DayNightCycleManager(this.scene);
    this.treeManager = new TreeManager(this.scene);
    // 创建樱花花瓣系统
    this.petalManager = new SakuraPetalsManager(this.scene);
    this.characterManager = new CharacterManager(this.scene, {
      characterCount: 20,
      render: this.render,
      camera: this.camera,
      handlerClickCharacter: this.onCharacterClick,
    });

    // 创建碰撞检测系统（现在检测所有角色）
    this.collisionManager = new CollisionDetection(
      this.characterManager.getCharacters(),
      this.treeManager.getTrees()
    );

    const player = this.characterManager.getPlayerCharacter();

    // 创建第三人称相机控制器
    this.cameraController = new ThirdPersonCamera(this.camera, player);
    this.playerController = new CharacterController(player);
  }
  onCharacterClick = (character: Character) => {
    this.cameraController?.setTarget?.(character);
    this.playerController?.setTarget?.(character);
  };

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.render.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    // 更新各个系统
    this.playerController.update(delta);
    this.cameraController.update();
    this.dayNightCycleManager.update(delta);
    this.petalManager.update();
    this.characterManager.update(delta);
    this.collisionManager.update();
    this.grassField.update(delta);
    this.render.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener("resize", this.onWindowResize.bind(this));
  }
}

/**
 * 初始化樱花场景
 * @param id canvas id
 */
export function initializeSakuraScene(id: string) {
  const sakuraScene = new SakuraForestManager();
  sakuraScene.init(id);
}

import * as THREE from "three";

export class ThirdPersonCamera {
  private camera: THREE.Camera;
  private target: THREE.Object3D;
  private distance: number;
  private lookAtHeight: number;
  private smoothSpeed: number;
  private rotationX: number;
  private rotationY: number;
  private minDistance: number;
  private maxDistance: number;
  private minRotationY: number;
  private maxRotationY: number;
  private isDragging: boolean;
  private previousMousePosition: { x: number; y: number };
  constructor(camera, target) {
    this.camera = camera;
    this.target = target;

    // 相机配置
    this.distance = 7; // 相机距离
    this.lookAtHeight = 1.5; // 视点高度
    this.smoothSpeed = 0.05; // 相机跟随平滑度
    this.rotationX = 0; // 水平旋转角度
    this.rotationY = -0.3; // 垂直旋转角度

    // 相机限制
    this.minDistance = 3;
    this.maxDistance = 15;
    this.minRotationY = -Math.PI / 2;
    this.maxRotationY = -0.1;

    // 鼠标控制状态
    this.isDragging = false;
    this.previousMousePosition = {
      x: 0,
      y: 0,
    };

    // 添加事件监听
    this.listenerMouse();
  }

  listenerMouse() {
    // 鼠标按下
    document.addEventListener("mousedown", (event) => {
      if (event.button === 2) {
        // 右键
        this.isDragging = true;
        this.previousMousePosition = {
          x: event.clientX,
          y: event.clientY,
        };
        event.preventDefault();
      }
    });

    // 鼠标移动
    document.addEventListener("mousemove", (event) => {
      if (this.isDragging) {
        const deltaMove = {
          x: event.clientX - this.previousMousePosition.x,
          y: event.clientY - this.previousMousePosition.y,
        };

        // 更新旋转角度
        this.rotationX -= deltaMove.x * 0.005;
        this.rotationY = Math.max(
          this.minRotationY,
          Math.min(this.maxRotationY, this.rotationY + deltaMove.y * 0.005)
        );

        this.previousMousePosition = {
          x: event.clientX,
          y: event.clientY,
        };
      }
    });

    // 鼠标抬起
    document.addEventListener("mouseup", () => {
      this.isDragging = false;
    });

    // 滚轮缩放
    document.addEventListener("wheel", (event) => {
      const zoomSpeed = 0.5;
      this.distance = Math.max(
        this.minDistance,
        Math.min(
          this.maxDistance,
          this.distance + event.deltaY * 0.01 * zoomSpeed
        )
      );
    });

    // 禁用右键菜单
    document.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });
  }

  setTarget(target: THREE.Object3D) {
    this.target = target;

    // 重置相机位置
    const targetPosition = new THREE.Vector3();
    targetPosition.copy(this.target.position);
    targetPosition.y += this.lookAtHeight;
    const frontDirection = new THREE.Vector3();
    target.getWorldDirection(frontDirection);
    const cameraPosition = target.position
      .clone()
      .add(frontDirection.multiplyScalar(this.distance));
    this.camera.position.copy(cameraPosition);

    // 让相机看向模型位置
    this.camera.lookAt(targetPosition);
  }

  calculateCameraPosition(targetPosition) {
    // 使用球坐标计算相机位置
    const phi = this.rotationY + Math.PI / 2;
    const theta = this.rotationX;

    const position = new THREE.Vector3();
    position.x =
      targetPosition.x + this.distance * Math.sin(phi) * Math.cos(theta);
    position.y = targetPosition.y + this.distance * Math.cos(phi);
    position.z =
      targetPosition.z + this.distance * Math.sin(phi) * Math.sin(theta);

    return position;
  }

  update() {
    if (!this.target) return;

    // 计算目标位置
    const targetPosition = new THREE.Vector3();
    targetPosition.copy(this.target.position);
    targetPosition.y += this.lookAtHeight;

    // 计算理想的相机位置
    const idealPosition = this.calculateCameraPosition(targetPosition);
    // 平滑过渡到理想位置
    this.camera.position.lerp(idealPosition, this.smoothSpeed);
    this.camera.lookAt(targetPosition);
  }
}

import * as THREE from "three";

export class SakuraPetalsManager {
  private scene: THREE.Scene;
  private petals: {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    rotationSpeed: THREE.Vector3;
    sinOffset: number;
  }[];
  constructor(scene) {
    this.scene = scene;
    this.petals = [];
    this.createPetals();
  }

  createPetals() {
    const petalCount = 1000;
    const petalGeometry = this.createPetalGeometry();
    const petalMaterial = new THREE.MeshStandardMaterial({
      color: 0xffb7c5,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });

    for (let i = 0; i < petalCount; i++) {
      const petal = new THREE.Mesh(petalGeometry, petalMaterial);
      this.initPetalPosition(petal);

      this.scene.add(petal);
      this.petals.push({
        mesh: petal,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          -Math.random() * 0.1 - 0.1,
          (Math.random() - 0.5) * 0.1
        ),
        rotationSpeed: new THREE.Vector3(
          Math.random() * 0.02 - 0.01,
          Math.random() * 0.02 - 0.01,
          Math.random() * 0.02 - 0.01
        ),
        sinOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  createPetalGeometry() {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.1);
    shape.bezierCurveTo(0.1, 0.1, 0.1, -0.1, 0, -0.1);
    shape.bezierCurveTo(-0.1, -0.1, -0.1, 0.1, 0, 0.1);

    return new THREE.ShapeGeometry(shape);
  }

  initPetalPosition(petal) {
    petal.position.set(
      (Math.random() - 0.5) * 100,
      20 + Math.random() * 10,
      (Math.random() - 0.5) * 100
    );
    petal.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
  }

  update() {
    const time = Date.now() * 0.001;

    this.petals.forEach((petal) => {
      // 更新位置
      petal.mesh.position.add(petal.velocity);

      // 添加摆动效果
      petal.mesh.position.x += Math.sin(time + petal.sinOffset) * 0.01;
      petal.mesh.position.z += Math.cos(time + petal.sinOffset) * 0.01;

      // 更新旋转
      petal.mesh.rotation.x += petal.rotationSpeed.x;
      petal.mesh.rotation.y += petal.rotationSpeed.y;
      petal.mesh.rotation.z += petal.rotationSpeed.z;

      // 如果花瓣落到地面以下，重置位置
      if (petal.mesh.position.y < 0) {
        this.initPetalPosition(petal.mesh);
      }
    });
  }
}

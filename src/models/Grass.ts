import * as THREE from "three";
interface IGrassFieldOptions {
  width: number;
  height: number;
  density: number;
  minHeight: number;
  maxHeight: number;
  colors: THREE.Color[];
  windStrength: number;
  windFrequency: number;
}
interface IWindState {
  time: number;
  strength: number;
  frequency: number;
  direction: THREE.Vector2;
  gustTimer: number;
  gustInterval: number;
  baseStrength: number;
}

export class GrassField {
  private scene: THREE.Scene;
  private options: IGrassFieldOptions;
  private windState: IWindState;
  private instancedGrass: THREE.InstancedMesh;
  constructor(scene, options = {}) {
    this.scene = scene;
    this.options = {
      width: 200,
      height: 200,
      density: 40000,
      minHeight: 0.3,
      maxHeight: 1.0,
      colors: [
        new THREE.Color(0x365c36),
        new THREE.Color(0x4a7a3d),
        new THREE.Color(0x5c9443),
        new THREE.Color(0x2d4424),
      ],
      windStrength: 0.15,
      windFrequency: 1.2,
      ...options,
    };

    // 风的状态
    this.windState = {
      time: 0,
      strength: this.options.windStrength,
      frequency: this.options.windFrequency,
      direction: new THREE.Vector2(1, 1),
      gustTimer: 0,
      gustInterval: 5,
      baseStrength: this.options.windStrength,
    };

    this.createGrass();
  }

  createGrass() {
    // 创建草叶几何体
    const grassGeometry = this.createGrassGeometry();

    // 创建材质
    const grassMaterial = new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide,
      alphaTest: 0.5,
      transparent: true,
      vertexColors: false,
    });

    // 创建实例化网格
    this.instancedGrass = new THREE.InstancedMesh(
      grassGeometry,
      grassMaterial,
      this.options.density
    );

    // 设置随机颜色
    const color = new THREE.Color();
    for (let i = 0; i < this.options.density; i++) {
      const randomColor =
        this.options.colors[
          Math.floor(Math.random() * this.options.colors.length)
        ];
      color.copy(randomColor).multiplyScalar(0.9 + Math.random() * 0.2);
      this.instancedGrass.setColorAt(i, color);
    }
    this.instancedGrass.instanceColor.needsUpdate = true;

    // 初始化草的位置和旋转
    this.initializeGrassInstances();

    this.instancedGrass.receiveShadow = true;
    this.scene.add(this.instancedGrass);
  }

  createGrassGeometry() {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.1, 0.5, 0, 0.3);
    shape.quadraticCurveTo(-0.1, 0.5, 0, 0);

    const extrudeSettings = {
      steps: 1,
      depth: 0.01,
      bevelEnabled: false,
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }

  initializeGrassInstances() {
    const dummy = new THREE.Object3D();

    for (let i = 0; i < this.options.density; i++) {
      const position = this.calculateGrassPosition(i);

      dummy.position.set(position.x, position.height / 2, position.z);
      dummy.rotation.set(
        (Math.random() - 0.5) * 0.2,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.2
      );
      dummy.scale.set(1, position.height, 1);
      dummy.updateMatrix();

      this.instancedGrass.setMatrixAt(i, dummy.matrix);
    }

    this.instancedGrass.instanceMatrix.needsUpdate = true;
  }

  calculateGrassPosition(index) {
    const gridSize = Math.sqrt(this.options.density);
    const cellSize = this.options.width / gridSize;

    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    const x = (col + Math.random()) * cellSize - this.options.width / 2;
    const z = (row + Math.random()) * cellSize - this.options.height / 2;

    const noise = this.simpleNoise(x * 0.05, z * 0.05);
    const height = THREE.MathUtils.lerp(
      this.options.minHeight,
      this.options.maxHeight,
      0.5 + noise * 0.5
    );

    return { x, z, height };
  }

  simpleNoise(x, z) {
    const X = Math.floor(x) & 255;
    const Z = Math.floor(z) & 255;
    const y = (X + Z * 16) % 255;
    return Math.sin(y * y * y * 60) * 0.5 + 0.5;
  }

  update(delta) {
    // 更新风状态
    this.windState.time += delta;
    this.windState.gustTimer += delta;

    // 处理阵风
    if (this.windState.gustTimer > this.windState.gustInterval) {
      this.windState.gustTimer = 0;
      this.createGustEffect();
    }

    // 更新草的动画
    this.updateGrassAnimation(delta);
  }

  createGustEffect() {
    const gustStrength = Math.random() * 0.3 + 0.2;
    this.windState.strength = this.windState.baseStrength + gustStrength;

    setTimeout(() => {
      this.windState.strength = this.windState.baseStrength;
    }, 1500);
  }

  updateGrassAnimation(delta) {
    const dummy = new THREE.Object3D();
    const matrix = new THREE.Matrix4();

    // 批量更新以提高性能
    const batchSize = 1000;
    for (let batch = 0; batch < this.options.density; batch += batchSize) {
      const endBatch = Math.min(batch + batchSize, this.options.density);

      for (let i = batch; i < endBatch; i++) {
        this.instancedGrass.getMatrixAt(i, matrix);

        const position = new THREE.Vector3();
        const rotation = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        matrix.decompose(position, rotation, scale);

        // 计算风效果
        const time = this.windState.time * this.windState.frequency;
        const windX = Math.sin(time + position.x * 0.1);
        const windZ = Math.cos(time + position.z * 0.1);

        const windEffect = (windX + windZ) * 0.5 * this.windState.strength;
        const heightFactor = scale.y / this.options.maxHeight;

        dummy.position.copy(position);
        dummy.rotation.set(
          windEffect * heightFactor,
          rotation.y,
          windEffect * heightFactor
        );
        dummy.scale.copy(scale);
        dummy.updateMatrix();

        this.instancedGrass.setMatrixAt(i, dummy.matrix);
      }
    }

    this.instancedGrass.instanceMatrix.needsUpdate = true;
  }
}

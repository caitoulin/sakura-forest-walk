import * as THREE from 'three';

export class DayNightCycleManager {
  private scene: THREE.Scene;
  private time: number;
  private dayDuration: number = 60;
  private ambientLight: THREE.AmbientLight;
  private sunLight: THREE.DirectionalLight;
  private moonLight: THREE.DirectionalLight;
  private dayColor: THREE.Color;
  private nightColor: THREE.Color;
  constructor(scene) {
    this.scene = scene;
    this.time = 0;
    this.setupLighting();
  }

  setupLighting() {
    // 环境光
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(this.ambientLight);

    // 太阳
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
    this.sunLight.position.set(0, 100, 0);
    this.sunLight.castShadow = true;
    this.scene.add(this.sunLight);

    // 月亮
    this.moonLight = new THREE.DirectionalLight(0x4444ff, 0.5);
    this.moonLight.position.set(0, -100, 0);
    this.scene.add(this.moonLight);

    // 天空颜色
    this.dayColor = new THREE.Color(0x87ceeb);
    this.nightColor = new THREE.Color(0x000024);
  }

  update(deltaTime) {
    this.time += deltaTime;
    const cycle = (this.time % this.dayDuration) / this.dayDuration;
    
    // 更新太阳和月亮位置
    const angle = cycle * Math.PI * 2;
    this.sunLight.position.x = Math.cos(angle) * 100;
    this.sunLight.position.y = Math.sin(angle) * 100;
    
    this.moonLight.position.x = Math.cos(angle + Math.PI) * 100;
    this.moonLight.position.y = Math.sin(angle + Math.PI) * 100;

    // 更新光照强度
    const sunIntensity = Math.max(0, Math.sin(angle));
    const moonIntensity = Math.max(0, -Math.sin(angle));
    
    this.sunLight.intensity = 1 * sunIntensity;
    this.moonLight.intensity = 0.5 * moonIntensity;
    this.ambientLight.intensity = 0.3 + (0.7 * sunIntensity);

    // 更新天空颜色
    const skyColor = new THREE.Color();
    skyColor.lerpColors(this.nightColor, this.dayColor, sunIntensity);
    this.scene.background = skyColor;
    this.scene.fog.color = skyColor;
  }
}

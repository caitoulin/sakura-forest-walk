import * as THREE from "three";

export class CollisionDetection {
  private characters: THREE.Object3D[];
  private objects: THREE.Object3D[];
  private collisionDistance: number;
  private boundingSpheresMap: Map<
    string,
    { object: THREE.Object3D; sphere: THREE.Sphere }
  > = new Map();

  constructor(characters, objects) {
    this.characters = characters;
    this.objects = objects;
    this.collisionDistance = 1;
    this.createBoundingSpheres();
  }

  getObjectSphere(object) {
    const box = new THREE.Box3().setFromObject(object);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    return {
      object: object,
      sphere: object.isLoaded ? sphere : null,
    };
  }

  createBoundingSpheres() {
    this.objects.map((object) => {
      const sphereInfo = this.getObjectSphere(object);
      this.boundingSpheresMap.set(object.uuid, sphereInfo);
    });
  }

  update() {
    // 检查每个角色的碰撞
    this.characters.forEach((character) => {
      const characterPosition = character.position.clone();
      characterPosition.y = 0; // 只检查水平方向的碰撞
      const boundingSpheres = this.boundingSpheresMap.values();
      // 与树木的碰撞检测
      for (let { sphere, object } of boundingSpheres) {
        if (!sphere) {
          if (object.isLoaded) {
            const sphereInfo = this.getObjectSphere(object);
            sphere = sphereInfo.sphere;
            this.boundingSpheresMap.set(object.uuid, sphereInfo);
          } else {
            return;
          }
        }
        const spherePos = sphere.center.clone();
        spherePos.y = 0;

        const distance = characterPosition.distanceTo(spherePos);
        if (distance < this.collisionDistance) {
          const pushBack = characterPosition.clone().sub(spherePos).normalize();
          const pushDistance = this.collisionDistance - distance;
          character.position.add(pushBack.multiplyScalar(pushDistance));
        }
      }

      // 与其他角色的碰撞检测
      this.characters.forEach((otherCharacter) => {
        if (character === otherCharacter) return;

        const otherPosition = otherCharacter.position.clone();
        otherPosition.y = 0;

        const distance = characterPosition.distanceTo(otherPosition);
        if (distance < this.collisionDistance * 2) {
          const pushBack = characterPosition
            .clone()
            .sub(otherPosition)
            .normalize();
          const pushDistance = this.collisionDistance * 2 - distance;
          character.position.add(pushBack.multiplyScalar(pushDistance * 0.5));
        }
      });
    });
  }
}

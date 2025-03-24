
import * as THREE from "three";
import { SakuraTree } from "../models/SakuraTree";

interface ICharacterManagerOptions {
  treeCount?: number;
}

export class TreeManager {
  private trees: SakuraTree[] = [];
  private scene: THREE.Scene;
  constructor(scene: THREE.Scene, options?: ICharacterManagerOptions) {
    const { treeCount = 100 } = options || {};
    this.scene = scene;
    this.createTrees(treeCount);
  }
   private createTrees(treeCount:number) {
    for (let i = 0; i < treeCount; i++) {
      const x = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      const tree = new SakuraTree();
      tree.position.set(x, 0, z);
      tree.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(tree);
      this.trees.push(tree);
    }
  }


  public getTrees() {
    return this.trees;
  }
}

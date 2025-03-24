import * as THREE from "three";
import { getGltfInfoByUrl } from "../util";

const treeSize = [25, 25, 25];
const modelPath = "models/sakura_tree.glb"; // 替换为你的模型路径

export class SakuraTree extends THREE.Group {
  private model: THREE.Group | null;
  private isLoaded: boolean = false;
  constructor() {
    super();
    this.initTree();
  }
  async initTree() {
    const { model } = await getGltfInfoByUrl(modelPath);
    this.processModel(model);
    this.model = model;
    this.isLoaded = true;
  }

  getModel() {
    return this.model;
  }

  processModel(model: THREE.Group) {
    // 遍历模型材质进行调整
    model.traverse((child: any) => {
      if (child.isMesh) {
        // 设置阴影
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    model.scale.set(treeSize[0], treeSize[1], treeSize[2]);
    this.add(model);
  }
}

import * as THREE from "three";
//@ts-ignore
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { GLTF } from "three/examples/jsm/Addons.js";

const cacheMap = new Map<string, GLTF>();
export const cloneGltf = (gltf: GLTF) => {
  const clone = {
    animations: gltf.animations,
    model: gltf.scene.clone(true),
  };

  const skinnedMeshes = {};

  gltf.scene.traverse((node) => {
    if (node.isSkinnedMesh) {
      skinnedMeshes[node.name] = node;
    }
  });

  const cloneBones = {};
  const cloneSkinnedMeshes = {};

  clone.model.traverse((node) => {
    if (node.isBone) {
      cloneBones[node.name] = node;
    }

    if (node.isSkinnedMesh) {
      cloneSkinnedMeshes[node.name] = node;
    }
  });

  for (let name in skinnedMeshes) {
    const skinnedMesh = skinnedMeshes[name];
    const skeleton = skinnedMesh.skeleton;
    const cloneSkinnedMesh = cloneSkinnedMeshes[name];

    const orderedCloneBones = [];

    for (let i = 0; i < skeleton.bones.length; ++i) {
      const cloneBone = cloneBones[skeleton.bones[i].name];
      orderedCloneBones.push(cloneBone);
    }

    cloneSkinnedMesh.bind(
      new THREE.Skeleton(orderedCloneBones, skeleton.boneInverses),
      cloneSkinnedMesh.matrixWorld
    );
  }

  return clone;
};

/**
 * 获取模型信息：动画及模型
 * @param modelUrl 模型地址
 * @returns
 */
export const getGltfInfoByUrl = async (modelUrl: string) => {
  const gltf = cacheMap.get(modelUrl);
  if (gltf) {
    const cloneInfo = cloneGltf(gltf);
    return cloneInfo;
  } else {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(modelUrl);
    cacheMap.set(modelUrl, gltf);
    const cloneInfo = cloneGltf(gltf);
    return cloneInfo;
  }
};

export const getRandomColor = () => {
  return new THREE.Color(
    Math.random() * 0.5 + 0.5,
    Math.random() * 0.5 + 0.5,
    Math.random() * 0.5 + 0.5
  );
};

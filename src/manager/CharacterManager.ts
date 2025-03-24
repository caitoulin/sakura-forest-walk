import { characterGroupName, LAYER_PICKABLE } from "../constant";
import { Character } from "../models/Character";
import * as THREE from "three";
import { getRandomColor } from "../util";

interface ICharacterManagerOptions {
  characterCount?: number;
  handlerClickCharacter?: (character: Character) => void;
  render: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
}

export class CharacterManager {
  private characters: Character[] = [];
  private player: Character;
  private scene: THREE.Scene;
  private render: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private handlerClickCharacter: (character: Character) => void;
  constructor(scene: THREE.Scene, options: ICharacterManagerOptions) {
    const {
      characterCount = 20,
      render,
      camera,
      handlerClickCharacter,
    } = options || {};
    this.handlerClickCharacter = handlerClickCharacter;
    this.render = render;
    this.scene = scene;
    this.camera = camera;
    this.createCharacters(characterCount);
    this.render.domElement.addEventListener("click", this.onCharacterClick);
  }

  private initCharacterPosition(character: Character) {
    // 随机位置
    const x = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 100;
    character.position.set(x, 0, z);
  }

  private createCharacters(characterCount: number) {
    for (let i = 0; i < characterCount; i++) {
      const character = new Character({
        isNPC: true,
        color: getRandomColor(),
      });
      this.initCharacterPosition(character);
      character.rotation.y = -Math.PI / 2;
      character.updateMatrixWorld(true)
      this.characters.push(character);
    }
    this.setPlayer(this.characters[0]);
    for (const eachCharacter of this.characters) {
      this.scene.add(eachCharacter);
    }
  }

  private setPlayer(character) {
    const player = character;
    player.setColor(new THREE.Color(0x3366ff));
    player.setIsNpc(false);
    this.player = player;
  }

  private onCharacterClick = (event: MouseEvent) => {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    const intersects = raycaster.intersectObjects(this.getCharacters(), true);
    if (intersects.length > 0) {
      const selected = intersects[0].object;
      let parentGroup = selected.parent;

      // 递归向上查找分组
      while (parentGroup !== null) {
        if (parentGroup.groupName === characterGroupName) {
          const curCharacter = parentGroup as Character;
          if (curCharacter === this.player) {
            break;
          }
          this.player.resetParams();
          this.setPlayer(curCharacter);
          this.handlerClickCharacter(curCharacter);
          break;
        }
        parentGroup = parentGroup.parent;
      }
    }
  };

  public getPlayerCharacter() {
    return this.player;
  }

  public getCharacters() {
    return this.characters;
  }

  public update(deltaTime: number) {
    const allCharacters = this.getCharacters();
    allCharacters.forEach((character) => {
      character.update(deltaTime);
    });
  }

  public dispose() {
    this.characters.forEach((character) => {
      character.dispose();
    });
    this.player.dispose();
    this.characters = [];
    this.render.domElement.removeEventListener("click", this.onCharacterClick);
  }
}

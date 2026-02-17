import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

let loader: GLTFLoader | null = null;

function getLoader(): GLTFLoader {
  if (!loader) {
    loader = new GLTFLoader();

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(dracoLoader);
  }
  return loader;
}

export interface LoadedModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  mixer?: THREE.AnimationMixer;
}

export async function loadModel(url: string): Promise<LoadedModel> {
  const gltfLoader = getLoader();

  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => {
        const model = gltf.scene;

        // Enable shadows on all meshes
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        let mixer: THREE.AnimationMixer | undefined;
        if (gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => {
            mixer!.clipAction(clip).play();
          });
        }

        resolve({
          scene: model,
          animations: gltf.animations,
          mixer,
        });
      },
      undefined,
      reject,
    );
  });
}

export function createPlaceholderModel(type: 'plate' | 'bowl' | 'drink' | 'dessert'): THREE.Group {
  const group = new THREE.Group();

  const materials = {
    plate: new THREE.MeshStandardMaterial({ color: 0xf5f5dc, roughness: 0.3 }),
    bowl: new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.4 }),
    drink: new THREE.MeshStandardMaterial({ color: 0x87ceeb, roughness: 0.1, transparent: true, opacity: 0.8 }),
    dessert: new THREE.MeshStandardMaterial({ color: 0xcd853f, roughness: 0.5 }),
  };

  switch (type) {
    case 'plate': {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.14, 0.015, 32), materials.plate);
      plate.castShadow = true;
      group.add(plate);
      // Food on plate
      const food = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
      food.position.y = 0.04;
      food.scale.y = 0.5;
      food.castShadow = true;
      group.add(food);
      break;
    }
    case 'bowl': {
      const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), materials.bowl);
      bowl.castShadow = true;
      group.add(bowl);
      break;
    }
    case 'drink': {
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.15, 16), materials.drink);
      glass.position.y = 0.075;
      glass.castShadow = true;
      group.add(glass);
      break;
    }
    case 'dessert': {
      const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 8), materials.dessert);
      cake.position.y = 0.03;
      cake.castShadow = true;
      group.add(cake);
      // Topping
      const topping = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 16), new THREE.MeshStandardMaterial({ color: 0xff6347 }));
      topping.position.y = 0.08;
      topping.castShadow = true;
      group.add(topping);
      break;
    }
  }

  return group;
}

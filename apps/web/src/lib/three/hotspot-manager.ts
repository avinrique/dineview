import * as THREE from 'three';

export interface Hotspot {
  id: string;
  label: string;
  position: THREE.Vector3;
  type: 'ingredient' | 'nutrition' | 'allergen' | 'info';
  content: string;
  screenPosition?: { x: number; y: number };
  visible?: boolean;
}

export class HotspotManager {
  private hotspots: Hotspot[] = [];
  private camera: THREE.PerspectiveCamera;
  private containerSize: { width: number; height: number };

  constructor(camera: THREE.PerspectiveCamera, width: number, height: number) {
    this.camera = camera;
    this.containerSize = { width, height };
  }

  setHotspots(hotspots: Hotspot[]) {
    this.hotspots = hotspots;
  }

  addHotspot(hotspot: Hotspot) {
    this.hotspots.push(hotspot);
  }

  updateScreenPositions(modelMatrix?: THREE.Matrix4): Hotspot[] {
    return this.hotspots.map((hotspot) => {
      const worldPos = hotspot.position.clone();

      if (modelMatrix) {
        worldPos.applyMatrix4(modelMatrix);
      }

      // Project 3D to 2D screen coordinates
      const projected = worldPos.clone().project(this.camera);

      const x = (projected.x * 0.5 + 0.5) * this.containerSize.width;
      const y = (-projected.y * 0.5 + 0.5) * this.containerSize.height;

      // Check if behind camera
      const visible = projected.z < 1;

      return {
        ...hotspot,
        screenPosition: { x, y },
        visible,
      };
    });
  }

  updateContainerSize(width: number, height: number) {
    this.containerSize = { width, height };
  }

  getHotspots(): Hotspot[] {
    return this.hotspots;
  }

  clear() {
    this.hotspots = [];
  }
}

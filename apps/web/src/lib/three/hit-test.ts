import * as THREE from 'three';

export class HitTestManager {
  private reticle: THREE.Mesh;
  private isPlaced: boolean = false;
  private placedPosition: THREE.Matrix4 | null = null;

  constructor(reticle: THREE.Mesh) {
    this.reticle = reticle;
  }

  updateReticle(hitMatrix: Float32Array | null) {
    if (this.isPlaced) return;

    if (hitMatrix) {
      const matrix = new THREE.Matrix4();
      matrix.fromArray(hitMatrix);
      this.reticle.visible = true;
      this.reticle.matrix.copy(matrix);
    } else {
      this.reticle.visible = false;
    }
  }

  placeAtReticle(): THREE.Matrix4 | null {
    if (!this.reticle.visible) return null;

    this.isPlaced = true;
    this.placedPosition = this.reticle.matrix.clone();
    this.reticle.visible = false;
    return this.placedPosition;
  }

  reset() {
    this.isPlaced = false;
    this.placedPosition = null;
    this.reticle.visible = false;
  }

  get placed(): boolean {
    return this.isPlaced;
  }

  get position(): THREE.Matrix4 | null {
    return this.placedPosition;
  }
}

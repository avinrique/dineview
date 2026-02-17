import * as THREE from 'three';

export function createScene() {
  const scene = new THREE.Scene();

  // Ambient light for overall illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // Directional light for shadows
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  scene.add(directionalLight);

  return scene;
}

export function createCamera(aspect: number = 1) {
  const camera = new THREE.PerspectiveCamera(70, aspect, 0.01, 100);
  camera.position.set(0, 0.5, 1);
  return camera;
}

export function createRenderer(canvas: HTMLCanvasElement, width: number, height: number) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

export function createShadowPlane() {
  const geometry = new THREE.PlaneGeometry(10, 10);
  const material = new THREE.ShadowMaterial({ opacity: 0.3 });
  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = true;
  return plane;
}

export function createReticle() {
  const geometry = new THREE.RingGeometry(0.05, 0.06, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  const reticle = new THREE.Mesh(geometry, material);
  reticle.rotation.x = -Math.PI / 2;
  reticle.visible = false;
  reticle.matrixAutoUpdate = false;
  return reticle;
}

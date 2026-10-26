/**
 * Camera preview for Android phones without ARCore.
 *
 * Google only runs AR on phones it has certified for ARCore (WebXR in Chrome
 * and Scene Viewer both need it), and plenty of current phones aren't on the
 * list, the POCO F6 for one. Here the rear camera fills the screen and the
 * dish is drawn over it. The gyroscope keeps the dish where it was placed as
 * the guest turns the phone, but walking isn't tracked, and the table is
 * assumed to sit ~40 cm below the phone, so the size is close to real rather
 * than exact.
 *
 * Loaded on demand (it pulls in three.js loaders), so keep imports local.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { contactShadow, disposeScene, makeReticle, type DishArSession, type DishArStatus } from '@/components/ar/webxr-ar';

// Assumed drop from the phone to the table, metres
const TABLE_DROP = 0.4;
// Field of view along the long side of a phone's main camera, degrees
const CAMERA_FOV = 62;
// Furthest the reticle may sit from the guest, metres
const MAX_REACH = 2;

interface StartOptions {
  modelUrl: string;
  /** The AR overlay: a tap on it (outside its buttons) places the dish. */
  overlay: HTMLElement;
  onStatus(status: DishArStatus): void;
  onEnd(): void;
}

const DEG = THREE.MathUtils.DEG2RAD;
const zee = new THREE.Vector3(0, 0, 1);
// The camera looks out of the back of the phone, not its top edge
const backOfPhone = new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2);

/** Points the three.js camera the way the phone faces (device orientation → world, y up). */
function orientCamera(camera: THREE.Camera, o: { alpha: number; beta: number; gamma: number }) {
  const screenAngle = (screen.orientation?.angle ?? 0) * DEG;
  camera.quaternion
    .setFromEuler(new THREE.Euler(o.beta * DEG, o.alpha * DEG, -o.gamma * DEG, 'YXZ'))
    .multiply(backOfPhone)
    .multiply(new THREE.Quaternion().setFromAxisAngle(zee, -screenAngle));
}

export async function startCameraAr({ modelUrl, overlay, onStatus, onEnd }: StartOptions): Promise<DishArSession> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
    audio: false,
  });

  const layer = document.createElement('div');
  layer.style.cssText = 'position:fixed;inset:0;z-index:79;background:#000';
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover';
  video.srcObject = stream;
  layer.appendChild(video);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  layer.appendChild(renderer.domElement);
  document.body.appendChild(layer);
  video.play().catch(() => undefined);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.01, 20);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const sun = new THREE.DirectionalLight(0xffffff, 0.8);
  sun.position.set(0.4, 1, 0.3);
  scene.add(sun);

  const reticle = makeReticle();
  const dish = new THREE.Group();
  dish.visible = false;
  scene.add(reticle, dish);

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // The camera's wide angle runs along the screen's long side
    const tanLong = Math.tan((CAMERA_FOV * DEG) / 2);
    camera.fov = (2 * Math.atan(h >= w ? tanLong : tanLong * (h / w))) / DEG;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  // Until the gyroscope reports, look down at the table at a comfortable angle
  const orientation = { alpha: 0, beta: 45, gamma: 0 };
  const onOrientation = (e: DeviceOrientationEvent) => {
    if (e.beta == null || e.gamma == null) return;
    orientation.alpha = e.alpha ?? 0;
    orientation.beta = e.beta;
    orientation.gamma = e.gamma;
  };
  window.addEventListener('deviceorientation', onOrientation);

  let placed = false;
  let modelReady = false;
  let ended = false;
  let status: DishArStatus | null = null;
  let popStart = 0;
  const setStatus = (next: DishArStatus) => {
    if (next !== status) onStatus((status = next));
  };
  setStatus('loading');

  new GLTFLoader().load(
    modelUrl,
    (gltf) => {
      const model = gltf.scene;
      const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
      dish.add(contactShadow(Math.max(size.x, size.z) * 1.3), model);
      modelReady = true;
    },
    undefined,
    () => end(),
  );

  // Where the middle of the screen meets the (assumed) table
  const forward = new THREE.Vector3();
  const aim = new THREE.Vector3();
  function aimAtTable() {
    forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
    if (forward.y > -0.15) return false;
    aim.copy(forward).multiplyScalar(-TABLE_DROP / forward.y);
    return Math.hypot(aim.x, aim.z) <= MAX_REACH;
  }

  // Taps on overlay buttons shouldn't also count as "tap to place"
  const onTap = (e: MouseEvent) => {
    if ((e.target as Element | null)?.closest?.('[data-ar-ui]')) return;
    if (placed || !modelReady || !aimAtTable()) return;
    dish.position.copy(aim);
    // Face the guest, who stands at the origin
    dish.rotation.set(0, Math.atan2(-aim.x, -aim.z), 0);
    dish.visible = true;
    reticle.visible = false;
    placed = true;
    popStart = performance.now();
    setStatus('placed');
  };
  overlay.addEventListener('click', onTap);

  renderer.setAnimationLoop(() => {
    orientCamera(camera, orientation);
    if (!placed) {
      const onTable = aimAtTable();
      reticle.visible = onTable;
      if (onTable) reticle.matrix.makeTranslation(aim.x, aim.y, aim.z);
      setStatus(!modelReady ? 'loading' : onTable ? 'ready' : 'scanning');
    } else {
      // Quick settle-in so placement feels deliberate
      const t = Math.min(1, (performance.now() - popStart) / 220);
      dish.scale.setScalar(0.9 + 0.1 * (1 - Math.pow(1 - t, 3)));
    }
    renderer.render(scene, camera);
  });

  function end() {
    if (ended) return;
    ended = true;
    renderer.setAnimationLoop(null);
    window.removeEventListener('resize', resize);
    window.removeEventListener('deviceorientation', onOrientation);
    overlay.removeEventListener('click', onTap);
    stream.getTracks().forEach((t) => t.stop());
    pmrem.dispose();
    disposeScene(scene);
    renderer.dispose();
    layer.remove();
    onEnd();
  }
  // The camera can be taken away (another app, permission revoked)
  stream.getVideoTracks()[0]?.addEventListener('ended', end);

  return {
    reposition() {
      placed = false;
      dish.visible = false;
      setStatus('scanning');
    },
    rotate(radians) {
      if (placed) dish.rotation.y += radians;
    },
    end,
  };
}

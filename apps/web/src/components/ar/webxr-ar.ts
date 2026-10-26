/**
 * In-browser AR for Android (Chrome + ARCore) built directly on WebXR.
 *
 * model-viewer's own WebXR mode drops the model ~1 m in front of the camera,
 * snaps it to the first plane it finds (often the floor) and never anchors it,
 * so dishes slide away. Here the guest aims a reticle at the table, taps to
 * place the dish, and an XRAnchor keeps it pinned there as tracking improves.
 *
 * Loaded on demand (it pulls in three.js loaders), so keep imports local.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type DishArStatus = 'loading' | 'scanning' | 'ready' | 'placed';

export interface DishArSession {
  /** Pick the dish up again so the guest can place it somewhere else. */
  reposition(): void;
  /** Turn the placed dish around its vertical axis. */
  rotate(radians: number): void;
  end(): void;
}

interface StartOptions {
  modelUrl: string;
  /** Element shown on top of the camera feed (WebXR DOM overlay). */
  overlay: HTMLElement;
  onStatus(status: DishArStatus): void;
  onEnd(): void;
}

/** Soft round shadow so the dish looks like it sits on the table. */
export function contactShadow(size: number) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(0,0,0,0.38)');
  gradient.addColorStop(0.45, 'rgba(0,0,0,0.16)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false }),
  );
  mesh.position.y = 0.001;
  mesh.renderOrder = -1;
  return mesh;
}

export function makeReticle() {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.075, 0.09, 64).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 }),
  );
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(0.075, 64).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.25 }),
  );
  group.add(ring, disc);
  group.matrixAutoUpdate = false;
  group.visible = false;
  return group;
}

/** Frees every geometry, material and texture in the scene. */
export function disposeScene(scene: THREE.Scene) {
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    materials.forEach((m) => {
      Object.values(m).forEach((v) => v instanceof THREE.Texture && v.dispose());
      m.dispose();
    });
  });
}

export async function startDishAr({ modelUrl, overlay, onStatus, onEnd }: StartOptions): Promise<DishArSession> {
  // Must be the first await: requestSession needs the tap's user activation
  const session = await navigator.xr!.requestSession('immersive-ar', {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['dom-overlay', 'anchors'],
    domOverlay: { root: overlay },
  });

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local');
  renderer.domElement.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none';
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const sun = new THREE.DirectionalLight(0xffffff, 0.8);
  sun.position.set(0.4, 1, 0.3);
  scene.add(sun);

  const reticle = makeReticle();
  const dish = new THREE.Group();
  dish.visible = false;
  scene.add(reticle, dish);

  let placed = false;
  let anchor: XRAnchor | null = null;
  let hitTestSource: XRHitTestSource | undefined;
  let modelReady = false;
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
    () => session.end(),
  );

  let refSpace: XRReferenceSpace;
  try {
    await renderer.xr.setSession(session);
    refSpace = renderer.xr.getReferenceSpace()!;
    const viewerSpace = await session.requestReferenceSpace('viewer');
    hitTestSource = await session.requestHitTestSource?.({ space: viewerSpace });
  } catch (err) {
    session.end().catch(() => undefined);
    renderer.dispose();
    renderer.domElement.remove();
    throw err;
  }

  // Taps on overlay buttons shouldn't also count as "tap to place"
  const onBeforeSelect = (e: Event) => {
    if ((e.target as Element | null)?.closest?.('[data-ar-ui]')) e.preventDefault();
  };
  overlay.addEventListener('beforexrselect', onBeforeSelect);

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  // Hit results can only be read (and anchored) inside the frame that produced
  // them, so a tap just requests placement and the next frame performs it.
  let placeRequested = false;
  session.addEventListener('select', () => {
    if (!placed && modelReady) placeRequested = true;
  });

  function place(hit: XRHitTestResult, pose: XRPose) {
    matrix.fromArray(pose.transform.matrix).decompose(position, quaternion, scale);
    dish.position.copy(position);
    // Turn the dish to face the guest (three copies the XR viewer pose into `camera` each frame)
    const cam = camera.position;
    dish.rotation.set(0, Math.atan2(cam.x - position.x, cam.z - position.z), 0);
    dish.visible = true;
    reticle.visible = false;
    placed = true;
    popStart = performance.now();
    setStatus('placed');
    hit.createAnchor?.()
      .then((a) => {
        anchor?.delete();
        anchor = a;
      })
      .catch(() => undefined);
  }

  renderer.setAnimationLoop((time, frame) => {
    if (!frame) return;
    if (!placed && hitTestSource) {
      const hit = frame.getHitTestResults(hitTestSource)[0];
      const pose = hit?.getPose(refSpace);
      // Only horizontal surfaces (table, counter): the pose's up axis must point up
      if (pose && pose.transform.matrix[5] > 0.75) {
        if (placeRequested) {
          place(hit, pose);
        } else {
          reticle.matrix.fromArray(pose.transform.matrix);
          reticle.visible = true;
          setStatus(modelReady ? 'ready' : 'loading');
        }
      } else {
        reticle.visible = false;
        setStatus(modelReady ? 'scanning' : 'loading');
      }
      placeRequested = false;
    }
    if (placed && anchor) {
      const pose = frame.getPose(anchor.anchorSpace, refSpace);
      if (pose) {
        matrix.fromArray(pose.transform.matrix).decompose(position, quaternion, scale);
        dish.position.copy(position);
      }
    }
    if (placed) {
      // Quick settle-in so placement feels deliberate; ends at true size
      const t = Math.min(1, (performance.now() - popStart) / 220);
      dish.scale.setScalar(0.9 + 0.1 * (1 - Math.pow(1 - t, 3)));
    }
    renderer.render(scene, camera);
  });

  session.addEventListener('end', () => {
    overlay.removeEventListener('beforexrselect', onBeforeSelect);
    renderer.setAnimationLoop(null);
    hitTestSource?.cancel();
    anchor?.delete();
    pmrem.dispose();
    disposeScene(scene);
    renderer.dispose();
    renderer.domElement.remove();
    onEnd();
  });

  return {
    reposition() {
      placed = false;
      dish.visible = false;
      anchor?.delete();
      anchor = null;
      setStatus('scanning');
    },
    rotate(radians) {
      if (placed) dish.rotation.y += radians;
    },
    end() {
      session.end().catch(() => undefined);
    },
  };
}

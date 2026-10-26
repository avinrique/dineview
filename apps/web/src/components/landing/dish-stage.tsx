'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Where the dish sits, written by the page's scroll animations and read every
 * frame. x / y are fractions of the viewport from its centre (y down).
 */
export interface StageState {
  x: number;
  y: number;
  scale: number;
  rotX: number;
  rotY: number;
  opacity: number;
  /** Idle turntable speed, radians per second. */
  spin: number;
}

interface DishStageProps {
  src: string;
  state: StageState;
  onProgress?: (fraction: number) => void;
  onLoaded?: () => void;
}

/**
 * One full-screen WebGL canvas behind the page with a single dish model. The
 * page moves and turns it as you scroll; the pointer adds a slight tilt.
 */
export function DishStage({ src, state, onProgress, onLoaded }: DishStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const callbacks = useRef({ onProgress, onLoaded });
  callbacks.current = { onProgress, onLoaded };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
      // No WebGL: the page still works, just without the dish
      callbacks.current.onLoaded?.();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envMap;

    // Warm key light and an ember rim, like a dish under a pass lamp, plus a
    // soft fill so the side turned away never goes muddy
    const key = new THREE.DirectionalLight(0xffd9b0, 2.4);
    key.position.set(3, 4, 5);
    const rim = new THREE.DirectionalLight(0xff7a2e, 2.2);
    rim.position.set(-4, 1.5, -3);
    const fill = new THREE.HemisphereLight(0xfff1e0, 0x3a2416, 0.9);
    scene.add(key, rim, fill);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    // pivot: position + scale · tilt: lean toward the camera · spinner: turntable
    const pivot = new THREE.Group();
    const tilt = new THREE.Group();
    const spinner = new THREE.Group();
    pivot.add(tilt);
    tilt.add(spinner);
    scene.add(pivot);

    let disposed = false;
    new GLTFLoader().load(
      src,
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        model.position.sub(box.getCenter(new THREE.Vector3()));
        const holder = new THREE.Group();
        // Models are real-size (metres); normalise to ~2.2 scene units
        holder.scale.setScalar(2.2 / Math.max(size.x, size.y, size.z));
        holder.add(model);
        spinner.add(holder);
        callbacks.current.onLoaded?.();
      },
      (e) => {
        if (e.total) callbacks.current.onProgress?.(e.loaded / e.total);
      },
      () => callbacks.current.onLoaded?.(),
    );

    let viewW = 1;
    let viewH = 1;
    let fit = 1;
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      viewH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      viewW = viewH * camera.aspect;
      // Phones in portrait are narrow: shrink so the dish fits the width
      fit = Math.min(1, viewW / 3.1);
    };
    resize();
    window.addEventListener('resize', resize);

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointer = (e: PointerEvent) => {
      pointer.tx = e.clientX / window.innerWidth - 0.5;
      pointer.ty = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener('pointermove', onPointer);

    const clock = new THREE.Clock();
    let spin = 0;
    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(clock.getDelta(), 0.1);
      spin += dt * state.spin;
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;

      canvas.style.opacity = String(state.opacity);
      if (state.opacity < 0.01) return;
      pivot.position.set(state.x * viewW, -state.y * viewH, 0);
      pivot.scale.setScalar(state.scale * fit);
      tilt.rotation.set(state.rotX + pointer.y * 0.25, pointer.x * 0.35, 0);
      spinner.rotation.y = state.rotY + spin;
      renderer.render(scene, camera);
    };
    frame();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
        mats.forEach((m) => m.dispose());
      });
      envMap.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, [src, state]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      style={{ opacity: 0 }}
    />
  );
}

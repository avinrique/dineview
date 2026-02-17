'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createScene, createCamera, createRenderer, createShadowPlane } from '@/lib/three/scene-manager';
import { loadModel, createPlaceholderModel } from '@/lib/three/model-loader';

interface ModelViewerProps {
  modelUrl?: string;
  placeholderType?: 'plate' | 'bowl' | 'drink' | 'dessert';
  scale?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  className?: string;
}

export function ModelViewer({
  modelUrl,
  placeholderType = 'plate',
  scale = { x: 1, y: 1, z: 1 },
  rotation = { x: 0, y: 0, z: 0 },
  className = '',
}: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = createScene();
    const camera = createCamera(width / height);
    const renderer = createRenderer(canvas, width, height);

    // Shadow plane
    const shadowPlane = createShadowPlane();
    scene.add(shadowPlane);

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.3;
    controls.maxDistance = 3;
    controls.target.set(0, 0.1, 0);

    let mixer: THREE.AnimationMixer | undefined;
    const clock = new THREE.Clock();

    async function loadContent() {
      try {
        let model: THREE.Group;

        if (modelUrl) {
          const loaded = await loadModel(modelUrl);
          model = loaded.scene;
          mixer = loaded.mixer;
        } else {
          model = createPlaceholderModel(placeholderType);
        }

        model.scale.set(scale.x, scale.y, scale.z);
        model.rotation.set(rotation.x, rotation.y, rotation.z);
        scene.add(model);

        setLoading(false);
      } catch (err) {
        setError('Failed to load 3D model');
        setLoading(false);
      }
    }

    loadContent();

    // Animation loop
    let animationId: number;
    function animate() {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    function onResize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
    };
  }, [modelUrl, placeholderType, scale, rotation]);

  return (
    <div ref={containerRef} className={`relative bg-gray-100 rounded-xl overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin h-8 w-8 border-3 border-brand-500 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-500">Loading 3D model...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-md">
        Drag to rotate | Pinch to zoom
      </div>
    </div>
  );
}

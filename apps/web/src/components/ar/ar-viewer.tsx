'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { createScene, createCamera, createRenderer, createReticle, createShadowPlane } from '@/lib/three/scene-manager';
import { loadModel, createPlaceholderModel } from '@/lib/three/model-loader';
import { ArSession } from '@/lib/three/ar-session';
import { HitTestManager } from '@/lib/three/hit-test';
import { HotspotManager, type Hotspot } from '@/lib/three/hotspot-manager';
import { ArHotspot } from './ar-hotspot';

type ArPhase = 'loading' | 'scanning' | 'placed';

interface ArViewerProps {
  modelUrl?: string;
  placeholderType?: 'plate' | 'bowl' | 'drink' | 'dessert';
  scale?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  hotspots?: Array<{
    id: string;
    label: string;
    position: { x: number; y: number; z: number };
    type: 'ingredient' | 'nutrition' | 'allergen' | 'info';
    content: string;
  }>;
  onClose?: () => void;
}

export function ArViewer({
  modelUrl,
  placeholderType = 'plate',
  scale = { x: 1, y: 1, z: 1 },
  rotation = { x: 0, y: 0, z: 0 },
  hotspots: rawHotspots = [],
  onClose,
}: ArViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<ArPhase>('loading');
  const [screenHotspots, setScreenHotspots] = useState<Hotspot[]>([]);
  const arSessionRef = useRef<ArSession | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);

  const handlePlace = useCallback(() => {
    setPhase('placed');
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = createScene();
    const camera = createCamera(width / height);
    const renderer = createRenderer(canvas, width, height);
    renderer.xr.enabled = true;

    const reticle = createReticle();
    scene.add(reticle);

    const shadowPlane = createShadowPlane();

    const hitTestManager = new HitTestManager(reticle);
    const hotspotManager = new HotspotManager(camera, width, height);

    // Set up hotspots
    const hotspotObjects: Hotspot[] = rawHotspots.map((h) => ({
      ...h,
      position: new THREE.Vector3(h.position.x, h.position.y, h.position.z),
    }));
    hotspotManager.setHotspots(hotspotObjects);

    let model: THREE.Group | null = null;

    async function init() {
      // Load model
      try {
        if (modelUrl) {
          const loaded = await loadModel(modelUrl);
          model = loaded.scene;
        } else {
          model = createPlaceholderModel(placeholderType);
        }
        model.scale.set(scale.x, scale.y, scale.z);
        model.rotation.set(rotation.x, rotation.y, rotation.z);
        model.visible = false;
        modelRef.current = model;
        scene.add(model);
      } catch (err) {
        console.error('Failed to load model:', err);
      }

      // Start AR session
      const arSession = new ArSession({
        renderer,
        scene,
        camera,
        onSessionStarted: () => setPhase('scanning'),
        onSessionEnded: () => onClose?.(),
      });

      arSessionRef.current = arSession;
      const started = await arSession.start();

      if (!started) {
        console.error('Failed to start AR session');
        onClose?.();
        return;
      }

      // Touch to place
      canvas.addEventListener('touchstart', () => {
        if (phase === 'scanning' || !hitTestManager.placed) {
          const matrix = hitTestManager.placeAtReticle();
          if (matrix && model) {
            model.visible = true;
            model.matrix.copy(matrix);
            model.matrixAutoUpdate = false;
            scene.add(shadowPlane);
            shadowPlane.matrix.copy(matrix);
            shadowPlane.matrixAutoUpdate = false;
            handlePlace();
          }
        }
      });

      // XR animation loop
      renderer.setAnimationLoop((timestamp, frame) => {
        if (frame) {
          const hitMatrix = arSession.processHitTest(frame);
          if (hitMatrix) {
            hitTestManager.updateReticle(new Float32Array(hitMatrix));
          }
        }

        // Update hotspot screen positions
        if (model?.visible) {
          const updated = hotspotManager.updateScreenPositions(model.matrix);
          setScreenHotspots([...updated]);
        }

        renderer.render(scene, camera);
      });
    }

    init();

    return () => {
      arSessionRef.current?.end();
      renderer.dispose();
    };
  }, [modelUrl, placeholderType, scale, rotation, rawHotspots, onClose, handlePlace]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* DOM Overlay */}
      <div ref={overlayRef} className="absolute inset-0 pointer-events-none">
        {/* Phase indicators */}
        {phase === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white">
              <div className="animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-lg">Starting AR Experience...</p>
            </div>
          </div>
        )}

        {phase === 'scanning' && (
          <div className="absolute bottom-24 left-0 right-0 text-center">
            <div className="bg-black/60 text-white px-6 py-3 rounded-full inline-block">
              <p className="text-sm">Move your phone to scan a surface, then tap to place the dish</p>
            </div>
          </div>
        )}

        {/* Hotspots */}
        {phase === 'placed' &&
          screenHotspots
            .filter((h) => h.visible && h.screenPosition)
            .map((hotspot) => (
              <ArHotspot
                key={hotspot.id}
                label={hotspot.label}
                content={hotspot.content}
                type={hotspot.type}
                x={hotspot.screenPosition!.x}
                y={hotspot.screenPosition!.y}
              />
            ))}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-12 right-4 bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center pointer-events-auto"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

'use client';

import { createElement, useEffect, useRef, useState } from 'react';
import { Box, Ruler, Smartphone } from 'lucide-react';
import { ArTipsSheet, hasSeenArTips, markArTipsSeen } from '@/components/ar/ar-tips-sheet';

interface ModelViewerArProps {
  modelUrl: string;
  alt?: string;
  /** Dish name, shown in Google's AR viewer on Android. */
  title?: string;
  /** Image shown until the model has loaded. */
  poster?: string | null;
  /** Render the prominent "View on your table" AR button. */
  showArButton?: boolean;
  /** Label for the AR button. */
  arLabel?: string;
  /** Show the dish's real-world size under the model. */
  showSize?: boolean;
  autoRotate?: boolean;
  className?: string;
}

interface ModelViewerElement extends HTMLElement {
  canActivateAR: boolean;
  activateAR(): Promise<void>;
  getDimensions(): { x: number; y: number; z: number };
}

function isTouchDevice() {
  return typeof window !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);
}

const cm = (metres: number) => Math.max(1, Math.round(metres * 100));

/**
 * Cross-platform 3D + AR viewer built on Google's <model-viewer> web component.
 *
 *  - Android: Google's Scene Viewer (native ARCore). It anchors the dish to the
 *    surface you point at, so it stays put. model-viewer's in-browser WebXR mode
 *    drops the model ~1 m away, snaps it to the first plane found (often the
 *    floor) and doesn't anchor it, so the dish drifts. WebXR is only a fallback.
 *  - iOS (Safari/Chrome): AR Quick Look, with a USDZ generated from the GLB.
 *  - Desktop / devices without AR: interactive 3D only.
 *
 * Models are authored at real-world scale, so `ar-scale="fixed"` shows the
 * dish at its true size on the table.
 */
export function ModelViewerAr({
  modelUrl,
  alt = 'Dish 3D model',
  title,
  poster,
  showArButton = true,
  arLabel = 'View on your table',
  showSize = true,
  autoRotate = true,
  className,
}: ModelViewerArProps) {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [canAr, setCanAr] = useState(false);
  const [arFailed, setArFailed] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [size, setSize] = useState<{ w: number; d: number; h: number } | null>(null);
  const viewerRef = useRef<ModelViewerElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Dynamically import so the custom element only registers in the browser.
    import('@google/model-viewer')
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    const refreshAr = () => setCanAr(Boolean(el.canActivateAR));
    const onProgress = (e: Event) => setProgress((e as CustomEvent).detail.totalProgress ?? 0);
    const onLoad = () => {
      setLoaded(true);
      refreshAr();
      const dims = el.getDimensions();
      setSize({ w: cm(dims.x), d: cm(dims.z), h: cm(dims.y) });
    };
    const onArStatus = (e: Event) => setArFailed((e as CustomEvent).detail.status === 'failed');
    el.addEventListener('progress', onProgress);
    el.addEventListener('load', onLoad);
    el.addEventListener('ar-status', onArStatus);
    // AR support is resolved asynchronously after the element upgrades
    const t = setTimeout(refreshAr, 300);
    return () => {
      clearTimeout(t);
      el.removeEventListener('progress', onProgress);
      el.removeEventListener('load', onLoad);
      el.removeEventListener('ar-status', onArStatus);
    };
  }, [ready]);

  useEffect(() => {
    setLoaded(false);
    setProgress(0);
    setSize(null);
  }, [modelUrl]);

  function launchAr() {
    setTipsOpen(false);
    setArFailed(false);
    viewerRef.current?.activateAR().catch(() => setArFailed(true));
  }

  function handleArClick() {
    if (hasSeenArTips()) launchAr();
    else setTipsOpen(true);
  }

  if (!ready) {
    return (
      <div className={className ?? 'w-full h-full'}>
        <div className="flex h-full w-full items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  // Scene Viewer reads extra options from the model URL's query string
  const src = title ? `${modelUrl}${modelUrl.includes('?') ? '&' : '?'}title=${encodeURIComponent(title)}` : modelUrl;
  const arReady = showArButton && canAr;

  const progressBar = createElement(
    'div',
    {
      slot: 'progress-bar',
      className: `absolute inset-x-0 top-0 h-1 transition-opacity duration-300 ${loaded ? 'opacity-0' : 'opacity-100'}`,
    },
    createElement('div', {
      className: 'h-full bg-brand-500 transition-[width] duration-200',
      style: { width: `${Math.round(progress * 100)}%` },
    }),
  );
  // Replaces model-viewer's default AR button; ours (below) opens the tips first
  const hiddenArSlot = createElement('span', { slot: 'ar-button', style: { display: 'none' } });

  // React 19 sets props that exist on the element (ar, exposure, src) as DOM
  // properties, so they need real values: ar="" is falsy and disables AR.
  return (
    <div className={`relative ${className ?? 'w-full h-full'}`}>
      {createElement(
        'model-viewer' as any,
        {
          ref: viewerRef,
          src,
          alt,
          poster: poster || undefined,
          loading: 'eager',
          ar: showArButton,
          'ar-modes': 'scene-viewer webxr quick-look',
          'ar-scale': 'fixed',
          'ar-placement': 'floor',
          'camera-controls': '',
          'camera-orbit': 'auto 72deg 135%',
          'touch-action': 'pan-y',
          'interaction-prompt': 'none',
          'environment-image': 'neutral',
          'shadow-intensity': '1',
          'shadow-softness': '0.8',
          exposure: 1.05,
          'auto-rotate': autoRotate ? '' : undefined,
          'auto-rotate-delay': '0',
          'rotation-per-second': '20deg',
          style: {
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
            '--poster-color': 'transparent',
          },
        },
        progressBar,
        hiddenArSlot,
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex flex-col items-center gap-2.5 px-4">
        {showSize && size && (
          <span className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-black/5 backdrop-blur">
            <Ruler className="h-3.5 w-3.5 text-brand-600" />
            Real size {size.w} × {size.d} × {size.h} cm
          </span>
        )}
        {arReady && (
          <button
            onClick={handleArClick}
            className="pointer-events-auto flex items-center gap-2 whitespace-nowrap rounded-full bg-brand-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-brand-600/30 transition active:scale-[0.97] active:bg-brand-600"
          >
            <Box className="h-5 w-5" />
            {arLabel}
          </button>
        )}
        {showArButton && loaded && !canAr && isTouchDevice() && (
          <span className="flex items-center gap-1.5 rounded-full bg-gray-900/75 px-3 py-1.5 text-xs text-white backdrop-blur">
            <Smartphone className="h-3.5 w-3.5" />
            Open this page in Safari or Chrome to view it in AR
          </span>
        )}
      </div>

      {arFailed && (
        <div className="absolute inset-x-4 top-4 z-20 rounded-xl bg-white/95 px-4 py-3 text-center text-sm text-gray-700 shadow">
          AR couldn’t start on this device. You can still rotate and zoom the dish here.
        </div>
      )}

      <ArTipsSheet
        open={tipsOpen}
        onStart={() => {
          markArTipsSeen();
          launchAr();
        }}
        onClose={() => setTipsOpen(false)}
      />
    </div>
  );
}

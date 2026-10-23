'use client';

import { createElement, useEffect, useRef, useState } from 'react';

interface ModelViewerArProps {
  modelUrl: string;
  alt?: string;
  /** Image shown until the model has loaded. */
  poster?: string | null;
  /** Render the prominent "View on your table" AR button. */
  showArButton?: boolean;
  /** Label for the AR button. */
  arLabel?: string;
  autoRotate?: boolean;
  className?: string;
}

const AR_ICON_PATH = 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9';

/**
 * Cross-platform 3D + AR viewer built on Google's <model-viewer> web component.
 *
 *  - iOS (Safari/Chrome): launches AR Quick Look. We don't pass `ios-src`, so
 *    model-viewer generates a USDZ from the GLB on the fly.
 *  - Android (Chrome): in-page WebXR when ARCore is available, else Scene Viewer.
 *  - Desktop / devices without AR: interactive 3D only; the AR button hides itself.
 *
 * Models are authored at real-world scale, so `ar-scale="fixed"` shows the
 * dish at its true size on the table.
 */
export function ModelViewerAr({
  modelUrl,
  alt = 'Dish 3D model',
  poster,
  showArButton = true,
  arLabel = 'View on your table',
  autoRotate = true,
  className,
}: ModelViewerArProps) {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [arFailed, setArFailed] = useState(false);
  const viewerRef = useRef<HTMLElement | null>(null);

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
    const onProgress = (e: Event) => setProgress((e as CustomEvent).detail.totalProgress ?? 0);
    const onLoad = () => setLoaded(true);
    const onArStatus = (e: Event) => setArFailed((e as CustomEvent).detail.status === 'failed');
    el.addEventListener('progress', onProgress);
    el.addEventListener('load', onLoad);
    el.addEventListener('ar-status', onArStatus);
    return () => {
      el.removeEventListener('progress', onProgress);
      el.removeEventListener('load', onLoad);
      el.removeEventListener('ar-status', onArStatus);
    };
  }, [ready]);

  useEffect(() => {
    setLoaded(false);
    setProgress(0);
  }, [modelUrl]);

  if (!ready) {
    return (
      <div className={className ?? 'w-full h-full'}>
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-stone-50 to-stone-100">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  const arButton = showArButton
    ? createElement(
        'button',
        {
          slot: 'ar-button',
          className:
            'absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-brand-500 active:bg-brand-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg shadow-brand-500/30 flex items-center gap-2 whitespace-nowrap',
        },
        createElement(
          'svg',
          { className: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
          createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: AR_ICON_PATH }),
        ),
        arLabel,
      )
    : null;

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

  return (
    <div className={`relative ${className ?? 'w-full h-full'}`}>
      {createElement(
        'model-viewer' as any,
        {
          ref: viewerRef,
          src: modelUrl,
          alt,
          poster: poster || undefined,
          loading: 'eager',
          ar: showArButton ? '' : undefined,
          'ar-modes': 'webxr scene-viewer quick-look',
          'ar-scale': 'fixed',
          'ar-placement': 'floor',
          'camera-controls': '',
          'camera-orbit': 'auto 72deg 135%',
          'touch-action': 'pan-y',
          'interaction-prompt': 'none',
          'environment-image': 'neutral',
          'shadow-intensity': '1',
          'shadow-softness': '0.8',
          exposure: '1.05',
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
        arButton,
      )}
      {arFailed && (
        <div className="absolute inset-x-4 top-4 z-20 rounded-xl bg-white/95 px-4 py-3 text-center text-sm text-gray-700 shadow">
          AR couldn’t start on this device. You can still rotate and zoom the dish here.
        </div>
      )}
    </div>
  );
}

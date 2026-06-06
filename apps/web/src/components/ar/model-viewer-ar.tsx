'use client';

import { createElement, useEffect, useState } from 'react';

interface ModelViewerArProps {
  /** GLB url; falls back to the bundled sample dish model. */
  modelUrl?: string;
  alt?: string;
  /** Render the prominent "View in your space" AR button. */
  showArButton?: boolean;
}

/**
 * Cross-platform 3D + AR viewer built on Google's <model-viewer> web component.
 *
 *  - iOS (Safari/Chrome): launches AR Quick Look. We don't pass `ios-src`, so
 *    model-viewer auto-generates a USDZ from the GLB on the fly.
 *  - Android (Chrome): uses in-page WebXR when ARCore is available (works with
 *    our self-signed HTTPS), falling back to Scene Viewer.
 *  - Desktop / no-AR devices: interactive inline 3D, AR button auto-hidden.
 */
export function ModelViewerAr({ modelUrl, alt = 'Dish 3D model', showArButton = true }: ModelViewerArProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Dynamically import so the custom element only registers in the browser.
    import('@google/model-viewer')
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const src = modelUrl || '/models/sample-dish.glb';

  if (!ready) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <span className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const arButton = showArButton
    ? createElement(
        'button',
        {
          slot: 'ar-button',
          className:
            'absolute bottom-5 left-1/2 -translate-x-1/2 z-10 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg flex items-center gap-2',
        },
        createElement(
          'svg',
          { className: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
          createElement('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            d: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
          })
        ),
        'View in your space'
      )
    : null;

  return createElement(
    'model-viewer' as any,
    {
      src,
      alt,
      ar: showArButton ? '' : undefined,
      'ar-modes': 'webxr scene-viewer quick-look',
      'ar-scale': 'auto',
      'camera-controls': '',
      'touch-action': 'pan-y',
      'shadow-intensity': '1',
      'auto-rotate': '',
      'auto-rotate-delay': '0',
      exposure: '1',
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f8fafc',
        position: 'relative',
      },
    },
    arButton
  );
}

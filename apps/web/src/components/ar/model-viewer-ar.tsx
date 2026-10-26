'use client';

import { createElement, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Box, Ruler, Smartphone } from 'lucide-react';
import { ArTipsSheet, hasSeenArTips, markArTipsSeen } from '@/components/ar/ar-tips-sheet';
import { DishArOverlay } from '@/components/ar/dish-ar-overlay';
import type { DishFactsData } from '@/components/customer/dish-facts';
import type { DishArSession, DishArStatus } from '@/components/ar/webxr-ar';

interface ModelViewerArProps {
  modelUrl: string;
  /** USDZ for iOS. Without it, Chrome on iPhone can't open AR Quick Look. */
  iosSrc?: string | null;
  alt?: string;
  /** Dish name, shown during AR. */
  title?: string;
  /** Image shown until the model has loaded. */
  poster?: string | null;
  /** Render the prominent "View on your table" AR button. */
  showArButton?: boolean;
  /** Label for the AR button. */
  arLabel?: string;
  /** Show the dish's real-world size under the model. */
  showSize?: boolean;
  /** Nutrition and ingredients the guest can open during in-browser AR. */
  facts?: DishFactsData;
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

/** Android Chrome with ARCore: use our own anchored WebXR session. */
async function supportsDishAr() {
  if (!/Android/i.test(navigator.userAgent) || !navigator.xr) return false;
  try {
    return await navigator.xr.isSessionSupported('immersive-ar');
  } catch {
    return false;
  }
}

/**
 * Any other Android phone (no ARCore, e.g. the POCO F6, or a browser without
 * WebXR): the gyroscope camera preview in camera-ar.ts.
 */
function supportsCameraAr() {
  return /Android/i.test(navigator.userAgent) && window.isSecureContext && Boolean(navigator.mediaDevices?.getUserMedia);
}

function arUnavailableHint() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) {
    return 'Open this page in Safari to see it on your table';
  }
  if (/Firefox/i.test(ua)) return 'Open this page in Chrome to see it on your table';
  return 'AR isn’t supported on this phone, but you can still turn and zoom the dish';
}

const cm = (metres: number) => Math.max(1, Math.round(metres * 100));

/**
 * 3D dish viewer with "View on your table" AR, built on Google's <model-viewer>.
 *
 *  - Android with ARCore: our own WebXR session (webxr-ar.ts): aim at the
 *    table, tap to place, anchored so it doesn't drift. If the session fails
 *    to start (ARCore declined), the next tap opens Google's Scene Viewer.
 *  - Other Android phones: a camera preview (camera-ar.ts) with the dish
 *    drawn over the live camera, held in place by the gyroscope.
 *  - iOS (Safari/Chrome): AR Quick Look with the dish's USDZ (`iosSrc`).
 *  - Desktop / devices without AR: interactive 3D only.
 *
 * Models are authored at real-world scale, so AR shows the dish at true size.
 */
export function ModelViewerAr({
  modelUrl,
  iosSrc,
  alt = 'Dish 3D model',
  title,
  poster,
  showArButton = true,
  arLabel = 'View on your table',
  showSize = true,
  facts,
  autoRotate = true,
  className,
}: ModelViewerArProps) {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [canNativeAr, setCanNativeAr] = useState(false);
  const [webxr, setWebxr] = useState(false);
  const [cameraAr, setCameraAr] = useState(false);
  const [xrActive, setXrActive] = useState(false);
  const [xrStatus, setXrStatus] = useState<DishArStatus>('loading');
  const [arError, setArError] = useState<'failed' | 'camera-denied' | 'camera' | null>(null);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [size, setSize] = useState<{ w: number; d: number; h: number } | null>(null);
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const sessionRef = useRef<DishArSession | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Dynamically import so the custom element only registers in the browser.
    import('@google/model-viewer')
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) setReady(true);
      });
    supportsDishAr().then((ok) => {
      if (cancelled) return;
      setWebxr(ok);
      setCameraAr(!ok && supportsCameraAr());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Warm up the AR module so the tap can start the session straight away
  useEffect(() => {
    if (webxr) import('@/components/ar/webxr-ar').catch(() => undefined);
    if (cameraAr) import('@/components/ar/camera-ar').catch(() => undefined);
  }, [webxr, cameraAr]);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    const refreshAr = () => setCanNativeAr(Boolean(el.canActivateAR));
    const onProgress = (e: Event) => setProgress((e as CustomEvent).detail.totalProgress ?? 0);
    const onLoad = () => {
      setLoaded(true);
      refreshAr();
      const dims = el.getDimensions();
      setSize({ w: cm(dims.x), d: cm(dims.z), h: cm(dims.y) });
    };
    const onArStatus = (e: Event) => setArError((e as CustomEvent).detail.status === 'failed' ? 'failed' : null);
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

  useEffect(() => () => sessionRef.current?.end(), []);

  /** Our own AR on Android: WebXR with ARCore, otherwise the camera preview. */
  async function startSession() {
    const overlay = overlayRef.current;
    if (!overlay) return;
    // The overlay must be visible before the session takes it over
    flushSync(() => {
      setXrStatus('loading');
      setXrActive(true);
    });
    const options = {
      modelUrl,
      overlay,
      onStatus: setXrStatus,
      onEnd: () => {
        sessionRef.current = null;
        setXrActive(false);
      },
    };
    try {
      if (webxr) {
        const { startDishAr } = await import('@/components/ar/webxr-ar');
        sessionRef.current = await startDishAr(options);
      } else {
        const { startCameraAr } = await import('@/components/ar/camera-ar');
        sessionRef.current = await startCameraAr(options);
      }
    } catch (err) {
      setXrActive(false);
      if (webxr) {
        // e.g. ARCore missing or declined: the next tap uses Google's AR viewer
        setWebxr(false);
        setArError('failed');
      } else {
        setArError((err as DOMException)?.name === 'NotAllowedError' ? 'camera-denied' : 'camera');
      }
    }
  }

  function launchAr() {
    setTipsOpen(false);
    setArError(null);
    if (webxr || cameraAr) startSession();
    else viewerRef.current?.activateAR().catch(() => setArError('failed'));
  }

  function handleArClick() {
    if (hasSeenArTips()) launchAr();
    else setTipsOpen(true);
  }

  if (!ready) {
    return (
      <div className={className ?? 'w-full h-full'}>
        <div className="flex h-full w-full items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-ember border-t-transparent" />
        </div>
      </div>
    );
  }

  // Scene Viewer reads extra options from the model URL's query string
  const src = title ? `${modelUrl}${modelUrl.includes('?') ? '&' : '?'}title=${encodeURIComponent(title)}` : modelUrl;
  const canAr = webxr || cameraAr || canNativeAr;

  const progressBar = createElement(
    'div',
    {
      slot: 'progress-bar',
      className: `absolute inset-x-0 top-0 h-1 transition-opacity duration-300 ${loaded ? 'opacity-0' : 'opacity-100'}`,
    },
    createElement('div', {
      className: 'h-full bg-ember transition-[width] duration-200',
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
          'ios-src': iosSrc || undefined,
          alt,
          poster: poster || undefined,
          loading: 'eager',
          ar: showArButton,
          // WebXR is handled by webxr-ar.ts; these are the native viewers
          'ar-modes': 'scene-viewer quick-look',
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
          <span className="flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-white ring-1 ring-white/15 backdrop-blur">
            <Ruler className="h-3.5 w-3.5 text-ember" />
            Real size {size.w} × {size.d} × {size.h} cm
          </span>
        )}
        {showArButton && canAr && (
          <button
            onClick={handleArClick}
            className="pointer-events-auto flex items-center gap-2 whitespace-nowrap rounded-full bg-ember px-6 py-3.5 font-semibold text-ink shadow-lg shadow-black/30 transition active:scale-[0.97]"
          >
            <Box className="h-5 w-5" />
            {arLabel}
          </button>
        )}
        {showArButton && loaded && !canAr && isTouchDevice() && (
          <span className="flex max-w-xs items-center gap-1.5 rounded-full bg-gray-900/75 px-3 py-1.5 text-center text-xs text-white backdrop-blur">
            <Smartphone className="h-3.5 w-3.5 shrink-0" />
            {arUnavailableHint()}
          </span>
        )}
      </div>

      {arError && (
        <div className="absolute inset-x-4 top-16 z-20 rounded-xl bg-white/95 px-4 py-3 text-center text-sm text-gray-700 shadow">
          {arError === 'camera-denied'
            ? 'Allow camera access to see the dish on your table, then tap “View on your table” again.'
            : arError === 'camera'
              ? 'The camera didn’t open. Close other apps using it and try again.'
              : canAr
                ? 'AR didn’t start. Tap “View on your table” to try again.'
                : 'AR couldn’t start on this phone. You can still turn and zoom the dish here.'}
        </div>
      )}

      <ArTipsSheet
        open={tipsOpen}
        preview={cameraAr}
        onStart={() => {
          markArTipsSeen();
          launchAr();
        }}
        onClose={() => setTipsOpen(false)}
      />
      {(webxr || cameraAr) && (
        <DishArOverlay
          rootRef={overlayRef}
          active={xrActive}
          status={xrStatus}
          title={title}
          facts={facts}
          preview={cameraAr}
          onClose={() => sessionRef.current?.end()}
          onReposition={() => sessionRef.current?.reposition()}
          onRotate={(r) => sessionRef.current?.rotate(r)}
        />
      )}
    </div>
  );
}

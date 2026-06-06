'use client';

import { useState, useEffect } from 'react';

interface ArButtonProps {
  dishId: string;
  onViewAr: () => void;
  onView3D: () => void;
}

/**
 * Detects whether the device can plausibly do AR:
 *  - iOS  -> AR Quick Look (handled by model-viewer, no WebXR needed)
 *  - Android / WebXR-capable -> in-page WebXR or Scene Viewer
 * Desktop browsers fall back to the 3D viewer only.
 */
function detectArCapable(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  return isIOS || isAndroid || 'xr' in navigator;
}

export function ArButton({ dishId, onViewAr, onView3D }: ArButtonProps) {
  const [arCapable, setArCapable] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setArCapable(detectArCapable());
    setChecked(true);
  }, []);

  if (!checked) {
    return (
      <button className="btn-secondary opacity-50 cursor-wait flex items-center gap-2 w-full justify-center" disabled>
        <span className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
        Loading viewer...
      </button>
    );
  }

  return (
    <div className="flex gap-3">
      {arCapable && (
        <button onClick={onViewAr} className="btn-primary flex-1 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
          </svg>
          View in AR
        </button>
      )}
      <button onClick={onView3D} className={`flex items-center justify-center gap-2 ${arCapable ? 'btn-secondary flex-1' : 'btn-primary w-full'}`}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
        </svg>
        View in 3D
      </button>
    </div>
  );
}

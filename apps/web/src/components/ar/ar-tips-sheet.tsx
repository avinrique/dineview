'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Hand, ScanLine, MoveHorizontal } from 'lucide-react';

const SEEN_KEY = 'dineview:ar-tips-seen';

export function hasSeenArTips() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markArTipsSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Private mode: the tips just show again next time
  }
}

function arViewerName() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'Apple AR Quick Look';
  if (/Android/.test(ua)) return 'Google’s AR viewer';
  return null;
}

const STEPS = [
  { icon: ScanLine, title: 'Point your camera at the table', body: 'A plain, well-lit surface works best.' },
  { icon: MoveHorizontal, title: 'Move your phone slowly', body: 'Sweep side to side until the dish lands on the table.' },
  { icon: Hand, title: 'Drag to move, twist to turn', body: 'It stays where you put it, at its real size.' },
];

/** One-time coaching shown before the camera opens, so first AR attempts succeed. */
export function ArTipsSheet({ open, onStart, onClose }: { open: boolean; onStart: () => void; onClose: () => void }) {
  const [viewer, setViewer] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setViewer(arViewerName());
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="ar-tips-title">
      <button className="absolute inset-0 bg-gray-950/50 animate-fade-in" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-lg rounded-t-3xl bg-white px-5 pt-3 pb-safe shadow-2xl animate-slide-up">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-200" />
        <h2 id="ar-tips-title" className="text-xl font-bold text-gray-900">
          Place it on your table
        </h2>
        <p className="mt-1 text-sm text-gray-500">Three quick tips before your camera opens.</p>

        <ol className="mt-5 space-y-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3.5">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <step.icon className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-[11px] font-bold text-white">
                  {i + 1}
                </span>
              </span>
              <div className="pt-0.5">
                <p className="font-semibold text-gray-900">{step.title}</p>
                <p className="text-sm text-gray-500">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <button
          onClick={onStart}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3.5 font-semibold text-white shadow-lg shadow-brand-600/25 transition active:scale-[0.98] active:bg-brand-600"
        >
          <Camera className="h-5 w-5" /> Open camera
        </button>
        <button onClick={onClose} className="mt-1 w-full py-3 text-sm font-medium text-gray-500">
          Not now
        </button>
        {viewer && <p className="pb-1 text-center text-[11px] text-gray-400">Opens {viewer}</p>}
      </div>
    </div>,
    document.body,
  );
}

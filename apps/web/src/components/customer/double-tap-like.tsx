'use client';

import { useRef, useState, type ReactNode } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Double-tap the dish to like it, with a heart burst. Drags (rotating the
 * 3D model) and slow taps are ignored, so it never fights the viewer controls.
 */
export function DoubleTapLike({ onLike, children, className }: { onLike: () => void; children: ReactNode; className?: string }) {
  const last = useRef<{ t: number; x: number; y: number } | null>(null);
  const down = useRef<{ t: number; x: number; y: number } | null>(null);
  const [burst, setBurst] = useState(0);

  return (
    <div
      className={cn('relative', className)}
      onPointerDown={(e) => (down.current = { t: e.timeStamp, x: e.clientX, y: e.clientY })}
      onPointerUp={(e) => {
        const d = down.current;
        if (!d || e.timeStamp - d.t > 250 || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10) return;
        const prev = last.current;
        if (prev && e.timeStamp - prev.t < 320 && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < 40) {
          last.current = null;
          onLike();
          setBurst((n) => n + 1);
        } else {
          last.current = { t: e.timeStamp, x: e.clientX, y: e.clientY };
        }
      }}
    >
      {children}
      {burst > 0 && (
        <span key={burst} className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <Heart className="h-24 w-24 fill-ember text-ember drop-shadow-[0_4px_18px_rgba(0,0,0,0.35)] animate-heart-burst" />
        </span>
      )}
    </div>
  );
}

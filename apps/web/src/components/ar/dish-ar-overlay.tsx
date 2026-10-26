'use client';

import { useRef, type Ref } from 'react';
import { createPortal } from 'react-dom';
import { Hand, Move, Smartphone, X } from 'lucide-react';
import type { DishArStatus } from '@/components/ar/webxr-ar';
import { DishFacts, type DishFactsData } from '@/components/customer/dish-facts';
import { cn } from '@/lib/utils';

interface DishArOverlayProps {
  rootRef: Ref<HTMLDivElement>;
  active: boolean;
  status: DishArStatus;
  title?: string;
  facts?: DishFactsData;
  /** Camera preview on a phone without ARCore: no table tracking, so promise less. */
  preview?: boolean;
  onClose(): void;
  onReposition(): void;
  onRotate(radians: number): void;
}

const MESSAGES: Record<DishArStatus, string> = {
  loading: 'Getting the dish ready…',
  scanning: 'Move your phone slowly over the table',
  ready: 'Tap to place it here',
  placed: 'Drag to turn it. It stays where you put it.',
};

const PREVIEW_MESSAGES: Record<DishArStatus, string> = {
  loading: 'Getting the dish ready…',
  scanning: 'Point your phone down at the table',
  ready: 'Tap to place it here',
  placed: 'Drag to turn it',
};

/**
 * UI drawn over the camera feed during in-browser AR (the WebXR DOM overlay).
 * Always mounted so the session can be handed the element on tap.
 */
export function DishArOverlay({ rootRef, active, status, title, facts, preview, onClose, onReposition, onRotate }: DishArOverlayProps) {
  const lastX = useRef<number | null>(null);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={rootRef}
      className={cn('fixed inset-0 z-[80] select-none text-white', !active && 'hidden')}
      onTouchStart={(e) => (lastX.current = e.touches[0]?.clientX ?? null)}
      onTouchMove={(e) => {
        const x = e.touches[0]?.clientX;
        if (x == null || lastX.current == null) return;
        onRotate((x - lastX.current) * 0.012);
        lastX.current = x;
      }}
      onTouchEnd={() => (lastX.current = null)}
    >
      <div className="absolute inset-x-0 top-0 flex items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),1rem)]">
        <button
          data-ar-ui
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/45 backdrop-blur-md"
          aria-label="Close AR"
        >
          <X className="h-5 w-5" />
        </button>
        {title && (
          <span className="min-w-0 truncate rounded-full bg-black/45 px-3.5 py-2 text-sm font-medium backdrop-blur-md">
            {title} · {preview ? 'camera preview' : 'real size'}
          </span>
        )}
      </div>

      {/* Nutrition and ingredients, opened from two buttons under the title */}
      {facts && (
        <DishFacts
          facts={facts}
          placement="below"
          className="absolute inset-x-4 bottom-36 top-[calc(max(env(safe-area-inset-top),1rem)+3.5rem)]"
        />
      )}

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-5 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
        <div
          className={cn(
            'flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg backdrop-blur-md',
            status === 'ready' ? 'bg-ember text-ink' : 'bg-black/55',
          )}
        >
          {status === 'loading' && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          {status === 'scanning' && <Smartphone className="h-4 w-4 animate-ar-sweep" />}
          {status === 'ready' && <span className="h-2.5 w-2.5 animate-ping rounded-full bg-ink" />}
          {status === 'placed' && <Hand className="h-4 w-4" />}
          {(preview ? PREVIEW_MESSAGES : MESSAGES)[status]}
        </div>
        {status === 'placed' && (
          <button
            data-ar-ui
            onClick={onReposition}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-gray-900 shadow-lg"
          >
            <Move className="h-4 w-4" /> Move it
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}

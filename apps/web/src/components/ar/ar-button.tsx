'use client';

import { useState, useEffect } from 'react';
import { checkArSupport } from '@/lib/three/ar-utils';

interface ArButtonProps {
  dishId: string;
  onViewAr: () => void;
  onView3D: () => void;
}

export function ArButton({ dishId, onViewAr, onView3D }: ArButtonProps) {
  const [arSupported, setArSupported] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkArSupport()
      .then((support) => {
        setArSupported(support.immersiveArSupported);
      })
      .catch(() => {
        setArSupported(false);
      })
      .finally(() => {
        setChecked(true);
      });
  }, []);

  // Show loading only briefly
  if (!checked) {
    return (
      <button className="btn-secondary opacity-50 cursor-wait flex items-center gap-2 w-full justify-center" disabled>
        <span className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
        Checking 3D support...
      </button>
    );
  }

  return (
    <div className="flex gap-3">
      {arSupported && (
        <button onClick={onViewAr} className="btn-primary flex-1 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          View in AR
        </button>
      )}
      <button onClick={onView3D} className={`flex items-center justify-center gap-2 ${arSupported ? 'btn-secondary flex-1' : 'btn-primary w-full'}`}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
        </svg>
        View in 3D
      </button>
    </div>
  );
}

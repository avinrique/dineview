'use client';

import { useState, useEffect } from 'react';
import { checkArSupport, type ArSupportInfo } from '@/lib/three/ar-utils';

export function useArSupport() {
  const [support, setSupport] = useState<ArSupportInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkArSupport().then((info) => {
      setSupport(info);
      setLoading(false);
    });
  }, []);

  return {
    support,
    loading,
    hasAr: support?.immersiveArSupported ?? false,
    has3D: true, // Fallback always available
  };
}

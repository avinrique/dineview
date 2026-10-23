'use client';

import { useEffect, useState } from 'react';

/**
 * False during SSR and the first client render. The store is preloaded from
 * localStorage on the client only, so state-dependent UI waits for this to
 * avoid hydration mismatches.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

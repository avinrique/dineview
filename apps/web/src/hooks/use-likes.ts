'use client';

import { useCallback, useSyncExternalStore } from 'react';

const KEY = 'dineview:likes';
const listeners = new Set<() => void>();
let liked: Set<string> | null = null;

function load(): Set<string> {
  if (liked) return liked;
  try {
    liked = new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
  } catch {
    liked = new Set();
  }
  return liked;
}

function save(next: Set<string>) {
  liked = next;
  try {
    localStorage.setItem(KEY, JSON.stringify([...next]));
  } catch {
    // Private mode: likes last for this visit only
  }
  listeners.forEach((l) => l());
}

const EMPTY = new Set<string>();

/** Dishes the guest has hearted, kept on their own device (no public counts). */
export function useLikes() {
  const set = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    load,
    () => EMPTY,
  );

  const toggle = useCallback((id: string) => {
    const next = new Set(load());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    save(next);
  }, []);

  const like = useCallback((id: string) => {
    if (!load().has(id)) save(new Set(load()).add(id));
  }, []);

  return { isLiked: (id: string) => set.has(id), toggle, like };
}

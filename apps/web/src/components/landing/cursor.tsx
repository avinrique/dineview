'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

/**
 * Custom cursor for mouse users: a dot plus a trailing ring that grows over
 * links and shows the element's `data-cursor` label ("Try it", "Drag").
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled || !dot.current || !ring.current) return;
    document.documentElement.classList.add('custom-cursor');
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.08, ease: 'none' });
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.08, ease: 'none' });
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.5, ease: 'power3.out' });
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.5, ease: 'power3.out' });

    let hovering: Element | null = null;
    const move = (e: PointerEvent) => {
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
      const target = (e.target as Element | null)?.closest?.('[data-cursor], a, button') ?? null;
      if (target === hovering) return;
      hovering = target;
      const text = target?.getAttribute('data-cursor') || null;
      setLabel(text);
      gsap.to(ring.current, { scale: text ? 2.6 : target ? 1.7 : 1, duration: 0.35, ease: 'power3.out' });
      gsap.to(dot.current, { scale: target ? 0 : 1, duration: 0.25 });
    };
    const leave = () => gsap.to([dot.current, ring.current], { opacity: 0, duration: 0.2 });
    const enter = () => gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.2 });
    window.addEventListener('pointermove', move);
    document.addEventListener('pointerleave', leave);
    document.addEventListener('pointerenter', enter);
    return () => {
      document.documentElement.classList.remove('custom-cursor');
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
      document.removeEventListener('pointerenter', enter);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <div
        ref={ring}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[110] -ml-5 -mt-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 mix-blend-difference"
      >
        {label && <span className="whitespace-nowrap text-[5px] font-semibold uppercase tracking-[0.18em] text-white">{label}</span>}
      </div>
      <div ref={dot} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[110] -ml-1 -mt-1 h-2 w-2 rounded-full bg-white mix-blend-difference" />
    </>
  );
}

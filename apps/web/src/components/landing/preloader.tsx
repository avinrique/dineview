'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface PreloaderProps {
  /** Model download progress, 0–1. */
  progress: number;
  /** The dish model has loaded (or failed). */
  loaded: boolean;
  /** Called as the curtain starts to lift, so the hero can animate in under it. */
  onReveal: () => void;
}

const WORD = 'DineView';

/**
 * Full-screen intro: a 000–100 counter that follows the 3D model download,
 * then the curtain lifts. Shorter on a repeat visit in the same tab.
 */
export function Preloader({ progress, loaded, onReveal }: PreloaderProps) {
  const root = useRef<HTMLDivElement>(null);
  const live = useRef({ progress, loaded });
  live.current = { progress, loaded };
  const revealRef = useRef(onReveal);
  revealRef.current = onReveal;
  const [count, setCount] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let repeat = false;
    try {
      repeat = sessionStorage.getItem('dv:intro') === '1';
      sessionStorage.setItem('dv:intro', '1');
    } catch {
      // Storage blocked: always play the full intro
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // A time floor so it never flashes, the real download so it never lies,
    // and a ceiling so a slow network never traps the visitor
    const floor = repeat || reduce ? 450 : 1700;
    const ceiling = 6000;
    const start = performance.now();
    let shown = 0;
    let raf = 0;
    let exiting = false;

    const ctx = gsap.context(() => {
      gsap.from('[data-pre-char]', { yPercent: 110, duration: 0.9, ease: 'expo.out', stagger: 0.045, delay: 0.1 });
    }, root);

    const exit = () => {
      exiting = true;
      const tl = gsap.timeline({ onComplete: () => setGone(true) });
      tl.to('[data-pre-char]', { yPercent: -110, duration: 0.6, ease: 'expo.in', stagger: 0.03 }, 0)
        .to('[data-pre-count]', { opacity: 0, duration: 0.3 }, 0.1)
        .add(() => revealRef.current(), 0.55)
        .to(root.current, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, 0.45);
    };

    const tick = (now: number) => {
      const elapsed = now - start;
      const { progress: p, loaded: done } = live.current;
      const byTime = Math.min(1, elapsed / floor);
      const target = elapsed > ceiling ? 1 : Math.min(byTime, done ? 1 : Math.min(p, 0.96));
      shown += (target - shown) * 0.12;
      if (target === 1 && shown > 0.995) shown = 1;
      setCount(Math.round(shown * 100));
      if (shown === 1 && !exiting) exit();
      if (!exiting) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ctx.revert();
    };
  }, []);

  if (gone) return null;

  return (
    <div ref={root} className="fixed inset-0 z-[120] flex flex-col justify-between bg-ink px-5 py-6 text-cream md:px-10 md:py-8" aria-hidden>
      <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-cream/50">
        <span>AR menus for restaurants</span>
        <span>Warming the oven</span>
      </div>
      <div className="flex justify-center overflow-hidden">
        <span className="flex font-display text-[18vw] font-medium leading-[0.9] tracking-tight md:text-[11vw]">
          {[...WORD].map((ch, i) => (
            <span key={i} data-pre-char className={`inline-block ${i >= 4 ? 'italic text-ember' : ''}`}>
              {ch}
            </span>
          ))}
        </span>
      </div>
      <div data-pre-count className="flex items-end justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-cream/50">Loading the croissant</span>
        <span className="font-mono text-6xl tabular-nums md:text-8xl">{String(count).padStart(3, '0')}</span>
      </div>
    </div>
  );
}

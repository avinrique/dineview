'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { ArrowDown, ArrowUpRight, Box, ChefHat, QrCode, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DishStage, type StageState } from '@/components/landing/dish-stage';
import { Preloader } from '@/components/landing/preloader';
import { Cursor } from '@/components/landing/cursor';
import { Magnetic } from '@/components/landing/magnetic';
import { DemoQr } from '@/components/landing/demo-qr';

// Sizes are measured from each model's bounding box (width × depth × height);
// calories are the demo menu's, per serving
const DISHES = [
  { name: 'Strawberry Chocolate Cake', category: 'Bakery & Cakes', price: '$46.00', kcal: 450, size: '24 × 24 × 8 cm', image: '/images/dishes/strawberry-chocolate-cake.png' },
  { name: 'Butter Croissant', category: 'Bakery & Cakes', price: '$4.50', kcal: 270, size: '20 × 8 × 6 cm', image: '/images/dishes/croissant.png' },
  { name: 'Carrot Cake', category: 'Bakery & Cakes', price: '$42.00', kcal: 410, size: '23 × 23 × 10 cm', image: '/images/dishes/carrot-cake.png' },
  { name: 'Seasonal Fruit Bowl', category: 'Starters', price: '$16.00', kcal: 240, size: '32 × 31 × 17 cm', image: '/images/dishes/fruit-bowl.png' },
  { name: 'Afternoon Tea for Two', category: 'Drinks', price: '$14.00', kcal: null, size: '55 × 38 × 16 cm', image: '/images/dishes/afternoon-tea.png' },
  { name: 'Italian Lemonade', category: 'Drinks', price: '$16.00', kcal: 120, size: '39 × 28 × 22 cm', image: '/images/dishes/lemonade.png' },
];

// The 3D hero dish, as the demo menu lists it (per serving)
const INSIDE = {
  name: 'Strawberry Chocolate Cake',
  image: '/images/dishes/strawberry-chocolate-cake.png',
  kcal: 450,
  macros: [
    { label: 'Protein', g: 6 },
    { label: 'Carbs', g: 52 },
    { label: 'Fat', g: 24 },
    { label: 'Sugar', g: 38 },
  ],
  ingredients: ['Dark chocolate', 'Fresh strawberries', 'Ganache'],
  allergens: ['Gluten', 'Eggs', 'Milk', 'Soybeans'],
};
// How far each ingredient's leader line reaches into the dish (desktop)
const LEADS = ['10vw', '14vw', '8vw'];

// Where the dish rests in the hero: top right beside the headline on a
// laptop, under it on a phone
const HERO_POSE = { desktop: { x: 0.26, y: -0.17, scale: 0.8 }, mobile: { x: 0, y: 0.02, scale: 0.72 } };

const STEPS = [
  {
    title: 'Scan the table',
    body: 'Point the camera at the QR code on the table. The menu opens in the browser. No app, no sign-up.',
    chip: { label: 'Table P1', value: 'Menu open' },
  },
  {
    title: 'See it on the table',
    body: 'Tap “View on your table” and the dish appears in front of you at its real size. Walk around it, lean in.',
    chip: { label: 'Real size', value: '24 × 24 × 8 cm' },
  },
  {
    title: 'Order, then follow it',
    body: 'The order reaches the kitchen screen in a second, and guests watch it move from accepted to ready.',
    chip: { label: 'Order #A41', value: 'Preparing' },
  },
];

const STATEMENT: { text: string; em?: boolean }[] = [
  { text: 'A paper menu can’t show you the cake. It can’t tell you how big it is, or what’s in it. DineView puts' },
  { text: 'the real dish', em: true },
  { text: 'on your table, in 3D and at true size, with its calories and ingredients beside it.' },
];

const ORDER_STEPS = ['Placed', 'Accepted', 'Preparing', 'Ready', 'Served', 'Paid'];

/** Characters wrapped for the slide-up reveal; the parent clips them. */
function Chars({ text }: { text: string }) {
  return (
    <>
      {[...text].map((ch, i) => (
        <span key={i} data-char className="inline-block will-change-transform">
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </>
  );
}

function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('font-mono text-[11px] uppercase tracking-[0.2em]', className)}>{children}</span>;
}

export function Landing({ demoEnabled }: { demoEnabled: boolean }) {
  const root = useRef<HTMLElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  // Off for prefers-reduced-motion: no pinning, steps listed normally
  const [motion, setMotion] = useState(true);
  // Read every frame by the WebGL stage; GSAP tweens these numbers directly
  const stage = useRef<StageState>({ ...HERO_POSE.desktop, rotX: 0.5, rotY: 0, opacity: 0, spin: 0.35 }).current;
  const demoHref = demoEnabled ? '/scan/demo' : '#demo';

  const onProgress = useCallback((p: number) => setProgress(p), []);
  const onLoaded = useCallback(() => setLoaded(true), []);

  // Smooth scrolling, held still until the intro has finished
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ lerp: 0.09, anchors: true });
    lenisRef.current = lenis;
    lenis.stop();
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Scroll choreography
  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (reduce) {
        setMotion(false);
        stage.spin = 0;
        Object.assign(stage, HERO_POSE[window.innerWidth >= 768 ? 'desktop' : 'mobile']);
        // No movement: the dish simply hides once you leave the hero
        ScrollTrigger.create({
          trigger: '#story',
          start: 'top 70%',
          onEnter: () => gsap.to(stage, { opacity: 0, duration: 0.3 }),
          onLeaveBack: () => gsap.to(stage, { opacity: 1, duration: 0.3 }),
        });
        return;
      }

      // Hero is hidden under the preloader until the curtain lifts
      gsap.set('[data-char]', { yPercent: 115 });
      gsap.set('[data-hero-fade]', { opacity: 0, y: 24 });

      const mm = gsap.matchMedia();
      mm.add({ desktop: '(min-width: 768px)', mobile: '(max-width: 767px)' }, (c) => {
        const { desktop } = c.conditions as { desktop: boolean };
        const at = (d: number, m: number) => (desktop ? d : m);
        const scrub = { scrub: 1.2, invalidateOnRefresh: true };

        const hero = desktop ? HERO_POSE.desktop : HERO_POSE.mobile;
        gsap.set(stage, hero);

        // Hero → statement: drift left, turn half way
        gsap.fromTo(
          stage,
          { ...hero, rotY: 0, rotX: 0.5 },
          {
            x: at(-0.33, 0),
            y: at(0.02, -0.3),
            scale: at(0.62, 0.6),
            rotY: Math.PI,
            rotX: 0.2,
            opacity: at(1, 0.3),
            ease: 'none',
            immediateRender: false,
            scrollTrigger: { trigger: '#story', start: 'top bottom', end: 'center center', ...scrub },
          },
        );

        // Statement → how it works
        gsap.fromTo(
          stage,
          { x: at(-0.33, 0), y: at(0.02, -0.3), scale: at(0.62, 0.6), rotY: Math.PI, rotX: 0.2, opacity: at(1, 0.3) },
          {
            x: at(0.2, 0),
            y: at(0.02, 0.2),
            opacity: 1,
            scale: at(1.05, 0.85),
            rotY: Math.PI * 2,
            rotX: 0.6,
            ease: 'none',
            immediateRender: false,
            scrollTrigger: { trigger: '#how', start: 'top bottom', end: 'top top', ...scrub },
          },
        );

        // How it works: pinned, three steps, one full turn per step
        const steps = gsap.utils.toArray<HTMLElement>('[data-step]');
        const chips = gsap.utils.toArray<HTMLElement>('[data-step-chip]');
        gsap.set(steps.slice(1), { autoAlpha: 0, yPercent: 30 });
        gsap.set(chips.slice(1), { autoAlpha: 0, scale: 0.85 });
        const how = gsap.timeline({
          scrollTrigger: { trigger: '#how', start: 'top top', end: '+=260%', pin: true, ...scrub },
        });
        how
          .fromTo(stage, { rotY: Math.PI * 2 }, { rotY: Math.PI * 8, ease: 'none', duration: 3 }, 0)
          .fromTo('[data-step-bar]', { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 3 }, 0);
        steps.forEach((step, i) => {
          if (i === 0) return;
          how
            .to(steps[i - 1], { autoAlpha: 0, yPercent: -30, duration: 0.25 }, i - 0.15)
            .to(chips[i - 1], { autoAlpha: 0, scale: 0.85, duration: 0.25 }, i - 0.15)
            .to(step, { autoAlpha: 1, yPercent: 0, duration: 0.25 }, i + 0.05)
            .to(chips[i], { autoAlpha: 1, scale: 1, duration: 0.25 }, i + 0.05);
        });

        // How it works → what's inside: the dish comes to the centre
        gsap.fromTo(
          stage,
          { x: at(0.2, 0), y: at(0.02, 0.2), scale: at(1.05, 0.85), rotY: Math.PI * 8, rotX: 0.6 },
          {
            x: 0,
            y: at(0.03, -0.11),
            scale: at(0.95, 0.72),
            rotY: Math.PI * 9,
            rotX: 0.55,
            ease: 'none',
            immediateRender: false,
            scrollTrigger: { trigger: '#inside', start: 'top bottom', end: 'top top', ...scrub },
          },
        );

        // What's inside: pinned while calories count, macros fill and the
        // ingredients are drawn out of the dish
        const kcal = document.querySelector<HTMLElement>('[data-kcal]');
        const count = { v: 0 };
        if (kcal) kcal.textContent = '0';
        gsap
          .timeline({ scrollTrigger: { trigger: '#inside', start: 'top top', end: '+=200%', pin: true, ...scrub } })
          .fromTo(stage, { rotY: Math.PI * 9 }, { rotY: Math.PI * 11, ease: 'none', duration: 3 }, 0)
          .fromTo(
            count,
            { v: 0 },
            {
              v: INSIDE.kcal,
              duration: 0.9,
              ease: 'power2.out',
              onUpdate: () => {
                if (kcal) kcal.textContent = String(Math.round(count.v));
              },
            },
            0,
          )
          .fromTo('[data-macro-bar]', { scaleX: 0 }, { scaleX: 1, duration: 0.5, stagger: 0.15, ease: 'power2.out' }, 0.2)
          .fromTo('[data-lead]', { scaleX: 0 }, { scaleX: 1, duration: 0.4, stagger: 0.35, ease: 'power2.inOut' }, 0.8)
          .fromTo('[data-ingredient]', { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.4, stagger: 0.35 }, 1)
          .fromTo('[data-allergen]', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.08 }, 2.1);

        // Into the menu gallery: the dish steps back and fades
        gsap.fromTo(
          stage,
          { opacity: 1, x: 0, scale: at(0.95, 0.72), y: at(0.03, -0.11) },
          {
            opacity: 0,
            scale: at(0.55, 0.5),
            y: -0.25,
            ease: 'none',
            immediateRender: false,
            scrollTrigger: { trigger: '#menu', start: 'top bottom', end: 'top 35%', ...scrub },
          },
        );

        // Desktop: the gallery is pinned and scrolls sideways
        if (desktop) {
          const track = document.querySelector<HTMLElement>('[data-track]');
          const viewport = document.querySelector<HTMLElement>('[data-track-viewport]');
          if (track && viewport) {
            gsap.set(viewport, { overflow: 'hidden' });
            const distance = () => track.scrollWidth - window.innerWidth;
            const slide = gsap.to(track, {
              x: () => -distance(),
              ease: 'none',
              scrollTrigger: { trigger: '#menu', start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: 1, invalidateOnRefresh: true },
            });
            gsap.utils.toArray<HTMLElement>('[data-panel-img]').forEach((img) => {
              gsap.fromTo(
                img,
                { xPercent: 18, rotate: 6 },
                {
                  xPercent: -18,
                  rotate: -6,
                  ease: 'none',
                  scrollTrigger: { trigger: img, containerAnimation: slide, start: 'left right', end: 'right left', scrub: true },
                },
              );
            });
          }
        }

        // Finale: the dish comes back
        gsap.fromTo(
          stage,
          { opacity: 0, x: at(0.24, 0), y: 0.3, scale: 0.5, rotY: Math.PI * 11, rotX: 0.5 },
          {
            opacity: 1,
            x: at(0.24, 0),
            y: at(0.02, 0.02),
            scale: at(1, 0.6),
            rotY: Math.PI * 12,
            rotX: 0.45,
            ease: 'none',
            immediateRender: false,
            scrollTrigger: { trigger: '#demo', start: 'top bottom', end: 'top top', ...scrub },
          },
        );
      });

      // Statement: words light up as you read
      gsap.fromTo(
        '[data-word]',
        { opacity: 0.14 },
        { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: '[data-statement]', start: 'top 80%', end: 'bottom 45%', scrub: true } },
      );

      // Headings and blocks rise into place
      gsap.utils.toArray<HTMLElement>('[data-rise]').forEach((el) => {
        gsap.from(el, { yPercent: 105, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
      });
      gsap.utils.toArray<HTMLElement>('[data-fade]').forEach((el) => {
        gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
      });

      // Numbers count up
      gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
        const to = Number(el.dataset.count);
        const n = { v: 0 };
        gsap.to(n, {
          v: to,
          duration: 1.6,
          ease: 'power3.out',
          onUpdate: () => {
            el.textContent = String(Math.round(n.v));
          },
          scrollTrigger: { trigger: el, start: 'top 90%' },
        });
      });

      // Marquee: always moving, faster and skewed while you scroll
      const rows = gsap.utils.toArray<HTMLElement>('[data-marquee]');
      const loops = rows.map((row, i) =>
        gsap.fromTo(row, { xPercent: i % 2 ? -50 : 0 }, { xPercent: i % 2 ? 0 : -50, duration: 28, ease: 'none', repeat: -1 }),
      );
      const skew = gsap.quickTo('[data-marquee-wrap]', 'skewX', { duration: 0.5, ease: 'power3' });
      let settle: gsap.core.Tween | null = null;
      ScrollTrigger.create({
        trigger: '[data-marquee-wrap]',
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const v = self.getVelocity();
          const boost = 1 + Math.min(Math.abs(v) / 400, 5);
          loops.forEach((t) => gsap.to(t, { timeScale: boost, duration: 0.15, overwrite: true }));
          skew(gsap.utils.clamp(-10, 10, v / -250));
          settle?.kill();
          settle = gsap.delayedCall(0.12, () => {
            loops.forEach((t) => gsap.to(t, { timeScale: 1, duration: 0.9, overwrite: true }));
            skew(0);
          });
        },
      });
    }, root);

    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => ctx.revert();
  }, [stage]);

  // Hero intro once the curtain lifts
  useEffect(() => {
    if (!revealed) return;
    lenisRef.current?.start();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      // Without smooth scroll the page can move under the intro: only show the
      // dish if the guest is still in the hero (matches the hide trigger below)
      const story = document.querySelector('#story');
      stage.opacity = story && story.getBoundingClientRect().top > window.innerHeight * 0.7 ? 1 : 0;
      return;
    }
    const tl = gsap.timeline();
    tl.to('[data-char]', { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.028 }, 0)
      .fromTo(stage, { opacity: 0, scale: 0.35, rotY: -Math.PI }, { opacity: 1, scale: HERO_POSE[window.innerWidth >= 768 ? 'desktop' : 'mobile'].scale, rotY: 0, duration: 1.8, ease: 'expo.out' }, 0.15)
      .to('[data-hero-fade]', { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }, 0.5);
    return () => {
      tl.kill();
    };
  }, [revealed, stage]);

  return (
    <main ref={root} className="relative overflow-x-clip bg-ink text-cream selection:bg-ember selection:text-ink">
      <Preloader progress={progress} loaded={loaded} onReveal={() => setRevealed(true)} />
      <DishStage src="/models/dishes/strawberry-chocolate-cake.glb" state={stage} onProgress={onProgress} onLoaded={onLoaded} />
      <Cursor />
      <div aria-hidden className="grain pointer-events-none fixed -inset-[10%] z-[90]" />

      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 mix-blend-difference">
        <div className="flex items-center justify-between px-5 py-5 md:px-10 md:py-7">
          <Link href="/" className="font-display text-2xl font-medium tracking-tight text-white">
            Dine<em>View</em>
          </Link>
          <nav className="hidden items-center gap-9 md:flex" aria-label="Sections">
            {[
              ['#how', 'How it works'],
              ['#inside', 'What’s inside'],
              ['#menu', 'The menu'],
              ['#restaurants', 'For restaurants'],
            ].map(([href, text]) => (
              <a key={href} href={href} className="group relative font-mono text-[11px] uppercase tracking-[0.2em] text-white">
                {text}
                <span className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 bg-white transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100" />
              </a>
            ))}
          </nav>
          <Link href="/admin/login" className="font-mono text-[11px] uppercase tracking-[0.2em] text-white">
            Restaurant login
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative z-10 flex min-h-[100svh] flex-col justify-between px-5 pb-6 pt-28 md:px-10 md:pb-10 md:pt-36">
        <h1 aria-label="Taste it before you order." className="font-display font-medium leading-[0.86] tracking-[-0.035em]">
          <span aria-hidden className="-mb-[0.14em] block overflow-hidden pb-[0.14em] text-[17vw] md:text-[13.5vw]">
            <Chars text="Taste it" />
          </span>
          <span aria-hidden className="-mb-[0.14em] block overflow-hidden pb-[0.14em] text-[17vw] md:pl-[9vw] md:text-[13.5vw]">
            <Chars text="before" />
          </span>
          <span aria-hidden className="-mb-[0.14em] block overflow-hidden pb-[0.14em] text-[17vw] md:text-[13.5vw]">
            <Chars text="you " />
            <span className="italic text-ember">
              <Chars text="order." />
            </span>
          </span>
        </h1>

        <div className="mt-10 grid items-end gap-8 md:grid-cols-[1fr_auto_auto] md:gap-14">
          <p data-hero-fade className="max-w-md text-[17px] leading-relaxed text-cream/70 md:text-lg">
            DineView is the AR menu for restaurants. Guests scan the table, see every dish in 3D at its real size, check its
            calories and ingredients, and order from their phone.
          </p>
          <div data-hero-fade className="flex flex-wrap items-center gap-3">
            <Magnetic>
              <Link
                href={demoHref}
                data-cursor="Try it"
                className="group inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3.5 font-semibold text-ink transition-colors hover:bg-ember"
              >
                Try the live demo
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </Magnetic>
          </div>
          <div data-hero-fade className="hidden items-center gap-3 md:flex">
            <Label className="text-cream/50">Scroll</Label>
            <span className="relative h-12 w-px overflow-hidden bg-cream/15">
              <span className="absolute inset-x-0 top-0 h-1/2 animate-scroll-line bg-cream" />
            </span>
          </div>
        </div>
        <ul data-hero-fade className="mt-8 hidden flex-wrap gap-x-6 gap-y-2 border-t border-cream/10 pt-5 md:flex">
          {['AR on iPhone & Android', 'Calories & allergens', 'No app to install', 'Live kitchen updates'].map((t) => (
            <li key={t}>
              <Label className="text-cream/45">({t})</Label>
            </li>
          ))}
        </ul>
      </section>

      {/* Statement */}
      <section id="story" className="relative z-10 flex min-h-[110svh] items-center px-5 py-32 md:px-10">
        <div className="ml-auto max-w-[60rem] md:w-[62%]">
          <Label className="text-ember">(The idea)</Label>
          <p data-statement className="mt-6 font-display text-[9vw] font-normal leading-[1.08] tracking-[-0.02em] md:text-[3.6vw]">
            {STATEMENT.map((part, i) =>
              part.text.split(' ').map((w, j) => (
                <span key={`${i}-${j}`} data-word className={cn('inline-block pr-[0.24em]', part.em && 'italic text-ember')}>
                  {w}
                </span>
              )),
            )}
          </p>
        </div>
      </section>

      {/* How it works (pinned) */}
      <section id="how" className={cn('relative z-10 px-5 md:px-10', motion && 'h-[100svh] overflow-hidden')}>
        <div className="flex h-full flex-col justify-between gap-10 pb-8 pt-24 md:pb-12 md:pt-32">
          <div className="flex items-baseline justify-between gap-6">
            <h2 className="-mb-[0.14em] overflow-hidden pb-[0.14em] font-display text-[11vw] font-medium leading-none tracking-[-0.03em] md:text-[6vw]">
              <span data-rise className="inline-block">
                How it works
              </span>
            </h2>
            <Label className="whitespace-nowrap text-cream/50">(01 — 03)</Label>
          </div>

          <div className="relative grid flex-1 md:grid-cols-2">
            {/* Step text, stacked; the scroll swaps them */}
            <div className="relative mt-8 md:mt-0 md:self-center">
              {STEPS.map((s, i) => (
                <div key={s.title} data-step className={cn('max-w-md', motion ? i > 0 && 'absolute inset-x-0 top-0' : 'mb-12')}>
                  <span className="font-mono text-sm text-ember">0{i + 1}</span>
                  <h3 className="mt-3 font-display text-[9vw] font-medium leading-[1] tracking-[-0.02em] md:text-[3.4vw]">{s.title}</h3>
                  <p className="mt-4 text-cream/65 md:text-lg">{s.body}</p>
                </div>
              ))}
            </div>
            {/* Live chips beside the turning dish */}
            <div className={cn('pointer-events-none relative hidden md:block', !motion && 'md:hidden')}>
              {STEPS.map((s, i) => (
                <div
                  key={s.title}
                  data-step-chip
                  className={cn(
                    'absolute right-[6%] top-[18%] rounded-2xl border border-cream/15 bg-ink/70 px-4 py-3 backdrop-blur-xl',
                  )}
                >
                  <Label className="block text-cream/50">{s.chip.label}</Label>
                  <span className="mt-1 flex items-center gap-2 font-semibold">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-ember" />
                    {s.chip.value}
                  </span>
                  {i === 2 && (
                    <span className="mt-3 flex gap-1">
                      {ORDER_STEPS.map((o, k) => (
                        <span key={o} title={o} className={cn('h-1 w-6 rounded-full', k <= 2 ? 'bg-ember' : 'bg-cream/15')} />
                      ))}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="h-px w-full bg-cream/10">
            <div data-step-bar className="h-full origin-left bg-ember" />
          </div>
        </div>
      </section>

      {/* What's inside (pinned) */}
      <section id="inside" className={cn('relative z-10 px-5 md:px-10', motion && 'h-[100svh] overflow-hidden')}>
        <div className="flex h-full flex-col pb-8 pt-24 md:pb-12 md:pt-32">
          <div className="flex items-baseline justify-between gap-6">
            <h2 className="font-display text-[11vw] font-medium leading-[0.95] tracking-[-0.03em] md:text-[6vw]">
              <span className="-mb-[0.14em] block overflow-hidden pb-[0.14em]">
                <span data-rise className="inline-block">
                  Know what’s
                </span>
              </span>
              <span className="-mb-[0.14em] block overflow-hidden pb-[0.14em]">
                <span data-rise className="inline-block italic text-ember">
                  in it.
                </span>
              </span>
            </h2>
            <Label className="hidden text-cream/50 md:block">({INSIDE.name})</Label>
          </div>

          <div className="mt-6 flex flex-1 flex-col justify-end gap-5 md:mt-0 md:grid md:grid-cols-[minmax(0,25%)_1fr_minmax(0,25%)] md:items-center md:gap-0">
            {/* Calories and macros */}
            <div>
              <Label className="text-cream/50">Per serving</Label>
              <p className="mt-1 flex items-baseline gap-2 md:mt-2">
                <span data-kcal className="font-display text-[17vw] font-medium leading-none tracking-[-0.04em] tabular-nums md:text-[7vw]">
                  {INSIDE.kcal}
                </span>
                <Label className="text-ember">kcal</Label>
              </p>
              <ul className="mt-4 grid grid-cols-4 gap-x-3 md:mt-10 md:block md:space-y-5">
                {INSIDE.macros.map((m) => (
                  <li key={m.label}>
                    <div className="flex flex-col gap-0.5 md:flex-row md:items-baseline md:justify-between md:gap-2">
                      <Label className="text-[10px] text-cream/60 md:text-[11px]">{m.label}</Label>
                      <span className="font-mono text-sm tabular-nums">{m.g} g</span>
                    </div>
                    <div className="mt-1.5 h-px bg-cream/15">
                      <div data-macro-bar className="h-full origin-left bg-ember" style={{ width: `${(m.g / 60) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* The 3D dish turns in this gap; a still stands in without motion */}
            <div className={cn('justify-center', motion ? 'hidden md:block' : 'flex')}>
              {!motion && <img src={INSIDE.image} alt={INSIDE.name} className="max-h-[40svh] w-[80%] object-contain" />}
            </div>

            {/* Ingredients, drawn out of the dish, and allergens */}
            <div>
              <Label className="text-cream/50">Ingredients</Label>
              <ul className="mt-2 flex flex-wrap gap-1.5 md:mt-3 md:block">
                {INSIDE.ingredients.map((name, i) => (
                  <li key={name} className="relative md:border-b md:border-cream/10">
                    <span
                      data-lead
                      aria-hidden
                      className="absolute right-full top-1/2 hidden h-px origin-right bg-cream/45 md:block"
                      style={{ width: LEADS[i] }}
                    >
                      <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-ember shadow-[0_0_0_4px_rgba(255,107,26,0.25)]" />
                    </span>
                    <span
                      data-ingredient
                      className="flex items-baseline gap-3 rounded-full border border-cream/20 px-3 py-1 text-sm md:rounded-none md:border-0 md:px-0 md:py-3.5 md:font-display md:text-[1.9vw] md:leading-tight"
                    >
                      <span className="hidden font-mono text-xs text-ember md:inline">0{i + 1}</span>
                      {name}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 md:mt-8">
                <Label className="text-cream/50">Allergens</Label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {INSIDE.allergens.map((a) => (
                    <span key={a} data-allergen className="rounded-full bg-cream/10 px-3 py-1 text-xs text-cream/80">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The menu (horizontal on desktop) */}
      <section id="menu" className="relative z-20 bg-cream text-ink">
        <div data-track-viewport className="overflow-x-auto scrollbar-none md:h-[100svh]">
          <div data-track className="flex h-full w-max items-stretch">
            <div className="flex w-[88vw] shrink-0 flex-col justify-between px-5 py-20 md:w-[38vw] md:px-10 md:py-28">
              <Label className="text-ink/50">(The demo menu)</Label>
              <div>
                <h2 className="font-display text-[14vw] font-medium leading-[0.92] tracking-[-0.03em] md:text-[6.4vw]">
                  Every dish,
                  <br />
                  <em className="text-ember">in 3D.</em>
                </h2>
                <p className="mt-6 max-w-sm text-ink/60">
                  Photoreal scans of real food, at true scale. The cake is 24 cm on the table because it’s 24 cm on the plate.
                </p>
              </div>
              <Label className="flex items-center gap-2 text-ink/50">
                <span className="md:hidden">Swipe</span>
                <span className="hidden md:inline">Scroll</span>
                <ArrowDown className="h-3.5 w-3.5 -rotate-90" />
              </Label>
            </div>

            {DISHES.map((d, i) => (
              <Link
                key={d.name}
                href={demoHref}
                data-cursor="Try it"
                className="group relative flex w-[85vw] shrink-0 flex-col justify-between overflow-hidden border-l border-ink/10 px-5 py-10 md:w-[52vw] md:px-10 md:py-24"
              >
                <div className="flex justify-between">
                  <Label className="tabular-nums text-ink/50">
                    {String(i + 1).padStart(2, '0')} / {String(DISHES.length).padStart(2, '0')}
                  </Label>
                  <Label className="text-ink/50">{d.category}</Label>
                </div>
                <div className="relative my-8 flex aspect-[4/3] items-center justify-center md:my-0 md:aspect-auto md:flex-1">
                  <span aria-hidden className="absolute inset-[12%] rounded-full bg-ember/15 blur-3xl transition-transform duration-700 group-hover:scale-125" />
                  <img
                    data-panel-img
                    src={d.image}
                    alt={d.name}
                    loading="lazy"
                    className="relative max-h-[42svh] w-[78%] object-contain drop-shadow-[0_30px_40px_rgba(60,30,10,0.35)] transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div>
                  <h3 className="font-display text-[10vw] font-medium leading-[0.95] tracking-[-0.025em] md:text-[4vw]">{d.name}</h3>
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1">
                    <span className="font-semibold">{d.price}</span>
                    {d.kcal && <Label className="text-ink/55">{d.kcal} kcal</Label>}
                    <Label className="text-ink/55">Real size {d.size}</Label>
                    <Label className="flex items-center gap-1.5 text-ember">
                      <Box className="h-3.5 w-3.5" /> AR ready
                    </Label>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee */}
      <section aria-label="Scan, see it in 3D, order, follow it live" className="relative z-20 overflow-hidden bg-ink py-16 md:py-24">
        <div data-marquee-wrap className="space-y-2">
          {[
            ['Scan the table', 'See it in 3D', 'Know what’s in it', 'Order', 'Follow it live'],
            ['No app needed', 'Real size', 'Calories & allergens', 'Kitchen in a second'],
          ].map((words, row) => (
            <div key={row} data-marquee className="flex w-max">
              {[0, 1].map((copy) => (
                <span
                  key={copy}
                  aria-hidden
                  className={cn(
                    'flex shrink-0 items-center font-display text-[13vw] font-medium leading-[1.05] tracking-[-0.03em] md:text-[8vw]',
                    row === 1 && 'type-outline italic text-transparent',
                  )}
                >
                  {words.map((w) => (
                    <span key={w} className="flex items-center">
                      <span className="px-[0.25em]">{w}</span>
                      <span className="text-[0.5em] not-italic text-ember [-webkit-text-stroke:0]">✳</span>
                    </span>
                  ))}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* For restaurants */}
      <section id="restaurants" className="relative z-20 bg-ink px-5 py-24 md:px-10 md:py-36">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-display text-[12vw] font-medium leading-[0.92] tracking-[-0.03em] md:text-[6vw]">
            <span className="-mb-[0.14em] block overflow-hidden pb-[0.14em]">
              <span data-rise className="inline-block">
                Built for the floor
              </span>
            </span>
            <span className="-mb-[0.14em] block overflow-hidden pb-[0.14em]">
              <span data-rise className="inline-block italic text-ember">
                and the kitchen.
              </span>
            </span>
          </h2>
          <Label className="text-cream/50">(For restaurants)</Label>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-4 md:grid-rows-[auto_auto]">
          <SpotCard className="md:col-span-2 md:row-span-2">
            <ChefHat className="h-6 w-6 text-ember" />
            <h3 className="mt-5 text-2xl font-semibold">Kitchen display</h3>
            <p className="mt-2 max-w-sm text-cream/60">New orders arrive with a chime. One tap moves them from accepted to preparing to ready.</p>
            <div className="mt-8 rounded-2xl border border-cream/10 bg-cream/[0.04] p-5 font-mono text-sm">
              <div className="flex justify-between text-cream/50">
                <span>#A41 · Table P1</span>
                <span className="tabular-nums">04:12</span>
              </div>
              <ul className="mt-4 space-y-1.5">
                <li>2 × Butter Croissant</li>
                <li>1 × Italian Lemonade</li>
                <li className="text-cream/50">Note: one without butter on the side</li>
              </ul>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {ORDER_STEPS.slice(0, 4).map((o, k) => (
                  <span key={o} className={cn('rounded-full px-2.5 py-1 text-[11px]', k === 2 ? 'bg-ember text-ink' : 'bg-cream/10 text-cream/60')}>
                    {o}
                  </span>
                ))}
              </div>
            </div>
            <Label className="mt-4 block text-cream/35">(Example ticket)</Label>
          </SpotCard>
          <SpotCard className="md:col-span-2">
            <QrCode className="h-6 w-6 text-ember" />
            <h3 className="mt-5 text-xl font-semibold">Table QR codes</h3>
            <p className="mt-2 text-cream/60">Print a code per table. Close the table and settle the bill in a tap.</p>
          </SpotCard>
          <SpotCard>
            <UploadCloud className="h-6 w-6 text-ember" />
            <h3 className="mt-5 text-xl font-semibold">3D menu builder</h3>
            <p className="mt-2 text-cream/60">Upload a model and it’s AR-ready on Android and iPhone.</p>
          </SpotCard>
          <SpotCard>
            <svg viewBox="0 0 120 40" className="h-10 w-28 text-ember" aria-hidden>
              <path d="M0 32 L15 28 L30 30 L45 18 L60 22 L75 10 L90 14 L105 4 L120 8" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            <h3 className="mt-3 text-xl font-semibold">Live analytics</h3>
            <p className="mt-2 text-cream/60">Revenue by day, best sellers and order volume.</p>
          </SpotCard>
        </div>

        <dl className="mt-20 grid gap-10 border-t border-cream/10 pt-10 md:grid-cols-3">
          {[
            { n: 14, label: 'EU allergens tracked on every dish' },
            { n: 6, label: 'Order steps guests can follow live' },
            { n: 0, label: 'Apps to install' },
          ].map((s) => (
            <div key={s.label} data-fade>
              <dt className="sr-only">{s.label}</dt>
              <dd data-count={s.n} className="font-display text-[22vw] font-medium leading-none tracking-[-0.04em] tabular-nums md:text-[9vw]">
                {s.n}
              </dd>
              <dd className="mt-2">
                <Label className="text-cream/55">{s.label}</Label>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Finale */}
      <section id="demo" className="relative z-10 flex min-h-[100svh] flex-col justify-between px-5 pb-16 pt-28 md:justify-center md:px-10 md:py-28">
        <h2 className="max-w-[12ch] font-display text-[16vw] font-medium leading-[0.9] tracking-[-0.035em] md:text-[8.5vw]">
          <span className="-mb-[0.14em] block overflow-hidden pb-[0.14em]">
            <span data-rise className="inline-block">
              Put your menu
            </span>
          </span>
          <span className="-mb-[0.14em] block overflow-hidden pb-[0.14em]">
            <span data-rise className="inline-block italic text-ember">
              on the table.
            </span>
          </span>
        </h2>
        <div data-fade className="mt-14 flex flex-wrap items-center gap-10">
          <Magnetic strength={0.45}>
            <Link
              href={demoHref}
              data-cursor="Go"
              className="flex h-40 w-40 flex-col items-center justify-center rounded-full bg-ember text-center font-semibold text-ink transition-transform duration-500 hover:scale-105 md:h-44 md:w-44"
            >
              <ArrowUpRight className="mb-1 h-6 w-6" />
              Try the
              <br />
              live demo
            </Link>
          </Magnetic>
          {demoEnabled && (
            <div className="hidden items-center gap-5 md:flex">
              <div className="rounded-2xl bg-cream p-1 [&_p]:hidden">
                <DemoQr size={120} />
              </div>
              <p className="max-w-[14rem] text-sm text-cream/60">Or point your phone camera here. It opens a demo table at Bella Vista.</p>
            </div>
          )}
        </div>
      </section>

      <footer className="relative z-20 overflow-hidden border-t border-cream/10 bg-ink px-5 pt-10 md:px-10">
        <div className="flex flex-wrap justify-between gap-4">
          <Label className="text-cream/45">© 2026 DineView · AR menus for restaurants</Label>
          <div className="flex gap-6">
            <Link href="/admin/login" className="hover:text-ember">
              <Label>Restaurant login</Label>
            </Link>
            <a href="#top" className="hover:text-ember">
              <Label>Back to top ↑</Label>
            </a>
          </div>
        </div>
        <p aria-hidden className="mt-8 select-none whitespace-nowrap font-display text-[24vw] font-medium leading-[0.75] tracking-[-0.05em] text-cream/[0.06]">
          Dine<em>View</em>
        </p>
      </footer>
    </main>
  );
}

/** Card with a soft light that follows the mouse. */
function SpotCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-fade
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
      }}
      className={cn(
        'group relative overflow-hidden rounded-3xl border border-cream/10 bg-cream/[0.03] p-7 transition-colors duration-500 hover:border-cream/25',
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: 'radial-gradient(420px circle at var(--mx) var(--my), rgba(249,115,22,0.14), transparent 60%)' }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

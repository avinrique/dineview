'use client';

import { createElement, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Box, Check, ChevronUp, Heart, LayoutGrid, Plus, ShoppingBag } from 'lucide-react';
import { ALLERGEN_LABELS } from '@dineview/shared';
import { useCart } from '@/hooks/use-cart';
import { useLikes } from '@/hooks/use-likes';
import { cn, formatPrice } from '@/lib/utils';
import { DoubleTapLike } from '@/components/customer/double-tap-like';
import { MacroRow } from '@/components/customer/nutrition';

type Dish = any;

export interface ReelItem {
  dish: Dish;
  category: string;
  ar: boolean;
}

interface ReelsFeedProps {
  items: ReelItem[];
  categories: { id: string; name: string }[];
  categoryId: string | null;
  onCategory: (id: string | null) => void;
  /** Dish to open at (tapped in the list, or the one the guest left from). */
  startId?: string | null;
  onActive?: (dishId: string) => void;
  onBrowse: () => void;
  restaurantName: string;
  tableLabel?: string | null;
  currency: string;
}

// Ingredient callouts around the dish: which side, and how far down
const CALLOUTS = [
  { side: 'left', top: '16%' },
  { side: 'right', top: '44%' },
  { side: 'left', top: '70%' },
] as const;

const label = 'font-mono text-[10px] uppercase tracking-[0.2em]';

// The swipe hint shows once per visit
let hintSeen = false;

/**
 * The menu one dish per screen: swipe up for the next. Dishes with a 3D model
 * turn slowly with their ingredients called out around them; calories and
 * macros sit under the name, with like, AR and add in one row.
 */
export function ReelsFeed({
  items,
  categories,
  categoryId,
  onCategory,
  startId,
  onActive,
  onBrowse,
  restaurantName,
  tableLabel,
  currency,
}: ReelsFeedProps) {
  const scroller = useRef<HTMLDivElement>(null);
  // Category the feed was last placed for: dev StrictMode re-runs effects
  // without a change, and that must not send the guest back to the top
  const placedFor = useRef<string | null | undefined>(undefined);
  const [active, setActive] = useState(0);
  const [viewerReady, setViewerReady] = useState(false);
  const [hint, setHint] = useState(!hintSeen);
  const [added, setAdded] = useState<{ name: string; at: number } | null>(null);
  const { itemCount, total } = useCart();

  useEffect(() => {
    let cancelled = false;
    // Registers <model-viewer> in the browser only
    import('@google/model-viewer')
      .catch(() => undefined)
      .then(() => !cancelled && setViewerReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  // Open at the requested dish; a new category starts from its first dish
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || placedFor.current === categoryId) return;
    const start = placedFor.current === undefined ? Math.max(0, items.findIndex((i) => i.dish.id === startId)) : 0;
    placedFor.current = categoryId;
    el.scrollTop = start * el.clientHeight;
    setActive(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll('[data-index]').forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [items]);

  const activeId = items[active]?.dish.id;
  useEffect(() => {
    if (activeId) onActive?.(activeId);
    if (active > 0) {
      hintSeen = true;
      setHint(false);
    }
  }, [active, activeId, onActive]);

  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(false), 5000);
    return () => clearTimeout(t);
  }, [hint]);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(null), 2600);
    return () => clearTimeout(t);
  }, [added]);

  // Arrow keys / j k step through dishes on a laptop
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = scroller.current;
      const dir = e.key === 'ArrowDown' || e.key === 'j' ? 1 : e.key === 'ArrowUp' || e.key === 'k' ? -1 : 0;
      if (!el || !dir || e.target instanceof HTMLInputElement) return;
      e.preventDefault();
      el.scrollBy({ top: dir * el.clientHeight, behavior: 'smooth' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="fixed inset-0 z-30 bg-ink text-cream">
      <div
        ref={scroller}
        className="mx-auto h-full max-w-md snap-y snap-mandatory overflow-y-scroll overscroll-y-contain scrollbar-none"
      >
        {items.map((item, i) => (
          <Reel
            key={item.dish.id}
            index={i}
            count={items.length}
            item={item}
            active={i === active}
            viewerReady={viewerReady}
            hint={hint && i === 0}
            currency={currency}
            onAdded={(name) => setAdded({ name, at: Date.now() })}
          />
        ))}
        {items.length === 0 && (
          <div className="flex h-full items-center justify-center px-10 text-center text-cream/60">Nothing on this menu yet.</div>
        )}
      </div>

      {/* Top bar: all dishes · where you are · your order, then the menus */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 mx-auto max-w-md bg-gradient-to-b from-ink via-ink/85 to-transparent pb-5">
        <div className="pointer-events-auto flex items-center gap-2.5 px-3 pt-[max(env(safe-area-inset-top),0.5rem)]">
          <button
            onClick={onBrowse}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cream/15 active:bg-cream/10"
            aria-label="All dishes"
          >
            <LayoutGrid className="h-[18px] w-[18px]" />
          </button>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate font-display text-[17px]">{restaurantName}</p>
            {tableLabel && <p className={cn(label, 'text-cream/50')}>Table {tableLabel}</p>}
          </div>
          <Link
            href="/cart"
            className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-cream/15 px-3.5 active:bg-cream/10"
            aria-label={`Your order, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {itemCount > 0 && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-ember px-1 font-mono text-[11px] font-medium text-ink">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
        <nav className="pointer-events-auto mt-2.5 flex gap-1.5 overflow-x-auto px-3 scrollbar-none" aria-label="Menus">
          {[{ id: null as string | null, name: 'All' }, ...categories].map((c) => {
            const on = c.id === categoryId;
            return (
              <button
                key={c.id ?? 'all'}
                onClick={(e) => {
                  e.currentTarget.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
                  onCategory(c.id);
                }}
                aria-pressed={on}
                className={cn(
                  label,
                  'shrink-0 rounded-full px-3.5 py-1.5 transition-colors',
                  on ? 'bg-cream text-ink' : 'border border-cream/15 text-cream/60',
                )}
              >
                {c.name}
              </button>
            );
          })}
        </nav>

        {added && (
          <Link
            key={added.at}
            href="/cart"
            className="pointer-events-auto mx-auto mt-3 flex w-max max-w-[calc(100%-2rem)] items-center gap-2 rounded-full bg-cream px-4 py-2 text-[13px] font-semibold text-ink shadow-xl animate-toast-in"
          >
            <Check className="h-4 w-4 shrink-0 text-ember" />
            <span className="truncate">{added.name} added</span>
            <span className="shrink-0 text-ink/40">·</span>
            <span className="shrink-0">View order {formatPrice(total, currency)}</span>
          </Link>
        )}
      </div>
    </div>
  );
}

interface ReelProps {
  item: ReelItem;
  index: number;
  count: number;
  active: boolean;
  viewerReady: boolean;
  hint: boolean;
  currency: string;
  onAdded: (name: string) => void;
}

function Reel({ item, index, count, active, viewerReady, hint, currency, onAdded }: ReelProps) {
  const { dish, category, ar } = item;
  const { isLiked, toggle, like } = useLikes();
  const { items: cart, addItem } = useCart();
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const liked = isLiked(dish.id);
  const qty = cart.find((i) => i.dishId === dish.id)?.quantity ?? 0;
  const price = formatPrice(Number(dish.price), currency);
  const allergens: string[] = (dish.allergens || []).map((a: any) => (ALLERGEN_LABELS as any)[a.allergen] ?? a.allergen);
  const ingredients: string[] = [...(dish.ingredients || [])]
    .sort((a: any, b: any) => Number(b.isPrimary) - Number(a.isPrimary))
    .map((i: any) => i.name);
  // Only the dish on screen runs a WebGL viewer
  const modelUrl: string | undefined = ar && active && viewerReady ? dish.arAsset?.fileUrl : undefined;
  const showModel = Boolean(modelUrl && loaded);
  const cutout = dish.imageUrl && /\.png($|\?)/i.test(dish.imageUrl);
  const pictured = Boolean(dish.imageUrl || ar);

  useEffect(() => {
    if (!active) {
      setExpanded(false);
      setLoaded(false);
    }
  }, [active]);

  function add() {
    addItem({ dishId: dish.id, name: dish.name, price: Number(dish.price), imageUrl: dish.imageUrl });
    onAdded(dish.name);
  }

  return (
    <section
      data-index={index}
      aria-label={`${dish.name}, ${price}`}
      className="relative flex h-full w-full snap-start snap-always flex-col overflow-hidden"
    >
      {/* Warm light behind the dish, or the photo itself */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'radial-gradient(80% 48% at 50% 38%, rgba(255,107,26,0.17), rgba(11,10,9,0) 70%)' }}
      />
      {dish.imageUrl && !cutout && (
        <>
          <img src={dish.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover animate-ken-burns" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/30" />
        </>
      )}

      {/* Room for the top bar */}
      <div className="h-[calc(max(env(safe-area-inset-top),0.5rem)+5.75rem)] shrink-0" />

      {/* Dish */}
      <div className="relative min-h-0 flex-1">
        <DoubleTapLike onLike={() => like(dish.id)} className="absolute inset-0">
          {cutout && (
            <img
              src={dish.imageUrl}
              alt=""
              className={cn(
                'absolute inset-0 h-full w-full object-contain p-[9%] drop-shadow-[0_28px_40px_rgba(0,0,0,0.6)] transition-opacity duration-500',
                showModel ? 'opacity-0' : 'opacity-100 animate-float',
              )}
            />
          )}
          {!pictured && <TitleCard name={dish.name} category={category} ingredients={ingredients} />}
          {modelUrl && <ReelModel src={modelUrl} onLoad={() => setLoaded(true)} />}
        </DoubleTapLike>

        {pictured &&
          ingredients.slice(0, CALLOUTS.length).map((name, i) => (
            <Callout key={name} name={name} side={CALLOUTS[i]!.side} top={CALLOUTS[i]!.top} shown={active} delay={350 + i * 160} />
          ))}

        <span className={cn(label, 'pointer-events-none absolute right-3 top-0 tabular-nums text-cream/40')}>
          {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
        </span>

        {hint && (
          <span
            className={cn(
              label,
              'pointer-events-none absolute inset-x-0 bottom-2 mx-auto flex w-max items-center gap-1.5 rounded-full bg-ink/70 px-3.5 py-2 text-cream/80 backdrop-blur-md animate-fade-in',
            )}
          >
            <ChevronUp className="h-4 w-4 animate-swipe-hint" /> Swipe up · next dish
          </span>
        )}
      </div>

      {/* About the dish */}
      <div className="relative z-10 shrink-0 px-4 pt-3">
        <p className={cn(label, 'flex flex-wrap items-center gap-x-2 gap-y-1 text-cream/55')}>
          <span>{category}</span>
          {dish.isFeatured && (
            <span className="flex items-center gap-2 text-ember">
              <span className="h-1 w-1 rounded-full bg-ember" /> Chef’s pick
            </span>
          )}
          {dish.prepTimeMin && (
            <span className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-cream/30" /> {dish.prepTimeMin} min
            </span>
          )}
        </p>
        <Link href={`/dish/${dish.id}`} className="mt-1.5 flex items-start gap-1.5 font-display text-[28px] font-medium leading-[1.05]">
          <span className="min-w-0">{dish.name}</span>
          <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-cream/40" aria-label="Details" />
        </Link>
        {dish.description && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className={cn('mt-1.5 block text-left text-[13.5px] leading-snug text-cream/65', !expanded && 'line-clamp-2')}
          >
            {dish.description}
          </button>
        )}
        <MacroRow nutrition={dish.nutrition} className="mt-3" />
        {allergens.length > 0 && <p className={cn(label, 'mt-2 tracking-[0.16em] text-cream/45')}>Contains {allergens.join(' · ')}</p>}

        <div className="mt-3.5 flex items-center gap-2">
          <button
            onClick={() => toggle(dish.id)}
            aria-label={liked ? 'Unlike' : 'Like'}
            aria-pressed={liked}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-cream/15 transition active:scale-90"
          >
            <Heart key={String(liked)} className={cn('h-[22px] w-[22px]', liked && 'fill-ember text-ember animate-heart-pop')} />
          </button>
          {ar && (
            <Link
              href={`/dish/${dish.id}/ar`}
              aria-label={`See ${dish.name} on your table in AR`}
              className="flex h-12 shrink-0 items-center gap-1.5 rounded-full border border-cream/15 px-4 text-sm font-semibold transition active:scale-95"
            >
              <Box className="h-[18px] w-[18px] text-ember" /> AR
            </Link>
          )}
          <button
            onClick={add}
            aria-label={`Add ${dish.name}, ${price}`}
            className="flex h-12 min-w-0 flex-1 items-center justify-between gap-2 rounded-full bg-ember pl-5 pr-1.5 font-semibold text-ink transition active:scale-[0.98]"
          >
            <span className="truncate">{qty ? `${qty} in order` : 'Add'}</span>
            <span className="flex items-center gap-2">
              <span className="font-mono text-sm">{price}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/15">
                <Plus className="h-4 w-4" strokeWidth={2.5} />
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* Room for the bottom nav */}
      <div className="shrink-0" style={{ height: 'calc(var(--guest-nav-h) + 0.75rem)' }} />
    </section>
  );
}

/** An ingredient label with a line drawn into the dish. */
function Callout({ name, side, top, shown, delay }: { name: string; side: 'left' | 'right'; top: string; shown: boolean; delay: number }) {
  const left = side === 'left';
  return (
    <span
      aria-hidden
      className={cn('pointer-events-none absolute flex items-center', left ? 'left-3' : 'right-3 flex-row-reverse')}
      style={{ top }}
    >
      <span
        className={cn(
          label,
          'max-w-[11.5rem] truncate rounded-full border border-cream/15 bg-ink/60 px-2.5 py-1 tracking-[0.14em] text-cream/85 backdrop-blur-md transition-all duration-500',
          shown ? 'translate-x-0 opacity-100' : left ? '-translate-x-2 opacity-0' : 'translate-x-2 opacity-0',
        )}
        style={{ transitionDelay: shown ? `${delay}ms` : '0ms' }}
      >
        {name}
      </span>
      <span
        className={cn('h-px w-7 bg-cream/40 transition-transform duration-500', left ? 'origin-left' : 'origin-right', shown ? 'scale-x-100' : 'scale-x-0')}
        style={{ transitionDelay: shown ? `${delay + 200}ms` : '0ms' }}
      />
      <span
        className={cn('h-1.5 w-1.5 rounded-full bg-ember shadow-[0_0_0_3px_rgba(255,107,26,0.25)] transition-opacity duration-300', shown ? 'opacity-100' : 'opacity-0')}
        style={{ transitionDelay: shown ? `${delay + 450}ms` : '0ms' }}
      />
    </span>
  );
}

/** Live turntable of the dish model. No camera controls, so swipes scroll the feed. */
function ReelModel({ src, onLoad }: { src: string; onLoad: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handle = () => onLoadRef.current();
    el.addEventListener('load', handle);
    return () => el.removeEventListener('load', handle);
  }, []);

  // React 19 sets known element props as DOM properties, so pass real values
  return createElement(
    'model-viewer' as any,
    {
      ref,
      src,
      alt: '',
      loading: 'eager',
      'camera-orbit': 'auto 68deg 110%',
      'interaction-prompt': 'none',
      'environment-image': 'neutral',
      'shadow-intensity': '1',
      'shadow-softness': '1',
      exposure: 1.1,
      'auto-rotate': '',
      'auto-rotate-delay': '0',
      'rotation-per-second': '20deg',
      style: {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        backgroundColor: 'transparent',
        '--poster-color': 'transparent',
      },
    },
    createElement('span', { slot: 'progress-bar' }),
  );
}

/** Typographic cover for a dish without a photo or model: name and what's in it. */
function TitleCard({ name, category, ingredients }: { name: string; category: string; ingredients: string[] }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
      <span className={cn(label, 'text-ember')}>({category})</span>
      <span className="mt-4 font-display text-[44px] font-medium leading-[1] tracking-[-0.02em]">{name}</span>
      {ingredients.length > 0 && (
        <span className={cn(label, 'mt-6 max-w-[18rem] leading-relaxed tracking-[0.16em] text-cream/55')}>{ingredients.join(' · ')}</span>
      )}
    </div>
  );
}

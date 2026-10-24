'use client';

import { createElement, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Box,
  Check,
  ChevronUp,
  Clock,
  Heart,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  Send,
  ShoppingBag,
  Star,
  UtensilsCrossed,
} from 'lucide-react';
import { ALLERGEN_LABELS } from '@dineview/shared';
import { useAppDispatch } from '@/store';
import { notify } from '@/store/slices/ui-slice';
import { useCart } from '@/hooks/use-cart';
import { useLikes } from '@/hooks/use-likes';
import { cn, formatPrice } from '@/lib/utils';
import { pickFor } from '@/components/customer/dish-tile';
import { DoubleTapLike } from '@/components/customer/double-tap-like';
import { RestaurantAvatar } from '@/components/customer/restaurant-avatar';

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
  /** Dish to open at (tapped in the grid, or the one the guest left from). */
  startId?: string | null;
  onActive?: (dishId: string) => void;
  onBrowse: () => void;
  restaurantName: string;
  tableLabel?: string | null;
  currency: string;
}

// Spotlight colour behind each dish, per category, on a dark stage
const TINTS = ['#6b3a1c', '#2d4a2b', '#5c2333', '#22385c', '#40295e', '#5c4a16'] as const;

// The swipe hint shows once per visit
let hintSeen = false;

/**
 * The menu as full-screen Reels: one dish per screen, swipe up for the next.
 * Dishes with a 3D model play it as a slow turntable; the rest show their
 * photo or a title card. Like, AR, add-to-order and share sit on the right
 * rail; the caption carries price, tags and allergens.
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
  const first = useRef(true);
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
    if (!el) return;
    const start = first.current ? Math.max(0, items.findIndex((i) => i.dish.id === startId)) : 0;
    first.current = false;
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

  // Arrow keys / j k step through reels on a laptop
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
    <div className="fixed inset-0 z-30 bg-black text-white">
      <div
        ref={scroller}
        className="mx-auto h-full max-w-md snap-y snap-mandatory overflow-y-scroll overscroll-y-contain scrollbar-none"
      >
        {items.map((item, i) => (
          <Reel
            key={item.dish.id}
            index={i}
            item={item}
            active={i === active}
            viewerReady={viewerReady}
            hint={hint && i === 0}
            restaurantName={restaurantName}
            tableLabel={tableLabel}
            currency={currency}
            onAdded={(name) => setAdded({ name, at: Date.now() })}
          />
        ))}
        {items.length === 0 && (
          <div className="flex h-full items-center justify-center px-10 text-center text-white/60">Nothing on this menu yet.</div>
        )}
      </div>

      {/* Top bar: browse grid · menus · your order */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 mx-auto max-w-md">
        <div className="pointer-events-auto flex items-center gap-1 px-1.5 pt-[max(env(safe-area-inset-top),0.375rem)]">
          <button
            onClick={onBrowse}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-white/10"
            aria-label="Browse all dishes"
          >
            <LayoutGrid className="h-6 w-6 drop-shadow" />
          </button>
          <nav
            className="flex min-w-0 flex-1 gap-5 overflow-x-auto px-2 scrollbar-none [mask-image:linear-gradient(90deg,transparent,#000_10px,#000_calc(100%-10px),transparent)]"
            aria-label="Menus"
          >
            {[{ id: null as string | null, name: 'For you' }, ...categories].map((c) => {
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
                    'relative shrink-0 py-2.5 text-[15px] font-semibold [text-shadow:0_1px_3px_rgba(0,0,0,0.45)] transition-colors',
                    on ? 'text-white' : 'text-white/60',
                  )}
                >
                  {c.name}
                  {on && <span className="absolute inset-x-1/4 bottom-1 h-[2px] rounded-full bg-white" />}
                </button>
              );
            })}
          </nav>
          <Link
            href="/cart"
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-white/10"
            aria-label={`Your order, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
          >
            <ShoppingBag className="h-6 w-6 drop-shadow" />
            {itemCount > 0 && (
              <span className="absolute right-0.5 top-0.5 min-w-[18px] rounded-full bg-ig px-1 text-center text-[10px] font-bold leading-[18px] ring-2 ring-black/40">
                {itemCount}
              </span>
            )}
          </Link>
        </div>

        {added && (
          <Link
            key={added.at}
            href="/cart"
            className="pointer-events-auto mx-auto mt-2 flex w-max max-w-[calc(100%-2rem)] items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-gray-900 shadow-xl animate-toast-in"
          >
            <Check className="h-4 w-4 shrink-0 text-green-600" />
            <span className="truncate">{added.name} added</span>
            <span className="shrink-0 text-gray-400">·</span>
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
  active: boolean;
  viewerReady: boolean;
  hint: boolean;
  restaurantName: string;
  tableLabel?: string | null;
  currency: string;
  onAdded: (name: string) => void;
}

function Reel({ item, index, active, viewerReady, hint, restaurantName, tableLabel, currency, onAdded }: ReelProps) {
  const { dish, category, ar } = item;
  const dispatch = useAppDispatch();
  const { isLiked, toggle, like } = useLikes();
  const { items: cart, addItem } = useCart();
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const liked = isLiked(dish.id);
  const qty = cart.find((i) => i.dishId === dish.id)?.quantity ?? 0;
  const price = formatPrice(Number(dish.price), currency);
  const allergens: string[] = (dish.allergens || []).map((a: any) => (ALLERGEN_LABELS as any)[a.allergen] ?? a.allergen);
  const tint = pickFor(dish.categoryId || dish.id, TINTS);
  // Only the reel on screen runs a WebGL viewer
  const modelUrl: string | undefined = ar && active && viewerReady ? dish.arAsset?.fileUrl : undefined;
  const showModel = Boolean(modelUrl && loaded);
  const cutout = dish.imageUrl && /\.png($|\?)/i.test(dish.imageUrl);
  const ticker = [category, restaurantName, tableLabel && `Table ${tableLabel}`].filter(Boolean).join('  ·  ');

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

  async function share() {
    const url = `${window.location.origin}/dish/${dish.id}`;
    try {
      if (navigator.share) await navigator.share({ title: dish.name, text: `${dish.name} at ${restaurantName}`, url });
      else {
        await navigator.clipboard.writeText(url);
        dispatch(notify('success', 'Link copied'));
      }
    } catch {
      // Share sheet dismissed
    }
  }

  return (
    <section
      data-index={index}
      aria-label={`${dish.name}, ${price}`}
      className="relative h-full w-full snap-start snap-always overflow-hidden"
      style={{ background: `radial-gradient(110% 70% at 50% 36%, ${tint} 0%, #0c0a09 72%)` }}
    >
      {/* Media */}
      <DoubleTapLike onLike={() => like(dish.id)} className="absolute inset-0">
        {dish.imageUrl && !cutout && (
          <img src={dish.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover animate-ken-burns" />
        )}
        <div className="absolute inset-x-0 top-[8%] h-[58%]">
          {cutout && (
            <img
              src={dish.imageUrl}
              alt=""
              className={cn(
                'absolute inset-0 h-full w-full object-contain p-[7%] drop-shadow-[0_28px_40px_rgba(0,0,0,0.55)] transition-opacity duration-500',
                showModel ? 'opacity-0' : 'opacity-100 animate-float',
              )}
            />
          )}
          {!dish.imageUrl && !showModel && <TitleCard name={dish.name} category={category} />}
          {modelUrl && <ReelModel src={modelUrl} onLoad={() => setLoaded(true)} />}
        </div>
      </DoubleTapLike>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {hint && (
        <div className="pointer-events-none absolute inset-x-0 top-[55%] z-10 flex justify-center animate-fade-in">
          <span className="flex flex-col items-center gap-1 rounded-2xl bg-black/45 px-4 py-3 text-[13px] font-semibold backdrop-blur-md">
            <ChevronUp className="h-6 w-6 animate-swipe-hint" />
            Swipe up for the next dish
          </span>
        </div>
      )}

      {/* Right rail */}
      <div className="absolute right-1.5 z-10 flex w-16 flex-col items-center gap-4" style={{ bottom: 'calc(var(--guest-nav-h) + 1rem)' }}>
        <RailButton label={liked ? 'Liked' : 'Like'} onClick={() => toggle(dish.id)} pressed={liked}>
          <Heart
            key={String(liked)}
            className={cn('h-[30px] w-[30px]', liked ? 'fill-red-500 text-red-500 animate-heart-pop' : 'text-white')}
          />
        </RailButton>
        {ar && (
          <RailLink href={`/dish/${dish.id}/ar`} label="AR" aria-label={`See ${dish.name} on your table in AR`}>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ig shadow-lg shadow-pink-500/30">
              <Box className="h-6 w-6" />
            </span>
          </RailLink>
        )}
        <RailButton label={qty ? `${qty} added` : 'Add'} onClick={add} aria-label={`Add ${dish.name}`}>
          <span className="relative">
            <ShoppingBag className="h-[30px] w-[30px]" />
            <span className="absolute -bottom-1 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-gray-900 ring-2 ring-black/30">
              {qty ? qty : <Plus className="h-3 w-3" strokeWidth={3} />}
            </span>
          </span>
        </RailButton>
        <RailButton label="Share" onClick={share}>
          <Send className="h-7 w-7 -rotate-12" />
        </RailButton>
        <RailLink href={`/dish/${dish.id}`} label="Details" aria-label={`${dish.name} details`}>
          <MoreHorizontal className="h-7 w-7" />
        </RailLink>
        <span className={cn('mt-1 block h-9 w-9 overflow-hidden rounded-lg ring-2 ring-white/90', active && 'animate-spin-slow')}>
          <RestaurantAvatar name={restaurantName} className="text-[11px]" />
        </span>
      </div>

      {/* Caption */}
      <div className="absolute left-0 right-[4.5rem] z-10 pl-3.5" style={{ bottom: 'calc(var(--guest-nav-h) + 0.875rem)' }}>
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-white/90">
            <RestaurantAvatar name={restaurantName} className="text-[11px]" />
          </span>
          <span className="truncate text-sm font-semibold">{restaurantName}</span>
          {tableLabel && (
            <span className="shrink-0 rounded-lg border border-white/70 px-2.5 py-0.5 text-xs font-semibold">Table {tableLabel}</span>
          )}
        </div>

        <h2 className="mt-2.5 font-display text-[27px] font-medium leading-[1.08] [text-shadow:0_2px_12px_rgba(0,0,0,0.35)]">
          {dish.name}
        </h2>

        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px]">
          <span className="rounded-md bg-white px-1.5 py-0.5 font-bold text-gray-900">{price}</span>
          {dish.isFeatured && (
            <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
              <Star className="h-3.5 w-3.5 fill-current" /> Chef’s pick
            </span>
          )}
          {dish.prepTimeMin && (
            <span className="inline-flex items-center gap-1 text-white/80">
              <Clock className="h-3.5 w-3.5" /> {dish.prepTimeMin} min
            </span>
          )}
          {ar && (
            <span className="inline-flex items-center gap-1 text-white/80">
              <Box className="h-3.5 w-3.5" /> Live 3D
            </span>
          )}
        </div>

        {dish.description && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className={cn('mt-2 block text-left text-[13.5px] leading-snug text-white/90', !expanded && 'line-clamp-2')}
          >
            {dish.description}
          </button>
        )}
        {allergens.length > 0 && <p className="mt-1 text-xs text-white/55">Contains {allergens.join(', ')}</p>}

        <div className="mt-2.5 flex items-center gap-2 text-[12.5px] text-white/85">
          <UtensilsCrossed className="h-3.5 w-3.5 shrink-0" />
          <div className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,#000_80%,transparent)]">
            <div className={cn('flex w-max whitespace-nowrap', active && 'animate-marquee')}>
              <span className="pr-10">{ticker}</span>
              <span className="pr-10" aria-hidden>
                {ticker}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Playback bar: one turn of the 3D dish */}
      {showModel && (
        <div className="absolute inset-x-0 z-10 h-[2px] bg-white/20" style={{ bottom: 'var(--guest-nav-h)' }}>
          <div className="h-full origin-left bg-white/90 animate-reel-progress" />
        </div>
      )}
    </section>
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
      'camera-orbit': 'auto 72deg 115%',
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

/** Typographic cover for a dish without a photo or model yet. */
function TitleCard({ name, category }: { name: string; category: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center animate-float">
      <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/50">{category}</span>
      <span className="mt-4 font-display text-[44px] font-medium leading-[1.02] text-white">{name}</span>
      <span className="mt-6 h-px w-12 bg-white/30" />
    </div>
  );
}

function RailButton({
  label,
  children,
  onClick,
  pressed,
  'aria-label': ariaLabel,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  pressed?: boolean;
  'aria-label'?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      aria-pressed={pressed}
      className="flex flex-col items-center gap-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)] transition active:scale-90"
    >
      {children}
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}

function RailLink({ href, label, children, 'aria-label': ariaLabel }: { href: string; label: string; children: ReactNode; 'aria-label'?: string }) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel ?? label}
      className="flex flex-col items-center gap-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)] transition active:scale-90"
    >
      {children}
      <span className="text-xs font-semibold">{label}</span>
    </Link>
  );
}

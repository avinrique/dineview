'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BellRing, Box, Search, ShoppingBag, X } from 'lucide-react';
import { useGetMenuQuery } from '@/store/api/menu-api';
import { useAppDispatch } from '@/store';
import { setImmersive } from '@/store/slices/ui-slice';
import { useSession } from '@/hooks/use-session';
import { useCart } from '@/hooks/use-cart';
import { formatPrice, hasArModel, cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DishTile } from '@/components/customer/dish-tile';
import { ReelsFeed } from '@/components/customer/reels-feed';

type View = 'reels' | 'grid';
type Dish = any;

// Where the guest was, kept across trips to a dish page and back
const last: { view: View; reelId: string | null; categoryId: string | null } = {
  view: 'reels',
  reelId: null,
  categoryId: null,
};

const label = 'font-mono text-[11px] uppercase tracking-[0.2em]';

/** Restaurant name with its last word in the italic accent, as on the landing page. */
function Title({ name }: { name: string }) {
  const words = name.trim().split(/\s+/);
  const tail = words.pop();
  return (
    <>
      {words.length > 0 && `${words.join(' ')} `}
      <em className="text-ember">{tail}</em>
    </>
  );
}

export default function MenuPage() {
  const { restaurantName, tableLabel, currency, settings } = useSession();
  const { data, isLoading, error, refetch } = useGetMenuQuery(undefined, { refetchOnFocus: true });
  const { itemCount, total } = useCart();
  const dispatch = useAppDispatch();
  const [view, setView] = useState<View>(last.view);
  const [reelId, setReelId] = useState<string | null>(last.reelId);
  const [only3d, setOnly3d] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(last.categoryId);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    last.view = view;
    last.categoryId = categoryId;
  }, [view, categoryId]);

  // The whole menu is dark, bottom nav included
  useEffect(() => {
    dispatch(setImmersive(true));
    return () => {
      dispatch(setImmersive(false));
    };
  }, [dispatch]);

  const rememberReel = useCallback((id: string) => {
    last.reelId = id;
  }, []);

  function openReels(at: string | null = last.reelId) {
    setReelId(at);
    setView('reels');
  }

  const arEnabled = settings?.enableAr !== false;
  const categories: any[] = useMemo(() => data?.data?.categories || [], [data]);
  const allDishes = useMemo(
    () =>
      categories.flatMap((c) =>
        (c.dishes || []).map((d: Dish) => ({ dish: d, category: c.name as string, ar: arEnabled && hasArModel(d) })),
      ),
    [categories, arEnabled],
  );
  const arCount = allDishes.filter((d) => d.ar).length;

  const inCategory = useMemo(
    () => allDishes.filter(({ dish }) => !categoryId || dish.categoryId === categoryId),
    [allDishes, categoryId],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inCategory.filter(
      ({ dish, ar }) =>
        (!only3d || ar) && (!q || dish.name.toLowerCase().includes(q) || dish.description?.toLowerCase().includes(q)),
    );
  }, [inCategory, only3d, query]);

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-ink">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-ink p-8 text-center text-cream">
        <p className="text-cream/60">We couldn’t load the menu.</p>
        <button onClick={() => refetch()} className="rounded-full bg-ember px-6 py-3 font-semibold text-ink">
          Try again
        </button>
      </div>
    );
  }

  const name = restaurantName || 'Menu';

  if (view === 'reels') {
    return (
      <ReelsFeed
        items={inCategory}
        categories={categories}
        categoryId={categoryId}
        onCategory={setCategoryId}
        startId={reelId}
        onActive={rememberReel}
        onBrowse={() => setView('grid')}
        restaurantName={name}
        tableLabel={tableLabel}
        currency={currency}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-ink pb-44 text-cream">
      <header className="sticky top-0 z-30 border-b border-cream/10 bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-2 px-4">
          <p className="min-w-0 flex-1 truncate font-display text-lg">{name}</p>
          <button
            onClick={() => {
              setSearchOpen((o) => !o);
              setQuery('');
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/15 active:bg-cream/10"
            aria-label={searchOpen ? 'Close search' : 'Search dishes'}
          >
            {searchOpen ? <X className="h-[18px] w-[18px]" /> : <Search className="h-[18px] w-[18px]" />}
          </button>
          <Link
            href="/actions"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/15 active:bg-cream/10"
            aria-label="Call a waiter"
          >
            <BellRing className="h-[18px] w-[18px]" />
          </Link>
        </div>
        {searchOpen && (
          <div className="mx-auto max-w-lg px-4 pb-3">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes"
              className="w-full rounded-full border border-cream/15 bg-cream/[0.06] px-4 py-2.5 text-sm text-cream outline-none placeholder:text-cream/40 focus:border-cream/40"
            />
          </div>
        )}
      </header>

      <div className="mx-auto max-w-lg">
        <section className="px-4 pt-8">
          <p className={cn(label, 'text-ember')}>{tableLabel ? `(Table ${tableLabel})` : '(The menu)'}</p>
          <h1 className="mt-3 font-display text-[46px] font-medium leading-[0.95] tracking-[-0.03em]">
            <Title name={name} />
          </h1>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-cream/60">
            {arCount > 0
              ? 'Swipe through the dishes, see them on your table in 3D, check calories and ingredients, then order right here.'
              : 'Swipe through the dishes, check calories and ingredients, then order right here.'}
          </p>
          <p className={cn(label, 'mt-4 text-cream/40')}>
            {allDishes.length} dishes{arCount > 0 && ` · ${arCount} in 3D`}
          </p>
          <button
            onClick={() => openReels()}
            className="mt-6 flex w-full items-center justify-between rounded-full bg-ember py-1.5 pl-6 pr-1.5 font-semibold text-ink transition active:scale-[0.98]"
          >
            Swipe through dishes
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/15">
              <ArrowUpRight className="h-[18px] w-[18px]" />
            </span>
          </button>
        </section>

        {/* Menus, and a 3D-only filter */}
        <nav className="sticky top-14 z-20 mt-8 flex gap-1.5 overflow-x-auto bg-ink/85 px-4 py-3 backdrop-blur-xl scrollbar-none" aria-label="Menus">
          {arEnabled && arCount > 0 && (
            <button
              onClick={() => setOnly3d((v) => !v)}
              aria-pressed={only3d}
              className={cn(
                label,
                'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 tracking-[0.16em] transition-colors',
                only3d ? 'bg-ember text-ink' : 'border border-ember/40 text-ember',
              )}
            >
              <Box className="h-3.5 w-3.5" /> In 3D
            </button>
          )}
          {[{ id: null as string | null, name: 'All' }, ...categories].map((c) => {
            const on = categoryId === c.id;
            return (
              <button
                key={c.id ?? 'all'}
                onClick={() => setCategoryId(c.id)}
                aria-pressed={on}
                className={cn(
                  label,
                  'shrink-0 rounded-full px-3.5 py-1.5 tracking-[0.16em] transition-colors',
                  on ? 'bg-cream text-ink' : 'border border-cream/15 text-cream/60',
                )}
              >
                {c.name}
              </button>
            );
          })}
        </nav>

        {visible.length === 0 && (
          <p className="px-8 py-16 text-center text-sm text-cream/50">{query ? `No dishes match “${query}”.` : 'Nothing here yet.'}</p>
        )}

        <ul className="grid grid-cols-2 gap-x-3 gap-y-7 px-4 pt-3">
          {visible.map(({ dish, category, ar }) => (
            <li key={dish.id}>
              <button onClick={() => openReels(dish.id)} className="block w-full text-left transition active:scale-[0.98]">
                <DishTile dish={dish} ar={ar} category={category} className="aspect-[4/5] w-full rounded-2xl" />
                <p className="mt-2.5 line-clamp-2 font-display text-[17px] leading-tight">{dish.name}</p>
                <p className="mt-1 flex items-center gap-2 font-mono text-[11px] tracking-[0.06em]">
                  <span>{formatPrice(Number(dish.price), currency)}</span>
                  {dish.nutrition?.calories != null && <span className="text-cream/45">{dish.nutrition.calories} kcal</span>}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {itemCount > 0 && (
        <div className="fixed inset-x-0 z-40 px-4 pb-3 animate-slide-up" style={{ bottom: 'var(--guest-nav-h)' }}>
          <Link
            href="/cart"
            className="mx-auto flex max-w-lg items-center justify-between rounded-full bg-cream py-1.5 pl-1.5 pr-5 text-ink shadow-2xl shadow-black/40"
          >
            <span className="flex items-center gap-3 text-sm font-semibold">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ember">
                <ShoppingBag className="h-[18px] w-[18px]" />
              </span>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
            <span className="text-sm font-semibold">View order · {formatPrice(total, currency)}</span>
          </Link>
        </div>
      )}
    </div>
  );
}

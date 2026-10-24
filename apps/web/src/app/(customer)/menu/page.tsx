'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BellRing, Box, Clapperboard, Grid3x3, Search, ShoppingBag, X } from 'lucide-react';
import { useGetMenuQuery } from '@/store/api/menu-api';
import { useAppDispatch } from '@/store';
import { setImmersive } from '@/store/slices/ui-slice';
import { useSession } from '@/hooks/use-session';
import { useCart } from '@/hooks/use-cart';
import { formatPrice, hasArModel, cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DishTile } from '@/components/customer/dish-tile';
import { StoryRing } from '@/components/customer/story-ring';
import { RestaurantAvatar } from '@/components/customer/restaurant-avatar';
import { ReelsFeed } from '@/components/customer/reels-feed';

type View = 'reels' | 'grid';
type Tab = 'grid' | 'ar';
type Dish = any;

// Where the guest was, kept across trips to a dish page and back (Instagram
// returns you to the same reel)
const last: { view: View; reelId: string | null; categoryId: string | null } = {
  view: 'reels',
  reelId: null,
  categoryId: null,
};

function GridItem({
  dish,
  category,
  ar,
  currency,
  onOpen,
}: {
  dish: Dish;
  category: string;
  ar: boolean;
  currency: string;
  onOpen: () => void;
}) {
  return (
    <button onClick={onOpen} aria-label={dish.name} className="relative block aspect-square text-left active:opacity-80">
      <DishTile
        dish={dish}
        ar={ar}
        category={category}
        footer={formatPrice(Number(dish.price), currency)}
        className="h-full w-full"
      />
      {dish.imageUrl && (
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent px-2 pb-1.5 pt-8 text-white">
          <span className="block truncate text-[11px] font-semibold leading-tight drop-shadow">{dish.name}</span>
          <span className="block text-[11px] opacity-90 drop-shadow">{formatPrice(Number(dish.price), currency)}</span>
        </span>
      )}
    </button>
  );
}

export default function MenuPage() {
  const { restaurantName, tableLabel, currency, settings } = useSession();
  const { data, isLoading, error, refetch } = useGetMenuQuery(undefined, { refetchOnFocus: true });
  const { itemCount, total } = useCart();
  const dispatch = useAppDispatch();
  const [view, setView] = useState<View>(last.view);
  const [reelId, setReelId] = useState<string | null>(last.reelId);
  const [tab, setTab] = useState<Tab>('grid');
  const [categoryId, setCategoryId] = useState<string | null>(last.categoryId);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    last.view = view;
    last.categoryId = categoryId;
  }, [view, categoryId]);

  // Reels are full-screen and dark, bottom nav included
  useEffect(() => {
    dispatch(setImmersive(view === 'reels'));
    return () => {
      dispatch(setImmersive(false));
    };
  }, [view, dispatch]);

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
        (tab !== 'ar' || ar) &&
        (!q || dish.name.toLowerCase().includes(q) || dish.description?.toLowerCase().includes(q)),
    );
  }, [inCategory, tab, query]);

  if (isLoading) {
    return (
      <div className={cn('flex min-h-[100dvh] items-center justify-center', view === 'reels' && 'bg-black')}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-gray-600">We couldn’t load the menu.</p>
        <button onClick={() => refetch()} className="btn-primary">Try again</button>
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

  const tabs: { id: Tab | 'reels'; icon: typeof Grid3x3; label: string }[] = [
    { id: 'grid', icon: Grid3x3, label: 'Grid' },
    { id: 'reels', icon: Clapperboard, label: 'Reels' },
    ...(arEnabled && arCount > 0 ? [{ id: 'ar' as Tab, icon: Box, label: 'In AR' }] : []),
  ];

  return (
    <div className="min-h-[100dvh] bg-white pb-40">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
          <h1 className="min-w-0 flex-1 truncate text-xl font-bold tracking-tight text-gray-900">{name}</h1>
          <button
            onClick={() => {
              setSearchOpen((o) => !o);
              setQuery('');
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full active:bg-gray-100"
            aria-label={searchOpen ? 'Close search' : 'Search dishes'}
          >
            {searchOpen ? <X className="h-6 w-6" /> : <Search className="h-6 w-6" />}
          </button>
          <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-900">Table {tableLabel}</span>
        </div>
        {searchOpen && (
          <div className="mx-auto max-w-lg px-4 pb-3">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes"
              className="w-full rounded-xl border-0 bg-gray-100 px-4 py-2.5 text-sm outline-none ring-gray-900 focus:ring-1"
            />
          </div>
        )}
      </header>

      <div className="mx-auto max-w-lg">
        {/* Profile header */}
        <section className="px-4 pt-4">
          <div className="flex items-center gap-6">
            <StoryRing className="h-[88px] w-[88px] shrink-0">
              <RestaurantAvatar name={name} className="text-2xl" />
            </StoryRing>
            <dl className="grid flex-1 grid-cols-3 text-center">
              {[
                [allDishes.length, 'dishes'],
                [arCount, 'in AR'],
                [categories.length, 'menus'],
              ].map(([value, label]) => (
                <div key={label as string}>
                  <dt className="sr-only">{label}</dt>
                  <dd className="text-lg font-bold leading-tight text-gray-900">{value}</dd>
                  <dd className="text-[13px] text-gray-500">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mt-3 text-sm leading-snug">
            <p className="font-semibold text-gray-900">{name}</p>
            <p className="text-gray-500">Restaurant · Table {tableLabel}</p>
            {arCount > 0 && (
              <p className="text-gray-800">
                Tap any dish with <Box className="inline h-3.5 w-3.5 -translate-y-px" /> to see it on your table in AR, then order
                right here.
              </p>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => openReels()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ig py-2 text-sm font-semibold text-white active:opacity-90"
            >
              <Clapperboard className="h-4 w-4" /> Watch reels
            </button>
            {arEnabled && arCount > 0 && (
              <button
                onClick={() => setTab('ar')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-100 py-2 text-sm font-semibold text-gray-900 active:bg-gray-200"
              >
                <Box className="h-4 w-4" /> View in AR
              </button>
            )}
            <Link href="/actions" className="flex items-center justify-center rounded-lg bg-gray-100 px-3 active:bg-gray-200" aria-label="Call a waiter">
              <BellRing className="h-4 w-4 text-gray-900" />
            </Link>
          </div>
        </section>

        {/* Category highlights */}
        <section className="flex gap-4 overflow-x-auto px-4 pb-1 pt-5 scrollbar-none" aria-label="Categories">
          {[{ id: null, name: 'All', dishes: [] as Dish[] }, ...categories].map((cat) => {
            const active = categoryId === cat.id;
            const cover = cat.dishes?.find((d: Dish) => d.imageUrl) || cat.dishes?.[0];
            return (
              <button key={cat.id ?? 'all'} onClick={() => setCategoryId(cat.id)} className="flex w-[68px] shrink-0 flex-col items-center gap-1.5">
                <StoryRing active={active} className="h-[68px] w-[68px]">
                  {cat.id === null ? (
                    <span className="flex h-full w-full items-center justify-center bg-gray-50">
                      <Grid3x3 className="h-6 w-6 text-gray-900" />
                    </span>
                  ) : (
                    <DishTile dish={cover ?? { id: cat.id, name: cat.name }} size="thumb" className="h-full w-full" />
                  )}
                </StoryRing>
                <span className={cn('w-full truncate text-center text-xs', active ? 'font-semibold text-gray-900' : 'text-gray-700')}>{cat.name}</span>
              </button>
            );
          })}
        </section>

        {/* Tabs */}
        <nav className="sticky top-14 z-20 mt-3 flex border-b border-gray-100 bg-white" aria-label="View">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => (id === 'reels' ? openReels() : setTab(id))}
              aria-label={label}
              aria-pressed={tab === id}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 border-b-[1.5px] py-3 text-xs font-semibold transition-colors',
                tab === id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400',
              )}
            >
              <Icon className="h-5 w-5" />
              {id === 'ar' && <span>In AR</span>}
            </button>
          ))}
        </nav>

        {visible.length === 0 && (
          <p className="px-8 py-16 text-center text-sm text-gray-500">
            {query ? `No dishes match “${query}”.` : 'Nothing here yet.'}
          </p>
        )}

        {tab === 'grid' && (
          <div className="grid grid-cols-3 gap-0.5">
            {visible.map(({ dish, category, ar }) => (
              <GridItem
                key={dish.id}
                dish={dish}
                category={category}
                ar={ar}
                currency={currency}
                onOpen={() => openReels(dish.id)}
              />
            ))}
          </div>
        )}

        {tab === 'ar' && visible.length > 0 && (
          <div className="px-3 pt-3">
            <p className="mb-3 px-1 text-sm text-gray-500">Open a dish and tap “View on your table” to place it in front of you at real size.</p>
            <div className="grid grid-cols-2 gap-3">
              {visible.map(({ dish, category }) => (
                <Link key={dish.id} href={`/dish/${dish.id}`} className="overflow-hidden rounded-2xl ring-1 ring-gray-100 active:scale-[0.98] transition">
                  <DishTile dish={dish} ar category={category} className="aspect-square w-full" />
                  <div className="px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-gray-900">{dish.name}</p>
                    <p className="text-sm text-gray-500">{formatPrice(Number(dish.price), currency)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-[64px] z-40 px-4 pb-3 animate-slide-up">
          <Link
            href="/cart"
            className="mx-auto flex max-w-lg items-center justify-between rounded-full bg-gray-900 py-2 pl-2 pr-5 text-white shadow-2xl shadow-gray-900/30"
          >
            <span className="flex items-center gap-3 text-sm font-semibold">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ig">
                <ShoppingBag className="h-5 w-5" />
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

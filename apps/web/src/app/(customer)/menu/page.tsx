'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Box, Search, X, Minus, Plus, ShoppingBag, Sparkles } from 'lucide-react';
import { ALLERGEN_LABELS } from '@dineview/shared';
import { useGetMenuQuery } from '@/store/api/menu-api';
import { useSession } from '@/hooks/use-session';
import { useCart } from '@/hooks/use-cart';
import { formatPrice, hasArModel, cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DishImage } from '@/components/customer/dish-image';

function QuantityControl({ dish }: { dish: any }) {
  const { items, addItem, updateQuantity } = useCart();
  const inCart = items.find((i) => i.dishId === dish.id);

  if (!inCart) {
    return (
      <button
        onClick={() =>
          addItem({ dishId: dish.id, name: dish.name, price: Number(dish.price), imageUrl: dish.imageUrl })
        }
        className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm shadow-brand-500/30 active:scale-95 transition"
        aria-label={`Add ${dish.name}`}
      >
        <Plus className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-full bg-brand-500 p-0.5 text-white shadow-sm shadow-brand-500/30">
      <button
        onClick={() => updateQuantity(dish.id, inCart.quantity - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-full active:bg-brand-600"
        aria-label="Remove one"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-5 text-center text-sm font-bold">{inCart.quantity}</span>
      <button
        onClick={() => updateQuantity(dish.id, inCart.quantity + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-full active:bg-brand-600"
        aria-label="Add one"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function DishCard({ dish, currency }: { dish: any; currency: string }) {
  const ar = hasArModel(dish);
  return (
    <div className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
      <Link href={`/dish/${dish.id}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
        <DishImage src={dish.imageUrl} alt={dish.name} className="h-full w-full" />
        {ar && (
          <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-gray-900/75 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            <Box className="h-3 w-3" /> AR
          </span>
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link href={`/dish/${dish.id}`} className="min-w-0">
          <h3 className="font-semibold leading-snug text-gray-900">{dish.name}</h3>
          {dish.description && <p className="mt-0.5 line-clamp-2 text-[13px] text-gray-500">{dish.description}</p>}
        </Link>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            <span className="font-bold text-gray-900">{formatPrice(Number(dish.price), currency)}</span>
            {dish.allergens?.length > 0 && (
              <p className="truncate text-[11px] text-gray-400">
                Contains {dish.allergens.map((a: any) => (ALLERGEN_LABELS as any)[a.allergen] ?? a.allergen).join(', ')}
              </p>
            )}
          </div>
          <QuantityControl dish={dish} />
        </div>
      </div>
    </div>
  );
}

export default function MenuPage() {
  const { restaurantName, tableLabel, currency, settings } = useSession();
  const { data, isLoading, error, refetch } = useGetMenuQuery(undefined, { refetchOnFocus: true });
  const { itemCount, total } = useCart();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const categories: any[] = useMemo(() => data?.data?.categories || [], [data]);
  const arEnabled = settings?.enableAr !== false;

  const visibleCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .map((c) => ({
        ...c,
        dishes: (c.dishes || []).filter(
          (d: any) => !q || d.name.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q),
        ),
      }))
      .filter((c) => c.dishes.length > 0);
  }, [categories, query]);

  const arCount = categories.reduce((n, c) => n + (c.dishes || []).filter(hasArModel).length, 0);

  // Highlight the category chip for the section currently in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const id = visible[0]?.target.getAttribute('data-category');
        if (id) setActiveCategory(id);
      },
      { rootMargin: '-140px 0px -60% 0px' },
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [visibleCategories]);

  useEffect(() => {
    if (activeCategory) chipRefs.current[activeCategory]?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [activeCategory]);

  function scrollToCategory(id: string) {
    const el = sectionRefs.current[id];
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 128, behavior: 'smooth' });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
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

  return (
    <div className="min-h-[100dvh] bg-gray-50 pb-40">
      <header className="sticky top-0 z-30 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-lg px-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-gray-900">{restaurantName || 'Menu'}</h1>
            </div>
            <span className="shrink-0 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
              Table {tableLabel}
            </span>
          </div>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes"
              className="w-full rounded-xl border-0 bg-gray-100 py-2.5 pl-9 pr-9 text-sm outline-none ring-brand-500 focus:ring-2"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-label="Clear search">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="mx-auto max-w-lg">
          <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
            {visibleCategories.map((cat) => (
              <button
                key={cat.id}
                ref={(el) => {
                  chipRefs.current[cat.id] = el;
                }}
                onClick={() => scrollToCategory(cat.id)}
                className={cn(
                  'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  activeCategory === cat.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600',
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-8 px-4 py-4">
        {arEnabled && arCount > 0 && !query && (
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 p-4 text-white">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <Sparkles className="h-6 w-6 text-brand-300" />
            </div>
            <div className="text-sm">
              <p className="font-semibold">See it before you order</p>
              <p className="text-white/70">Dishes marked AR can be placed on your table at real size.</p>
            </div>
          </div>
        )}

        {visibleCategories.length === 0 && (
          <p className="py-12 text-center text-gray-500">No dishes match “{query}”.</p>
        )}

        {visibleCategories.map((category) => (
          <section
            key={category.id}
            data-category={category.id}
            ref={(el) => {
              sectionRefs.current[category.id] = el;
            }}
          >
            <h2 className="text-lg font-bold text-gray-900">{category.name}</h2>
            {category.description && <p className="mb-3 text-sm text-gray-500">{category.description}</p>}
            <div className="mt-3 space-y-3">
              {category.dishes.map((dish: any) => (
                <DishCard key={dish.id} dish={arEnabled ? dish : { ...dish, arAsset: null }} currency={currency} />
              ))}
            </div>
          </section>
        ))}
      </main>

      {itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-[64px] z-40 px-4 pb-3 animate-slide-up">
          <Link
            href="/cart"
            className="mx-auto flex max-w-lg items-center justify-between rounded-2xl bg-gray-900 px-5 py-3.5 text-white shadow-xl"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <ShoppingBag className="h-5 w-5" />
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
            <span className="text-sm font-semibold">View order · {formatPrice(total, currency)}</span>
          </Link>
        </div>
      )}
    </div>
  );
}

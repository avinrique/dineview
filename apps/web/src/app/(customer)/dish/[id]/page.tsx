'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Box, ChevronLeft, Clock, Expand, Minus, Plus, Star } from 'lucide-react';
import { ALLERGEN_LABELS } from '@dineview/shared';
import { useGetDishDetailQuery } from '@/store/api/menu-api';
import { useCart } from '@/hooks/use-cart';
import { useLikes } from '@/hooks/use-likes';
import { useSession } from '@/hooks/use-session';
import { formatPrice, hasArModel } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ModelViewerAr } from '@/components/ar/model-viewer-ar';
import { PhoneHandoffQr } from '@/components/ar/phone-handoff-qr';
import { DishTile } from '@/components/customer/dish-tile';
import { DoubleTapLike } from '@/components/customer/double-tap-like';
import { LikeButton } from '@/components/customer/like-button';
import { RestaurantAvatar } from '@/components/customer/restaurant-avatar';
import { StoryRing } from '@/components/customer/story-ring';

export default function DishDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dishId = params.id as string;
  const { currency, settings, restaurantName } = useSession();
  const { items, addItem, updateQuantity } = useCart();
  const { like } = useLikes();
  const { data, isLoading } = useGetDishDetailQuery(dishId);
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const dish = data?.data;
  if (!dish) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4">
        <p className="text-gray-500">This dish isn’t on the menu any more.</p>
        <Link href="/menu" className="btn-primary">Back to menu</Link>
      </div>
    );
  }

  const ar = settings?.enableAr !== false && hasArModel(dish);
  const nutrition = dish.nutrition;
  const allergens = dish.allergens || [];
  const ingredients = dish.ingredients || [];
  const inCart = items.find((i) => i.dishId === dish.id);
  const price = Number(dish.price);
  const name = restaurantName || 'Menu';

  function handleAdd() {
    if (inCart) {
      updateQuantity(dish.id, inCart.quantity + quantity);
    } else {
      addItem({ dishId: dish.id, name: dish.name, price, imageUrl: dish.imageUrl });
      if (quantity > 1) updateQuantity(dish.id, quantity);
    }
    router.push('/menu');
  }

  const nutritionFacts = nutrition
    ? [
        { label: 'Calories', value: nutrition.calories, unit: '' },
        { label: 'Protein', value: nutrition.proteinG, unit: 'g' },
        { label: 'Carbs', value: nutrition.carbsG, unit: 'g' },
        { label: 'Fat', value: nutrition.fatsG, unit: 'g' },
      ].filter((f) => f.value != null)
    : [];

  return (
    <div className="min-h-[100dvh] bg-white pb-28">
      {/* Post header */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-2 px-2">
          <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-full active:bg-gray-100" aria-label="Back">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <StoryRing active={ar} className="h-8 w-8 shrink-0">
            <RestaurantAvatar name={name} className="text-[10px]" />
          </StoryRing>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-semibold text-gray-900">{name}</p>
            {dish.category?.name && <p className="truncate text-[11px] text-gray-500">{dish.category.name}</p>}
          </div>
          {ar && (
            <Link href={`/dish/${dish.id}/ar`} className="flex h-10 w-10 items-center justify-center rounded-full active:bg-gray-100" aria-label="Full screen">
              <Expand className="h-5 w-5" />
            </Link>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-lg">
        {/* Media: live 3D model when the dish has one */}
        <DoubleTapLike onLike={() => like(dish.id)}>
          {ar ? (
            <div className="relative aspect-[4/5] max-h-[68vh] w-full bg-stage">
              <ModelViewerAr
                modelUrl={dish.arAsset.fileUrl}
                iosSrc={dish.arAsset.iosFileUrl}
                title={dish.name}
                poster={dish.imageUrl}
                alt={`${dish.name} in 3D`}
              />
            </div>
          ) : (
            <DishTile dish={dish} category={dish.category?.name} size="large" className="aspect-square w-full" />
          )}
        </DoubleTapLike>

        {/* Actions */}
        <div className="flex items-center gap-4 px-4 pt-3">
          <LikeButton id={dish.id} />
          {ar && (
            <Link href={`/dish/${dish.id}/ar`} className="-m-1 p-1" aria-label="Full screen 3D">
              <Box className="h-6 w-6 text-gray-900" />
            </Link>
          )}
          <span className="ml-auto text-xl font-bold text-gray-900">{formatPrice(price, currency)}</span>
        </div>

        {/* Caption */}
        <div className="space-y-6 px-4 pt-2">
          <div>
            <h1 className="font-display text-[30px] font-medium leading-tight text-gray-900">{dish.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              {ar && (
                <span className="inline-flex items-center gap-1 rounded-full bg-ig px-2.5 py-0.5 text-xs font-bold text-white">
                  <Box className="h-3 w-3" /> AR ready
                </span>
              )}
              {dish.prepTimeMin && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4" /> ~{dish.prepTimeMin} min
                </span>
              )}
              {dish.isFeatured && (
                <span className="inline-flex items-center gap-1 text-amber-600">
                  <Star className="h-4 w-4 fill-current" /> Chef’s pick
                </span>
              )}
            </div>
            {dish.description && <p className="mt-3 leading-relaxed text-gray-700">{dish.description}</p>}
          </div>

          {ar && <PhoneHandoffQr path={`/dish/${dish.id}`} />}

          {allergens.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Allergens</h2>
              <div className="flex flex-wrap gap-2">
                {allergens.map((a: any) => (
                  <span key={a.id} className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                    {(ALLERGEN_LABELS as any)[a.allergen] ?? a.allergen}
                  </span>
                ))}
              </div>
            </div>
          )}

          {ingredients.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Ingredients</h2>
              <p className="text-sm leading-relaxed text-gray-700">{ingredients.map((i: any) => i.name).join(' · ')}</p>
            </div>
          )}

          {nutritionFacts.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Nutrition</h2>
              <div className="grid grid-cols-4 divide-x divide-gray-100 rounded-2xl border border-gray-100">
                {nutritionFacts.map((f) => (
                  <div key={f.label} className="py-3 text-center">
                    <p className="text-lg font-bold text-gray-900">
                      {f.value}
                      {f.unit}
                    </p>
                    <p className="text-[11px] text-gray-500">{f.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 px-4 pt-3 pb-safe backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full active:bg-gray-200"
              aria-label="Fewer"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full active:bg-gray-200"
              aria-label="More"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleAdd}
            className="flex-1 rounded-full bg-gray-900 py-3.5 text-base font-semibold text-white transition active:scale-[0.98]"
          >
            Add to order · {formatPrice(price * quantity, currency)}
          </button>
        </div>
      </div>
    </div>
  );
}

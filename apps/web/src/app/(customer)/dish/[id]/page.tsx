'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Expand, Minus, Plus } from 'lucide-react';
import { ALLERGEN_LABELS } from '@dineview/shared';
import { useGetDishDetailQuery } from '@/store/api/menu-api';
import { useCart } from '@/hooks/use-cart';
import { useLikes } from '@/hooks/use-likes';
import { useSession } from '@/hooks/use-session';
import { cn, formatPrice, hasArModel } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ModelViewerAr } from '@/components/ar/model-viewer-ar';
import { PhoneHandoffQr } from '@/components/ar/phone-handoff-qr';
import { DishTile } from '@/components/customer/dish-tile';
import { DoubleTapLike } from '@/components/customer/double-tap-like';
import { factsFor } from '@/components/customer/dish-facts';
import { LikeButton } from '@/components/customer/like-button';
import { NutritionPanel, hasNutrition } from '@/components/customer/nutrition';

const label = 'font-mono text-[11px] uppercase tracking-[0.2em]';

export default function DishDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dishId = params.id as string;
  const { currency, settings } = useSession();
  const { items, addItem, updateQuantity } = useCart();
  const { like } = useLikes();
  const { data, isLoading } = useGetDishDetailQuery(dishId);
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-ink">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const dish = data?.data;
  if (!dish) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-ink text-cream">
        <p className="text-cream/60">This dish isn’t on the menu any more.</p>
        <Link href="/menu" className="rounded-full bg-ember px-6 py-3 font-semibold text-ink">
          Back to menu
        </Link>
      </div>
    );
  }

  const ar = settings?.enableAr !== false && hasArModel(dish);
  const allergens = dish.allergens || [];
  const ingredients = [...(dish.ingredients || [])].sort((a: any, b: any) => Number(b.isPrimary) - Number(a.isPrimary));
  const inCart = items.find((i) => i.dishId === dish.id);
  const price = Number(dish.price);

  function handleAdd() {
    if (inCart) {
      updateQuantity(dish.id, inCart.quantity + quantity);
    } else {
      addItem({ dishId: dish.id, name: dish.name, price, imageUrl: dish.imageUrl });
      if (quantity > 1) updateQuantity(dish.id, quantity);
    }
    router.push('/menu');
  }

  return (
    <div className="min-h-[100dvh] bg-ink pb-28 text-cream">
      <header className="sticky top-0 z-30 border-b border-cream/10 bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-2 px-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/15 active:bg-cream/10"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className={cn(label, 'min-w-0 flex-1 truncate text-center text-cream/55')}>{dish.category?.name}</p>
          <LikeButton id={dish.id} className="h-10 w-10 rounded-full border border-cream/15 active:bg-cream/10" />
          {ar && (
            <Link
              href={`/dish/${dish.id}/ar`}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/15 active:bg-cream/10"
              aria-label="Full screen 3D"
            >
              <Expand className="h-[18px] w-[18px]" />
            </Link>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-lg">
        {/* Media: live 3D model when the dish has one */}
        <DoubleTapLike onLike={() => like(dish.id)}>
          {ar ? (
            <div className="relative aspect-[4/5] max-h-[68vh] w-full bg-stage-dark">
              <ModelViewerAr
                modelUrl={dish.arAsset.fileUrl}
                iosSrc={dish.arAsset.iosFileUrl}
                title={dish.name}
                poster={dish.imageUrl}
                alt={`${dish.name} in 3D`}
                facts={factsFor(dish)}
              />
            </div>
          ) : (
            <DishTile dish={dish} category={dish.category?.name} size="large" className="aspect-square w-full" />
          )}
        </DoubleTapLike>

        <div className="space-y-10 px-4 pt-6">
          <div>
            <p className={cn(label, 'flex flex-wrap items-center gap-x-2 gap-y-1 text-cream/55')}>
              {dish.isFeatured && <span className="text-ember">Chef’s pick</span>}
              {dish.isFeatured && dish.prepTimeMin && <span className="h-1 w-1 rounded-full bg-cream/30" />}
              {dish.prepTimeMin && <span>About {dish.prepTimeMin} min</span>}
              {ar && (
                <>
                  {(dish.isFeatured || dish.prepTimeMin) && <span className="h-1 w-1 rounded-full bg-cream/30" />}
                  <span>In 3D &amp; AR</span>
                </>
              )}
            </p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <h1 className="font-display text-[34px] font-medium leading-[1.02] tracking-[-0.02em]">{dish.name}</h1>
              <span className="mt-2 shrink-0 font-mono text-lg">{formatPrice(price, currency)}</span>
            </div>
            {dish.description && <p className="mt-4 leading-relaxed text-cream/65">{dish.description}</p>}
          </div>

          {ar && <PhoneHandoffQr path={`/dish/${dish.id}`} />}

          {hasNutrition(dish.nutrition) && (
            <section>
              <h2 className={cn(label, 'mb-4 text-cream/45')}>Nutrition · per serving</h2>
              <NutritionPanel nutrition={dish.nutrition} />
            </section>
          )}

          {ingredients.length > 0 && (
            <section>
              <h2 className={cn(label, 'mb-1 text-cream/45')}>Ingredients</h2>
              <ol>
                {ingredients.map((i: any, n: number) => (
                  <li key={i.id} className="flex items-baseline gap-3 border-b border-cream/10 py-3">
                    <span className="font-mono text-xs text-ember">{String(n + 1).padStart(2, '0')}</span>
                    <span className="font-display text-xl">{i.name}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {allergens.length > 0 && (
            <section>
              <h2 className={cn(label, 'mb-3 text-cream/45')}>Allergens</h2>
              <div className="flex flex-wrap gap-1.5">
                {allergens.map((a: any) => (
                  <span key={a.id} className="rounded-full border border-ember/40 px-3 py-1 text-xs text-cream/85">
                    {(ALLERGEN_LABELS as any)[a.allergen] ?? a.allergen}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream/10 bg-ink/90 px-4 pt-3 pb-safe backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-cream/15 p-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full active:bg-cream/10"
              aria-label="Fewer"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center font-mono">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full active:bg-cream/10"
              aria-label="More"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleAdd}
            className="flex-1 rounded-full bg-ember py-3.5 text-base font-semibold text-ink transition active:scale-[0.98]"
          >
            Add to order · {formatPrice(price * quantity, currency)}
          </button>
        </div>
      </div>
    </div>
  );
}

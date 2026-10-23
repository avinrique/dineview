'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Clock, Expand, Minus, Plus, Box } from 'lucide-react';
import { ALLERGEN_LABELS } from '@dineview/shared';
import { useGetDishDetailQuery } from '@/store/api/menu-api';
import { useCart } from '@/hooks/use-cart';
import { useSession } from '@/hooks/use-session';
import { formatPrice, hasArModel } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ModelViewerAr } from '@/components/ar/model-viewer-ar';
import { PhoneHandoffQr } from '@/components/ar/phone-handoff-qr';
import { DishImage } from '@/components/customer/dish-image';

export default function DishDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dishId = params.id as string;
  const { currency, settings } = useSession();
  const { items, addItem, updateQuantity } = useCart();
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
    <div className="min-h-[100dvh] bg-gray-50 pb-28">
      {/* Hero: live 3D model when the dish has one, otherwise the photo */}
      <div className="relative">
        <button
          onClick={() => router.back()}
          className="absolute left-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow backdrop-blur"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {ar ? (
          <div className="relative h-[58vh] max-h-[520px] min-h-[360px] bg-stage pb-6">
            <ModelViewerAr
              modelUrl={dish.arAsset.fileUrl}
              title={dish.name}
              poster={dish.imageUrl}
              alt={`${dish.name} in 3D`}
            />
            <Link
              href={`/dish/${dish.id}/ar`}
              className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow backdrop-blur"
              aria-label="Full screen"
            >
              <Expand className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <DishImage src={dish.imageUrl} alt={dish.name} className="h-64 w-full" iconClassName="h-12 w-12" />
        )}
      </div>

      <div className="relative z-10 -mt-6 rounded-t-3xl bg-gray-50 pt-6">
        <div className="mx-auto max-w-lg space-y-6 px-4">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold leading-tight text-gray-900">{dish.name}</h1>
              <span className="whitespace-nowrap text-xl font-bold text-gray-900">{formatPrice(price, currency)}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              {ar && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">
                  <Box className="h-3 w-3" /> AR ready
                </span>
              )}
              {dish.prepTimeMin && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4" /> ~{dish.prepTimeMin} min
                </span>
              )}
              {dish.isFeatured && <Badge variant="warning">Chef’s pick</Badge>}
            </div>
            {dish.description && <p className="mt-3 leading-relaxed text-gray-600">{dish.description}</p>}
          </div>
  
          {ar && <PhoneHandoffQr path={`/dish/${dish.id}`} />}
  
          {allergens.length > 0 && (
            <div>
              <h2 className="mb-2 font-semibold text-gray-900">Allergens</h2>
              <div className="flex flex-wrap gap-2">
                {allergens.map((a: any) => (
                  <Badge key={a.id} variant="danger">{(ALLERGEN_LABELS as any)[a.allergen] ?? a.allergen}</Badge>
                ))}
              </div>
            </div>
          )}
  
          {ingredients.length > 0 && (
            <div>
              <h2 className="mb-2 font-semibold text-gray-900">Ingredients</h2>
              <p className="text-sm leading-relaxed text-gray-600">
                {ingredients.map((i: any) => i.name).join(' · ')}
              </p>
            </div>
          )}
  
          {nutritionFacts.length > 0 && (
            <div>
              <h2 className="mb-3 font-semibold text-gray-900">Nutrition</h2>
              <div className="grid grid-cols-4 gap-2">
                {nutritionFacts.map((f) => (
                  <div key={f.label} className="rounded-xl bg-white p-3 text-center ring-1 ring-gray-100">
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

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white px-4 pt-3 pb-safe">
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
          <button onClick={handleAdd} className="btn-primary flex-1 py-3 text-base">
            Add · {formatPrice(price * quantity, currency)}
          </button>
        </div>
      </div>
    </div>
  );
}

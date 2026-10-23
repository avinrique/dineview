'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Check } from 'lucide-react';
import { useGetDishDetailQuery } from '@/store/api/menu-api';
import { useCart } from '@/hooks/use-cart';
import { useSession } from '@/hooks/use-session';
import { formatPrice, hasArModel } from '@/lib/utils';
import { ModelViewerAr } from '@/components/ar/model-viewer-ar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function DishArPage() {
  const params = useParams();
  const router = useRouter();
  const { currency } = useSession();
  const { items, addItem } = useCart();
  const { data, isLoading } = useGetDishDetailQuery(params.id as string);

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-stone-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const dish = data?.data;
  if (!dish || !hasArModel(dish)) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-gray-600">{dish ? 'This dish doesn’t have a 3D model yet.' : 'Dish not found.'}</p>
        <Link href={dish ? `/dish/${dish.id}` : '/menu'} className="btn-primary">Go back</Link>
      </div>
    );
  }

  const inCart = items.some((i) => i.dishId === dish.id);

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-stone-100 to-stone-50">
      <div className="z-30 flex shrink-0 items-center gap-3 px-3 py-3">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate font-semibold text-gray-900">{dish.name}</h1>
          <p className="text-sm text-gray-500">{formatPrice(Number(dish.price), currency)}</p>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <ModelViewerAr modelUrl={dish.arAsset.fileUrl} poster={dish.imageUrl} alt={`${dish.name} 3D model`} />
      </div>

      <div className="shrink-0 space-y-3 bg-white px-4 pt-3 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <p className="text-center text-xs text-gray-500">
          Tap <span className="font-medium text-brand-600">View on your table</span>, then point your camera at the
          table. The dish appears at its real size.
        </p>
        <button
          onClick={() => addItem({ dishId: dish.id, name: dish.name, price: Number(dish.price), imageUrl: dish.imageUrl })}
          className="btn-secondary flex w-full items-center justify-center gap-2 py-3"
        >
          {inCart ? <Check className="h-4 w-4 text-green-600" /> : <Plus className="h-4 w-4" />}
          {inCart ? 'In your order: add another' : 'Add to order'}
        </button>
      </div>
    </div>
  );
}

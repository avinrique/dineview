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
      <div className="flex min-h-[100dvh] items-center justify-center bg-stage">
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

  const inCart = items.find((i) => i.dishId === dish.id);

  return (
    <div className="fixed inset-0 flex flex-col bg-stage">
      <button
        onClick={() => router.back()}
        className="absolute left-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow backdrop-blur"
        aria-label="Back"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="relative min-h-0 flex-1">
        <ModelViewerAr
          modelUrl={dish.arAsset.fileUrl}
          title={dish.name}
          poster={dish.imageUrl}
          alt={`${dish.name} 3D model`}
        />
      </div>

      <div className="shrink-0 px-3 pb-safe">
        <div className="mx-auto flex max-w-lg items-center gap-3 rounded-3xl bg-white p-3 pl-4 shadow-[0_8px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-semibold text-gray-900">{dish.name}</h1>
            <p className="text-sm text-gray-500">{formatPrice(Number(dish.price), currency)}</p>
          </div>
          <button
            onClick={() => addItem({ dishId: dish.id, name: dish.name, price: Number(dish.price), imageUrl: dish.imageUrl })}
            className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.97]"
          >
            {inCart ? <Check className="h-4 w-4 text-green-400" /> : <Plus className="h-4 w-4" />}
            {inCart ? `${inCart.quantity} in order · add` : 'Add to order'}
          </button>
        </div>
      </div>
    </div>
  );
}

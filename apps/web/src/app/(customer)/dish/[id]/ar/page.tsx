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
      <div className="flex min-h-[100dvh] items-center justify-center bg-stage-dark">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const dish = data?.data;
  if (!dish || !hasArModel(dish)) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-ink p-8 text-center text-cream">
        <p className="text-cream/60">{dish ? 'This dish doesn’t have a 3D model yet.' : 'Dish not found.'}</p>
        <Link href={dish ? `/dish/${dish.id}` : '/menu'} className="rounded-full bg-ember px-6 py-3 font-semibold text-ink">
          Go back
        </Link>
      </div>
    );
  }

  const inCart = items.find((i) => i.dishId === dish.id);

  return (
    <div className="fixed inset-0 flex flex-col bg-stage-dark text-cream">
      <button
        onClick={() => router.back()}
        className="absolute left-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-cream/15 bg-ink/60 backdrop-blur"
        aria-label="Back"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="relative min-h-0 flex-1">
        <ModelViewerAr
          modelUrl={dish.arAsset.fileUrl}
          iosSrc={dish.arAsset.iosFileUrl}
          title={dish.name}
          poster={dish.imageUrl}
          alt={`${dish.name} 3D model`}
        />
      </div>

      <div className="shrink-0 px-3 pb-safe">
        <div className="mx-auto flex max-w-lg items-center gap-3 rounded-full border border-cream/10 bg-ink/80 p-1.5 pl-5 backdrop-blur-xl">
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg leading-tight">{dish.name}</h1>
            <p className="font-mono text-xs text-cream/55">{formatPrice(Number(dish.price), currency)}</p>
          </div>
          <button
            onClick={() => addItem({ dishId: dish.id, name: dish.name, price: Number(dish.price), imageUrl: dish.imageUrl })}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-ember px-5 py-3 text-sm font-semibold text-ink transition active:scale-[0.97]"
          >
            {inCart ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {inCart ? `${inCart.quantity} in order · add` : 'Add to order'}
          </button>
        </div>
      </div>
    </div>
  );
}

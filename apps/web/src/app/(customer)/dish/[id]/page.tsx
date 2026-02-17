'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetDishDetailQuery } from '@/store/api/menu-api';
import { useCart } from '@/hooks/use-cart';
import { useSession } from '@/hooks/use-session';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ArButton } from '@/components/ar/ar-button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Link from 'next/link';

export default function DishDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currency } = useSession();
  const { addItem } = useCart();
  const { data, isLoading } = useGetDishDetailQuery(params.id as string);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const dish = data?.data;
  if (!dish) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Dish not found</p>
      </div>
    );
  }

  const nutrition = dish.nutrition;
  const allergens = dish.allergens || [];
  const ingredients = dish.ingredients || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Back button */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-30 px-4 py-3">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* Image */}
      {dish.imageUrl && (
        <div className="w-full h-56 bg-gray-200">
          <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Title & Price */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">{dish.name}</h1>
            <span className="text-2xl font-bold text-brand-600 whitespace-nowrap">
              {formatPrice(Number(dish.price), currency)}
            </span>
          </div>
          {dish.description && (
            <p className="text-gray-600 mt-2">{dish.description}</p>
          )}
          {dish.prepTimeMin && (
            <p className="text-sm text-gray-500 mt-2">Prep time: ~{dish.prepTimeMin} min</p>
          )}
        </div>

        {/* AR / 3D Button */}
        <ArButton
          dishId={dish.id}
          onViewAr={() => router.push(`/dish/${dish.id}/ar`)}
          onView3D={() => router.push(`/dish/${dish.id}/ar?mode=3d`)}
        />

        {/* Allergens */}
        {allergens.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-2">Allergens</h2>
            <div className="flex gap-2 flex-wrap">
              {allergens.map((a: any) => (
                <Badge key={a.id} variant="danger">{a.allergen}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-2">Ingredients</h2>
            <div className="flex gap-2 flex-wrap">
              {ingredients.map((ing: any) => (
                <Badge key={ing.id} variant={ing.isPrimary ? 'info' : 'default'}>
                  {ing.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Nutrition */}
        {nutrition && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">Nutrition Facts</h2>
            <div className="grid grid-cols-2 gap-3">
              {nutrition.calories != null && (
                <div className="card p-3 text-center">
                  <p className="text-2xl font-bold text-brand-600">{nutrition.calories}</p>
                  <p className="text-xs text-gray-500">Calories</p>
                </div>
              )}
              {nutrition.proteinG != null && (
                <div className="card p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{nutrition.proteinG}g</p>
                  <p className="text-xs text-gray-500">Protein</p>
                </div>
              )}
              {nutrition.carbsG != null && (
                <div className="card p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{nutrition.carbsG}g</p>
                  <p className="text-xs text-gray-500">Carbs</p>
                </div>
              )}
              {nutrition.fatsG != null && (
                <div className="card p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{nutrition.fatsG}g</p>
                  <p className="text-xs text-gray-500">Fats</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add to cart button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-40">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => {
              addItem({
                dishId: dish.id,
                name: dish.name,
                price: Number(dish.price),
                imageUrl: dish.imageUrl,
              });
              router.push('/menu');
            }}
            className="btn-primary w-full py-3 text-base"
          >
            Add to Cart - {formatPrice(Number(dish.price), currency)}
          </button>
        </div>
      </div>
    </div>
  );
}

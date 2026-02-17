'use client';

import { useState } from 'react';
import { useGetMenuQuery } from '@/store/api/menu-api';
import { useSession } from '@/hooks/use-session';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function MenuPage() {
  const { restaurantName, tableLabel, currency } = useSession();
  const { data, isLoading, error } = useGetMenuQuery(undefined);
  const { addItem, itemCount, total } = useCart();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-red-500">Failed to load menu. Please try again.</p>
      </div>
    );
  }

  const menu = data.data;
  const categories = menu.categories || [];
  const filteredCategories = activeCategory
    ? categories.filter((c: any) => c.id === activeCategory)
    : categories;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">{restaurantName || 'Menu'}</h1>
          <p className="text-sm text-gray-500">Table {tableLabel}</p>
        </div>

        {/* Category tabs */}
        <div className="max-w-lg mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                !activeCategory
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Menu items */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-8">
        {filteredCategories.map((category: any) => (
          <section key={category.id}>
            <h2 className="text-lg font-bold text-gray-900 mb-1">{category.name}</h2>
            {category.description && (
              <p className="text-sm text-gray-500 mb-4">{category.description}</p>
            )}

            <div className="space-y-3">
              {category.dishes?.map((dish: any) => (
                <div key={dish.id} className="card flex gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <Link href={`/dish/${dish.id}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-brand-600 transition-colors">
                        {dish.name}
                      </h3>
                    </Link>
                    {dish.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{dish.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-bold text-brand-600">
                        {formatPrice(Number(dish.price), currency)}
                      </span>
                      {dish.isFeatured && <Badge variant="warning">Featured</Badge>}
                    </div>
                    {dish.allergens?.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {dish.allergens.map((a: any) => (
                          <Badge key={a.id} variant="danger" className="text-[10px]">
                            {a.allergen}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    {dish.imageUrl && (
                      <div className="w-20 h-20 rounded-lg bg-gray-200 overflow-hidden">
                        <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <button
                      onClick={() =>
                        addItem({
                          dishId: dish.id,
                          name: dish.name,
                          price: Number(dish.price),
                          imageUrl: dish.imageUrl,
                        })
                      }
                      className="bg-brand-500 hover:bg-brand-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Cart FAB */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-40">
          <div className="max-w-lg mx-auto">
            <Link
              href="/cart"
              className="btn-primary w-full flex items-center justify-between py-3 px-6 text-base"
            >
              <span className="bg-white/20 px-2 py-0.5 rounded">{itemCount} items</span>
              <span>View Cart</span>
              <span className="font-bold">{formatPrice(total, currency)}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

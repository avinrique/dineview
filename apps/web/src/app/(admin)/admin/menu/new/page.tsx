'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateDishMutation } from '@/store/api/menu-api';
import { useGetAdminCategoriesQuery } from '@/store/api/menu-api';
import { EU_ALLERGENS, ALLERGEN_LABELS } from '@dineview/shared';

export default function NewDishPage() {
  const router = useRouter();
  const [createDish, { isLoading }] = useCreateDishMutation();
  const { data: catData } = useGetAdminCategoriesQuery(undefined);
  const categories = catData?.data || [];
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '', description: '', price: '', categoryId: '',
    prepTimeMin: '', isFeatured: false,
    calories: '', proteinG: '', carbsG: '', fatsG: '',
    allergens: [] as string[],
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const nutrition = form.calories ? {
        calories: Number(form.calories) || undefined,
        proteinG: Number(form.proteinG) || undefined,
        carbsG: Number(form.carbsG) || undefined,
        fatsG: Number(form.fatsG) || undefined,
      } : undefined;

      await createDish({
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        categoryId: form.categoryId,
        prepTimeMin: form.prepTimeMin ? Number(form.prepTimeMin) : undefined,
        isFeatured: form.isFeatured,
        nutrition,
        allergens: form.allergens.length > 0 ? form.allergens : undefined,
      }).unwrap();

      router.push('/admin/menu');
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to create dish');
    }
  }

  function toggleAllergen(allergen: string) {
    setForm((f) => ({
      ...f,
      allergens: f.allergens.includes(allergen)
        ? f.allergens.filter((a) => a !== allergen)
        : [...f.allergens, allergen],
    }));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Dish</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Basic Info */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input h-20 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input" required>
                <option value="">Select...</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (min)</label>
              <input type="number" value={form.prepTimeMin} onChange={(e) => setForm({ ...form, prepTimeMin: e.target.value })} className="input" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} id="featured" />
              <label htmlFor="featured" className="text-sm text-gray-700">Featured dish</label>
            </div>
          </div>
        </div>

        {/* Nutrition */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Nutrition (optional)</h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
              <input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
              <input type="number" step="0.1" value={form.proteinG} onChange={(e) => setForm({ ...form, proteinG: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
              <input type="number" step="0.1" value={form.carbsG} onChange={(e) => setForm({ ...form, carbsG: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fats (g)</label>
              <input type="number" step="0.1" value={form.fatsG} onChange={(e) => setForm({ ...form, fatsG: e.target.value })} className="input" />
            </div>
          </div>
        </div>

        {/* Allergens */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Allergens</h2>
          <div className="flex flex-wrap gap-2">
            {EU_ALLERGENS.map((allergen) => (
              <button
                key={allergen}
                type="button"
                onClick={() => toggleAllergen(allergen)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  form.allergens.includes(allergen)
                    ? 'bg-red-100 border-red-300 text-red-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {(ALLERGEN_LABELS as any)[allergen]}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

        <div className="flex gap-3">
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? 'Creating...' : 'Create Dish'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, ImagePlus, Trash2, Upload } from 'lucide-react';
import { EU_ALLERGENS, ALLERGEN_LABELS } from '@dineview/shared';
import {
  useCreateDishMutation,
  useUpdateDishMutation,
  useGetAdminCategoriesQuery,
  useSetDishModelMutation,
  useRemoveDishModelMutation,
} from '@/store/api/menu-api';
import { useUploadFileMutation } from '@/store/api/admin-api';
import { useAppDispatch } from '@/store';
import { notify } from '@/store/slices/ui-slice';
import { ModelViewerAr } from '@/components/ar/model-viewer-ar';
import { glbToUsdz } from '@/lib/glb-to-usdz';
import { DishImage } from '@/components/customer/dish-image';
import { cn } from '@/lib/utils';

type Model = { fileUrl: string; fileSizeBytes: number; iosFileUrl?: string | null } | null;

function numOrUndefined(v: string) {
  return v.trim() === '' ? undefined : Number(v);
}

export function DishForm({ dish }: { dish?: any }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data: catData } = useGetAdminCategoriesQuery(undefined);
  const categories: any[] = catData?.data || [];
  const [createDish, { isLoading: creating }] = useCreateDishMutation();
  const [updateDish, { isLoading: updating }] = useUpdateDishMutation();
  const [setDishModel] = useSetDishModelMutation();
  const [removeDishModel] = useRemoveDishModelMutation();
  const [uploadFile] = useUploadFileMutation();
  const [uploading, setUploading] = useState<'image' | 'model' | null>(null);
  const [error, setError] = useState('');
  const imageInput = useRef<HTMLInputElement>(null);
  const modelInput = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: dish?.name ?? '',
    description: dish?.description ?? '',
    price: dish ? String(Number(dish.price)) : '',
    categoryId: dish?.categoryId ?? '',
    prepTimeMin: dish?.prepTimeMin ? String(dish.prepTimeMin) : '',
    isFeatured: dish?.isFeatured ?? false,
    isAvailable: dish?.isAvailable ?? true,
    calories: dish?.nutrition?.calories != null ? String(dish.nutrition.calories) : '',
    proteinG: dish?.nutrition?.proteinG != null ? String(dish.nutrition.proteinG) : '',
    carbsG: dish?.nutrition?.carbsG != null ? String(dish.nutrition.carbsG) : '',
    fatsG: dish?.nutrition?.fatsG != null ? String(dish.nutrition.fatsG) : '',
    ingredients: (dish?.ingredients || []).map((i: any) => i.name).join(', '),
    allergens: (dish?.allergens || []).map((a: any) => a.allergen) as string[],
  });
  const [imageUrl, setImageUrl] = useState<string | null>(dish?.imageUrl ?? null);
  const initialModel: Model = dish?.arAsset
    ? { fileUrl: dish.arAsset.fileUrl, fileSizeBytes: dish.arAsset.fileSizeBytes, iosFileUrl: dish.arAsset.iosFileUrl }
    : null;
  const [model, setModel] = useState<Model>(initialModel);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  async function handleUpload(file: File | undefined, kind: 'image' | 'model') {
    if (!file) return;
    setError('');
    setUploading(kind);
    try {
      const { data } = await uploadFile(file).unwrap();
      if (kind === 'image') {
        setImageUrl(data.url);
      } else {
        // Also store an iPhone (USDZ) copy; if conversion fails, Safari still converts on the fly
        const usdz = await glbToUsdz(file)
          .then((f) => uploadFile(f).unwrap())
          .catch(() => null);
        setModel({ fileUrl: data.url, fileSizeBytes: data.fileSizeBytes, iosFileUrl: usdz?.data.url ?? null });
      }
    } catch (err: any) {
      setError(err?.data?.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const hasNutrition = [form.calories, form.proteinG, form.carbsG, form.fatsG].some((v) => v.trim() !== '');
    const ingredients = form.ingredients
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
      .map((name: string, i: number) => ({ name, isPrimary: i < 2 }));

    const body = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price),
      categoryId: form.categoryId,
      imageUrl,
      prepTimeMin: form.prepTimeMin ? Number(form.prepTimeMin) : null,
      isFeatured: form.isFeatured,
      isAvailable: form.isAvailable,
      nutrition: hasNutrition
        ? {
            calories: numOrUndefined(form.calories),
            proteinG: numOrUndefined(form.proteinG),
            carbsG: numOrUndefined(form.carbsG),
            fatsG: numOrUndefined(form.fatsG),
          }
        : undefined,
      allergens: form.allergens as any,
      ingredients,
    };

    try {
      const saved = dish
        ? await updateDish({ id: dish.id, ...body }).unwrap()
        : await createDish(body).unwrap();
      const id = saved.data.id;

      if (model && model.fileUrl !== initialModel?.fileUrl) {
        await setDishModel({ id, ...model }).unwrap();
      } else if (!model && initialModel) {
        await removeDishModel(id).unwrap();
      }

      dispatch(notify('success', dish ? 'Dish updated' : 'Dish created'));
      router.push('/admin/menu');
    } catch (err: any) {
      const details = err?.data?.details?.map((d: any) => `${d.field}: ${d.message}`).join(', ');
      setError(details || err?.data?.message || 'Could not save the dish');
    }
  }

  function toggleAllergen(allergen: string) {
    set({
      allergens: form.allergens.includes(allergen)
        ? form.allergens.filter((a) => a !== allergen)
        : [...form.allergens, allergen],
    });
  }

  const saving = creating || updating;

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Basic info</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
              <input value={form.name} onChange={(e) => set({ name: e.target.value })} className="input" required maxLength={200} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea value={form.description} onChange={(e) => set({ description: e.target.value })} className="input h-20 resize-none" maxLength={1000} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Price *</label>
              <input type="number" step="0.01" min="0.01" value={form.price} onChange={(e) => set({ price: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category *</label>
              <select value={form.categoryId} onChange={(e) => set({ categoryId: e.target.value })} className="input" required>
                <option value="">Select…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Prep time (min)</label>
              <input type="number" min={1} max={180} value={form.prepTimeMin} onChange={(e) => set({ prepTimeMin: e.target.value })} className="input" />
            </div>
            <div className="flex flex-col justify-end gap-2 pb-1">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.isAvailable} onChange={(e) => set({ isAvailable: e.target.checked })} />
                Available to order
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => set({ isFeatured: e.target.checked })} />
                Chef’s pick
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Ingredients</label>
              <input
                value={form.ingredients}
                onChange={(e) => set({ ingredients: e.target.value })}
                className="input"
                placeholder="Comma separated, e.g. Flour, Butter, Sugar"
              />
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Nutrition (optional)</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {([
              ['calories', 'Calories', '1'],
              ['proteinG', 'Protein (g)', '0.1'],
              ['carbsG', 'Carbs (g)', '0.1'],
              ['fatsG', 'Fat (g)', '0.1'],
            ] as const).map(([key, label, step]) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
                <input type="number" min={0} step={step} value={form[key]} onChange={(e) => set({ [key]: e.target.value })} className="input" />
              </div>
            ))}
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Allergens</h2>
          <div className="flex flex-wrap gap-2">
            {EU_ALLERGENS.map((allergen) => (
              <button
                key={allergen}
                type="button"
                onClick={() => toggleAllergen(allergen)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
                  form.allergens.includes(allergen)
                    ? 'border-red-300 bg-red-100 text-red-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100',
                )}
              >
                {(ALLERGEN_LABELS as any)[allergen]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-900">Photo</h2>
          <DishImage src={imageUrl} alt={form.name.trim() || 'Dish photo'} className="aspect-[4/3] w-full rounded-xl" placeholderClassName="text-6xl" />
          <input ref={imageInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0], 'image')} />
          <div className="flex gap-2">
            <button type="button" onClick={() => imageInput.current?.click()} disabled={uploading !== null} className="btn-secondary flex flex-1 items-center justify-center gap-2 text-sm">
              <ImagePlus className="h-4 w-4" /> {uploading === 'image' ? 'Uploading…' : imageUrl ? 'Replace photo' : 'Upload photo'}
            </button>
            {imageUrl && (
              <button type="button" onClick={() => setImageUrl(null)} className="btn-ghost px-3" aria-label="Remove photo">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="card space-y-3">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <Box className="h-4 w-4 text-brand-500" /> 3D model for AR
            </h2>
            <p className="text-xs text-gray-500">
              Upload a .glb file at real-world scale (meters). Guests can then place the dish on their table in AR on iPhone and Android.
            </p>
          </div>
          {model ? (
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-gradient-to-b from-stone-100 to-stone-50">
              <ModelViewerAr modelUrl={model.fileUrl} iosSrc={model.iosFileUrl} poster={imageUrl} showArButton={false} />
            </div>
          ) : (
            <div className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400">
              <Box className="mb-2 h-8 w-8" />
              No 3D model yet
            </div>
          )}
          <input ref={modelInput} type="file" accept=".glb,model/gltf-binary" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0], 'model')} />
          <div className="flex gap-2">
            <button type="button" onClick={() => modelInput.current?.click()} disabled={uploading !== null} className="btn-secondary flex flex-1 items-center justify-center gap-2 text-sm">
              <Upload className="h-4 w-4" /> {uploading === 'model' ? 'Uploading…' : model ? 'Replace model' : 'Upload .glb'}
            </button>
            {model && (
              <button type="button" onClick={() => setModel(null)} className="btn-ghost px-3" aria-label="Remove 3D model">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          {model && <p className="text-xs text-gray-400">{(model.fileSizeBytes / 1024 / 1024).toFixed(1)} MB</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 xl:col-span-2">
        <button type="submit" disabled={saving || uploading !== null} className="btn-primary">
          {saving ? 'Saving…' : dish ? 'Save changes' : 'Create dish'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </form>
  );
}

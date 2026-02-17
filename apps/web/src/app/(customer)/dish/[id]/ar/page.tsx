'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useGetDishDetailQuery } from '@/store/api/menu-api';
import { ArViewer } from '@/components/ar/ar-viewer';
import { ModelViewer } from '@/components/ar/model-viewer';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function DishArPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const { data, isLoading } = useGetDishDetailQuery(params.id as string);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
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

  const arAsset = dish.arAsset;
  const modelUrl = arAsset?.fileUrl;
  const placeholderType = dish.category?.slug?.includes('drink')
    ? 'drink'
    : dish.category?.slug?.includes('dessert')
    ? 'dessert'
    : dish.category?.slug?.includes('starter')
    ? 'bowl'
    : 'plate';

  const hotspots = arAsset?.hotspots || [];
  const scale = arAsset?.scale || { x: 1, y: 1, z: 1 };
  const rotation = arAsset?.rotation || { x: 0, y: 0, z: 0 };

  // 3D fallback mode
  if (mode === '3d') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 bg-white z-30 px-4 py-3 flex items-center justify-between shadow-sm">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="font-semibold">{dish.name} - 3D View</h1>
          <div className="w-12" />
        </div>
        <div className="max-w-lg mx-auto p-4">
          <ModelViewer
            modelUrl={modelUrl}
            placeholderType={placeholderType as any}
            scale={scale}
            rotation={rotation}
            className="h-[400px]"
          />
          <div className="mt-4 card">
            <h2 className="font-semibold text-gray-900 mb-2">{dish.name}</h2>
            <p className="text-sm text-gray-600">{dish.description}</p>
          </div>
        </div>
      </div>
    );
  }

  // Full AR mode
  return (
    <ArViewer
      modelUrl={modelUrl}
      placeholderType={placeholderType as any}
      scale={scale}
      rotation={rotation}
      hotspots={hotspots as any}
      onClose={() => router.back()}
    />
  );
}

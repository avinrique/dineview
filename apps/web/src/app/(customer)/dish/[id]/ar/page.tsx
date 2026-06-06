'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetDishDetailQuery } from '@/store/api/menu-api';
import { ModelViewerAr } from '@/components/ar/model-viewer-ar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function DishArPage() {
  const params = useParams();
  const router = useRouter();
  const { data, isLoading } = useGetDishDetailQuery(params.id as string);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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

  // Use the dish's own AR model if one has been uploaded, otherwise the
  // bundled sample model so AR/3D always has something to show.
  const modelUrl = dish.arAsset?.fileUrl as string | undefined;

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50">
      <div className="bg-white z-30 px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="font-semibold truncate px-2">{dish.name}</h1>
        <div className="w-12" />
      </div>

      <div className="relative flex-1 min-h-0">
        <ModelViewerAr modelUrl={modelUrl} alt={`${dish.name} 3D model`} />
      </div>

      <div className="bg-white px-4 py-3 shrink-0 border-t border-gray-100">
        <p className="text-sm text-gray-600 text-center">
          Drag to rotate · pinch to zoom · tap <span className="font-medium text-brand-600">View in your space</span> for AR
        </p>
        {!modelUrl && (
          <p className="text-xs text-gray-400 text-center mt-1">
            Showing a sample model — upload a 3D model for this dish in the admin panel.
          </p>
        )}
      </div>
    </div>
  );
}

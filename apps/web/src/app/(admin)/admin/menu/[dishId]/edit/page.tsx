'use client';

import { useParams, useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function EditDishPage() {
  const params = useParams();
  const router = useRouter();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Dish</h1>
      <div className="card p-8 text-center text-gray-500">
        <p>Edit form for dish {params.dishId}</p>
        <p className="text-sm mt-2">Similar to the create form with pre-populated values</p>
        <button onClick={() => router.back()} className="btn-secondary mt-4">Go Back</button>
      </div>
    </div>
  );
}

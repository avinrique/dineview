'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useGetAdminDishQuery } from '@/store/api/menu-api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DishForm } from '@/components/admin/dish-form';

export default function EditDishPage() {
  const params = useParams();
  const { data, isLoading, error } = useGetAdminDishQuery(params.dishId as string);

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;
  }

  if (error || !data?.data) {
    return (
      <div className="card p-8 text-center text-gray-500">
        <p className="mb-4">This dish couldn’t be found.</p>
        <Link href="/admin/menu" className="btn-secondary">Back to menu</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Edit {data.data.name}</h1>
      {/* key: re-initialise the form if a different dish loads */}
      <DishForm key={data.data.id} dish={data.data} />
    </div>
  );
}

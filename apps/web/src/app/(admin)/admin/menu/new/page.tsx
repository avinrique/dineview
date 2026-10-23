'use client';

import { DishForm } from '@/components/admin/dish-form';

export default function NewDishPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Add a dish</h1>
      <DishForm />
    </div>
  );
}

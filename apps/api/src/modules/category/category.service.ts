import { prisma, redis } from '../../config';
import { ApiError } from '../../utils/api-error';
import { slugify } from '@dineview/shared';
import type { CreateCategoryInput, UpdateCategoryInput } from '@dineview/shared';

export async function getAllCategories(restaurantId: string) {
  return prisma.category.findMany({
    where: { restaurantId },
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { dishes: true } } },
  });
}

export async function createCategory(restaurantId: string, input: CreateCategoryInput) {
  const slug = slugify(input.name);
  const existing = await prisma.category.findFirst({
    where: { slug, restaurantId },
  });
  if (existing) throw ApiError.conflict('Category with this name already exists');

  const category = await prisma.category.create({
    data: { ...input, slug, restaurantId },
  });

  await redis.del(`menu:${restaurantId}`);
  return category;
}

export async function getCategoryById(restaurantId: string, id: string) {
  const category = await prisma.category.findFirst({
    where: { id, restaurantId },
    include: { dishes: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!category) throw ApiError.notFound('Category not found');
  return category;
}

export async function updateCategory(restaurantId: string, id: string, input: UpdateCategoryInput) {
  const category = await prisma.category.findFirst({ where: { id, restaurantId } });
  if (!category) throw ApiError.notFound('Category not found');

  const data: any = { ...input };
  if (input.name) data.slug = slugify(input.name);

  const updated = await prisma.category.update({ where: { id }, data });
  await redis.del(`menu:${restaurantId}`);
  return updated;
}

export async function deleteCategory(restaurantId: string, id: string) {
  const category = await prisma.category.findFirst({ where: { id, restaurantId } });
  if (!category) throw ApiError.notFound('Category not found');

  const dishCount = await prisma.dish.count({ where: { categoryId: id } });
  if (dishCount > 0) throw ApiError.conflict('Cannot delete category with dishes');

  await prisma.category.delete({ where: { id } });
  await redis.del(`menu:${restaurantId}`);
}

export async function reorderCategories(restaurantId: string, items: { id: string; sortOrder: number }[]) {
  await prisma.$transaction(
    items.map((item) =>
      prisma.category.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      }),
    ),
  );
  await redis.del(`menu:${restaurantId}`);
}

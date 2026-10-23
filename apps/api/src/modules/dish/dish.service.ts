import { prisma, redis } from '../../config';
import { getIO } from '../../config/socket';
import { ApiError } from '../../utils/api-error';
import { slugify } from '@dineview/shared';
import type { CreateDishInput, UpdateDishInput, SetDishModelInput } from '@dineview/shared';

export async function getAllDishes(
  restaurantId: string,
  opts: { skip: number; limit: number; search?: string; categoryId?: string },
) {
  const where: any = { restaurantId };
  if (opts.search) {
    where.OR = [
      { name: { contains: opts.search, mode: 'insensitive' } },
      { description: { contains: opts.search, mode: 'insensitive' } },
    ];
  }
  if (opts.categoryId) where.categoryId = opts.categoryId;

  const [dishes, total] = await Promise.all([
    prisma.dish.findMany({
      where,
      skip: opts.skip,
      take: opts.limit,
      orderBy: { sortOrder: 'asc' },
      include: {
        category: { select: { name: true } },
        nutrition: true,
        allergens: true,
        arAsset: { select: { id: true, status: true } },
      },
    }),
    prisma.dish.count({ where }),
  ]);

  return { dishes, total };
}

export async function createDish(restaurantId: string, input: CreateDishInput) {
  const slug = slugify(input.name);
  const { nutrition, allergens, ingredients, ...rest } = input;

  const category = await prisma.category.findFirst({ where: { id: input.categoryId, restaurantId } });
  if (!category) throw ApiError.badRequest('Category not found');

  const clash = await prisma.dish.findFirst({ where: { slug, restaurantId } });
  if (clash) throw ApiError.conflict('A dish with this name already exists');

  const dish = await prisma.dish.create({
    data: {
      ...rest,
      slug,
      restaurantId,
      nutrition: nutrition ? { create: nutrition } : undefined,
      allergens: allergens
        ? { create: allergens.map((a) => ({ allergen: a })) }
        : undefined,
      ingredients: ingredients
        ? { create: ingredients }
        : undefined,
    },
    include: {
      category: true,
      nutrition: true,
      allergens: true,
      ingredients: true,
    },
  });

  await redis.del(`menu:${restaurantId}`);
  return dish;
}

export async function getDishById(restaurantId: string, id: string) {
  const dish = await prisma.dish.findFirst({
    where: { id, restaurantId },
    include: {
      category: true,
      nutrition: true,
      allergens: true,
      ingredients: true,
      arAsset: true,
    },
  });
  if (!dish) throw ApiError.notFound('Dish not found');
  return dish;
}

export async function updateDish(restaurantId: string, id: string, input: UpdateDishInput) {
  const dish = await prisma.dish.findFirst({ where: { id, restaurantId } });
  if (!dish) throw ApiError.notFound('Dish not found');

  const { nutrition, allergens, ingredients, ...rest } = input;
  const data: any = { ...rest };
  if (rest.name) {
    data.slug = slugify(rest.name);
    const clash = await prisma.dish.findFirst({ where: { slug: data.slug, restaurantId, id: { not: id } } });
    if (clash) throw ApiError.conflict('A dish with this name already exists');
  }

  if (rest.categoryId) {
    const category = await prisma.category.findFirst({ where: { id: rest.categoryId, restaurantId } });
    if (!category) throw ApiError.badRequest('Category not found');
  }

  const updated = await prisma.dish.update({
    where: { id },
    data,
    include: { category: true, nutrition: true, allergens: true, ingredients: true },
  });

  if (nutrition) {
    await prisma.nutrition.upsert({
      where: { dishId: id },
      update: nutrition,
      create: { ...nutrition, dishId: id },
    });
  }

  if (allergens) {
    await prisma.dishAllergen.deleteMany({ where: { dishId: id } });
    await prisma.dishAllergen.createMany({
      data: allergens.map((a) => ({ dishId: id, allergen: a })),
    });
  }

  if (ingredients) {
    await prisma.dishIngredient.deleteMany({ where: { dishId: id } });
    await prisma.dishIngredient.createMany({
      data: ingredients.map((i) => ({ ...i, dishId: id })),
    });
  }

  await redis.del(`menu:${restaurantId}`);
  return updated;
}

export async function deleteDish(restaurantId: string, id: string) {
  const dish = await prisma.dish.findFirst({ where: { id, restaurantId } });
  if (!dish) throw ApiError.notFound('Dish not found');

  const ordered = await prisma.orderItem.count({ where: { dishId: id } });
  if (ordered > 0) {
    // Past orders reference this dish; hide it instead of breaking order history.
    await prisma.dish.update({ where: { id }, data: { isAvailable: false } });
    await redis.del(`menu:${restaurantId}`);
    return { archived: true };
  }

  await prisma.dish.delete({ where: { id } });
  await redis.del(`menu:${restaurantId}`);
  return { archived: false };
}

export async function setDishModel(restaurantId: string, dishId: string, input: SetDishModelInput) {
  const dish = await prisma.dish.findFirst({ where: { id: dishId, restaurantId } });
  if (!dish) throw ApiError.notFound('Dish not found');

  const asset = await prisma.arAsset.upsert({
    where: { dishId },
    update: {
      fileUrl: input.fileUrl,
      iosFileUrl: input.iosFileUrl ?? null,
      fileSizeBytes: input.fileSizeBytes,
      status: 'READY',
    },
    create: {
      dishId,
      restaurantId,
      fileUrl: input.fileUrl,
      iosFileUrl: input.iosFileUrl ?? null,
      fileSizeBytes: input.fileSizeBytes,
      status: 'READY',
    },
  });

  await redis.del(`menu:${restaurantId}`);
  return asset;
}

export async function removeDishModel(restaurantId: string, dishId: string) {
  await prisma.arAsset.deleteMany({ where: { dishId, restaurantId } });
  await redis.del(`menu:${restaurantId}`);
}

export async function toggleDishAvailability(restaurantId: string, id: string, isAvailable: boolean) {
  const dish = await prisma.dish.findFirst({ where: { id, restaurantId } });
  if (!dish) throw ApiError.notFound('Dish not found');

  const updated = await prisma.dish.update({
    where: { id },
    data: { isAvailable },
  });

  await redis.del(`menu:${restaurantId}`);

  // Emit real-time availability update
  try {
    const io = getIO();
    io.to(`restaurant:${restaurantId}`).emit('menu:dish_availability', {
      dishId: id,
      dishName: dish.name,
      isAvailable,
    });
  } catch {}

  return updated;
}

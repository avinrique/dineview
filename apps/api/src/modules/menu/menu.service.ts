import { prisma, redis, CACHE_TTL } from '../../config';
import { ApiError } from '../../utils/api-error';

export async function getFullMenu(restaurantId: string) {
  const cacheKey = `menu:${restaurantId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, name: true },
  });

  if (!restaurant) {
    throw ApiError.notFound('Restaurant not found');
  }

  const categories = await prisma.category.findMany({
    where: { restaurantId, isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      dishes: {
        where: { isAvailable: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          nutrition: true,
          allergens: true,
          ingredients: true,
          arAsset: {
            select: { id: true, thumbnailUrl: true, status: true },
          },
        },
      },
    },
  });

  const menu = {
    categories,
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
  };

  await redis.setex(cacheKey, CACHE_TTL.MENU, JSON.stringify(menu));
  return menu;
}

export async function getCategoryBySlug(restaurantId: string, slug: string) {
  const category = await prisma.category.findFirst({
    where: { restaurantId, slug, isActive: true },
    include: {
      dishes: {
        where: { isAvailable: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          nutrition: true,
          allergens: true,
          ingredients: true,
        },
      },
    },
  });

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  return category;
}

export async function getDishDetail(restaurantId: string, dishId: string) {
  const dish = await prisma.dish.findFirst({
    where: { id: dishId, restaurantId },
    include: {
      category: true,
      nutrition: true,
      allergens: true,
      ingredients: true,
      arAsset: true,
    },
  });

  if (!dish) {
    throw ApiError.notFound('Dish not found');
  }

  return dish;
}

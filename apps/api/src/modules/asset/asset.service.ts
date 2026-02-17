import { prisma } from '../../config';
import { getUploadPresignedUrl, getPublicUrl } from '../../config/storage';
import { ApiError } from '../../utils/api-error';
import { createId } from '@paralleldrive/cuid2';
import type { UpdateArAssetInput } from '@dineview/shared';

export async function getUploadPresigned(restaurantId: string, fileName: string, contentType: string) {
  const key = `ar-assets/${restaurantId}/${createId()}-${fileName}`;
  const uploadUrl = await getUploadPresignedUrl(key, contentType);
  const fileUrl = getPublicUrl(key);

  return { uploadUrl, fileUrl, key };
}

export async function updateAsset(restaurantId: string, id: string, input: UpdateArAssetInput) {
  const asset = await prisma.arAsset.findFirst({ where: { id, restaurantId } });
  if (!asset) throw ApiError.notFound('Asset not found');

  return prisma.arAsset.update({
    where: { id },
    data: input,
  });
}

export async function linkAssetToDish(restaurantId: string, assetId: string, dishId: string) {
  const asset = await prisma.arAsset.findFirst({ where: { id: assetId, restaurantId } });
  if (!asset) throw ApiError.notFound('Asset not found');

  const dish = await prisma.dish.findFirst({ where: { id: dishId, restaurantId } });
  if (!dish) throw ApiError.notFound('Dish not found');

  return prisma.arAsset.update({
    where: { id: assetId },
    data: { dishId, status: 'READY' },
  });
}

export async function getAssetById(restaurantId: string, id: string) {
  const asset = await prisma.arAsset.findFirst({
    where: { id, restaurantId },
    include: { dish: { select: { name: true, slug: true } } },
  });
  if (!asset) throw ApiError.notFound('Asset not found');
  return asset;
}

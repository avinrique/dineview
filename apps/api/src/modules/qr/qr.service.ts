import { prisma } from '../../config';
import { ApiError } from '../../utils/api-error';
import { generateShortToken } from '../../utils/crypto';
import QRCode from 'qrcode';

export async function generateQr(restaurantId: string, tableId: string) {
  const table = await prisma.table.findFirst({
    where: { id: tableId, restaurantId },
  });
  if (!table) throw ApiError.notFound('Table not found');

  const token = generateShortToken(12);
  const scanUrl = `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/scan/${token}`;

  const qrCode = await prisma.qrCode.create({
    data: {
      token,
      tableId,
      restaurantId,
    },
  });

  const qrDataUrl = await QRCode.toDataURL(scanUrl, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });

  return { ...qrCode, scanUrl, qrDataUrl };
}

export async function getQrForTable(restaurantId: string, tableId: string) {
  return prisma.qrCode.findMany({
    where: { tableId, restaurantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function regenerateQr(restaurantId: string, tableId: string) {
  // Deactivate old QR codes
  await prisma.qrCode.updateMany({
    where: { tableId, restaurantId },
    data: { isActive: false },
  });

  return generateQr(restaurantId, tableId);
}

import { prisma } from '../../config';
import { ApiError } from '../../utils/api-error';
import { signSessionToken } from '../../utils/crypto';

export async function handleQrScan(qrToken: string) {
  const qrCode = await prisma.qrCode.findUnique({
    where: { token: qrToken },
    include: {
      table: true,
      restaurant: true,
    },
  });

  if (!qrCode || !qrCode.isActive) {
    throw ApiError.notFound('Invalid or inactive QR code');
  }

  if (!qrCode.table.isActive) {
    throw ApiError.badRequest('This table is currently not active');
  }

  // Check for existing active session
  let session = await prisma.tableSession.findFirst({
    where: {
      tableId: qrCode.tableId,
      restaurantId: qrCode.restaurantId,
      status: 'ACTIVE',
    },
  });

  // Create new session if none exists
  if (!session) {
    session = await prisma.tableSession.create({
      data: {
        tableId: qrCode.tableId,
        restaurantId: qrCode.restaurantId,
        guestCount: 1,
      },
    });
  }

  // Increment scan count
  await prisma.qrCode.update({
    where: { id: qrCode.id },
    data: { scannedCount: { increment: 1 } },
  });

  const sessionToken = signSessionToken({
    sessionId: session.id,
    restaurantId: qrCode.restaurantId,
    tableId: qrCode.tableId,
    tableLabel: qrCode.table.label,
  });

  const settings = qrCode.restaurant.settings as any;

  return {
    sessionToken,
    restaurant: {
      id: qrCode.restaurant.id,
      name: qrCode.restaurant.name,
      logo: qrCode.restaurant.logo,
      currency: qrCode.restaurant.currency,
      settings: {
        taxRate: settings?.taxRate ?? 0,
        serviceCharge: settings?.serviceCharge ?? 0,
        autoAcceptOrders: settings?.autoAcceptOrders ?? false,
        enableAr: settings?.enableAr ?? true,
        primaryColor: settings?.primaryColor ?? '#f97316',
        secondaryColor: settings?.secondaryColor ?? '#1e293b',
      },
    },
    table: {
      id: qrCode.table.id,
      label: qrCode.table.label,
    },
    session: {
      id: session.id,
      guestCount: session.guestCount,
      startedAt: session.startedAt,
    },
  };
}

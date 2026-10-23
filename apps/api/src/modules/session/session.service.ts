import { prisma, env, getIO } from '../../config';
import { ApiError } from '../../utils/api-error';
import { signSessionToken } from '../../utils/crypto';

// `/scan/demo` opens the first active table of the demo restaurant so the
// landing page can offer a one-tap demo without a printed QR code.
async function findDemoQr() {
  if (!env.DEMO_RESTAURANT_SLUG) return null;
  return prisma.qrCode.findFirst({
    where: {
      isActive: true,
      restaurant: { slug: env.DEMO_RESTAURANT_SLUG },
      table: { isActive: true },
    },
    orderBy: { table: { label: 'asc' } },
    include: { table: true, restaurant: true },
  });
}

export async function handleQrScan(qrToken: string) {
  const qrCode =
    qrToken === 'demo'
      ? await findDemoQr()
      : await prisma.qrCode.findUnique({
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

    try {
      getIO().to(`restaurant:${qrCode.restaurantId}`).emit('session:started', {
        sessionId: session.id,
        tableId: qrCode.tableId,
        tableLabel: qrCode.table.label,
      });
    } catch {
      // Socket not initialized
    }
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

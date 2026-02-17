import { Server, Socket } from 'socket.io';
import { randomUUID } from 'crypto';
import type { ServerToClientEvents, ClientToServerEvents } from '@dineview/shared';
import { logger } from '../../config/logger';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function handleNotificationEvents(io: TypedServer, socket: TypedSocket) {
  socket.on('notification:waiter_call', (data) => {
    const notificationId = randomUUID();
    logger.info({ ...data, notificationId }, 'Waiter call requested');

    // Extract restaurant ID from the rooms the socket is in
    const rooms = Array.from(socket.rooms);
    const tableRoom = rooms.find((r) => r.includes(':table:'));
    if (!tableRoom) return;

    const restaurantId = tableRoom.split(':')[1];

    io.to(`restaurant:${restaurantId}:waiters`).emit('notification:waiter_call', {
      notificationId,
      tableId: data.tableId,
      tableLabel: data.tableLabel,
      sessionId: data.sessionId,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('notification:bill_request', (data) => {
    const notificationId = randomUUID();
    logger.info({ ...data, notificationId }, 'Bill requested');

    const rooms = Array.from(socket.rooms);
    const tableRoom = rooms.find((r) => r.includes(':table:'));
    if (!tableRoom) return;

    const restaurantId = tableRoom.split(':')[1];

    io.to(`restaurant:${restaurantId}:waiters`).emit('notification:bill_request', {
      notificationId,
      tableId: data.tableId,
      tableLabel: data.tableLabel,
      sessionId: data.sessionId,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('notification:acknowledge', (data) => {
    logger.info(data, 'Notification acknowledged');

    // Broadcast acknowledgment to all restaurant rooms
    const rooms = Array.from(socket.rooms);
    const restaurantRoom = rooms.find((r) => r.startsWith('restaurant:') && !r.includes(':'));
    if (!restaurantRoom) return;

    io.to(restaurantRoom).emit('notification:acknowledged', {
      notificationId: data.notificationId,
      acknowledgedBy: socket.id,
      timestamp: new Date().toISOString(),
    });
  });
}

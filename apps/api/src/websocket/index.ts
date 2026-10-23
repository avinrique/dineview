import { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@dineview/shared';
import { logger } from '../config/logger';
import { resolveIdentity, isStaffOf } from './identity';
import { handleNotificationEvents } from './handlers/notification.handler';
import { handleSessionEvents } from './handlers/session.handler';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function setupSocketHandlers(io: TypedServer) {
  io.on('connection', (socket) => {
    const identity = resolveIdentity(socket.handshake.auth?.token);
    socket.data.identity = identity;
    logger.debug({ socketId: socket.id, kind: identity?.kind }, 'Socket connected, setting up handlers');

    const deny = (room: string) => {
      logger.warn({ socketId: socket.id, room }, 'Socket room join denied');
      socket.emit('error', { message: 'Not allowed to join this room' });
    };

    // Room joining
    socket.on('join:restaurant', (restaurantId) => {
      if (!isStaffOf(identity, restaurantId)) return deny(`restaurant:${restaurantId}`);
      socket.join(`restaurant:${restaurantId}`);
    });

    socket.on('join:table', ({ restaurantId, tableId }) => {
      const isGuestOfTable =
        identity?.kind === 'guest' && identity.restaurantId === restaurantId && identity.tableId === tableId;
      if (!isGuestOfTable && !isStaffOf(identity, restaurantId)) {
        return deny(`restaurant:${restaurantId}:table:${tableId}`);
      }
      socket.join(`restaurant:${restaurantId}:table:${tableId}`);
    });

    socket.on('join:kitchen', (restaurantId) => {
      if (!isStaffOf(identity, restaurantId)) return deny(`restaurant:${restaurantId}:kitchen`);
      socket.join(`restaurant:${restaurantId}:kitchen`);
    });

    socket.on('join:waiters', (restaurantId) => {
      if (!isStaffOf(identity, restaurantId)) return deny(`restaurant:${restaurantId}:waiters`);
      socket.join(`restaurant:${restaurantId}:waiters`);
    });

    // Module-specific handlers
    handleNotificationEvents(io, socket);
    handleSessionEvents(io, socket);

    socket.on('disconnect', () => {
      logger.debug({ socketId: socket.id }, 'Socket disconnected');
    });
  });

  logger.info('WebSocket handlers initialized');
}

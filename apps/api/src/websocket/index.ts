import { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@dineview/shared';
import { logger } from '../config/logger';
import { handleOrderEvents } from './handlers/order.handler';
import { handleNotificationEvents } from './handlers/notification.handler';
import { handleSessionEvents } from './handlers/session.handler';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function setupSocketHandlers(io: TypedServer) {
  io.on('connection', (socket) => {
    logger.debug({ socketId: socket.id }, 'Socket connected, setting up handlers');

    // Room joining
    socket.on('join:restaurant', (restaurantId) => {
      socket.join(`restaurant:${restaurantId}`);
      logger.debug({ socketId: socket.id, restaurantId }, 'Joined restaurant room');
    });

    socket.on('join:table', ({ restaurantId, tableId }) => {
      socket.join(`restaurant:${restaurantId}:table:${tableId}`);
      logger.debug({ socketId: socket.id, restaurantId, tableId }, 'Joined table room');
    });

    socket.on('join:kitchen', (restaurantId) => {
      socket.join(`restaurant:${restaurantId}:kitchen`);
      logger.debug({ socketId: socket.id, restaurantId }, 'Joined kitchen room');
    });

    socket.on('join:waiters', (restaurantId) => {
      socket.join(`restaurant:${restaurantId}:waiters`);
      logger.debug({ socketId: socket.id, restaurantId }, 'Joined waiters room');
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

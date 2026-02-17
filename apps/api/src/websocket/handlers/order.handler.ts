import { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@dineview/shared';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function handleOrderEvents(io: TypedServer, socket: TypedSocket) {
  // Order events are emitted from the order service, not from client
  // This handler is reserved for any future client-initiated order events
}

export function emitOrderNew(
  io: TypedServer,
  restaurantId: string,
  event: Parameters<ServerToClientEvents['order:new']>[0],
) {
  io.to(`restaurant:${restaurantId}`).emit('order:new', event);
  io.to(`restaurant:${restaurantId}:kitchen`).emit('order:new', event);
}

export function emitOrderStatusChanged(
  io: TypedServer,
  restaurantId: string,
  tableId: string,
  event: Parameters<ServerToClientEvents['order:status_changed']>[0],
) {
  io.to(`restaurant:${restaurantId}`).emit('order:status_changed', event);
  io.to(`restaurant:${restaurantId}:table:${tableId}`).emit('order:status_changed', event);
  io.to(`restaurant:${restaurantId}:kitchen`).emit('order:status_changed', event);
}

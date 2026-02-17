import { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@dineview/shared';
import { logger } from '../../config/logger';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function handleSessionEvents(io: TypedServer, socket: TypedSocket) {
  // Session events are mainly emitted from the server side
  // when sessions are created or closed
}

export function emitSessionStarted(
  io: TypedServer,
  restaurantId: string,
  event: Parameters<ServerToClientEvents['session:started']>[0],
) {
  io.to(`restaurant:${restaurantId}`).emit('session:started', event);
  io.to(`restaurant:${restaurantId}:waiters`).emit('session:started', event);
}

export function emitSessionClosed(
  io: TypedServer,
  restaurantId: string,
  event: Parameters<ServerToClientEvents['session:closed']>[0],
) {
  io.to(`restaurant:${restaurantId}`).emit('session:closed', event);
}

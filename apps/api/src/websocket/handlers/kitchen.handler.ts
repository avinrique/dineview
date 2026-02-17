import { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@dineview/shared';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function emitDishAvailability(
  io: TypedServer,
  restaurantId: string,
  event: Parameters<ServerToClientEvents['menu:dish_availability']>[0],
) {
  io.to(`restaurant:${restaurantId}`).emit('menu:dish_availability', event);
}

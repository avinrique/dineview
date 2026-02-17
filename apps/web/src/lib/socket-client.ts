import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@dineview/shared';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export function getSocket(): TypedSocket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000', {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket(): TypedSocket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export function joinTableRoom(restaurantId: string, tableId: string) {
  const s = getSocket();
  s.emit('join:table', { restaurantId, tableId });
}

export function joinRestaurantRoom(restaurantId: string) {
  const s = getSocket();
  s.emit('join:restaurant', restaurantId);
}

export function joinKitchenRoom(restaurantId: string) {
  const s = getSocket();
  s.emit('join:kitchen', restaurantId);
}

export function joinWaitersRoom(restaurantId: string) {
  const s = getSocket();
  s.emit('join:waiters', restaurantId);
}

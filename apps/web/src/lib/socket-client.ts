import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@dineview/shared';
import { store } from '@/store';
import { getValidAccessToken } from '@/store/auth-refresh';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;
let users = 0;
let disconnectTimer: ReturnType<typeof setTimeout> | null = null;

// Rooms are re-joined on every (re)connect: the server forgets them when the
// connection drops (phone sleeps, network switch, API restart).
const rooms = new Map<string, (s: TypedSocket) => void>();

function isStaffContext() {
  return typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
}

export function getSocket(): TypedSocket {
  if (!socket) {
    const opts = {
      autoConnect: false,
      // Called on every connection attempt, so reconnects carry a fresh token.
      auth: (cb: (data: object) => void) => {
        if (isStaffContext()) {
          getValidAccessToken(store.getState, store.dispatch).then((token) => cb({ token }));
        } else {
          cb({ token: store.getState().session.sessionToken });
        }
      },
    };
    // Same origin by default; Next.js proxies /socket.io to the API.
    const url = process.env.NEXT_PUBLIC_WS_URL;
    socket = (url ? io(url, opts) : io(opts)) as TypedSocket;
    socket.on('connect', () => {
      rooms.forEach((join) => join(socket!));
    });
  }
  return socket;
}

/** Ref-counted connect; pair every call with releaseSocket(). */
export function acquireSocket(): TypedSocket {
  const s = getSocket();
  users += 1;
  if (disconnectTimer) {
    clearTimeout(disconnectTimer);
    disconnectTimer = null;
  }
  if (!s.connected) s.connect();
  return s;
}

export function releaseSocket() {
  users = Math.max(0, users - 1);
  if (users === 0 && !disconnectTimer) {
    // Grace period so client-side navigation doesn't drop and re-open the socket
    disconnectTimer = setTimeout(() => {
      disconnectTimer = null;
      if (users === 0) {
        rooms.clear();
        socket?.disconnect();
      }
    }, 2000);
  }
}

/** Reconnect so the server re-reads the auth token (after login or a QR scan). */
export function reauthenticateSocket() {
  if (socket?.connected) {
    socket.disconnect();
    socket.connect();
  }
}

function joinRoom(key: string, join: (s: TypedSocket) => void) {
  rooms.set(key, join);
  const s = getSocket();
  if (s.connected) join(s);
}

export function joinTableRoom(restaurantId: string, tableId: string) {
  joinRoom(`table:${restaurantId}:${tableId}`, (s) => s.emit('join:table', { restaurantId, tableId }));
}

export function joinRestaurantRoom(restaurantId: string) {
  joinRoom(`restaurant:${restaurantId}`, (s) => s.emit('join:restaurant', restaurantId));
}

export function joinKitchenRoom(restaurantId: string) {
  joinRoom(`kitchen:${restaurantId}`, (s) => s.emit('join:kitchen', restaurantId));
}

export function joinWaitersRoom(restaurantId: string) {
  joinRoom(`waiters:${restaurantId}`, (s) => s.emit('join:waiters', restaurantId));
}

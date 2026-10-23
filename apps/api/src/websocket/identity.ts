import type { Socket } from 'socket.io';
import { verifyAccessToken, verifySessionToken } from '../utils/crypto';

export type SocketIdentity =
  | { kind: 'staff'; userId: string; role: string; restaurantId: string | null }
  | { kind: 'guest'; sessionId: string; restaurantId: string; tableId: string; tableLabel: string };

// Clients pass their staff access token or guest session token in the
// handshake (`auth.token`); it decides which rooms they may join.
export function resolveIdentity(token: unknown): SocketIdentity | null {
  if (typeof token !== 'string' || !token) return null;
  try {
    const p = verifyAccessToken(token);
    return { kind: 'staff', userId: p.id, role: p.role, restaurantId: p.restaurantId };
  } catch {}
  try {
    const p = verifySessionToken(token);
    return {
      kind: 'guest',
      sessionId: p.sessionId,
      restaurantId: p.restaurantId,
      tableId: p.tableId,
      tableLabel: p.tableLabel,
    };
  } catch {}
  return null;
}

export function isStaffOf(identity: SocketIdentity | null, restaurantId: string) {
  return (
    identity?.kind === 'staff' &&
    (identity.restaurantId === restaurantId || identity.role === 'SUPER_ADMIN')
  );
}

export function getIdentity(socket: Socket): SocketIdentity | null {
  return socket.data.identity ?? null;
}

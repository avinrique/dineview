import { Server, Socket } from 'socket.io';
import { randomUUID } from 'crypto';
import type { ServerToClientEvents, ClientToServerEvents } from '@dineview/shared';
import { logger } from '../../config/logger';
import { getIdentity, isStaffOf } from '../identity';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

type NotificationKind = 'waiter_call' | 'bill_request';

// Remember which table raised each notification so an acknowledgement from
// staff can be relayed back to that table ("a waiter is on the way").
const pending = new Map<string, { restaurantId: string; tableId: string; kind: NotificationKind }>();
const PENDING_TTL_MS = 60 * 60 * 1000;

export function handleNotificationEvents(io: TypedServer, socket: TypedSocket) {
  const raise = (kind: NotificationKind) => () => {
    // Table details come from the verified session token, not the payload.
    const identity = getIdentity(socket);
    if (identity?.kind !== 'guest') return;

    const notificationId = randomUUID();
    const { restaurantId, tableId, tableLabel, sessionId } = identity;
    logger.info({ kind, restaurantId, tableLabel, notificationId }, 'Table notification');

    pending.set(notificationId, { restaurantId, tableId, kind });
    setTimeout(() => pending.delete(notificationId), PENDING_TTL_MS).unref();

    io.to(`restaurant:${restaurantId}:waiters`).emit(`notification:${kind}`, {
      notificationId,
      tableId,
      tableLabel,
      sessionId,
      timestamp: new Date().toISOString(),
    });
  };

  socket.on('notification:waiter_call', raise('waiter_call'));
  socket.on('notification:bill_request', raise('bill_request'));

  socket.on('notification:acknowledge', (data) => {
    const identity = getIdentity(socket);
    const entry = pending.get(data.notificationId);
    if (!entry || !isStaffOf(identity, entry.restaurantId) || identity?.kind !== 'staff') return;

    pending.delete(data.notificationId);
    logger.info({ notificationId: data.notificationId }, 'Notification acknowledged');

    const event = {
      notificationId: data.notificationId,
      acknowledgedBy: identity.userId,
      kind: entry.kind,
      tableId: entry.tableId,
      timestamp: new Date().toISOString(),
    };
    // Dismiss on every staff screen, and tell the table someone is coming.
    io.to(`restaurant:${entry.restaurantId}:waiters`).emit('notification:acknowledged', event);
    io.to(`restaurant:${entry.restaurantId}:table:${entry.tableId}`).emit('notification:acknowledged', event);
  });
}

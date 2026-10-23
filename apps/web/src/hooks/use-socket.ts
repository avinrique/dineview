'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  acquireSocket,
  releaseSocket,
  getSocket,
  joinTableRoom,
  joinRestaurantRoom,
  joinKitchenRoom,
  joinWaitersRoom,
} from '@/lib/socket-client';
import type { ServerToClientEvents } from '@dineview/shared';

type EventName = keyof ServerToClientEvents;

export function useSocket() {
  const socketRef = useRef(getSocket());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = acquireSocket();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    setConnected(s.connected);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      releaseSocket();
    };
  }, []);

  const on = useCallback(<E extends EventName>(
    event: E,
    handler: ServerToClientEvents[E],
  ) => {
    socketRef.current.on(event as any, handler as any);
    return () => {
      socketRef.current.off(event as any, handler as any);
    };
  }, []);

  return {
    socket: socketRef.current,
    connected,
    on,
    joinTable: joinTableRoom,
    joinRestaurant: joinRestaurantRoom,
    joinKitchen: joinKitchenRoom,
    joinWaiters: joinWaitersRoom,
  };
}

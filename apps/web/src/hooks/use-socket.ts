'use client';

import { useEffect, useRef, useCallback } from 'react';
import { connectSocket, disconnectSocket, getSocket, joinTableRoom, joinRestaurantRoom, joinKitchenRoom, joinWaitersRoom } from '@/lib/socket-client';
import type { ServerToClientEvents } from '@dineview/shared';

type EventName = keyof ServerToClientEvents;

export function useSocket() {
  const socketRef = useRef(getSocket());

  useEffect(() => {
    connectSocket();
    return () => {
      disconnectSocket();
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
    on,
    joinTable: joinTableRoom,
    joinRestaurant: joinRestaurantRoom,
    joinKitchen: joinKitchenRoom,
    joinWaiters: joinWaitersRoom,
  };
}

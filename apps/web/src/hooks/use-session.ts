'use client';

import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { setSession, clearSession } from '@/store/slices/session-slice';
import { useSocket } from './use-socket';

export function useSession() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((s) => s.session);
  const { joinTable } = useSocket();

  useEffect(() => {
    if (session.restaurantId && session.tableId) {
      joinTable(session.restaurantId, session.tableId);
    }
  }, [session.restaurantId, session.tableId, joinTable]);

  return {
    ...session,
    isActive: !!session.sessionToken,
    setSession: (data: Parameters<typeof setSession>[0]) => dispatch(setSession(data)),
    clearSession: () => dispatch(clearSession()),
  };
}

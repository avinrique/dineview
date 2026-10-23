'use client';

import { useAppSelector, useAppDispatch } from '@/store';
import { setSession, clearSession } from '@/store/slices/session-slice';

export function useSession() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((s) => s.session);

  return {
    ...session,
    isActive: !!session.sessionToken,
    setSession: (data: Parameters<typeof setSession>[0]) => dispatch(setSession(data)),
    clearSession: () => dispatch(clearSession()),
  };
}

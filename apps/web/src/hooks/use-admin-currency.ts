'use client';

import { useAppSelector } from '@/store';

/** Currency of the signed-in staff member's restaurant (for formatting prices). */
export function useAdminCurrency(): string {
  return useAppSelector((s) => s.admin.user?.currency) || 'USD';
}

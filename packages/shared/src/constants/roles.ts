import type { UserRole } from '../types/user.types';

export const ROLES: UserRole[] = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'KITCHEN_STAFF', 'WAITER'];

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  OWNER: 'Owner',
  MANAGER: 'Manager',
  KITCHEN_STAFF: 'Kitchen Staff',
  WAITER: 'Waiter',
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  OWNER: 80,
  MANAGER: 60,
  KITCHEN_STAFF: 40,
  WAITER: 20,
};

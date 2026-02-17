import type { UserRole } from '../types/user.types';

export type Permission =
  | 'menu:read' | 'menu:write'
  | 'category:read' | 'category:write'
  | 'dish:read' | 'dish:write' | 'dish:toggle_availability'
  | 'order:read' | 'order:update_status' | 'order:cancel'
  | 'table:read' | 'table:write'
  | 'qr:read' | 'qr:write'
  | 'session:read' | 'session:close'
  | 'staff:read' | 'staff:write'
  | 'analytics:read'
  | 'restaurant:read' | 'restaurant:write'
  | 'asset:read' | 'asset:write'
  | 'platform:read' | 'platform:write';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    'menu:read', 'menu:write', 'category:read', 'category:write',
    'dish:read', 'dish:write', 'dish:toggle_availability',
    'order:read', 'order:update_status', 'order:cancel',
    'table:read', 'table:write', 'qr:read', 'qr:write',
    'session:read', 'session:close',
    'staff:read', 'staff:write',
    'analytics:read',
    'restaurant:read', 'restaurant:write',
    'asset:read', 'asset:write',
    'platform:read', 'platform:write',
  ],
  OWNER: [
    'menu:read', 'menu:write', 'category:read', 'category:write',
    'dish:read', 'dish:write', 'dish:toggle_availability',
    'order:read', 'order:update_status', 'order:cancel',
    'table:read', 'table:write', 'qr:read', 'qr:write',
    'session:read', 'session:close',
    'staff:read', 'staff:write',
    'analytics:read',
    'restaurant:read', 'restaurant:write',
    'asset:read', 'asset:write',
  ],
  MANAGER: [
    'menu:read', 'menu:write', 'category:read', 'category:write',
    'dish:read', 'dish:write', 'dish:toggle_availability',
    'order:read', 'order:update_status', 'order:cancel',
    'table:read', 'table:write', 'qr:read', 'qr:write',
    'session:read', 'session:close',
    'staff:read',
    'analytics:read',
    'restaurant:read',
    'asset:read', 'asset:write',
  ],
  KITCHEN_STAFF: [
    'menu:read', 'category:read',
    'dish:read', 'dish:toggle_availability',
    'order:read', 'order:update_status',
  ],
  WAITER: [
    'menu:read', 'category:read',
    'dish:read',
    'order:read', 'order:update_status',
    'table:read',
    'session:read',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

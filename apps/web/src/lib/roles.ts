// Land each staff role on a page it's allowed to use.
export function homeForRole(role: string) {
  if (role === 'KITCHEN_STAFF') return '/admin/kitchen';
  if (role === 'WAITER') return '/admin/orders';
  return '/admin/dashboard';
}

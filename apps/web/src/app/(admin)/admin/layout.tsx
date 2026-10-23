'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  ClipboardList,
  ChefHat,
  UtensilsCrossed,
  FolderTree,
  QrCode,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu as MenuIcon,
  X,
  ExternalLink,
} from 'lucide-react';
import { hasPermission, ROLE_LABELS, type Permission, type UserRole } from '@dineview/shared';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearCredentials } from '@/store/slices/admin-slice';
import { apiSlice } from '@/store/api/api-slice';
import { reauthenticateSocket } from '@/lib/socket-client';
import { useMounted } from '@/hooks/use-mounted';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Toaster } from '@/components/ui/toaster';
import { StaffAlerts } from '@/components/admin/staff-alerts';

const navItems: { href: string; label: string; icon: typeof LayoutDashboard; permission: Permission }[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'analytics:read' },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList, permission: 'order:read' },
  { href: '/admin/kitchen', label: 'Kitchen display', icon: ChefHat, permission: 'order:update_status' },
  { href: '/admin/tables', label: 'Tables & QR', icon: QrCode, permission: 'table:read' },
  { href: '/admin/menu', label: 'Menu', icon: UtensilsCrossed, permission: 'dish:read' },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree, permission: 'category:write' },
  { href: '/admin/staff', label: 'Staff', icon: Users, permission: 'staff:read' },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, permission: 'analytics:read' },
  { href: '/admin/settings', label: 'Settings', icon: Settings, permission: 'restaurant:read' },
];

const DEMO_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO === 'true';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, accessToken } = useAppSelector((s) => s.admin);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isLogin = pathname === '/admin/login';

  // Re-authenticate the shared socket whenever the signed-in user changes
  useEffect(() => {
    if (accessToken) reauthenticateSocket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (mounted && !isLogin && !accessToken) router.replace('/admin/login');
  }, [mounted, isLogin, accessToken, router]);

  useEffect(() => setDrawerOpen(false), [pathname]);

  if (isLogin) return <>{children}</>;

  if (!mounted || !accessToken || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const role = user.role as UserRole;
  const items = navItems.filter((item) => hasPermission(role, item.permission));

  async function logout() {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } });
    } catch {}
    dispatch(clearCredentials());
    dispatch(apiSlice.util.resetApiState());
    router.replace('/admin/login');
  }

  const nav = (
    <nav className="space-y-1 p-3">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
            pathname.startsWith(href) ? 'bg-brand-50 font-medium text-brand-700' : 'text-gray-600 hover:bg-gray-50',
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
      {DEMO_ENABLED && (
        <a
          href="/scan/demo"
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex items-center gap-3 rounded-lg border border-dashed border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <ExternalLink className="h-4 w-4" />
          Open customer view
        </a>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster />
      {user.restaurantId && (
        <StaffAlerts restaurantId={user.restaurantId} receivesTableRequests={hasPermission(role, 'table:read')} />
      )}

      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-1.5 hover:bg-gray-100 lg:hidden" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
              <MenuIcon className="h-5 w-5" />
            </button>
            <Link href="/admin/dashboard" className="text-xl font-bold text-gray-900">
              Dine<span className="text-brand-500">View</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-600 sm:inline">
              {user.firstName} {user.lastName}
            </span>
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700">
              {ROLE_LABELS[role] ?? user.role}
            </span>
            <button onClick={logout} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900" aria-label="Sign out" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <span className="font-bold">Menu</span>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 border-r border-gray-200 bg-white lg:block">
          {nav}
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

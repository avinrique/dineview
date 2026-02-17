'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector } from '@/store';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/orders', label: 'Orders', icon: '📋' },
  { href: '/admin/kitchen', label: 'Kitchen', icon: '👨‍🍳' },
  { href: '/admin/menu', label: 'Menu', icon: '🍽️' },
  { href: '/admin/categories', label: 'Categories', icon: '📁' },
  { href: '/admin/tables', label: 'Tables', icon: '🪑' },
  { href: '/admin/staff', label: 'Staff', icon: '👥' },
  { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAppSelector((s) => s.admin.user);

  // Don't wrap login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">
              Dine<span className="text-brand-500">View</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-gray-600">
                {user.firstName} {user.lastName}
                <span className="ml-2 text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                  {user.role}
                </span>
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-200 min-h-[calc(100vh-3.5rem)] sticky top-14">
          <nav className="p-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === item.href
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { removeNotification, type Notification } from '@/store/slices/ui-slice';
import { cn } from '@/lib/utils';

const styles: Record<Notification['type'], { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: 'border-green-200 text-green-800' },
  error: { icon: AlertCircle, className: 'border-red-200 text-red-800' },
  info: { icon: Info, className: 'border-blue-200 text-blue-800' },
  warning: { icon: AlertTriangle, className: 'border-amber-200 text-amber-800' },
};

function Toast({ notification }: { notification: Notification }) {
  const dispatch = useAppDispatch();
  const { icon: Icon, className } = styles[notification.type];

  useEffect(() => {
    const t = setTimeout(() => dispatch(removeNotification(notification.id)), notification.duration ?? 4000);
    return () => clearTimeout(t);
  }, [dispatch, notification.id, notification.duration]);

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg animate-toast-in',
        className,
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="flex-1 text-sm font-medium text-gray-900">{notification.message}</p>
      <button
        onClick={() => dispatch(removeNotification(notification.id))}
        className="text-gray-400 hover:text-gray-600"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Toaster({ position = 'top' }: { position?: 'top' | 'bottom' }) {
  const notifications = useAppSelector((s) => s.ui.notifications);
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 z-[60] mx-auto flex max-w-md flex-col gap-2 px-4',
        position === 'top' ? 'top-[max(env(safe-area-inset-top),0.75rem)]' : 'bottom-24',
      )}
    >
      {notifications.slice(-3).map((n) => (
        <Toast key={n.id} notification={n} />
      ))}
    </div>
  );
}

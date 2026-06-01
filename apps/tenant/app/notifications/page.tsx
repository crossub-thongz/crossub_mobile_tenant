'use client';

import Link from 'next/link';

import { TenantShell } from '@/components/layout/tenant-shell';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { formatRelative } from '@/lib/utils';

export default function NotificationsPage() {
  const { notifications, markNotificationRead } = useTenantData();

  return (
    <TenantShell title="Notifications">
      <div className="space-y-2">
        {notifications.map((n) => (
          <Link
            key={n.id}
            href={n.href}
            onClick={() => markNotificationRead(n.id)}
            className={`block rounded-xl border p-4 ${!n.read ? 'border-primary/30 bg-card' : 'bg-card/50'}`}
          >
            <p className="font-semibold">{n.title}</p>
            <p className="text-muted-foreground text-sm">{n.body}</p>
            {n.actionRequired && (
              <p className="text-primary mt-1 text-xs">{n.actionRequired}</p>
            )}
            <p className="text-muted-foreground mt-1 text-xs">{formatRelative(n.createdAt)}</p>
          </Link>
        ))}
      </div>
    </TenantShell>
  );
}

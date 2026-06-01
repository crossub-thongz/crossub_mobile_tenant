'use client';

import Link from 'next/link';

import { TenantShell } from '@/components/layout/tenant-shell';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { messageDetail } from '@/constants/routes';
import { formatRelative } from '@/lib/utils';

const TYPE_LABEL: Record<string, string> = {
  general: 'General',
  maintenance: 'Maintenance',
  inspection: 'Inspection',
  rent_review: 'Rent review',
  accounting: 'Accounting',
  vacating: 'Vacating',
};

export default function MessagesPage() {
  const { messages } = useTenantData();

  return (
    <TenantShell title="Communication hub">
      <p className="text-muted-foreground mb-4 text-sm">
        Messages linked to your property, lease, and cases. Distinct from email when integrated.
      </p>
      <div className="space-y-2">
        {messages.map((m) => (
          <Link
            key={m.id}
            href={messageDetail(m.id)}
            className="block rounded-xl border bg-card p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <StatusBadge label={TYPE_LABEL[m.type] ?? m.type} />
              {m.unread > 0 && (
                <span className="bg-destructive rounded-full px-2 py-0.5 text-[10px] text-white">
                  {m.unread}
                </span>
              )}
            </div>
            <p className="mt-2 font-semibold">{m.subject}</p>
            <p className="text-muted-foreground line-clamp-2 text-sm">{m.lastMessage}</p>
            <p className="text-muted-foreground mt-1 text-xs">{formatRelative(m.lastAt)}</p>
          </Link>
        ))}
      </div>
    </TenantShell>
  );
}

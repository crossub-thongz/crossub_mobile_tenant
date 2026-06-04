'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { messageDetail, ROUTES } from '@/constants/routes';
import { MESSAGE_TYPE_LABEL } from '@/lib/tenant-labels';
import { formatRelative } from '@/lib/utils';

export default function MessagesPage() {
  const { messages } = useTenantData();

  return (
    <TenantShell title="Communication hub">
      <p className="text-muted-foreground mb-4 text-sm">
        Messages linked to property, lease, and cases. App and email channels shown where
        integrated.
      </p>
      <Button asChild className="mb-4 w-full" variant="outline">
        <Link href={ROUTES.MESSAGES_NEW}>
          <Plus className="size-4" /> New message to CROSSUB
        </Link>
      </Button>
      <div className="space-y-2">
        {messages.map((m) => (
          <Link
            key={m.id}
            href={messageDetail(m.id)}
            className="block rounded-xl border bg-card p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={MESSAGE_TYPE_LABEL[m.type] ?? m.type} />
              {m.channel && (
                <span className="text-muted-foreground text-[10px] uppercase">
                  {m.channel === 'email' ? 'Email' : 'App'}
                </span>
              )}
              {m.unread > 0 && (
                <span className="bg-destructive rounded-full px-2 py-0.5 text-[10px] text-white">
                  {m.unread}
                </span>
              )}
            </div>
            {m.propertyAddress && (
              <p className="text-muted-foreground mt-1 truncate text-xs">{m.propertyAddress}</p>
            )}
            <p className="mt-2 font-semibold">{m.subject}</p>
            <p className="text-muted-foreground line-clamp-2 text-sm">{m.lastMessage}</p>
            <p className="text-muted-foreground mt-1 text-xs">{formatRelative(m.lastAt)}</p>
          </Link>
        ))}
      </div>
    </TenantShell>
  );
}

'use client';

import Link from 'next/link';

import { TenantShell } from '@/components/layout/tenant-shell';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { formatDateTime } from '@/lib/utils';

const TYPE_LABEL = {
  ingoing: 'Ingoing',
  outgoing: 'Outgoing',
  routine: 'Routine',
} as const;

export default function InspectionsPage() {
  const { inspections } = useTenantData();

  return (
    <TenantShell title="Inspection">
      <p className="text-muted-foreground mb-4 text-sm">
        Ingoing, outgoing, and routine inspections for your tenancy.
      </p>
      <div className="space-y-3">
        {inspections.map((i) => (
          <Link
            key={i.id}
            href={i.href}
            className="block rounded-xl border bg-card p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <StatusBadge label={TYPE_LABEL[i.type]} />
              <span className="text-muted-foreground text-xs">{i.status}</span>
            </div>
            <p className="mt-2 font-medium">{i.propertyAddress}</p>
            {i.scheduledAt && (
              <p className="text-muted-foreground mt-1 text-xs">
                {formatDateTime(i.scheduledAt)}
              </p>
            )}
          </Link>
        ))}
      </div>
    </TenantShell>
  );
}

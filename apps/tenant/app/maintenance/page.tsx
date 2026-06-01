'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { maintenanceDetail, maintenanceNew } from '@/constants/routes';
import { formatRelative } from '@/lib/utils';

export default function MaintenancePage() {
  const { maintenance } = useTenantData();

  return (
    <TenantShell title="Maintenance">
      <Button asChild className="mb-4 w-full">
        <Link href={maintenanceNew()}>
          <Plus className="size-4" /> New repair request
        </Link>
      </Button>
      <div className="space-y-3">
        {maintenance.map((m) => (
          <Link
            key={m.id}
            href={maintenanceDetail(m.id)}
            className="block rounded-xl border bg-card p-4"
          >
            <p className="text-muted-foreground text-xs">{m.trackingNumber}</p>
            <p className="font-semibold">{m.category}</p>
            <p className="text-muted-foreground line-clamp-2 text-sm">{m.description}</p>
            <p className="text-primary mt-2 text-xs font-medium">{m.statusLabel}</p>
            <p className="text-muted-foreground text-xs">{formatRelative(m.createdAt)}</p>
          </Link>
        ))}
      </div>
    </TenantShell>
  );
}

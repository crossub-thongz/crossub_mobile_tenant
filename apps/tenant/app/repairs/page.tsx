'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { repairDetail, repairNew } from '@/constants/routes';
import { formatRelative } from '@/lib/utils';

export default function RepairsPage() {
  const { maintenance } = useTenantData();
  const [tab, setTab] = useState<'active' | 'history'>('active');

  const active = useMemo(
    () =>
      maintenance.filter(
        (m) => m.status !== 'closed' && !m.tenantCompletionApproved,
      ),
    [maintenance],
  );
  const history = useMemo(
    () =>
      maintenance.filter(
        (m) => m.status === 'closed' || m.tenantCompletionApproved,
      ),
    [maintenance],
  );
  const list = tab === 'active' ? active : history;

  return (
    <TenantShell title="Repair">
      <Button asChild className="mb-4 w-full">
        <Link href={repairNew()}>
          <Plus className="size-4" /> Report a repair
        </Link>
      </Button>

      <div className="mb-4 flex gap-1 rounded-lg bg-secondary p-1">
        <button
          type="button"
          onClick={() => setTab('active')}
          className={`flex-1 rounded-md py-2 text-sm font-medium ${
            tab === 'active' ? 'bg-background' : 'text-muted-foreground'
          }`}
        >
          Active ({active.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('history')}
          className={`flex-1 rounded-md py-2 text-sm font-medium ${
            tab === 'history' ? 'bg-background' : 'text-muted-foreground'
          }`}
        >
          History ({history.length})
        </button>
      </div>

      {tab === 'history' && (
        <div className="text-muted-foreground mb-4 rounded-xl border border-dashed p-3 text-xs">
          <p className="font-medium text-foreground">Summary</p>
          <p className="mt-1">
            {history.length} completed repair(s) since your tenancy started at this
            property.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {list.length === 0 ? (
          <p className="text-muted-foreground text-center text-sm py-8">
            No {tab} repairs.
          </p>
        ) : (
          list.map((m) => (
            <Link
              key={m.id}
              href={repairDetail(m.id)}
              className="block rounded-xl border bg-card p-4"
            >
              <p className="text-muted-foreground text-xs">{m.trackingNumber}</p>
              <p className="font-semibold">{m.category}</p>
              <p className="text-primary text-xs font-medium">{m.statusLabel}</p>
              <p className="text-muted-foreground text-xs">{formatRelative(m.createdAt)}</p>
            </Link>
          ))
        )}
      </div>
    </TenantShell>
  );
}

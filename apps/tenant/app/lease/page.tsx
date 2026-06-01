'use client';

import { TenantShell } from '@/components/layout/tenant-shell';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function LeasePage() {
  const { lease } = useTenantData();

  if (!lease) {
    return (
      <TenantShell title="My lease">
        <p className="text-muted-foreground text-sm">No active lease linked to your account.</p>
      </TenantShell>
    );
  }

  return (
    <TenantShell title="My lease">
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="font-semibold">{lease.propertyAddress}</p>
          <p className="text-primary mt-2 text-lg font-semibold">
            {formatCurrency(lease.rentWeekly)}/week
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            {formatDate(lease.leaseStart)} – {formatDate(lease.leaseEnd)}
            {lease.periodic && ' · Periodic tenancy'}
          </p>
          <StatusBadge label={lease.status} variant="success" className="mt-3" />
          {lease.renewalDueInDays != null && lease.renewalDueInDays <= 90 && (
            <p className="text-amber-400 mt-3 text-xs">
              Renewal decision due in {lease.renewalDueInDays} days
            </p>
          )}
        </div>
        <section>
          <h2 className="text-sm font-semibold">Documents</h2>
          <ul className="mt-2 space-y-2">
            {lease.documents.map((d) => (
              <li key={d.id} className="rounded-lg border bg-card px-3 py-2 text-sm">
                {d.name}
                <span className="text-muted-foreground block text-xs">
                  {formatDate(d.uploadedAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </TenantShell>
  );
}

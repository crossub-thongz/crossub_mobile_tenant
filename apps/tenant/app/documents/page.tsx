'use client';

import { TenantShell } from '@/components/layout/tenant-shell';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { formatDate } from '@/lib/utils';

export default function DocumentsPage() {
  const { storedDocuments } = useTenantData();

  return (
    <TenantShell title="My documents">
      <p className="text-muted-foreground mb-4 text-sm">
        Single source of truth — lease, receipts, and uploaded proofs stored in the app (not
        scattered across email).
      </p>
      <div className="space-y-2">
        {storedDocuments.map((d) => (
          <div key={d.id} className="rounded-xl border bg-card p-4 text-sm">
            <p className="text-muted-foreground text-xs">{d.category}</p>
            <p className="font-medium">{d.name}</p>
            <p className="text-muted-foreground text-xs">{formatDate(d.uploadedAt)}</p>
          </div>
        ))}
      </div>
    </TenantShell>
  );
}

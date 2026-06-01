'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { formatDate } from '@/lib/utils';

export default function RenewalPage() {
  const { renewal } = useTenantData();
  const [moveOut, setMoveOut] = useState('');

  if (!renewal) {
    return (
      <TenantShell title="Lease renewal">
        <p className="text-muted-foreground text-sm">No renewal decision pending.</p>
      </TenantShell>
    );
  }

  return (
    <TenantShell title="Lease renewal">
      <p className="text-muted-foreground mb-4 text-sm">
        90 days before lease expiry, indicate whether you intend to renew. Renew may connect to rent
        review. Confirm periodic period wording with Qiaolin/Fay.
      </p>
      <div className="rounded-xl border bg-card p-4 text-sm">
        <p>Lease ends {formatDate(renewal.leaseEnd)}</p>
        <p className="text-muted-foreground mt-1">Response due by {formatDate(renewal.dueBy)}</p>
        <p className="mt-2 capitalize">Status: {renewal.status.replace(/_/g, ' ')}</p>
      </div>
      <div className="mt-6 space-y-3">
        <Button
          className="w-full"
          onClick={() => toast.success('Renewal intent recorded — rent review workflow')}
        >
          Renew / continue tenancy
        </Button>
        <div className="space-y-2 rounded-xl border p-4">
          <p className="text-sm font-medium">Not renewing</p>
          <Input type="date" value={moveOut} onChange={(e) => setMoveOut(e.target.value)} />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              if (!moveOut) return toast.error('Select vacating date');
              toast.success('Vacating date recorded — outgoing workflow triggered');
            }}
          >
            Select move-out date
          </Button>
        </div>
      </div>
    </TenantShell>
  );
}

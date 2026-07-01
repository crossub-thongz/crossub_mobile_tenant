'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/utils';

export default function RenewalPage() {
  const router = useRouter();
  const { renewal, startVacating } = useTenantData();
  const [moveOut, setMoveOut] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
        Indicate whether you intend to renew. If not renewing, your vacate date opens the same
        End Leasing workflow your agent uses.
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
            disabled={submitting}
            onClick={() => {
              if (!moveOut) {
                toast.error('Select vacating date');
                return;
              }
              setSubmitting(true);
              void startVacating(moveOut, 'Not renewing — tenant selected move-out date')
                .then(() => {
                  toast.success('Vacating case started');
                  router.push(ROUTES.VACATING);
                })
                .catch(() => toast.error('Could not start vacating case'))
                .finally(() => setSubmitting(false));
            }}
          >
            {submitting ? 'Starting…' : 'Start vacating on this date'}
          </Button>
        </div>
      </div>
    </TenantShell>
  );
}

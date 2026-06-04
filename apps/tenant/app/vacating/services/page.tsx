'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export default function MoveOutServicesPage() {
  const [moving, setMoving] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  return (
    <TenantShell title="Move-out services" backHref={ROUTES.VACATING}>
      <p className="text-muted-foreground mb-4 text-sm">
        After you confirm a move-out date, CROSSUB can help arrange optional services.
      </p>
      <div className="space-y-3">
        <label className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <input
            type="checkbox"
            checked={moving}
            onChange={(e) => setMoving(e.target.checked)}
            className="accent-primary size-4"
          />
          <div>
            <p className="font-medium">Moving service</p>
            <p className="text-muted-foreground text-xs">Partner referral — quote on request</p>
          </div>
        </label>
        <label className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <input
            type="checkbox"
            checked={cleaning}
            onChange={(e) => setCleaning(e.target.checked)}
            className="accent-primary size-4"
          />
          <div>
            <p className="font-medium">End-of-lease cleaning</p>
            <p className="text-muted-foreground text-xs">Recommended before outgoing inspection</p>
          </div>
        </label>
      </div>
      <Button
        className="mt-6 w-full"
        onClick={() => {
          if (!moving && !cleaning) return toast.error('Select at least one service or skip');
          toast.success('Request sent — CROSSUB will contact you');
        }}
      >
        Request services
      </Button>
      <Button variant="ghost" className="mt-2 w-full" onClick={() => toast.info('Skipped')}>
        No thanks
      </Button>
    </TenantShell>
  );
}

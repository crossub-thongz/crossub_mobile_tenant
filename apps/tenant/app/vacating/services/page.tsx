'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { VacatingCleaningChoice } from '@/components/tenant/vacating-cleaning-choice';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export default function MoveOutServicesPage() {
  const { vacatingCase } = useTenantData();
  const [moving, setMoving] = useState(false);

  return (
    <TenantShell title="Move-out services" backHref={ROUTES.VACATING}>
      <p className="text-muted-foreground mb-4 text-sm">
        After you confirm a move-out date, CROSSUB can help arrange optional services.
      </p>
      <div className="space-y-3">
        {/* End-of-lease cleaning is a real choice saved to your vacating case (27 Sep 2026). */}
        {vacatingCase ? (
          <VacatingCleaningChoice vacating={vacatingCase} />
        ) : (
          <p className="text-muted-foreground rounded-xl border bg-card p-4 text-xs">
            End-of-lease cleaning can be arranged once your property manager opens your end-of-lease
            case.
          </p>
        )}
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
      </div>
      <Button
        className="mt-6 w-full"
        disabled={!moving}
        onClick={() => toast.success('Request sent — CROSSUB will contact you')}
      >
        Request moving service
      </Button>
    </TenantShell>
  );
}

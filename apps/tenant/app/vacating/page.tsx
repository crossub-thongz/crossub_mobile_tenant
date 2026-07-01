'use client';

import Link from 'next/link';
import { useState } from 'react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { VacatingCaseView, VacatingStartForm } from '@/components/tenant/vacating-case-view';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';

export default function VacatingPage() {
  const { vacating, startVacating, cancelVacatingCase, updateVacateDate, showPhase3Demo } =
    useTenantData();
  const [starting, setStarting] = useState(false);

  if (!vacating) {
    return (
      <TenantShell title="Vacating">
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            End your lease with the same workflow your agent uses in End Leasing — key return,
            outgoing inspection, make-good, and bond settlement.
          </p>
          <VacatingStartForm
            loading={starting}
            onStart={async (date) => {
              setStarting(true);
              try {
                await startVacating(date);
              } finally {
                setStarting(false);
              }
            }}
          />
          <p className="text-muted-foreground text-xs">
            You can also set a move-out date from{' '}
            <Link href={ROUTES.RENEWAL} className="text-primary font-medium">
              Lease renewal
            </Link>{' '}
            if your lease is ending soon.
          </p>
          {showPhase3Demo && (
            <p className="text-muted-foreground text-xs">
              Demo mode: enable SHOW_PHASE3_DEMO in mock-data for a sample vacating case.
            </p>
          )}
        </div>
      </TenantShell>
    );
  }

  return (
    <TenantShell title="Vacating">
      <VacatingCaseView
        vacating={vacating}
        cancelVacatingCase={cancelVacatingCase}
        updateVacateDate={updateVacateDate}
      />
    </TenantShell>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { VacatingCaseView, VacatingStartForm } from '@/components/tenant/vacating-case-view';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';

export default function VacatingPage() {
  const {
    vacatingCase,
    apiConnected,
    startVacating,
    cancelVacatingCase,
    updateVacateDate,
    acceptVacatingSettlement,
    declineVacatingSettlement,
    acceptVacatingRepairQuote,
    declineVacatingRepairQuote,
    setVacatingOutgoingAttendance,
  } = useTenantData();
  const [starting, setStarting] = useState(false);

  if (!vacatingCase) {
    return (
      <TenantShell title="End of lease">
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {apiConnected
              ? 'Your property manager will open an end-leasing case here when your lease is ending. You will receive a notification when action is required.'
              : 'End your lease with the same workflow your agent uses in End Leasing — key return, outgoing inspection, make-good, and bond settlement.'}
          </p>
          {!apiConnected && (
            <>
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
            </>
          )}
        </div>
      </TenantShell>
    );
  }

  return (
    <TenantShell title="End of lease">
      <div className="space-y-6">
        <VacatingCaseView
          vacating={vacatingCase}
          cancelVacatingCase={cancelVacatingCase}
          updateVacateDate={updateVacateDate}
          acceptVacatingSettlement={acceptVacatingSettlement}
          declineVacatingSettlement={declineVacatingSettlement}
          acceptVacatingRepairQuote={acceptVacatingRepairQuote}
          declineVacatingRepairQuote={declineVacatingRepairQuote}
          setVacatingOutgoingAttendance={setVacatingOutgoingAttendance}
        />
        {vacatingCase.status === 'cancelled' && !apiConnected && (
          <div className="space-y-3 border-t pt-6">
            <p className="text-muted-foreground text-sm">
              Start a new vacating case if your plans change.
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
          </div>
        )}
      </div>
    </TenantShell>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';

import { TenantShell } from '@/components/layout/tenant-shell';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { outgoingReport, ROUTES, statementDetail } from '@/constants/routes';
import { hrefWithFrom } from '@/lib/back-navigation';
import { OUTGOING_STATUS_LABEL } from '@/lib/tenant-labels';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function VacatingPage() {
  const {
    vacating,
    finalStatement,
    showPhase3Demo,
    outgoingReport: outgoing,
    cancelVacatingCase,
  } = useTenantData();
  const [withdrawing, setWithdrawing] = useState(false);

  if (!vacating) {
    return (
      <TenantShell title="Vacating">
        <p className="text-muted-foreground text-sm">
          No active vacating process. If you choose not to renew or rent review is not agreed,
          select your move-out date from{' '}
          <Link href={ROUTES.RENEWAL} className="text-primary font-medium">
            Lease renewal
          </Link>
          .
        </p>
        {showPhase3Demo && (
          <p className="text-muted-foreground mt-4 text-xs">
            Set SHOW_PHASE3_DEMO in mock-data to preview vacating + final statement flows.
          </p>
        )}
        <Link
          href={hrefWithFrom(outgoingReport(outgoing.id), 'vacating')}
          className="text-primary mt-6 block text-sm font-medium"
        >
          Preview outgoing report flow (demo) →
        </Link>
      </TenantShell>
    );
  }

  const isDeleted = vacating.status === 'cancelled';

  const handleWithdraw = async () => {
    if (
      !window.confirm(
        'Withdraw your vacating request? Staff will see this case marked as deleted.',
      )
    ) {
      return;
    }
    setWithdrawing(true);
    try {
      await cancelVacatingCase('Tenant no longer vacating');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <TenantShell title="Vacating">
      <div className="space-y-5">
        <div className="rounded-xl border bg-card p-4 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{vacating.propertyAddress}</p>
              <p className="text-muted-foreground mt-1">
                Vacating {formatDate(vacating.vacatingDate)}
              </p>
            </div>
            {isDeleted && (
              <span className="rounded-full border border-rose-500/35 bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-800 dark:text-rose-200">
                Deleted
              </span>
            )}
          </div>
          {isDeleted ? (
            <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
              This vacating case was withdrawn
              {vacating.cancellationReason ? ` — ${vacating.cancellationReason}` : '.'}
            </p>
          ) : (
            <>
              <p className="mt-2 text-xs">
                {OUTGOING_STATUS_LABEL[vacating.outgoingStatus]}
              </p>
              {vacating.outgoingReportId && (
                <Link
                  href={hrefWithFrom(outgoingReport(vacating.outgoingReportId), 'vacating')}
                  className="text-primary mt-3 inline-block text-xs font-medium"
                >
                  Review outgoing report →
                </Link>
              )}
              <button
                type="button"
                disabled={withdrawing}
                onClick={() => void handleWithdraw()}
                className="text-destructive mt-4 block text-xs font-medium disabled:opacity-50"
              >
                {withdrawing ? 'Withdrawing…' : 'Delete vacating case'}
              </button>
            </>
          )}
        </div>
        {finalStatement && !isDeleted && (
          <section className="rounded-xl border bg-card p-4">
            <h2 className="text-sm font-semibold">Final statement</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Bond position after reconciliation — confirm with Accounting.
            </p>
            <p className="mt-2 text-lg font-semibold text-primary">
              {finalStatement.finalRefund >= 0 ? 'Refund' : 'Owing'}:{' '}
              {formatCurrency(Math.abs(finalStatement.finalRefund))}
            </p>
            <Link
              href={statementDetail()}
              className="text-primary mt-2 inline-block text-xs font-medium"
            >
              Full breakdown →
            </Link>
          </section>
        )}
      </div>
    </TenantShell>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';

import { TenantShell } from '@/components/layout/tenant-shell';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { outgoingReport, ROUTES, statementDetail } from '@/constants/routes';
import { hrefWithFrom } from '@/lib/back-navigation';
import { OUTGOING_STATUS_LABEL } from '@/lib/tenant-labels';
import { formatCurrency, formatDate } from '@/lib/utils';

function vacateDateLabel(date: string, changed?: boolean): string {
  const base = formatDate(date);
  return changed ? `${base} (changed)` : base;
}

export default function VacatingPage() {
  const {
    vacating,
    finalStatement,
    showPhase3Demo,
    outgoingReport: outgoing,
    cancelVacatingCase,
    updateVacateDate,
  } = useTenantData();
  const [withdrawing, setWithdrawing] = useState(false);
  const [draftDate, setDraftDate] = useState('');
  const [savingDate, setSavingDate] = useState(false);

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
  const dateValue = draftDate || vacating.vacatingDate.slice(0, 10);

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

  const handleDateSave = async () => {
    if (!dateValue) return;
    setSavingDate(true);
    try {
      await updateVacateDate(dateValue);
      setDraftDate('');
    } finally {
      setSavingDate(false);
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
                Vacating {vacateDateLabel(vacating.vacatingDate, vacating.vacateDateChanged)}
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
              <div className="mt-4 space-y-2 border-t border-border/60 pt-3">
                <p className="text-xs font-medium">Change vacate date</p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={dateValue}
                    onChange={(e) => setDraftDate(e.target.value)}
                    className="border-input bg-background rounded-md border px-2 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    disabled={savingDate || !dateValue}
                    onClick={() => void handleDateSave()}
                    className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                  >
                    {savingDate ? 'Saving…' : 'Save date'}
                  </button>
                </div>
              </div>
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

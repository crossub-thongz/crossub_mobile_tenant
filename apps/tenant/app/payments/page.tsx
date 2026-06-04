'use client';

import Link from 'next/link';

import { ArrearsBanner } from '@/components/tenant/arrears-banner';
import { TenantShell } from '@/components/layout/tenant-shell';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES, statementDetail } from '@/constants/routes';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PaymentsPage() {
  const {
    rentReceipts,
    lease,
    paymentProofs,
    outstandingBalance,
    finalStatement,
    showPhase3Demo,
  } = useTenantData();

  return (
    <TenantShell title="Payments & receipts">
      <div className="space-y-5">
        <ArrearsBanner />

        {lease && (
          <div className="rounded-xl border bg-card p-4 text-sm">
            <p className="text-muted-foreground text-xs uppercase">Current rent</p>
            <p className="text-primary text-lg font-semibold">
              {formatCurrency(lease.rentWeekly)}/week
            </p>
          </div>
        )}

        {outstandingBalance && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
            <p className="font-semibold">Outstanding balance</p>
            <p className="text-lg font-semibold">{formatCurrency(outstandingBalance.amount)}</p>
            <p className="text-muted-foreground mt-1">{outstandingBalance.reason}</p>
            <p className="text-muted-foreground text-xs">Due {formatDate(outstandingBalance.dueDate)}</p>
          </div>
        )}

        <section>
          <h2 className="mb-2 text-sm font-semibold">Rent receipts</h2>
          <div className="space-y-3">
            {rentReceipts.map((r) => (
              <div key={r.id} className="rounded-xl border bg-card p-4">
                <p className="text-muted-foreground text-xs">{r.receiptNumber}</p>
                <p className="font-semibold">{formatCurrency(r.amount)}</p>
                <p className="text-muted-foreground text-sm">
                  Period {formatDate(r.periodStart)} – {formatDate(r.periodEnd)}
                </p>
                <p className="text-muted-foreground text-xs">
                  Received {formatDate(r.receivedAt)} · Issued {formatDate(r.issuedAt)}
                </p>
                {r.pdfAvailable && (
                  <button
                    type="button"
                    className="text-primary mt-2 text-xs font-medium"
                    onClick={() => alert('PDF download — accounting API integration')}
                  >
                    Download receipt PDF
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold">Deposit / bond proof</h2>
          <div className="space-y-2">
            {paymentProofs.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border bg-card p-3 text-sm">
                <div>
                  <p className="font-medium capitalize">{p.type} proof</p>
                  <p className="text-muted-foreground text-xs">
                    {formatCurrency(p.amount)}
                    {p.fileName && ` · ${p.fileName}`}
                  </p>
                </div>
                <StatusBadge
                  label={p.status}
                  variant={p.status === 'approved' ? 'success' : 'action'}
                />
              </div>
            ))}
          </div>
        </section>

        {(finalStatement || showPhase3Demo) && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">Final statement</h2>
            {finalStatement ? (
              <Link
                href={statementDetail()}
                className="block rounded-xl border bg-card p-4 text-sm hover:bg-secondary/30"
              >
                <p className="font-medium">{finalStatement.propertyAddress}</p>
                <p className="text-primary mt-1">
                  {finalStatement.finalRefund >= 0 ? 'Refund' : 'Owing'}:{' '}
                  {formatCurrency(Math.abs(finalStatement.finalRefund))}
                </p>
                <span className="text-primary mt-2 inline-block text-xs font-medium">
                  View breakdown →
                </span>
              </Link>
            ) : (
              <p className="text-muted-foreground text-sm">
                Available after vacating and outgoing reconciliation.
              </p>
            )}
          </section>
        )}

        <section className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Direct debit (Phase 4)</p>
          <p className="mt-1">
            Online payment and direct debit setup deferred until bank/provider confirmation. MVP:
            payment instructions, proof upload, and receipt history.
          </p>
          <Link href={ROUTES.ONBOARDING} className="text-primary mt-2 inline-block text-xs font-medium">
            Onboarding payment steps →
          </Link>
        </section>
      </div>
    </TenantShell>
  );
}

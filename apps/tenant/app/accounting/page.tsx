'use client';

import Link from 'next/link';

import { ArrearsBanner } from '@/components/tenant/arrears-banner';
import { PayRentCard } from '@/components/tenant/pay-rent-card';
import { DocumentActions } from '@/components/tenant/document-actions';
import { TenantShell } from '@/components/layout/tenant-shell';
import { StatusBadge } from '@/components/tenant/status-badge';
import { getTenantDocument } from '@/lib/tenant-documents';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES, statementDetail } from '@/constants/routes';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function AccountingPage() {
  const {
    rentReceipts,
    lease,
    paymentProofs,
    outstandingBalance,
    finalStatement,
    showPhase3Demo,
  } = useTenantData();

  return (
    <TenantShell title="Accounting">
      <p className="text-muted-foreground mb-4 text-sm">
        Rent payment history and downloadable rent receipts for each period.
      </p>
      <div className="space-y-5">
        <ArrearsBanner />
        <PayRentCard />
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
                  {formatDate(r.periodStart)} – {formatDate(r.periodEnd)}
                </p>
                {r.pdfAvailable && getTenantDocument(r.id) && (
                  <DocumentActions
                    documentId={r.id}
                    fileName={`Rent receipt — ${r.periodStart.slice(0, 7)}.pdf`}
                    className="mt-3"
                    compact
                  />
                )}
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-2 text-sm font-semibold">Deposit / bond proof</h2>
          <div className="space-y-2">
            {paymentProofs.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border bg-card p-3 text-sm"
              >
                <div>
                  <p className="font-medium capitalize">{p.type} proof</p>
                  <p className="text-muted-foreground text-xs">{formatCurrency(p.amount)}</p>
                </div>
                <StatusBadge
                  label={p.status}
                  variant={p.status === 'approved' ? 'success' : 'action'}
                />
              </div>
            ))}
          </div>
        </section>
        {(finalStatement || showPhase3Demo) && finalStatement && (
          <Link
            href={statementDetail()}
            className="text-primary block text-center text-sm font-medium"
          >
            View final statement →
          </Link>
        )}
      </div>
    </TenantShell>
  );
}

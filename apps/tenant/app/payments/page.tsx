'use client';

import { TenantShell } from '@/components/layout/tenant-shell';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PaymentsPage() {
  const { rentReceipts, lease } = useTenantData();

  return (
    <TenantShell title="Payments & receipts">
      <p className="text-muted-foreground mb-4 text-sm">
        Rent receipts from accounting integration. MVP includes history and PDF download when
        available. Direct debit setup — Phase 4.
      </p>
      {lease && (
        <p className="mb-4 rounded-lg border bg-card p-3 text-sm">
          Current rent: <strong>{formatCurrency(lease.rentWeekly)}/week</strong>
        </p>
      )}
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
                onClick={() => alert('PDF download — wire to accounting API')}
              >
                Download receipt PDF
              </button>
            )}
          </div>
        ))}
      </div>
      <section className="mt-6 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Payment instructions</p>
        <p className="mt-1">
          Bank transfer details and proof upload for deposit/bond are in Onboarding. Outstanding
          balance and final statement appear after vacating reconciliation.
        </p>
      </section>
    </TenantShell>
  );
}

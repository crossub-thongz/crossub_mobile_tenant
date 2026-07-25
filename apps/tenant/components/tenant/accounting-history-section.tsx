'use client';

import Link from 'next/link';
import { Receipt } from 'lucide-react';

import { DocumentActions } from '@/components/tenant/document-actions';
import { SectionTitle } from '@/components/tenant/page-intro';
import { StatusBadge } from '@/components/tenant/status-badge';
import { statementDetail } from '@/constants/routes';
import type { TenantDocumentView } from '@/lib/crossub-api/tenant-mappers';
import type {
  FinalStatement,
  PaymentProofRecord,
  RentReceipt,
} from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export function AccountingHistorySection({
  rentReceipts,
  paymentProofs,
  finalStatement,
  storedDocuments,
}: {
  rentReceipts: RentReceipt[];
  paymentProofs: PaymentProofRecord[];
  finalStatement: FinalStatement | null;
  storedDocuments: TenantDocumentView[];
}) {
  return (
    <div className="space-y-6">
      <section>
        <SectionTitle>Rent payments</SectionTitle>
        {rentReceipts.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No rent receipts yet. After you pay and your agency records the transfer, receipts
            will appear here.
          </p>
        ) : (
          <div className="space-y-3">
            {rentReceipts.map((r) => {
              const doc = storedDocuments.find((d) => d.id === r.id);
              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                      <Receipt className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-muted-foreground text-xs font-medium">
                        {r.receiptNumber}
                      </p>
                      <p className="text-lg font-bold">{formatCurrency(r.amount)}</p>
                      <p className="text-muted-foreground text-sm">
                        {formatDate(r.periodStart)} – {formatDate(r.periodEnd)}
                      </p>
                      {r.pdfAvailable && doc?.url && (
                        <DocumentActions
                          documentId={r.id}
                          fileName={`Rent receipt — ${r.periodStart.slice(0, 7)}.pdf`}
                          documentUrl={doc.url}
                          className="mt-3"
                          compact
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {paymentProofs.length > 0 && (
        <section>
          <SectionTitle>Deposit & bond proof</SectionTitle>
          <div className="space-y-2">
            {paymentProofs.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-2xl border bg-card p-4"
              >
                <div>
                  <p className="font-medium capitalize">{p.type} proof</p>
                  <p className="text-muted-foreground text-sm">{formatCurrency(p.amount)}</p>
                </div>
                <StatusBadge
                  label={p.status}
                  variant={p.status === 'approved' ? 'success' : 'action'}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {finalStatement && (
        <Link
          href={statementDetail()}
          className="text-primary block rounded-2xl border border-dashed border-primary/30 bg-primary/5 py-4 text-center text-sm font-medium"
        >
          View final statement →
        </Link>
      )}
    </div>
  );
}

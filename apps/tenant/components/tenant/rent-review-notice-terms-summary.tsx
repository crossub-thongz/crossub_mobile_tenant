'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { RentReviewNoticePdfDialog } from '@/components/tenant/rent-review-notice-pdf-dialog';
import type { RentReviewCase } from '@/lib/types';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

function Term({
  label,
  value,
  tabular = false,
}: {
  label: string;
  value: string;
  tabular?: boolean;
}) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className={tabular ? 'mt-0.5 font-medium tabular-nums' : 'mt-0.5 font-medium'}>
        {value}
      </dd>
    </div>
  );
}

function formatLeaseType(value: 'fixed' | 'periodic' | null): string {
  if (!value) return '—';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function RentReviewNoticeTermsSummary({ review }: { review: RentReviewCase }) {
  const [pdfOpen, setPdfOpen] = useState(false);
  const terms = review.noticeTerms;

  if (!terms) return null;

  return (
    <>
      <section className="rounded-2xl border bg-card p-4">
        <p className="mb-4 text-sm font-semibold">Confirmed notice terms</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <dl className="space-y-3 text-sm">
            <Term
              label="New rent value"
              value={`${formatCurrency(terms.newRentWeekly)}/wk`}
              tabular
            />
            <Term label="Lease term" value={terms.leaseTerm || '—'} />
            <Term
              label="Rent increase on"
              value={terms.rentIncreaseOn ? formatDate(terms.rentIncreaseOn) : '—'}
              tabular
            />
            <div>
              <dt className="text-muted-foreground text-xs">Notice of rent increase</dt>
              <dd className="mt-0.5">
                {terms.noticePdfAvailable ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-2.5 text-xs"
                    onClick={() => setPdfOpen(true)}
                  >
                    <FileText className="size-3.5" />
                    PDF
                  </Button>
                ) : (
                  <span className="font-medium">—</span>
                )}
              </dd>
            </div>
            <Term
              label="Notice sent on"
              value={
                review.noticeDispatchedAt ? formatDateTime(review.noticeDispatchedAt) : '—'
              }
              tabular
            />
          </dl>
          <dl className="space-y-3 text-sm">
            <Term label="Lease type" value={formatLeaseType(terms.leaseType)} />
            <Term
              label="New lease start on"
              value={terms.newLeaseStart ? formatDate(terms.newLeaseStart) : '—'}
              tabular
            />
          </dl>
        </div>
      </section>

      <RentReviewNoticePdfDialog
        reviewId={review.id}
        open={pdfOpen}
        onOpenChange={setPdfOpen}
      />
    </>
  );
}

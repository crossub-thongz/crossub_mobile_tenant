'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { RentReviewCase } from '@/lib/types';

import { RentReviewLeaseAgreementPdfDialog } from './rent-review-lease-agreement-pdf-dialog';

function isFixedTermLeaseReview(review: RentReviewCase): boolean {
  const terms = review.noticeTerms;
  return (
    terms?.leaseAgreementPdfAvailable === true ||
    terms?.requiresLeaseAgreementSign === true ||
    terms?.leaseType === 'fixed'
  );
}

export function RentReviewLeaseAgreementSection({
  review,
  busy = false,
  onSignLeaseAgreement,
}: {
  review: RentReviewCase;
  busy?: boolean;
  onSignLeaseAgreement?: () => Promise<void>;
}) {
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [signing, setSigning] = useState(false);

  if (!isFixedTermLeaseReview(review)) return null;

  const terms = review.noticeTerms;
  const leaseSigned = terms?.leaseAgreementSigned === true;
  const canSign = review.status === 'pending' && !leaseSigned && Boolean(onSignLeaseAgreement);
  const accepted =
    review.status === 'accepted' ||
    (review.status === 'pending' && leaseSigned);

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Lease extension agreement</p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {canSign
              ? 'Review the agreement, sign your name, then accept the rent increase.'
              : leaseSigned || accepted
                ? 'Your signed lease extension agreement is available to preview and download.'
                : 'Preview the residential tenancy agreement for this fixed-term renewal.'}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 sm:w-auto"
          disabled={busy}
          onClick={() => setAgreementOpen(true)}
        >
          <FileText className="size-4" />
          {leaseSigned ? 'View signed agreement' : 'Preview agreement'}
        </Button>
      </div>
      {canSign ? (
        <p className="text-muted-foreground mt-3 text-xs">
          Open the agreement preview and use <span className="font-medium">Sign agreement</span>{' '}
          to unlock accept.
        </p>
      ) : null}
      <RentReviewLeaseAgreementPdfDialog
        reviewId={review.id}
        open={agreementOpen}
        onOpenChange={setAgreementOpen}
        showSignButton={canSign}
        signing={signing}
        onSign={
          canSign && onSignLeaseAgreement
            ? async () => {
                setSigning(true);
                try {
                  await onSignLeaseAgreement();
                  setAgreementOpen(false);
                } finally {
                  setSigning(false);
                }
              }
            : undefined
        }
      />
    </section>
  );
}

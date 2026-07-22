'use client';

import { useState } from 'react';
import { FileText, PenLine } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RentReviewCase } from '@/lib/types';

import { RentReviewLeaseAgreementPdfDialog } from './rent-review-lease-agreement-pdf-dialog';

export function RentReviewResponsePanel({
  review,
  busy,
  onAccept,
  onReject,
  onCounter,
  onSignLeaseAgreement,
}: {
  review: RentReviewCase;
  busy: boolean;
  onAccept: () => Promise<void>;
  onReject: (moveOutDate: string) => Promise<void>;
  onCounter: (amount: number) => Promise<void>;
  onSignLeaseAgreement?: () => Promise<void>;
}) {
  const [moveOutDate, setMoveOutDate] = useState(review.moveOutDate ?? '');
  const [counterWeekly, setCounterWeekly] = useState('');
  const [agreementOpen, setAgreementOpen] = useState(false);
  const canCounter = review.rentNegotiable === true;

  const leaseTerms = review.noticeTerms;
  const showLeaseAgreement =
    leaseTerms?.leaseAgreementPdfAvailable === true ||
    leaseTerms?.requiresLeaseAgreementSign === true;
  const leaseSigned = leaseTerms?.leaseAgreementSigned === true;
  const mustSignBeforeAccept = leaseTerms?.requiresLeaseAgreementSign === true;
  const canAccept = !mustSignBeforeAccept || leaseSigned;

  return (
    <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div>
        <p className="text-primary text-xs font-semibold uppercase">Your response</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Submit your response to the proposed rent increase. Your property manager will be notified
          immediately.
        </p>
      </div>

      {showLeaseAgreement ? (
        <div className="space-y-3 rounded-xl border border-dashed border-primary/40 bg-background/80 p-3">
          <div>
            <p className="text-sm font-semibold">Lease extension agreement</p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Review the residential tenancy agreement below. The landlord and managing agent have
              already signed. You must sign before accepting the rent increase.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 sm:flex-1"
              disabled={busy}
              onClick={() => setAgreementOpen(true)}
            >
              <FileText className="size-4" />
              View agreement
            </Button>
            {!leaseSigned && onSignLeaseAgreement ? (
              <Button
                type="button"
                className="w-full gap-2 sm:flex-1"
                disabled={busy}
                onClick={() => {
                  void (async () => {
                    try {
                      await onSignLeaseAgreement();
                      toast.success('Agreement signed — you can now accept the increase');
                    } catch {
                      toast.error('Could not sign the agreement');
                    }
                  })();
                }}
              >
                <PenLine className="size-4" />
                Sign agreement
              </Button>
            ) : null}
          </div>
          {leaseSigned ? (
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              You have signed the lease extension agreement.
            </p>
          ) : (
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Sign the agreement to unlock the accept button.
            </p>
          )}
          <RentReviewLeaseAgreementPdfDialog
            reviewId={review.id}
            open={agreementOpen}
            onOpenChange={setAgreementOpen}
          />
        </div>
      ) : null}

      {canAccept ? (
        <Button className="w-full" disabled={busy} onClick={() => void onAccept()}>
          Tenant accepts increase
        </Button>
      ) : (
        <Button className="w-full" disabled>
          Tenant accepts increase
        </Button>
      )}

      <div className="space-y-2">
        <Label htmlFor={`move-out-${review.id}`}>Move-out date (reject path)</Label>
        <Input
          id={`move-out-${review.id}`}
          type="date"
          value={moveOutDate}
          onChange={(e) => setMoveOutDate(e.target.value)}
        />
        <Button
          variant="outline"
          className="w-full"
          disabled={busy || !moveOutDate}
          onClick={() => {
            if (!moveOutDate) {
              toast.error('Select a move-out date');
              return;
            }
            void onReject(moveOutDate);
          }}
        >
          Tenant rejects (vacating)
        </Button>
      </div>

      {canCounter ? (
        <div className="space-y-2 border-t border-dashed pt-3">
          <Label htmlFor={`counter-${review.id}`}>Counter-offer ($/week)</Label>
          <Input
            id={`counter-${review.id}`}
            type="number"
            value={counterWeekly}
            placeholder="Your proposed weekly rent"
            onChange={(e) => setCounterWeekly(e.target.value)}
          />
          <Button
            variant="outline"
            className="w-full"
            disabled={busy || !counterWeekly}
            onClick={() => {
              const amount = Number(counterWeekly);
              if (!amount) {
                toast.error('Enter a counter-offer amount');
                return;
              }
              void onCounter(amount);
            }}
          >
            Tenant counter-offer
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-900 dark:text-amber-100">
          Rent is marked non-negotiable — you can accept or decline only.
        </p>
      )}
    </div>
  );
}

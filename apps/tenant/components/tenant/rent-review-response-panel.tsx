'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RentReviewCase } from '@/lib/types';

export function RentReviewResponsePanel({
  review,
  busy,
  onAccept,
  onReject,
  onCounter,
}: {
  review: RentReviewCase;
  busy: boolean;
  onAccept: () => Promise<void>;
  onReject: (moveOutDate: string) => Promise<void>;
  onCounter: (amount: number) => Promise<void>;
}) {
  const [moveOutDate, setMoveOutDate] = useState(review.moveOutDate ?? '');
  const [counterWeekly, setCounterWeekly] = useState('');
  const canCounter = review.rentNegotiable === true;

  const leaseTerms = review.noticeTerms;
  const mustSignBeforeAccept = leaseTerms?.requiresLeaseAgreementSign === true;
  const leaseSigned = leaseTerms?.leaseAgreementSigned === true;
  const canAccept = !mustSignBeforeAccept || leaseSigned;

  return (
    <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div>
        <p className="text-primary text-xs font-semibold uppercase">Your response</p>
        <p className="text-muted-foreground mt-1 text-xs">
          {mustSignBeforeAccept && !leaseSigned
            ? 'Review and sign the lease agreement above before accepting the rent increase.'
            : mustSignBeforeAccept && leaseSigned
              ? 'Your signed agreement is ready — accept the rent increase to confirm.'
              : 'Submit your response to the proposed rent increase. Your property manager will be notified immediately.'}
        </p>
      </div>

      {canAccept ? (
        <Button className="w-full" disabled={busy} onClick={() => void onAccept()}>
          Accept rent increase
        </Button>
      ) : mustSignBeforeAccept ? (
        <Button className="w-full" disabled>
          Accept rent increase
        </Button>
      ) : null}

      <div className="space-y-2 border-t border-dashed pt-3">
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
          Reject and vacate
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
            Submit counter-offer
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

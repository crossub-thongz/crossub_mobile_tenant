'use client';

import { useState } from 'react';
import { Scale } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RENT_REVIEW_RESPONSE_COPY } from '@/constants/rent-review';
import type { RentReviewCase } from '@/lib/types';

/**
 * The tenant's four answers to a rent increase (Daniel Zhou, 17 Sep 2026).
 *
 * Accepting and asking for a review are the two that move the case, so they lead. Disputing is
 * information only — it opens the NCAT note and records nothing, because applying to the
 * tribunal is the tenant's to do and the agency's to disclose, not a state this workflow owns.
 * Giving notice is not a way of answering the increase at all, which is why it sits apart at
 * the foot of the card behind a question rather than beside the buttons: the old screen put
 * "Reject and vacate" under a date field, which made moving out look like the way to say no.
 */
export function RentReviewResponsePanel({
  review,
  busy,
  onAccept,
  onReject,
  onCounter,
  embedded = false,
}: {
  review: RentReviewCase;
  busy: boolean;
  onAccept: () => Promise<void>;
  onReject: (moveOutDate: string) => Promise<void>;
  onCounter: (amount: number) => Promise<void>;
  embedded?: boolean;
}) {
  const [moveOutDate, setMoveOutDate] = useState(review.moveOutDate ?? '');
  const [counterWeekly, setCounterWeekly] = useState('');
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [vacateOpen, setVacateOpen] = useState(false);
  const canCounter = review.rentNegotiable === true;
  const hasAskedBefore = review.counterHistory.some((entry) => entry.by === 'tenant');

  return (
    <div
      className={
        embedded ? 'space-y-3' : 'space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4'
      }
    >
      <div>
        <p
          className={
            embedded ? 'text-sm font-medium' : 'text-primary text-xs font-semibold uppercase'
          }
        >
          {RENT_REVIEW_RESPONSE_COPY.HEADING}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">{RENT_REVIEW_RESPONSE_COPY.INTRO}</p>
      </div>

      <Button className="w-full" disabled={busy} onClick={() => void onAccept()}>
        {RENT_REVIEW_RESPONSE_COPY.ACCEPT}
      </Button>

      {canCounter ? (
        <div className="space-y-2 border-t border-dashed pt-3">
          <Label htmlFor={`counter-${review.id}`}>
            {RENT_REVIEW_RESPONSE_COPY.REQUEST_REVIEW_LABEL}
          </Label>
          <Input
            id={`counter-${review.id}`}
            type="number"
            value={counterWeekly}
            placeholder={RENT_REVIEW_RESPONSE_COPY.REQUEST_REVIEW_PLACEHOLDER}
            onChange={(e) => setCounterWeekly(e.target.value)}
          />
          <Button
            variant="outline"
            className="w-full"
            disabled={busy || !counterWeekly}
            onClick={() => {
              const amount = Number(counterWeekly);
              if (!amount) {
                toast.error('Enter the rent you are asking for');
                return;
              }
              void onCounter(amount);
            }}
          >
            {hasAskedBefore
              ? RENT_REVIEW_RESPONSE_COPY.REQUEST_REVIEW_AGAIN
              : RENT_REVIEW_RESPONSE_COPY.REQUEST_REVIEW}
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-900 dark:text-amber-100">
          {RENT_REVIEW_RESPONSE_COPY.NON_NEGOTIABLE}
        </p>
      )}

      <div className="space-y-2 border-t border-dashed pt-3">
        <Button
          variant="outline"
          className="w-full"
          aria-expanded={disputeOpen}
          onClick={() => setDisputeOpen((open) => !open)}
        >
          {RENT_REVIEW_RESPONSE_COPY.DISPUTE}
        </Button>
        {disputeOpen ? (
          <div className="flex items-start gap-3 rounded-lg border border-sky-500/30 bg-sky-500/10 p-3">
            <Scale className="mt-0.5 size-4 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden />
            <p className="whitespace-pre-line text-xs leading-relaxed text-sky-950 dark:text-sky-50">
              {RENT_REVIEW_RESPONSE_COPY.DISPUTE_BODY}
            </p>
          </div>
        ) : null}
      </div>

      <div className="space-y-2 border-t border-dashed pt-3">
        <p className="text-muted-foreground text-xs">{RENT_REVIEW_RESPONSE_COPY.VACATE_PROMPT}</p>
        {vacateOpen ? (
          <div className="space-y-2">
            <Label htmlFor={`move-out-${review.id}`}>
              {RENT_REVIEW_RESPONSE_COPY.VACATE_DATE_LABEL}
            </Label>
            <Input
              id={`move-out-${review.id}`}
              type="date"
              value={moveOutDate}
              onChange={(e) => setMoveOutDate(e.target.value)}
            />
            <p className="text-muted-foreground text-xs leading-relaxed">
              {RENT_REVIEW_RESPONSE_COPY.VACATE_HINT}
            </p>
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
              {RENT_REVIEW_RESPONSE_COPY.VACATE_CONFIRM}
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs underline underline-offset-4"
            onClick={() => setVacateOpen(true)}
          >
            {RENT_REVIEW_RESPONSE_COPY.VACATE_ACTION}
          </Button>
        )}
      </div>
    </div>
  );
}

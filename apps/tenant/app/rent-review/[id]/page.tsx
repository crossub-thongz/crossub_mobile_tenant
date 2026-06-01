'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

export default function RentReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { rentReviews, respondRentReview } = useTenantData();
  const review = rentReviews.find((r) => r.id === id);
  const [counter, setCounter] = useState('');
  const [moveOut, setMoveOut] = useState('');

  if (!review) {
    return (
      <TenantShell title="Rent review" backHref={ROUTES.RENT_REVIEW}>
        <p className="text-sm text-muted-foreground">Not found.</p>
      </TenantShell>
    );
  }

  return (
    <TenantShell title="Rent review notice" backHref={ROUTES.RENT_REVIEW}>
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm">{review.propertyAddress}</p>
          <p className="mt-2">
            Current {formatCurrency(review.currentRentWeekly)} → Proposed{' '}
            <strong className="text-primary">
              {formatCurrency(review.proposedRentWeekly)}
            </strong>
          </p>
          <p className="text-muted-foreground text-xs">
            Effective {formatDate(review.effectiveDate)}
          </p>
          {review.explanation && (
            <p className="text-muted-foreground mt-2 text-sm">{review.explanation}</p>
          )}
          <p className="mt-2 text-xs font-medium capitalize">Status: {review.status}</p>
        </div>
        {review.counterHistory.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold">Counter offer history</h2>
            <ul className="mt-2 space-y-1 text-xs">
              {review.counterHistory.map((h, i) => (
                <li key={i}>
                  {h.by} {formatCurrency(h.amount)} · {formatDateTime(h.at)}
                </li>
              ))}
            </ul>
          </section>
        )}
        {review.status === 'pending' && (
          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={() => {
                respondRentReview(review.id, 'accept');
                toast.success('Acceptance recorded — sent to agent workflow');
              }}
            >
              Accept proposed rent
            </Button>
            <div className="space-y-2 rounded-xl border p-4">
              <p className="text-sm font-medium">Counter offer</p>
              <Input
                type="number"
                placeholder="Proposed $/week"
                value={counter}
                onChange={(e) => setCounter(e.target.value)}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const amount = Number(counter);
                  if (!amount) return toast.error('Enter an amount');
                  respondRentReview(review.id, 'counter', { amount });
                  toast.success('Counter offer submitted');
                }}
              >
                Submit counter offer
              </Button>
            </div>
            <div className="space-y-2 rounded-xl border p-4">
              <p className="text-sm font-medium">Reject</p>
              <Input type="date" value={moveOut} onChange={(e) => setMoveOut(e.target.value)} />
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  if (!moveOut) return toast.error('Select intended move-out date');
                  respondRentReview(review.id, 'reject', { moveOutDate: moveOut });
                  toast.success('Rejection recorded — vacating workflow may start');
                }}
              >
                Reject and indicate move-out
              </Button>
            </div>
          </div>
        )}
      </div>
    </TenantShell>
  );
}

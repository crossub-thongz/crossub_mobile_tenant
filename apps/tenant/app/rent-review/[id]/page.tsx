'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, TrendingUp, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { InfoCard } from '@/components/tenant/info-card';
import { StatusBadge } from '@/components/tenant/status-badge';
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
  const [rejectReason, setRejectReason] = useState('');

  if (!review) {
    return (
      <TenantShell title="Rent review" backHref={ROUTES.RENT_REVIEW}>
        <p className="text-sm text-muted-foreground">Not found.</p>
      </TenantShell>
    );
  }

  const increase = review.proposedRentWeekly - review.currentRentWeekly;
  const canCounter = review.rentNegotiable === true;

  return (
    <TenantShell title="Rent review notice" backHref={ROUTES.RENT_REVIEW}>
      <div className="space-y-5">
        <InfoCard icon={TrendingUp} label="Proposed rent change" accent="primary">
          <p className="text-sm">{review.propertyAddress}</p>
          <div className="mt-4 flex items-end gap-3">
            <div>
              <p className="text-muted-foreground text-xs">Current</p>
              <p className="text-lg font-semibold">
                {formatCurrency(review.currentRentWeekly)}
                <span className="text-muted-foreground text-sm font-normal">/wk</span>
              </p>
            </div>
            <ArrowRight className="text-muted-foreground mb-1 size-4" />
            <div>
              <p className="text-muted-foreground text-xs">Proposed</p>
              <p className="text-primary text-xl font-bold">
                {formatCurrency(review.proposedRentWeekly)}
                <span className="text-base font-normal">/wk</span>
              </p>
            </div>
          </div>
          {increase > 0 && (
            <p className="text-muted-foreground mt-2 text-xs">
              +{formatCurrency(increase)}/week increase
            </p>
          )}
          <p className="text-muted-foreground mt-3 text-xs">
            Effective {formatDate(review.effectiveDate)}
          </p>
          {review.explanation && (
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              {review.explanation}
            </p>
          )}
          <StatusBadge label={review.status} className="mt-3" variant="action" />
        </InfoCard>

        {review.counterHistory.length > 0 && (
          <section className="rounded-2xl border bg-card p-4">
            <h2 className="text-sm font-semibold">Counter offer history</h2>
            <ul className="mt-3 space-y-2">
              {review.counterHistory.map((h, i) => (
                <li key={i} className="text-muted-foreground text-sm">
                  <span className="text-foreground font-medium capitalize">{h.by}</span>{' '}
                  {formatCurrency(h.amount)} · {formatDateTime(h.at)}
                </li>
              ))}
            </ul>
          </section>
        )}

        {review.status === 'pending' && (
          <div className="space-y-4">
            <Button
              className="h-12 w-full text-base"
              onClick={() => {
                respondRentReview(review.id, 'accept');
                toast.success('Acceptance recorded — sent to agent workflow');
              }}
            >
              Approve new rent
            </Button>

            {canCounter ? (
              <div className="rounded-2xl border bg-card p-4">
                <p className="font-semibold">Submit counter offer</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Propose a different weekly rent amount.
                </p>
                <Input
                  type="number"
                  className="mt-3"
                  placeholder="Your proposed $/week"
                  value={counter}
                  onChange={(e) => setCounter(e.target.value)}
                />
                <Button
                  variant="outline"
                  className="mt-3 w-full"
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
            ) : (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-sm font-semibold text-amber-950 dark:text-amber-50">
                  Non-negotiable increase
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  This rent review is not open to counter-offers. You can approve the new rent or
                  decline and vacate.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4">
              <div className="flex items-center gap-2">
                <XCircle className="text-destructive size-4" />
                <p className="font-semibold">Decline & vacate</p>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                If you do not accept the new rent, provide a reason and move-out date.
              </p>
              <textarea
                className="border-input bg-background mt-3 w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="Reason for declining (required)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <Input
                type="date"
                className="mt-2"
                value={moveOut}
                onChange={(e) => setMoveOut(e.target.value)}
              />
              <Button
                variant="destructive"
                className="mt-3 w-full"
                onClick={() => {
                  if (!rejectReason.trim()) return toast.error('Provide a reason');
                  if (!moveOut) return toast.error('Select intended move-out date');
                  respondRentReview(review.id, 'reject', {
                    moveOutDate: moveOut,
                    reason: rejectReason,
                  });
                  toast.success('Rejection recorded', {
                    description: 'Vacating workflow started — see move-out services',
                  });
                  window.location.href = ROUTES.MOVE_OUT_SERVICES;
                }}
              >
                Decline rent & indicate move-out
              </Button>
            </div>
          </div>
        )}
      </div>
    </TenantShell>
  );
}

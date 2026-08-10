'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { useAuth } from '@/components/providers/auth-provider';
import { InfoCard } from '@/components/tenant/info-card';
import { RentReviewEmailsSection } from '@/components/tenant/rent-review-emails-section';
import { RentReviewLeaseAgreementSection } from '@/components/tenant/rent-review-lease-agreement-section';
import { RentReviewNoticeTermsSummary } from '@/components/tenant/rent-review-notice-terms-summary';
import { RentReviewResponsePanel } from '@/components/tenant/rent-review-response-panel';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function RentReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { status } = useAuth();
  const { rentReviews, respondRentReview, signLeaseAgreement, notifications, markNotificationRead } =
    useTenantData();
  const review = rentReviews.find((r) => r.id === id);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const match = notifications.find(
      (n) => !n.read && n.type === 'rent_review' && n.href.includes(id),
    );
    if (match) markNotificationRead(match.id);
  }, [id, notifications, markNotificationRead]);

  if (status === 'loading') {
    return (
      <TenantShell title="Rent review notice" backHref={ROUTES.RENT_REVIEW}>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </TenantShell>
    );
  }

  if (status !== 'authed') {
    return (
      <TenantShell title="Rent review notice" backHref={ROUTES.LOGIN}>
        <p className="text-sm text-muted-foreground">
          Sign in to view this rent review notice and lease agreement.
        </p>
      </TenantShell>
    );
  }

  if (!review) {
    return (
      <TenantShell title="Rent review notice" backHref={ROUTES.RENT_REVIEW}>
        <p className="text-sm text-muted-foreground">Not found.</p>
      </TenantShell>
    );
  }

  const leaseAgreementEnabled =
    review.status === 'accepted' &&
    (review.noticeTerms?.leaseAgreementPdfAvailable ||
      review.noticeTerms?.requiresLeaseAgreementSign ||
      review.noticeTerms?.leaseAgreementSigned);
  const signLease = leaseAgreementEnabled ? () => signLeaseAgreement(review.id) : undefined;

  const handleAccept = async () => {
    setBusy(true);
    try {
      await respondRentReview(review.id, 'accept');
      toast.success('Rent increase accepted', {
        description: 'Your property manager has been notified.',
      });
    } catch {
      toast.error('Could not record acceptance');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (moveOutDate: string) => {
    setBusy(true);
    try {
      await respondRentReview(review.id, 'reject', { moveOutDate });
      toast.success('Rejection recorded', {
        description: 'Your property manager will open an end-leasing case',
      });
      router.push(ROUTES.VACATING);
    } catch {
      toast.error('Could not record rejection');
    } finally {
      setBusy(false);
    }
  };

  const handleCounter = async (amount: number) => {
    setBusy(true);
    try {
      await respondRentReview(review.id, 'counter', { amount });
      toast.success('Counter-offer submitted');
    } catch {
      toast.error('Could not submit counter offer');
    } finally {
      setBusy(false);
    }
  };

  const responseHandlers =
    review.status === 'pending'
      ? {
          onAccept: handleAccept,
          onReject: handleReject,
          onCounter: handleCounter,
        }
      : undefined;

  return (
    <TenantShell title="Notice of rent review" backHref={ROUTES.RENT_REVIEW}>
      <div className="space-y-5">
        <InfoCard label="Notice of rent review" accent="primary">
          <p className="text-sm">{review.propertyAddress}</p>
          <StatusBadge label={review.status} className="mt-3" variant="action" />
          {review.explanation ? (
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{review.explanation}</p>
          ) : null}
        </InfoCard>

        <RentReviewNoticeTermsSummary review={review} />

        {leaseAgreementEnabled ? (
          <RentReviewLeaseAgreementSection
            review={review}
            busy={busy}
            onSignLeaseAgreement={signLease}
          />
        ) : null}

        {responseHandlers ? (
          <RentReviewResponsePanel review={review} busy={busy} {...responseHandlers} />
        ) : review.status === 'accepted' &&
          review.noticeTerms?.requiresLeaseAgreementSign !== true &&
          !review.noticeTerms?.leaseAgreementSigned ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
            <p className="font-semibold text-emerald-950 dark:text-emerald-50">Rent increase accepted</p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Your property manager will send the lease extension agreement for signature when it is
              ready.
            </p>
          </div>
        ) : null}

        {review.status === 'countered' ? (
          <div className="flex items-start gap-3 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
            <Clock className="mt-0.5 size-5 shrink-0 text-sky-700 dark:text-sky-300" />
            <div>
              <p className="text-sm font-semibold text-sky-950 dark:text-sky-50">
                Counter-offer submitted
              </p>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                Your property manager is reviewing your offer
                {review.counterHistory[0]
                  ? ` of ${formatCurrency(review.counterHistory[0].amount)}/week`
                  : ''}
                . You will receive an updated notice if terms change.
              </p>
            </div>
          </div>
        ) : null}

        {review.counterHistory.length > 0 && review.status !== 'pending' ? (
          <section className="rounded-2xl border bg-card p-4">
            <h2 className="text-sm font-semibold">Negotiation history</h2>
            <ul className="mt-3 space-y-2">
              {review.counterHistory.map((h, i) => (
                <li key={i} className="text-muted-foreground text-sm">
                  <span className="text-foreground font-medium capitalize">{h.by}</span>{' '}
                  {formatCurrency(h.amount)}/wk · {formatDateTime(h.at)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <RentReviewEmailsSection review={review} />
      </div>
    </TenantShell>
  );
}

'use client';

import Link from 'next/link';
import { Building2, Calendar, FileText, MapPin } from 'lucide-react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { PropertyHubActions } from '@/components/tenant/property-hub-actions';
import { OnboardingPendingAlert } from '@/components/tenant/onboarding-pending-alert';
import { EmptyState } from '@/components/tenant/empty-state';
import { InfoCard } from '@/components/tenant/info-card';
import { StatusBadge } from '@/components/tenant/status-badge';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { findActiveNewLeasingCase } from '@/lib/new-leasing';
import {
  resolveNextRentReviewDate,
  shouldShowNextRentReviewDate,
} from '@/lib/rent-review';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PropertyPage() {
  const { lease, leasingOnboarding, newLeasingCases, rentReviews, loading, apiConnected } =
    useTenantData();

  const activeNewLeasing =
    findActiveNewLeasingCase(newLeasingCases) ?? newLeasingCases[0];

  const hasPropertyContext = Boolean(lease || leasingOnboarding || activeNewLeasing);

  if (!hasPropertyContext) {
    if (loading) {
      return (
        <TenantShell title="Property">
          <p className="text-muted-foreground text-sm">Loading your property…</p>
        </TenantShell>
      );
    }
    return (
      <TenantShell title="Property">
        <EmptyState
          icon={Building2}
          title="No property linked"
          description={
            apiConnected
              ? 'Your login is active, but no approved application or lease was found for this account. Ask your agent to send tenant login from New Leasing → Onboarding after approving your application.'
              : 'Could not reach the CROSSUB API. Make sure crossub_web is running and you are signed in with the email your agent provisioned.'
          }
          action={
            <Button asChild>
              <Link href={ROUTES.PROPERTIES}>Browse new leasing properties</Link>
            </Button>
          }
        />
      </TenantShell>
    );
  }

  const address =
    lease?.propertyAddress ??
    leasingOnboarding?.propertyAddress ??
    activeNewLeasing!.propertyAddress;
  const inOnboarding = Boolean(leasingOnboarding || activeNewLeasing?.onboardingActive);
  const nextRentReviewDate = resolveNextRentReviewDate(lease, rentReviews);
  const showNextRentReview = shouldShowNextRentReviewDate(lease, rentReviews);

  return (
    <TenantShell title="Property details">
      <div className="space-y-4">
        <OnboardingPendingAlert />

        <InfoCard icon={MapPin} accent="primary">
          <p className="text-lg font-semibold leading-snug">{address}</p>
          {lease ? (
            <p className="text-primary mt-3 text-2xl font-bold tracking-tight">
              {formatCurrency(lease.rentWeekly)}
              <span className="text-muted-foreground text-base font-normal">/week</span>
            </p>
          ) : (
            <p className="text-muted-foreground mt-3 text-sm">
              Approved — complete onboarding to finalise your move-in.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {lease ? (
              <>
                <StatusBadge label={lease.status} variant="success" />
                {lease.periodic && <StatusBadge label="Periodic" />}
              </>
            ) : inOnboarding ? (
              <StatusBadge label="Onboarding" variant="action" />
            ) : null}
          </div>
        </InfoCard>

        {lease ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <InfoCard icon={Calendar} label="Lease start">
                <p className="font-medium">{formatDate(lease.leaseStart)}</p>
              </InfoCard>
              <InfoCard icon={Calendar} label="Lease end">
                <p className="font-medium">{formatDate(lease.leaseEnd)}</p>
              </InfoCard>
            </div>

            {showNextRentReview && nextRentReviewDate ? (
              <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
                <p className="text-sm font-medium">Next rent review</p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  You accepted the recent rent increase. Your property manager can begin the
                  next rent review from{' '}
                  <span className="text-foreground font-medium">
                    {formatDate(nextRentReviewDate)}
                  </span>
                  .
                </p>
              </div>
            ) : null}

            {lease.renewalDueInDays != null && lease.renewalDueInDays <= 90 && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                <p className="text-sm font-medium text-amber-400">Renewal decision due</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {lease.renewalDueInDays} days remaining on your current lease term.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href={ROUTES.RENEWAL}>Review renewal options</Link>
                </Button>
              </div>
            )}

            <PropertyHubActions />

            <Button asChild variant="secondary" className="w-full">
              <Link href={ROUTES.LEASE}>
                <FileText className="size-4" />
                View lease documents
              </Link>
            </Button>
          </>
        ) : inOnboarding ? (
          <Button asChild className="w-full">
            <Link href={ROUTES.ONBOARDING}>Complete move-in checklist</Link>
          </Button>
        ) : null}
      </div>
    </TenantShell>
  );
}

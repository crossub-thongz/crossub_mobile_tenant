'use client';

import Link from 'next/link';
import { Building2, Calendar, DoorOpen, FileText, MapPin, Repeat } from 'lucide-react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { PropertyHubActions } from '@/components/tenant/property-hub-actions';
import { OnboardingPendingAlert } from '@/components/tenant/onboarding-pending-alert';
import { EmptyState } from '@/components/tenant/empty-state';
import { InfoCard } from '@/components/tenant/info-card';
import { StatusBadge } from '@/components/tenant/status-badge';
import { TenancyUpcomingTimers } from '@/components/tenant/tenancy-upcoming-timers';
import { RentCycleAmount, RentCycleSummary } from '@/components/tenant/rent-cycle-amount';
import { UpcomingRentHint } from '@/components/tenant/upcoming-rent-hint';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { findActiveNewLeasingCase } from '@/lib/new-leasing';
import { resolveUpcomingRentHint } from '@/lib/rent-review';
import { formatDate } from '@/lib/utils';

export default function PropertyPage() {
  const {
    lease,
    leasingOnboarding,
    newLeasingCases,
    rentReviews,
    vacatingCase,
    routineInspections,
    loading,
    apiConnected,
    profileUnlinked,
  } = useTenantData();

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

    const description = apiConnected
      ? 'Your login is active, but no approved application or onboarding case was found for this account. Ask your agent (or admin) to send tenant login credentials again from the approved application — that links your account to the property.'
      : profileUnlinked
        ? 'You are signed in, but this login is not linked to your rental application yet. Use the exact email from your approval credentials email, or ask admin to resend tenant login from the approved application.'
        : 'Could not reach the CROSSUB API. Check that the tenant app can reach the API, then sign in again with the email from your credentials email.';

    return (
      <TenantShell title="Property">
        <EmptyState
          icon={Building2}
          title="No property linked"
          description={description}
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
  const upcomingRentHint = resolveUpcomingRentHint(rentReviews, lease, vacatingCase);

  return (
    <TenantShell title="Property details">
      <div className="space-y-4">
        <OnboardingPendingAlert />

        <InfoCard icon={MapPin} accent="primary">
          <p className="text-lg font-semibold leading-snug">{address}</p>
          {lease ? (
            <>
              <RentCycleAmount
                lease={lease}
                className="text-primary mt-3 text-2xl font-bold tracking-tight"
              />
              <RentCycleSummary lease={lease} />
              {lease.rentPaidTo ? (
                <p className="text-muted-foreground mt-3 text-sm">
                  Rent paid to{' '}
                  <span className="text-foreground font-medium">
                    {formatDate(lease.rentPaidTo)}
                  </span>
                </p>
              ) : null}
              {lease.paymentReference ? (
                <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                    Rent payment reference
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums tracking-wide text-amber-950 dark:text-amber-50">
                    {lease.paymentReference}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Include this reference when paying rent by bank transfer.
                  </p>
                </div>
              ) : null}
              <UpcomingRentHint hint={upcomingRentHint} />
            </>
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
            {vacatingCase ? (
              <Link
                href={ROUTES.VACATING}
                className="block transition-opacity active:opacity-80"
              >
                <InfoCard
                  icon={DoorOpen}
                  label="Vacate date"
                  accent="primary"
                  className="hover:border-primary/40"
                >
                  <p className="font-medium">
                    {formatDate(vacatingCase.vacatingDate)}
                    {vacatingCase.vacateDateChanged ? (
                      <span className="text-muted-foreground ml-1 text-sm font-normal">
                        (changed)
                      </span>
                    ) : null}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">Tap to view end of lease</p>
                </InfoCard>
              </Link>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <InfoCard icon={Calendar} label="Lease start">
                <p className="font-medium">{formatDate(lease.leaseStart)}</p>
              </InfoCard>
              <InfoCard icon={Calendar} label="Lease end">
                <p className="font-medium">{formatDate(lease.leaseEnd)}</p>
              </InfoCard>
              <InfoCard icon={Repeat} label="Annual visits">
                <p className="font-medium">
                  {lease.routineInspectionFrequency != null
                    ? `${lease.routineInspectionFrequency}× per year`
                    : '—'}
                </p>
              </InfoCard>
              <InfoCard icon={Repeat} label="Cycle interval">
                <p className="font-medium">
                  {lease.routineInspectionFrequencyMonths != null
                    ? `Every ${lease.routineInspectionFrequencyMonths} months`
                    : '—'}
                </p>
              </InfoCard>
            </div>

            <TenancyUpcomingTimers
              lease={lease}
              routineInspections={routineInspections}
              rentReviews={rentReviews}
            />

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

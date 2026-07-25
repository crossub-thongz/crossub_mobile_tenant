'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, TrendingUp } from 'lucide-react';

import { InfoCard } from '@/components/tenant/info-card';
import { ROUTES } from '@/constants/routes';
import {
  formatCountdownLabel,
  isCountdownOverdue,
  resolveNextRoutineInspectionDate,
  resolveRentReviewCountdownDate,
} from '@/lib/tenancy-countdown';
import type { TenantRoutineInspection } from '@/lib/crossub-api/tenant-account-client';
import type { LeaseSummary, RentReviewCase } from '@/lib/types';
import { formatDate } from '@/lib/utils';

function useCountdownTick(iso: string | null): void {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!iso) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, [iso]);
}

function TimerCard({
  icon,
  label,
  targetDate,
  detail,
  href,
  accent,
}: {
  icon: typeof CalendarClock;
  label: string;
  targetDate: string;
  detail: string;
  href?: string;
  accent?: 'default' | 'primary' | 'warning' | 'danger';
}) {
  useCountdownTick(targetDate);
  const countdown = formatCountdownLabel(targetDate);
  const overdue = isCountdownOverdue(targetDate);
  const resolvedAccent =
    accent ?? (overdue ? 'warning' : countdown === 'Today' ? 'primary' : 'default');

  const body = (
    <InfoCard icon={icon} label={label} accent={resolvedAccent}>
      <p className="text-2xl font-bold tracking-tight">{countdown ?? formatDate(targetDate)}</p>
      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{detail}</p>
      <p className="text-foreground mt-2 text-sm font-medium">{formatDate(targetDate)}</p>
    </InfoCard>
  );

  if (!href) return body;

  return (
    <Link href={href} className="block transition-opacity hover:opacity-90">
      {body}
    </Link>
  );
}

export function TenancyUpcomingTimers({
  lease,
  routineInspections,
  rentReviews,
}: {
  lease: LeaseSummary | null;
  routineInspections: TenantRoutineInspection[];
  rentReviews: RentReviewCase[];
}) {
  if (!lease) return null;

  const routineDate = resolveNextRoutineInspectionDate(lease, routineInspections);
  const rentReviewDate = resolveRentReviewCountdownDate(lease, rentReviews);

  if (!routineDate && !rentReviewDate) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {routineDate ? (
        <TimerCard
          icon={ClipboardList}
          label="Next routine inspection"
          targetDate={routineDate}
          detail="Your property manager will schedule a routine visit or self-inspection around this date."
          href={ROUTES.INSPECTIONS}
        />
      ) : null}
      {rentReviewDate ? (
        <TimerCard
          icon={TrendingUp}
          label="Upcoming rent review"
          targetDate={rentReviewDate}
          detail="Your property manager can begin the next rent review from this date. We will notify you when a formal notice is issued."
          href={ROUTES.RENT_REVIEW}
        />
      ) : null}
    </div>
  );
}

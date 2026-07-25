import type { TenantRoutineInspection } from '@/lib/crossub-api/tenant-account-client';
import type { LeaseSummary, RentReviewCase } from '@/lib/types';
import { resolveNextRentReviewDate } from '@/lib/rent-review';

const MS_PER_DAY = 86_400_000;

function calendarDayStart(iso: string): Date {
  const day = iso.slice(0, 10);
  return new Date(`${day}T00:00:00`);
}

function todayStart(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

/** Whole calendar days from today until `iso` (negative when overdue). */
export function daysUntilCalendarDate(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const target = calendarDayStart(iso);
  if (Number.isNaN(target.getTime())) return null;
  return Math.round((target.getTime() - todayStart().getTime()) / MS_PER_DAY);
}

/** Human label for a future/past calendar date countdown. */
export function formatCountdownLabel(iso: string | null | undefined): string | null {
  const days = daysUntilCalendarDate(iso);
  if (days === null) return null;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 0) return `In ${days} days`;
  return `${Math.abs(days)} days overdue`;
}

export function isCountdownOverdue(iso: string | null | undefined): boolean {
  const days = daysUntilCalendarDate(iso);
  return days !== null && days < 0;
}

/**
 * Next routine inspection — prefers an active agent-created routine with a schedule,
 * else the lease snapshot from the property routine schedule.
 */
export function resolveNextRoutineInspectionDate(
  lease: LeaseSummary | null,
  routineInspections: TenantRoutineInspection[],
): string | null {
  const candidates: string[] = [];

  for (const inspection of routineInspections) {
    if (inspection.status === 'completed') continue;
    const scheduledAt = inspection.scheduledAt?.trim();
    if (scheduledAt) candidates.push(scheduledAt);
  }

  if (lease?.nextRoutineInspectionAt) {
    candidates.push(lease.nextRoutineInspectionAt);
  }

  if (!candidates.length) return null;

  const ranked = candidates
    .map((iso) => ({ iso, days: daysUntilCalendarDate(iso) }))
    .filter((row): row is { iso: string; days: number } => row.days !== null)
    .sort((a, b) => {
      const aFuture = a.days >= 0;
      const bFuture = b.days >= 0;
      if (aFuture && bFuture) return a.days - b.days;
      if (aFuture) return -1;
      if (bFuture) return 1;
      return b.days - a.days;
    });

  return ranked[0]?.iso ?? null;
}

/** Target date for the upcoming rent review window. */
export function resolveRentReviewCountdownDate(
  lease: LeaseSummary | null,
  rentReviews: RentReviewCase[],
): string | null {
  return resolveNextRentReviewDate(lease, rentReviews);
}

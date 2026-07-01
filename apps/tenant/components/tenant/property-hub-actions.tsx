'use client';

import Link from 'next/link';
import {
  ClipboardList,
  DoorOpen,
  TrendingUp,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

import { useTenantData } from '@/components/providers/tenant-data-provider';
import {
  rentReviewDetail,
  ROUTES,
} from '@/constants/routes';
import { VACATING_STAGE_LABEL } from '@/constants/vacating';
import { cn, formatCurrency } from '@/lib/utils';

function HubLink({
  href,
  icon: Icon,
  title,
  subtitle,
  badge,
  urgent,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  badge?: string;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-xl border bg-card p-3.5 transition-colors active:bg-secondary/60',
        urgent && 'border-primary/35',
      )}
    >
      <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-muted-foreground mt-0.5 text-xs leading-snug">{subtitle}</p>
      </div>
      {badge && (
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
            urgent
              ? 'bg-primary/15 text-primary'
              : 'bg-secondary text-muted-foreground',
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

export function PropertyHubActions() {
  const {
    inspections,
    maintenance,
    rentReviews,
    vacating,
    ingoingReport,
    renewal,
  } = useTenantData();

  const openRepairs = maintenance.filter(
    (m) => m.status !== 'closed' && !m.tenantCompletionApproved,
  );
  const pendingRentReview = rentReviews.find((r) => r.status === 'pending');
  const ingoingAction =
    ingoingReport && ingoingReport.status !== 'confirmed' ? 'Confirm' : undefined;

  const vacatingSubtitle = vacating
    ? `${VACATING_STAGE_LABEL[vacating.currentStage]} · vacate ${vacating.vacatingDate}`
    : renewal
      ? 'Set move-out date if not renewing'
      : 'Start when you plan to move out';

  return (
    <section className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        Property services
      </p>
      <div className="grid gap-2">
        <HubLink
          href={ROUTES.INSPECTIONS}
          icon={ClipboardList}
          title="Inspections"
          subtitle={
            ingoingReport
              ? `Ingoing ${ingoingReport.confirmedCount}/${ingoingReport.sections.length} confirmed · ${inspections.length} on file`
              : `${inspections.length} inspection record(s)`
          }
          badge={ingoingAction ?? (inspections.length ? String(inspections.length) : undefined)}
          urgent={!!ingoingAction}
        />
        <HubLink
          href={ROUTES.REPAIRS}
          icon={Wrench}
          title="Repairs"
          subtitle={
            openRepairs.length
              ? `${openRepairs.length} active · ${openRepairs[0]?.statusLabel ?? ''}`
              : 'Report maintenance or track repairs'
          }
          badge={openRepairs.length ? String(openRepairs.length) : undefined}
        />
        <HubLink
          href={
            pendingRentReview
              ? rentReviewDetail(pendingRentReview.id)
              : ROUTES.RENT_REVIEW
          }
          icon={TrendingUp}
          title="Rent review"
          subtitle={
            pendingRentReview
              ? `Proposed ${formatCurrency(pendingRentReview.proposedRentWeekly)}/week`
              : rentReviews.length
                ? `${rentReviews.length} review(s) on file`
                : 'No rent review in progress'
          }
          badge={pendingRentReview ? 'Action' : undefined}
          urgent={!!pendingRentReview}
        />
        <HubLink
          href={vacating ? ROUTES.VACATING : renewal ? ROUTES.RENEWAL : ROUTES.VACATING}
          icon={DoorOpen}
          title="Vacating"
          subtitle={vacatingSubtitle}
          badge={vacating ? 'Active' : undefined}
          urgent={!!vacating}
        />
      </div>
    </section>
  );
}

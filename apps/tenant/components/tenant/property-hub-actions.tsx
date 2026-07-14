'use client';

import Link from 'next/link';
import {
  ClipboardList,
  DoorOpen,
  KeyRound,
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
import { findPendingRentReview } from '@/lib/rent-review';
import { findUrgentIngoingInspection, needsIngoingConfirmationAction } from '@/lib/ingoing-inspection';
import {
  findUrgentOutgoingInspection,
  needsOutgoingConfirmationAction,
} from '@/lib/outgoing-inspection';
import {
  findUrgentRoutineInspection,
  needsRoutineInspectionAction,
} from '@/lib/routine-inspection';
import { needsVacatingSettlementAction } from '@/lib/end-leasing';
import {
  findUrgentNewLeasingCase,
  needsNewLeasingOnboardingAction,
  NEW_LEASING_STEP_LABEL,
} from '@/lib/new-leasing';
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
    newLeasingCases,
    onboardingSteps,
    vacatingCase,
    ingoingReport,
    ingoingInspections,
    outgoingReport,
    outgoingInspections,
    routineInspections,
  } = useTenantData();

  const openRepairs = maintenance.filter(
    (m) => m.status !== 'closed' && !m.tenantCompletionApproved,
  );
  const pendingRentReview = findPendingRentReview(rentReviews);
  const urgentNewLeasing = findUrgentNewLeasingCase(newLeasingCases, onboardingSteps);
  const urgentIngoing = findUrgentIngoingInspection(ingoingInspections);
  const urgentOutgoing = findUrgentOutgoingInspection(outgoingInspections);
  const urgentRoutine = findUrgentRoutineInspection(routineInspections);
  const ingoingAction =
    urgentIngoing &&
    ingoingReport &&
    needsIngoingConfirmationAction(ingoingReport)
      ? 'Confirm'
      : undefined;
  const routineAction =
    urgentRoutine && needsRoutineInspectionAction(urgentRoutine) ? 'Required' : undefined;

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
            urgentIngoing && ingoingReport
              ? `Ingoing ${ingoingReport.confirmedCount}/${ingoingReport.sections.length} confirmed · ${inspections.length} on file`
              : urgentRoutine && needsRoutineInspectionAction(urgentRoutine)
                ? `Routine inspection · ${inspections.length} on file`
                : `${inspections.length} inspection record(s)`
          }
          badge={ingoingAction ?? routineAction ?? (inspections.length ? String(inspections.length) : undefined)}
          urgent={!!ingoingAction || !!routineAction}
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
        {newLeasingCases.length > 0 && urgentNewLeasing && (
          <HubLink
            href={
              needsNewLeasingOnboardingAction(urgentNewLeasing, onboardingSteps)
                ? ROUTES.ONBOARDING
                : ROUTES.APPLICATIONS
            }
            icon={KeyRound}
            title="New leasing"
            subtitle={
              needsNewLeasingOnboardingAction(urgentNewLeasing, onboardingSteps)
                ? `Onboarding · ${urgentNewLeasing.propertyAddress}`
                : `${NEW_LEASING_STEP_LABEL[urgentNewLeasing.lifecycleStep]} · ${urgentNewLeasing.propertyAddress}`
            }
            badge={
              needsNewLeasingOnboardingAction(urgentNewLeasing, onboardingSteps)
                ? 'Required'
                : 'Active'
            }
            urgent={
              needsNewLeasingOnboardingAction(urgentNewLeasing, onboardingSteps) ||
              urgentNewLeasing.lifecycleStep !== 'onboarding'
            }
          />
        )}
        {rentReviews.length > 0 && (
          <HubLink
            href={
              pendingRentReview
                ? rentReviewDetail(pendingRentReview.id)
                : ROUTES.RENT_REVIEW
            }
            icon={TrendingUp}
            title="Rent review notice"
            subtitle={
              pendingRentReview
                ? `Proposed ${formatCurrency(pendingRentReview.proposedRentWeekly)}/week — respond required`
                : `${rentReviews.length} past review(s)`
            }
            badge={pendingRentReview ? 'Action' : undefined}
            urgent={!!pendingRentReview}
          />
        )}
        {vacatingCase && (
          <HubLink
            href={ROUTES.VACATING}
            icon={DoorOpen}
            title="End of lease"
            subtitle={
              needsVacatingSettlementAction(vacatingCase)
                ? `Settlement due · vacate ${vacatingCase.vacatingDate}`
                : urgentOutgoing &&
                    outgoingReport &&
                    needsOutgoingConfirmationAction(outgoingReport)
                  ? `Outgoing report · ${outgoingReport.confirmedCount} section(s) reviewed · vacate ${vacatingCase.vacatingDate}`
                  : `${VACATING_STAGE_LABEL[vacatingCase.currentStage]} · vacate ${vacatingCase.vacatingDate}`
            }
            badge={
              needsVacatingSettlementAction(vacatingCase)
                ? 'Required'
                : urgentOutgoing &&
                    outgoingReport &&
                    needsOutgoingConfirmationAction(outgoingReport)
                  ? 'Confirm'
                  : vacatingCase.status === 'open'
                    ? 'Active'
                    : undefined
            }
            urgent={
              needsVacatingSettlementAction(vacatingCase) ||
              vacatingCase.status === 'open' ||
              (!!urgentOutgoing &&
                !!outgoingReport &&
                needsOutgoingConfirmationAction(outgoingReport))
            }
          />
        )}
      </div>
    </section>
  );
}

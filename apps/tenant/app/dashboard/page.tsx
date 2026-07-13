'use client';

import {
  AlertTriangle,
  Building2,
  ClipboardList,
  DoorOpen,
  KeyRound,
  MessageSquare,
  Wallet,
  Wrench,
} from 'lucide-react';

import { HomeSummaryCard } from '@/components/tenant/home-summary-card';
import { ArrearsBanner } from '@/components/tenant/arrears-banner';
import { SectionTitle } from '@/components/tenant/page-intro';
import { TenantShell } from '@/components/layout/tenant-shell';
import { useAuth } from '@/components/providers/auth-provider';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import {
  ingoingReport as ingoingReportPath,
  outgoingReport as outgoingReportPath,
  routineInspection as routineInspectionPath,
  rentReviewDetail,
  repairDetail,
  ROUTES,
} from '@/constants/routes';
import { hrefWithFrom } from '@/lib/back-navigation';
import { findUrgentIngoingInspection, needsIngoingConfirmationAction } from '@/lib/ingoing-inspection';
import {
  findUrgentOutgoingInspection,
  needsOutgoingConfirmationAction,
} from '@/lib/outgoing-inspection';
import {
  findUrgentRoutineInspection,
  needsRoutineInspectionAction,
} from '@/lib/routine-inspection';
import { findPendingRentReview } from '@/lib/rent-review';
import { needsVacatingSettlementAction } from '@/lib/end-leasing';
import {
  findUrgentNewLeasingCase,
  needsNewLeasingOnboardingAction,
  NEW_LEASING_STEP_LABEL,
} from '@/lib/new-leasing';
import { displayName, formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    lease,
    ingoingReport,
    ingoingInspections,
    outgoingReport,
    outgoingInspections,
    routineInspections,
    maintenance,
    rentReviews,
    newLeasingCases,
    onboardingSteps,
    messages,
    rentReceipts,
    inspections,
    terminationNotice,
    vacatingCase,
  } = useTenantData();

  const openRepairs = maintenance.filter(
    (m) => m.status !== 'closed' && !m.tenantCompletionApproved,
  );
  const unreadMessages = messages.reduce((s, m) => s + m.unread, 0);
  const urgentIngoing = findUrgentIngoingInspection(ingoingInspections);
  const urgentOutgoing = findUrgentOutgoingInspection(outgoingInspections);
  const urgentRoutine = findUrgentRoutineInspection(routineInspections);
  const pendingRentReview = findPendingRentReview(rentReviews);
  const urgentNewLeasing = findUrgentNewLeasingCase(newLeasingCases, onboardingSteps);
  const needsCompletion = openRepairs.some((r) => r.completionApprovalPending);

  const summaries = [
    {
      title: 'Property details',
      summary: lease
        ? `${lease.propertyAddress} · ${formatCurrency(lease.rentWeekly)}/week`
        : 'No property linked — browse listings to apply',
      href: ROUTES.PROPERTY,
      icon: Building2,
    },
    {
      title: 'Inspection',
      summary:
        urgentIngoing && ingoingReport
          ? `Ingoing ${ingoingReport.confirmedCount}/${ingoingReport.sections.length} confirmed · ${inspections.length} on file`
          : `${inspections.length} inspection record(s)`,
      href: ROUTES.PROPERTY,
      badge:
        urgentIngoing &&
        ingoingReport &&
        needsIngoingConfirmationAction(ingoingReport)
          ? 'Action'
          : undefined,
      icon: ClipboardList,
    },
    {
      title: 'Repair',
      summary:
        openRepairs.length > 0
          ? `${openRepairs.length} active · ${openRepairs[0]?.statusLabel ?? ''}`
          : 'No open repairs — report an issue anytime',
      href: ROUTES.PROPERTY,
      badge: openRepairs.length > 0 ? String(openRepairs.length) : undefined,
      icon: Wrench,
    },
    {
      title: 'Accounting',
      summary: lease
        ? `${rentReceipts.length} receipt(s) · pay rent or view history`
        : 'Pay rent and view receipts when lease is linked',
      href: ROUTES.ACCOUNTING,
      icon: Wallet,
    },
    {
      title: 'Message',
      summary:
        unreadMessages > 0
          ? `${unreadMessages} unread · landlord, agent, or contractor`
          : 'Contact by leasing, maintenance, inspection, or accounting',
      href: ROUTES.MESSAGES,
      badge: unreadMessages > 0 ? String(unreadMessages) : undefined,
      icon: MessageSquare,
    },
  ];

  const urgentItems = [
    terminationNotice && {
      title: 'Lease termination notice',
      summary: terminationNotice.reason,
      href: ROUTES.TERMINATION,
      badge: 'Urgent',
      icon: AlertTriangle,
      variant: 'urgent' as const,
    },
    urgentNewLeasing &&
      needsNewLeasingOnboardingAction(urgentNewLeasing, onboardingSteps) && {
        title: 'New lease onboarding',
        summary: `${urgentNewLeasing.propertyAddress} · complete move-in steps`,
        href: ROUTES.ONBOARDING,
        badge: 'Required',
        icon: KeyRound,
        variant: 'urgent' as const,
      },
    urgentNewLeasing &&
      !needsNewLeasingOnboardingAction(urgentNewLeasing, onboardingSteps) && {
        title: 'New leasing',
        summary: `${NEW_LEASING_STEP_LABEL[urgentNewLeasing.lifecycleStep]} · ${urgentNewLeasing.propertyAddress}`,
        href: ROUTES.APPLICATIONS,
        badge: 'Active',
        icon: KeyRound,
        variant: 'urgent' as const,
      },
    pendingRentReview && {
      title: 'Rent review',
      summary: `Proposed ${formatCurrency(pendingRentReview.proposedRentWeekly)}/week — ${
        pendingRentReview.rentNegotiable === true
          ? 'approve, decline, or counter'
          : 'approve or decline (non-negotiable)'
      }`,
      href: rentReviewDetail(pendingRentReview.id),
      badge: 'Required',
      icon: Wallet,
      variant: 'urgent' as const,
    },
    vacatingCase &&
      needsVacatingSettlementAction(vacatingCase) && {
        title: 'End of lease settlement',
        summary: `Confirm bond settlement · respond by ${
          vacatingCase.tenantConfirmationDueAt
            ? new Date(vacatingCase.tenantConfirmationDueAt).toLocaleDateString()
            : 'deadline'
        }`,
        href: ROUTES.VACATING,
        badge: 'Required',
        icon: DoorOpen,
        variant: 'urgent' as const,
      },
    vacatingCase &&
      vacatingCase.status === 'open' &&
      !needsVacatingSettlementAction(vacatingCase) && {
        title: 'End of lease',
        summary: `Vacate ${vacatingCase.vacatingDate} · ${vacatingCase.currentStage.replace('_', ' ')}`,
        href: ROUTES.VACATING,
        badge: 'Active',
        icon: DoorOpen,
        variant: 'urgent' as const,
      },
    needsCompletion && {
      title: 'Completion approval needed',
      summary: 'A repair is finished — confirm work completed',
      href: repairDetail(openRepairs.find((r) => r.completionApprovalPending)!.id),
      badge: '!',
      icon: Wrench,
      variant: 'urgent' as const,
    },
    urgentIngoing &&
      ingoingReport &&
      needsIngoingConfirmationAction(ingoingReport) && {
        title: 'Ingoing inspection',
        summary: 'Confirm each section before move-in is official',
        href: hrefWithFrom(ingoingReportPath(ingoingReport.id), 'dashboard'),
        badge: 'Move-in',
        icon: ClipboardList,
        variant: 'urgent' as const,
      },
    urgentOutgoing &&
      outgoingReport &&
      needsOutgoingConfirmationAction(outgoingReport) && {
        title: 'Outgoing inspection',
        summary: 'Confirm each section of your move-out condition report',
        href: hrefWithFrom(outgoingReportPath(outgoingReport.id), 'dashboard'),
        badge: 'Move-out',
        icon: ClipboardList,
        variant: 'urgent' as const,
      },
    urgentRoutine &&
      needsRoutineInspectionAction(urgentRoutine) && {
        title: 'Routine inspection',
        summary:
          urgentRoutine.flow === 'self'
            ? 'Complete your self-inspection checklist'
            : 'Be available for your scheduled routine visit',
        href: hrefWithFrom(routineInspectionPath(urgentRoutine.id), 'dashboard'),
        badge: 'Required',
        icon: ClipboardList,
        variant: 'urgent' as const,
      },
  ].filter(Boolean) as Array<{
    title: string;
    summary: string;
    href: string;
    badge: string;
    icon: typeof Building2;
    variant: 'urgent';
  }>;

  return (
    <TenantShell title="Home">
      <div className="space-y-6">
        <div className="from-primary/10 via-card to-card rounded-2xl border border-primary/20 bg-gradient-to-br p-5">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Welcome back
          </p>
          <p className="mt-1 text-lg font-semibold">
            {user ? displayName(user) : 'Tenant'}
          </p>
          {lease ? (
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {lease.propertyAddress}
            </p>
          ) : (
            <p className="text-muted-foreground mt-2 text-sm">
              Your tenancy summary will appear here once a lease is linked.
            </p>
          )}
        </div>

        <ArrearsBanner />

        {urgentItems.length > 0 && (
          <section>
            <SectionTitle>Action required</SectionTitle>
            <div className="space-y-2">
              {urgentItems.map((item) => (
                <HomeSummaryCard key={item.title} {...item} />
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionTitle>Your tenancy</SectionTitle>
          <div className="space-y-2">
            {summaries.map((s) => (
              <HomeSummaryCard key={s.title} {...s} />
            ))}
          </div>
        </section>
      </div>
    </TenantShell>
  );
}

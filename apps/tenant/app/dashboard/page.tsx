'use client';

import { HomeSummaryCard } from '@/components/tenant/home-summary-card';
import { ArrearsBanner } from '@/components/tenant/arrears-banner';
import { TenantShell } from '@/components/layout/tenant-shell';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import {
  ingoingReport as ingoingReportPath,
  rentReviewDetail,
  repairDetail,
  ROUTES,
} from '@/constants/routes';
import { hrefWithFrom } from '@/lib/back-navigation';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const {
    lease,
    ingoingReport,
    maintenance,
    rentReviews,
    messages,
    rentReceipts,
    inspections,
    terminationNotice,
  } = useTenantData();

  const openRepairs = maintenance.filter(
    (m) => m.status !== 'closed' && !m.tenantCompletionApproved,
  );
  const unreadMessages = messages.reduce((s, m) => s + m.unread, 0);
  const pendingRentReview = rentReviews.find((r) => r.status === 'pending');

  const summaries = [
    {
      title: 'Property details',
      summary: lease
        ? `${lease.propertyAddress} · ${formatCurrency(lease.rentWeekly)}/week`
        : 'No property linked',
      href: ROUTES.PROPERTY,
    },
    {
      title: 'Inspection',
      summary: ingoingReport
        ? `Ingoing ${ingoingReport.confirmedCount}/${ingoingReport.sections.length} confirmed · ${inspections.length} on file`
        : `${inspections.length} inspection record(s)`,
      href: ROUTES.INSPECTIONS,
      badge:
        ingoingReport && ingoingReport.status !== 'confirmed' ? 'Action' : undefined,
    },
    {
      title: 'Repair',
      summary:
        openRepairs.length > 0
          ? `${openRepairs.length} active · ${openRepairs[0]?.statusLabel ?? ''}`
          : 'No open repairs',
      href: ROUTES.REPAIRS,
      badge: openRepairs.length > 0 ? String(openRepairs.length) : undefined,
    },
    {
      title: 'Accounting',
      summary: lease
        ? `${rentReceipts.length} receipt(s) · pay rent or view history`
        : 'Pay rent and view receipts when lease is linked',
      href: ROUTES.ACCOUNTING,
    },
    {
      title: 'Message',
      summary:
        unreadMessages > 0
          ? `${unreadMessages} unread · Leasing, repair, inspection, accounting`
          : 'Contact CROSSUB by topic',
      href: ROUTES.MESSAGES,
      badge: unreadMessages > 0 ? String(unreadMessages) : undefined,
    },
  ];

  return (
    <TenantShell title="Home">
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Summary of your tenancy — tap a section for full details.
        </p>
        <ArrearsBanner />

        {terminationNotice && (
          <HomeSummaryCard
            title="Lease termination notice"
            summary={terminationNotice.reason}
            href={ROUTES.TERMINATION}
            badge="Urgent"
          />
        )}

        {pendingRentReview && (
          <HomeSummaryCard
            title="Rent review"
            summary={`Proposed ${formatCurrency(pendingRentReview.proposedRentWeekly)}/week — approve, decline, or counter`}
            href={rentReviewDetail(pendingRentReview.id)}
            badge="Required"
          />
        )}

        <div className="space-y-2">
          {summaries.map((s) => (
            <HomeSummaryCard key={s.title} {...s} />
          ))}
        </div>

        {openRepairs.some((r) => r.completionApprovalPending) && (
          <HomeSummaryCard
            title="Completion approval needed"
            summary="A repair is finished — confirm work completed"
            href={repairDetail(
              openRepairs.find((r) => r.completionApprovalPending)!.id,
            )}
            badge="!"
          />
        )}

        {ingoingReport && ingoingReport.status !== 'confirmed' && (
          <HomeSummaryCard
            title="Ingoing inspection"
            summary="Complete section confirmations before move-in is official"
            href={hrefWithFrom(ingoingReportPath(ingoingReport.id), 'dashboard')}
            badge="Move-in"
          />
        )}
      </div>
    </TenantShell>
  );
}

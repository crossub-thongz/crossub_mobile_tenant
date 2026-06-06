'use client';

import {
  AlertTriangle,
  Building2,
  ClipboardList,
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
  rentReviewDetail,
  repairDetail,
  ROUTES,
} from '@/constants/routes';
import { hrefWithFrom } from '@/lib/back-navigation';
import { displayName, formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
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
      summary: ingoingReport
        ? `Ingoing ${ingoingReport.confirmedCount}/${ingoingReport.sections.length} confirmed · ${inspections.length} on file`
        : `${inspections.length} inspection record(s)`,
      href: ROUTES.INSPECTIONS,
      badge:
        ingoingReport && ingoingReport.status !== 'confirmed' ? 'Action' : undefined,
      icon: ClipboardList,
    },
    {
      title: 'Repair',
      summary:
        openRepairs.length > 0
          ? `${openRepairs.length} active · ${openRepairs[0]?.statusLabel ?? ''}`
          : 'No open repairs — report an issue anytime',
      href: ROUTES.REPAIRS,
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
    pendingRentReview && {
      title: 'Rent review',
      summary: `Proposed ${formatCurrency(pendingRentReview.proposedRentWeekly)}/week — approve, decline, or counter`,
      href: rentReviewDetail(pendingRentReview.id),
      badge: 'Required',
      icon: Wallet,
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
    ingoingReport &&
      ingoingReport.status !== 'confirmed' && {
        title: 'Ingoing inspection',
        summary: 'Confirm each section before move-in is official',
        href: hrefWithFrom(ingoingReportPath(ingoingReport.id), 'dashboard'),
        badge: 'Move-in',
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

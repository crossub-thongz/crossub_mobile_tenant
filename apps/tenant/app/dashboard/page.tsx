'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

import { ActionCard } from '@/components/tenant/action-card';
import { ArrearsBanner } from '@/components/tenant/arrears-banner';
import { LifecycleBanner } from '@/components/tenant/lifecycle-banner';
import { TenantShell } from '@/components/layout/tenant-shell';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { maintenanceDetail, ROUTES } from '@/constants/routes';
import { formatCurrency, formatRelative } from '@/lib/utils';

const QUICK_LINKS = [
  { href: ROUTES.LEASE, label: 'My lease' },
  { href: ROUTES.PAYMENTS, label: 'Rent receipts' },
  { href: ROUTES.ONBOARDING, label: 'Onboarding' },
  { href: ROUTES.APPLICATIONS, label: 'Applications' },
] as const;

export default function DashboardPage() {
  const { pendingActions, loading, lease, maintenance, ingoingReport, rentReviews } =
    useTenantData();
  const actions = pendingActions.slice(0, 6);
  const openMaintenance = maintenance.filter(
    (m) => m.status !== 'completed' && m.status !== 'closed',
  );

  return (
    <TenantShell title="Home">
      <div className="space-y-5">
        <LifecycleBanner />
        <ArrearsBanner />

        {lease && (
          <div className="rounded-xl border bg-card p-4 text-sm">
            <p className="text-muted-foreground text-xs font-medium uppercase">Rent status</p>
            <p className="mt-1 font-semibold">{formatCurrency(lease.rentWeekly)}/week</p>
            <p className="text-muted-foreground text-xs">Next receipt in Payments</p>
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">What you need to do now</h2>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : actions.length === 0 ? (
            <div className="text-muted-foreground flex items-center gap-2 rounded-xl border border-dashed p-4 text-sm">
              <CheckCircle2 className="text-primary size-4 shrink-0" />
              You&apos;re all caught up
            </div>
          ) : (
            actions.map((item) => <ActionCard key={item.id} item={item} />)
          )}
        </section>

        {openMaintenance.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Maintenance updates</h2>
            {openMaintenance.slice(0, 2).map((m) => (
              <Link
                key={m.id}
                href={maintenanceDetail(m.id)}
                className="block rounded-xl border bg-card p-3 text-sm"
              >
                <p className="font-medium">{m.category}</p>
                <p className="text-primary text-xs">{m.statusLabel}</p>
                <p className="text-muted-foreground text-xs">{formatRelative(m.createdAt)}</p>
              </Link>
            ))}
          </section>
        )}

        {ingoingReport && ingoingReport.status !== 'confirmed' && (
          <section className="rounded-xl border border-primary/30 bg-card p-3 text-sm">
            <p className="font-medium">Ingoing report</p>
            <p className="text-muted-foreground text-xs capitalize">
              {ingoingReport.status.replace(/_/g, ' ')} · {ingoingReport.confirmedCount}/
              {ingoingReport.sections.length} sections
            </p>
          </section>
        )}

        {rentReviews.some((r) => r.status === 'pending') && (
          <section className="rounded-xl border border-amber-500/30 bg-card p-3 text-sm">
            <p className="font-medium">Rent review</p>
            <p className="text-muted-foreground text-xs">Response required — see Rent review</p>
          </section>
        )}

        <section>
          <h2 className="text-muted-foreground mb-2 text-xs font-medium uppercase">Quick links</h2>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-xl border bg-card px-3 py-3 text-sm font-medium hover:bg-secondary/50"
              >
                {label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </TenantShell>
  );
}

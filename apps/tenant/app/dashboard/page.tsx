'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

import { ActionCard } from '@/components/tenant/action-card';
import { LifecycleBanner } from '@/components/tenant/lifecycle-banner';
import { TenantShell } from '@/components/layout/tenant-shell';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';

const QUICK_LINKS = [
  // { href: ROUTES.LEASE, label: 'My lease' },
  // { href: ROUTES.PAYMENTS, label: 'Rent receipts' },
  // { href: ROUTES.ONBOARDING, label: 'Onboarding' },
  // { href: ROUTES.APPLICATIONS, label: 'Applications' },
] as const;

export default function DashboardPage() {
  const { pendingActions, loading } = useTenantData();
  const actions = pendingActions.slice(0, 6);

  return (
    <TenantShell title="Home">
      <div className="space-y-5">
        {/* <LifecycleBanner /> */}
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

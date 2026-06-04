'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { isDemoTenantEmail } from '@/lib/tenant-user';

/** Shown when a built-in demo agency account is signed in — confirms seed data is active. */
export function DemoTenancyBanner() {
  const { user } = useAuth();
  const { lease, loading } = useTenantData();

  if (loading || !user || !isDemoTenantEmail(user.email)) return null;

  if (!lease) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs">
        Signed in as <strong>{user.email}</strong> but demo tenancy did not load. Sign out, clear
        site data for this URL, then use <strong>Sign in</strong> (not Register) with your agency
        password.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
      Demo tenancy loaded for <strong className="text-foreground">{user.email}</strong> —{' '}
      {lease.propertyAddress}
    </div>
  );
}

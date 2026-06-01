'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { TenantShell } from '@/components/layout/tenant-shell';
import { displayName } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <TenantShell title="Profile">
      {user ? (
        <div className="space-y-4 text-sm">
          <div className="rounded-xl border bg-card p-4">
            <p className="font-semibold">{displayName(user)}</p>
            <p className="text-muted-foreground">{user.email}</p>
            {user.phone && <p className="text-muted-foreground mt-1">{user.phone}</p>}
          </div>
          <section>
            <h2 className="text-sm font-semibold">Emergency contact</h2>
            <p className="text-muted-foreground mt-1 text-sm">Add in settings when API is wired.</p>
          </section>
          <section>
            <h2 className="text-sm font-semibold">Document storage</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Lease, receipts, and uploaded proofs stored in-app (single source of truth).
            </p>
          </section>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Sign in to view your profile.</p>
      )}
    </TenantShell>
  );
}

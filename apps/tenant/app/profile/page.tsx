'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/components/providers/auth-provider';
import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import { displayName } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useAuth();
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  return (
    <TenantShell title="Profile">
      {user ? (
        <div className="space-y-5 text-sm">
          <div className="rounded-xl border bg-card p-4">
            <p className="font-semibold">{displayName(user)}</p>
            <p className="text-muted-foreground">{user.email}</p>
            {user.phone && <p className="text-muted-foreground mt-1">{user.phone}</p>}
          </div>

          <section className="space-y-3 rounded-xl border bg-card p-4">
            <h2 className="font-semibold">Emergency contact</h2>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => toast.success('Emergency contact saved')}
            >
              Save contact
            </Button>
          </section>

          <section>
            <h2 className="font-semibold">Document storage</h2>
            <p className="text-muted-foreground mt-1">
              Lease, receipts, deposit/bond proofs, and statements.
            </p>
            <Link href={ROUTES.DOCUMENTS} className="text-primary mt-2 inline-block text-xs font-medium">
              View all documents →
            </Link>
          </section>

          <Link href={ROUTES.SETTINGS} className="text-primary text-xs font-medium">
            Notification preferences in Settings →
          </Link>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Sign in to view your profile.</p>
      )}
    </TenantShell>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/components/providers/auth-provider';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { applicationDetail, ROUTES } from '@/constants/routes';
import { APPLICATION_STATUS_LABEL } from '@/lib/tenant-labels';
import { displayName, formatDateTime } from '@/lib/utils';

export default function ProfilePage() {
  const { user, status } = useAuth();
  const { applications } = useTenantData();
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  return (
    <TenantShell title="Profile">
      {status === 'loading' ? (
        <p className="text-muted-foreground text-sm">Loading profile…</p>
      ) : user ? (
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

          <section className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Rental applications</h2>
              <Link href={ROUTES.APPLICATIONS} className="text-primary text-xs font-medium">
                View all
              </Link>
            </div>
            {applications.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                Applications you submit will appear here with the full NSW form on file.
              </p>
            ) : (
              <ul className="space-y-2">
                {applications.slice(0, 3).map((app) => (
                  <li key={app.id}>
                    <Link
                      href={applicationDetail(app.id)}
                      className="hover:bg-muted/50 block rounded-lg border p-3"
                    >
                      <p className="font-medium">{app.propertyAddress}</p>
                      <p className="text-muted-foreground text-xs">
                        Ref {app.referenceNumber} · {formatDateTime(app.submittedAt)}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {APPLICATION_STATUS_LABEL[app.status]}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
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

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { ThemeSetting } from '@/components/theme-setting';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

const NOTIFICATION_TRIGGERS = [
  { id: 'application', label: 'Application approved/declined' },
  { id: 'deposit_bond', label: 'Deposit / bond due' },
  { id: 'lease_sign', label: 'Lease ready for signing' },
  { id: 'ingoing', label: 'Ingoing report pending' },
  { id: 'maintenance', label: 'Maintenance status updates' },
  { id: 'receipt', label: 'Rent receipt issued' },
  { id: 'rent_review', label: 'Rent review notice' },
  { id: 'renewal', label: 'Lease expiry / renewal (90-day)' },
  { id: 'arrears', label: 'Rent arrears reminders' },
  { id: 'outgoing', label: 'Outgoing report pending' },
  { id: 'statement', label: 'Final statement ready' },
] as const;

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_TRIGGERS.map((t) => [t.id, true])),
  );

  const agentUrl = process.env.NEXT_PUBLIC_AGENT_PORTAL_URL;
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL;

  return (
    <TenantShell title="Settings">
      <div className="space-y-5 text-sm">
        <ThemeSetting />

        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold">Notification preferences</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Push, in-app, SMS/email per trigger (§16 requirements doc).
          </p>
          <ul className="mt-3 space-y-2">
            {NOTIFICATION_TRIGGERS.map((t) => (
              <li key={t.id}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={prefs[t.id] ?? true}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, [t.id]: e.target.checked }))
                    }
                    className="accent-primary size-4"
                  />
                  {t.label}
                </label>
              </li>
            ))}
          </ul>
          <Button
            className="mt-4 w-full"
            variant="outline"
            onClick={() => toast.success('Preferences saved')}
          >
            Save preferences
          </Button>
        </section>

        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold">Help</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Common questions about sign-in, repairs, inspections, rent, and moving out.
          </p>
          <Link
            href={ROUTES.FAQ}
            className="text-primary mt-3 inline-block text-sm font-medium"
          >
            View FAQ →
          </Link>
        </section>

        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold">Connected systems</h2>
          <ul className="text-muted-foreground mt-2 space-y-1">
            <li>API: crossub_web (via /api proxy)</li>
            {webUrl && (
              <li>
                Staff web:{' '}
                <a href={webUrl} className="text-primary underline" target="_blank" rel="noreferrer">
                  {webUrl}
                </a>
              </li>
            )}
            {agentUrl && (
              <li>
                Agent portal:{' '}
                <a href={agentUrl} className="text-primary underline" target="_blank" rel="noreferrer">
                  {agentUrl}
                </a>
              </li>
            )}
          </ul>
        </section>
      </div>
    </TenantShell>
  );
}

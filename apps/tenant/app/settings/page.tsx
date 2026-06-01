'use client';

import { TenantShell } from '@/components/layout/tenant-shell';

export default function SettingsPage() {
  const agentUrl = process.env.NEXT_PUBLIC_AGENT_PORTAL_URL;
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL;

  return (
    <TenantShell title="Settings">
      <div className="space-y-4 text-sm">
        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold">Notification preferences</h2>
          <p className="text-muted-foreground mt-1">
            Push, in-app, SMS/email per trigger (applications, maintenance, rent review, etc.).
          </p>
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

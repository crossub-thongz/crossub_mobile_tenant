'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { TenantShell } from '@/components/layout/tenant-shell';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { messageDetail, ROUTES } from '@/constants/routes';
import { formatDateTime } from '@/lib/utils';

export default function MaintenanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { maintenance, messages } = useTenantData();
  const request = maintenance.find((m) => m.id === id);
  const thread = messages.find((m) => m.linkedCaseId === id);

  if (!request) {
    return (
      <TenantShell title="Maintenance" backHref={ROUTES.MAINTENANCE}>
        <p className="text-sm text-muted-foreground">Request not found.</p>
      </TenantShell>
    );
  }

  return (
    <TenantShell title={request.trackingNumber} backHref={ROUTES.MAINTENANCE}>
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="font-semibold">{request.category}</p>
          <p className="mt-2 text-sm">{request.description}</p>
          <p className="text-primary mt-3 font-medium">{request.statusLabel}</p>
          {request.statusHint && (
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{request.statusHint}</p>
          )}
          {request.contractorName && (
            <p className="text-muted-foreground mt-1 text-xs">
              Contractor: {request.contractorName}
            </p>
          )}
        </div>
        <section>
          <h2 className="text-sm font-semibold">Timeline</h2>
          <ul className="mt-2 space-y-2">
            {request.timeline.map((t) => (
              <li key={t.id} className="rounded-lg border px-3 py-2 text-sm">
                <p className="font-medium">{t.title}</p>
                <p className="text-muted-foreground text-xs">
                  {t.actor} · {formatDateTime(t.at)}
                </p>
              </li>
            ))}
          </ul>
        </section>
        <div className="flex flex-col gap-2">
          {thread && (
            <Link
              href={messageDetail(thread.id)}
              className="text-primary block text-center text-sm font-medium"
            >
              Message CROSSUB about this repair →
            </Link>
          )}
          {request.contractorName && thread?.contractorEnabled && (
            <p className="text-muted-foreground text-center text-xs">
              Contractor messaging enabled — open thread and switch to Contractor tab
            </p>
          )}
        </div>
      </div>
    </TenantShell>
  );
}

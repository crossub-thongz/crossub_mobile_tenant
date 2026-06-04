'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Phone } from 'lucide-react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { messageDetail, ROUTES } from '@/constants/routes';
import { cn, formatDateTime } from '@/lib/utils';

type Tab = 'overview' | 'status' | 'message';

export default function RepairDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { maintenance, messages, approveRepairCompletion } = useTenantData();
  const request = maintenance.find((m) => m.id === id);
  const thread = messages.find((m) => m.linkedCaseId === id);
  const [tab, setTab] = useState<Tab>('overview');

  if (!request) {
    return (
      <TenantShell title="Repair" backHref={ROUTES.REPAIRS}>
        <p className="text-sm text-muted-foreground">Not found.</p>
      </TenantShell>
    );
  }

  return (
    <TenantShell title={request.trackingNumber} backHref={ROUTES.REPAIRS}>
      <div className="space-y-4 pb-8">
        <div className="space-y-2">
          <div className="bg-secondary h-2 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-all"
              style={{ width: `${request.progressPercent}%` }}
            />
          </div>
          <p className="text-muted-foreground text-xs">{request.progressPercent}% complete</p>
        </div>

        <div className="rounded-xl border bg-card p-4 text-sm">
          <p className="text-muted-foreground text-xs uppercase">Property</p>
          <p className="font-medium">{request.propertyAddress}</p>
        </div>

        <div className="rounded-xl border bg-card p-4 text-sm">
          <p className="font-semibold">{request.category}</p>
          <p className="text-muted-foreground">{request.area}</p>
          <p className="mt-2">{request.description}</p>
          {request.scheduledAt && (
            <p className="text-primary mt-3 text-xs font-medium">
              Scheduled: {formatDateTime(request.scheduledAt)}
            </p>
          )}
          {request.contractorName && (
            <div className="mt-3 border-t border-border pt-3">
              <p className="font-medium">{request.contractorName}</p>
              {request.contractorPhone && (
                <a
                  href={`tel:${request.contractorPhone.replace(/\s/g, '')}`}
                  className="text-primary mt-1 flex items-center gap-1 text-xs"
                >
                  <Phone className="size-3" />
                  {request.contractorPhone}
                </a>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          {(['overview', 'status', 'message'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 rounded-md py-2 text-xs font-medium capitalize',
                tab === t ? 'bg-background' : 'text-muted-foreground',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="rounded-xl border bg-card p-4 text-sm">
            <p className="font-medium">Repair details</p>
            <p className="text-muted-foreground mt-2">{request.description}</p>
            <p className="text-muted-foreground mt-2 text-xs">
              Urgency: {request.urgency} · Ref {request.trackingNumber}
            </p>
          </div>
        )}

        {tab === 'status' && (
          <ul className="space-y-2">
            {request.timeline.map((t) => (
              <li key={t.id} className="rounded-lg border px-3 py-2 text-sm">
                <p className="font-medium">{t.title}</p>
                <p className="text-muted-foreground text-xs">
                  {t.actor} · {formatDateTime(t.at)}
                </p>
              </li>
            ))}
          </ul>
        )}

        {tab === 'message' && (
          <div className="space-y-2 text-sm">
            {thread ? (
              <Button asChild variant="outline" className="w-full">
                <Link href={messageDetail(thread.id)}>Open repair messages</Link>
              </Button>
            ) : (
              <p className="text-muted-foreground">No message thread yet.</p>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href={`${ROUTES.MESSAGES_NEW}?to=contractor&category=maintenance`}>
                Message contractor
              </Link>
            </Button>
            {request.contractorName && (
              <p className="text-muted-foreground text-xs">
                Contractor chat available in the message thread when enabled.
              </p>
            )}
          </div>
        )}

        {request.completionApprovalPending && !request.tenantCompletionApproved && (
          <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-full max-w-lg -translate-x-1/2 border-t border-border bg-background px-4 py-3">
            <p className="mb-2 text-sm font-medium">Completion approval</p>
            <p className="text-muted-foreground mb-3 text-xs">
              Confirm the repair is completed to your satisfaction.
            </p>
            <Button
              className="w-full"
              onClick={() => {
                approveRepairCompletion(request.id);
                toast.success('Repair completion confirmed');
              }}
            >
              Approve repair completed
            </Button>
          </div>
        )}
      </div>
    </TenantShell>
  );
}

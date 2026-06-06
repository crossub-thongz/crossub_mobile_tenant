'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  HardHat,
  ListTree,
  MessageSquare,
  Phone,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { InfoCard } from '@/components/tenant/info-card';
import { SegmentTabs } from '@/components/tenant/segment-tabs';
import { StatusBadge } from '@/components/tenant/status-badge';
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

  const needsApproval =
    request?.completionApprovalPending && !request.tenantCompletionApproved;

  if (!request) {
    return (
      <TenantShell title="Repair" backHref={ROUTES.REPAIRS}>
        <p className="text-sm text-muted-foreground">Repair not found.</p>
      </TenantShell>
    );
  }

  return (
    <TenantShell title={request.trackingNumber} backHref={ROUTES.REPAIRS}>
      <div className={cn('space-y-4', needsApproval && 'pb-36')}>
        {/* Progress hero */}
        <div className="from-primary/15 via-card to-card rounded-2xl border border-primary/20 bg-gradient-to-br p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Repair progress
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                {request.progressPercent}%
              </p>
            </div>
            <StatusBadge label={request.statusLabel} variant="action" />
          </div>
          <div className="bg-secondary/80 mt-4 h-2.5 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${request.progressPercent}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-2 text-xs">{request.trackingNumber}</p>
        </div>

        {/* Property */}
        <InfoCard icon={Building2} label="Property">
          <p className="font-medium leading-snug">{request.propertyAddress}</p>
        </InfoCard>

        {/* Repair request */}
        <InfoCard icon={Wrench} label="Repair request">
          <p className="text-lg font-semibold">{request.category}</p>
          <p className="text-muted-foreground text-sm">{request.area}</p>
          <p className="mt-3 text-sm leading-relaxed">{request.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge label={request.urgency} priority={request.urgency} />
          </div>
          {request.scheduledAt && (
            <div className="bg-primary/10 text-primary mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium">
              <CalendarClock className="size-4 shrink-0" />
              Scheduled {formatDateTime(request.scheduledAt)}
            </div>
          )}
        </InfoCard>

        {/* Contractor */}
        {request.contractorName && (
          <InfoCard icon={HardHat} label="Assigned contractor" accent="primary">
            <p className="font-semibold">{request.contractorName}</p>
            {request.contractorPhone && (
              <a
                href={`tel:${request.contractorPhone.replace(/\s/g, '')}`}
                className="text-primary mt-2 inline-flex items-center gap-2 text-sm font-medium"
              >
                <Phone className="size-4" />
                {request.contractorPhone}
              </a>
            )}
          </InfoCard>
        )}

        <SegmentTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'overview', label: 'Overview', icon: ClipboardList },
            { id: 'status', label: 'Status', icon: ListTree },
            { id: 'message', label: 'Message', icon: MessageSquare },
          ]}
        />

        {tab === 'overview' && (
          <InfoCard label="Details">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs uppercase">Description</dt>
                <dd className="mt-1 leading-relaxed">{request.description}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-muted-foreground text-xs uppercase">Urgency</dt>
                  <dd className="mt-1 capitalize">{request.urgency}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase">Area</dt>
                  <dd className="mt-1">{request.area}</dd>
                </div>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase">Submitted</dt>
                <dd className="mt-1">{formatDateTime(request.createdAt)}</dd>
              </div>
            </dl>
          </InfoCard>
        )}

        {tab === 'status' && (
          <div className="relative space-y-0 pl-2">
            {request.timeline.map((entry, i) => (
              <div key={entry.id} className="relative flex gap-4 pb-5 last:pb-0">
                {i < request.timeline.length - 1 && (
                  <span className="bg-border absolute top-3 left-[7px] h-[calc(100%-4px)] w-px" />
                )}
                <span className="bg-primary relative z-10 mt-1.5 size-3.5 shrink-0 rounded-full ring-4 ring-background" />
                <div className="min-w-0 flex-1 rounded-xl border bg-card px-3 py-2.5">
                  <p className="font-medium">{entry.title}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {entry.actor} · {formatDateTime(entry.at)}
                  </p>
                  {entry.detail && (
                    <p className="text-muted-foreground mt-1 text-xs">{entry.detail}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'message' && (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Contact CROSSUB or your assigned contractor about this repair.
            </p>
            {thread && (
              <Button asChild variant="secondary" className="w-full">
                <Link href={messageDetail(thread.id)}>
                  <MessageSquare className="size-4" />
                  Open repair message thread
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href={`${ROUTES.MESSAGES_NEW}?to=agent&category=maintenance`}>
                Message CROSSUB
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`${ROUTES.MESSAGES_NEW}?to=contractor&category=maintenance`}>
                <HardHat className="size-4" />
                Message contractor
              </Link>
            </Button>
          </div>
        )}
      </div>

      {needsApproval && (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-full max-w-lg -translate-x-1/2 border-t border-primary/20 bg-background/95 px-4 py-4 backdrop-blur">
          <div className="from-primary/10 to-card rounded-2xl border border-primary/25 bg-gradient-to-br p-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/15 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                <CheckCircle2 className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Completion approval</p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  The contractor has marked this repair complete. Confirm you are satisfied
                  with the work.
                </p>
              </div>
            </div>
            <Button
              className="mt-4 w-full"
              onClick={() => {
                approveRepairCompletion(request.id);
                toast.success('Repair completion confirmed');
              }}
            >
              Approve repair completed
            </Button>
          </div>
        </div>
      )}
    </TenantShell>
  );
}

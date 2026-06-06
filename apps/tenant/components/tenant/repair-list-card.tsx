import Link from 'next/link';
import { ChevronRight, Wrench } from 'lucide-react';

import { StatusBadge } from '@/components/tenant/status-badge';
import { repairDetail } from '@/constants/routes';
import type { MaintenanceRequest } from '@/lib/types';
import { cn, formatRelative } from '@/lib/utils';

export function RepairListCard({
  repair,
  showProgress = false,
}: {
  repair: MaintenanceRequest;
  showProgress?: boolean;
}) {
  return (
    <Link
      href={repairDetail(repair.id)}
      className="group block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-card/80"
    >
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Wrench className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-muted-foreground text-[11px] font-medium tracking-wide">
                {repair.trackingNumber}
              </p>
              <p className="mt-0.5 truncate font-semibold">{repair.category}</p>
              <p className="text-muted-foreground truncate text-xs">{repair.area}</p>
            </div>
            <ChevronRight className="text-muted-foreground size-4 shrink-0 opacity-60 transition group-hover:opacity-100" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge label={repair.statusLabel} variant="action" />
            <span className="text-muted-foreground text-[11px]">
              {formatRelative(repair.createdAt)}
            </span>
          </div>
          {showProgress && (
            <div className="mt-3 space-y-1">
              <div className="bg-secondary h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${repair.progressPercent}%` }}
                />
              </div>
              <p className="text-muted-foreground text-[10px]">
                {repair.progressPercent}% complete
              </p>
            </div>
          )}
          {repair.completionApprovalPending && !repair.tenantCompletionApproved && (
            <p
              className={cn(
                'mt-2 text-[11px] font-medium text-amber-400',
              )}
            >
              Completion approval needed
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

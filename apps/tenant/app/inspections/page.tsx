'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronRight, ClipboardCheck, DoorOpen, Repeat, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { EmptyState } from '@/components/tenant/empty-state';
import { PageIntro, SectionTitle } from '@/components/tenant/page-intro';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import type { InspectionListType } from '@/lib/types';
import { cn, formatDateTime } from '@/lib/utils';

type InspectionFilter = 'all' | InspectionListType;

const TYPE_FILTERS: { value: InspectionFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'ingoing', label: 'Ingoing' },
  { value: 'outgoing', label: 'Outgoing' },
  { value: 'routine', label: 'Routine' },
];

const TYPE_META: Record<
  InspectionListType,
  { label: string; icon: LucideIcon; description: string }
> = {
  ingoing: {
    label: 'Ingoing',
    icon: DoorOpen,
    description: 'Condition report at move-in — confirm each section',
  },
  outgoing: {
    label: 'Outgoing',
    icon: ClipboardCheck,
    description: 'End-of-lease condition report',
  },
  routine: {
    label: 'Routine',
    icon: Repeat,
    description: 'Periodic property inspection',
  },
};

export default function InspectionsPage() {
  const { inspections } = useTenantData();
  const [typeFilter, setTypeFilter] = useState<InspectionFilter>('all');

  const counts = useMemo(() => {
    const map: Record<InspectionFilter, number> = {
      all: inspections.length,
      ingoing: 0,
      outgoing: 0,
      routine: 0,
    };
    for (const i of inspections) {
      map[i.type] += 1;
    }
    return map;
  }, [inspections]);

  const filtered = useMemo(
    () =>
      typeFilter === 'all'
        ? inspections
        : inspections.filter((i) => i.type === typeFilter),
    [inspections, typeFilter],
  );

  return (
    <TenantShell title="Inspection">
      <PageIntro description="View ingoing, outgoing, and routine inspections linked to your tenancy." />

      <SectionTitle>Type</SectionTitle>
      <div className="mb-5 -mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max gap-2">
          {TYPE_FILTERS.map((f) => {
            const active = typeFilter === f.value;
            const count = counts[f.value];
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setTypeFilter(f.value)}
                aria-pressed={active}
                className={cn(
                  'shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold tracking-wide transition-all',
                  active
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/30',
                )}
              >
                {f.label}
                {count > 0 && (
                  <span className={cn('ml-1.5', active ? 'opacity-90' : 'opacity-70')}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title={`No ${typeFilter === 'all' ? '' : `${TYPE_META[typeFilter].label.toLowerCase()} `}inspections`}
            description={
              typeFilter === 'all'
                ? 'Inspections will appear here when scheduled or assigned to your tenancy.'
                : `You don't have any ${TYPE_META[typeFilter].label.toLowerCase()} inspections on file yet.`
            }
            action={
              typeFilter !== 'all' ? (
                <button
                  type="button"
                  className="text-primary text-sm font-medium"
                  onClick={() => setTypeFilter('all')}
                >
                  Show all inspections
                </button>
              ) : undefined
            }
          />
        ) : (
          filtered.map((i) => {
            const meta = TYPE_META[i.type];
            const Icon = meta.icon;
            return (
              <Link
                key={i.id}
                href={i.href}
                className="group flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/25"
              >
                <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={meta.label} variant="action" />
                    <span className="text-muted-foreground text-xs">{i.status}</span>
                  </div>
                  <p className="mt-1.5 font-semibold">{i.propertyAddress}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">{meta.description}</p>
                  {i.scheduledAt && (
                    <p className="text-primary mt-2 text-xs font-medium">
                      {formatDateTime(i.scheduledAt)}
                    </p>
                  )}
                </div>
                <ChevronRight className="text-muted-foreground size-4 shrink-0 group-hover:text-primary" />
              </Link>
            );
          })
        )}
      </div>
    </TenantShell>
  );
}

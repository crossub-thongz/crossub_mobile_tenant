'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { History, Plus, Wrench } from 'lucide-react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { EmptyState } from '@/components/tenant/empty-state';
import { PageIntro } from '@/components/tenant/page-intro';
import { RepairListCard } from '@/components/tenant/repair-list-card';
import { SegmentTabs } from '@/components/tenant/segment-tabs';
import { Button } from '@/components/ui/button';
import { InfoCard } from '@/components/tenant/info-card';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { repairNew } from '@/constants/routes';

export default function RepairsPage() {
  const { maintenance } = useTenantData();
  const [tab, setTab] = useState<'active' | 'history'>('active');

  const active = useMemo(
    () =>
      maintenance.filter(
        (m) => m.status !== 'closed' && !m.tenantCompletionApproved,
      ),
    [maintenance],
  );
  const history = useMemo(
    () =>
      maintenance.filter(
        (m) => m.status === 'closed' || m.tenantCompletionApproved,
      ),
    [maintenance],
  );
  const list = tab === 'active' ? active : history;

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of history) {
      counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [history]);

  return (
    <TenantShell title="Repair">
      <PageIntro description="Report new issues, track active repairs, and review your full maintenance history at this property." />

      <Button asChild className="mb-5 w-full shadow-lg shadow-primary/10">
        <Link href={repairNew()}>
          <Plus className="size-4" /> Report a repair
        </Link>
      </Button>

      <SegmentTabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'active', label: 'Active', icon: Wrench, count: active.length },
          { id: 'history', label: 'History', icon: History, count: history.length },
        ]}
      />

      {tab === 'history' && history.length > 0 && (
        <InfoCard icon={History} label="Repair history summary" className="mb-5">
          <p className="text-2xl font-bold">{history.length}</p>
          <p className="text-muted-foreground text-sm">
            completed repair{history.length !== 1 ? 's' : ''} since your tenancy started
          </p>
          {categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map(([cat, n]) => (
                <span
                  key={cat}
                  className="bg-secondary rounded-full px-2.5 py-1 text-xs font-medium"
                >
                  {cat} · {n}
                </span>
              ))}
            </div>
          )}
        </InfoCard>
      )}

      <div className="space-y-3">
        {list.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title={tab === 'active' ? 'No active repairs' : 'No repair history yet'}
            description={
              tab === 'active'
                ? 'When you report an issue, it will appear here with live progress.'
                : 'Completed repairs will be listed here for your records.'
            }
            action={
              tab === 'active' ? (
                <Button asChild size="sm">
                  <Link href={repairNew()}>Report a repair</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          list.map((m) => (
            <RepairListCard key={m.id} repair={m} showProgress={tab === 'active'} />
          ))
        )}
      </div>
    </TenantShell>
  );
}

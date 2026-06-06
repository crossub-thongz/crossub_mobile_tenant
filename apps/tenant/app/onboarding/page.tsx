'use client';

import Link from 'next/link';
import { CheckCircle2, ChevronRight } from 'lucide-react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { PageIntro } from '@/components/tenant/page-intro';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

export default function OnboardingPage() {
  const { onboardingSteps } = useTenantData();
  const completed = onboardingSteps.filter((s) => s.status === 'completed').length;

  return (
    <TenantShell title="Onboarding">
      <PageIntro description="Complete each step after your application is approved — deposit, bond, lease signing, key pickup, and ingoing inspection confirmation." />

      <div className="from-primary/10 to-card mb-5 rounded-2xl border border-primary/20 bg-gradient-to-br p-4">
        <p className="text-muted-foreground text-xs font-medium uppercase">Progress</p>
        <p className="mt-1 text-2xl font-bold">
          {completed}/{onboardingSteps.length}
          <span className="text-muted-foreground text-base font-normal"> steps complete</span>
        </p>
        <div className="bg-secondary mt-3 h-2 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all"
            style={{
              width: `${onboardingSteps.length ? (completed / onboardingSteps.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {onboardingSteps.map((step, i) => {
          const done = step.status === 'completed';
          return (
            <Link
              key={step.id}
              href={step.href}
              className={cn(
                'group flex items-center gap-3.5 rounded-2xl border p-4 transition-colors',
                done
                  ? 'border-primary/20 bg-primary/5'
                  : 'border-border bg-card hover:border-primary/25',
              )}
            >
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-xl',
                  done ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground',
                )}
              >
                {done ? (
                  <CheckCircle2 className="size-5" />
                ) : (
                  <span className="text-sm font-semibold">{i + 1}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{step.title}</p>
                <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                  {step.description}
                </p>
                {step.amount != null && (
                  <p className="text-primary mt-1.5 text-xs font-medium">
                    {formatCurrency(step.amount)}
                    {step.dueAt && ` · due ${formatDate(step.dueAt)}`}
                  </p>
                )}
                <StatusBadge
                  label={step.status}
                  variant={done ? 'success' : 'action'}
                  className="mt-2"
                />
              </div>
              <ChevronRight className="text-muted-foreground size-4 shrink-0 group-hover:text-primary" />
            </Link>
          );
        })}
      </div>
    </TenantShell>
  );
}

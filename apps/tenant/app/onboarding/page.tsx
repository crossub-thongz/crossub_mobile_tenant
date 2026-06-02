'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function OnboardingPage() {
  const { onboardingSteps } = useTenantData();

  return (
    <TenantShell title="Onboarding">
      <p className="text-muted-foreground mb-4 text-sm">
        Approved tenant checklist — deposit and bond are separate payments (both required when
        applicable), then lease signing, account setup, and ingoing report.
      </p>
      <div className="space-y-2">
        {onboardingSteps.map((step, i) => (
          <Link
            key={step.id}
            href={step.href}
            className="flex items-center gap-3 rounded-xl border bg-card p-4"
          >
            <span className="text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{step.title}</p>
              <p className="text-muted-foreground line-clamp-2 text-xs">{step.description}</p>
              {step.amount != null && (
                <p className="text-primary mt-1 text-xs">
                  {formatCurrency(step.amount)}
                  {step.dueAt && ` · due ${formatDate(step.dueAt)}`}
                </p>
              )}
              <StatusBadge
                label={step.status}
                variant={step.status === 'completed' ? 'success' : 'action'}
                className="mt-2"
              />
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </TenantShell>
  );
}

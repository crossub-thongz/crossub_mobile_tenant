'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { isOnboardingChecklistComplete } from '@/lib/new-leasing';
import type { OnboardingStepStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<OnboardingStepStatus, string> = {
  pending: 'Not started',
  uploaded: 'Pending confirmation',
  approved: 'Approved',
  completed: 'Done',
};

const STATUS_VARIANT: Record<
  OnboardingStepStatus,
  'danger' | 'action' | 'success' | 'default' | 'warning'
> = {
  pending: 'danger',
  uploaded: 'warning',
  approved: 'success',
  completed: 'success',
};

export default function OnboardingPage() {
  const { onboardingSteps, leasingOnboarding, loading } = useTenantData();
  const [applicationDocsOpen, setApplicationDocsOpen] = useState(false);
  const completed = onboardingSteps.filter((s) => s.status === 'completed').length;
  const onboardingComplete = isOnboardingChecklistComplete(onboardingSteps);
  const applicationDocs = leasingOnboarding?.applicationDocuments ?? [];

  return (
    <TenantShell title="Onboarding">
      <p className="text-muted-foreground mb-4 text-sm">
        {onboardingComplete
          ? 'Your onboarding is complete. You can still review your checklist and documents below.'
          : 'Live status from your leasing cycle (step 4 — onboarding). Your agent creates your login after approving your application.'}
      </p>

      {leasingOnboarding && (
        <div className="mb-4 rounded-xl border bg-card p-4 text-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold">{leasingOnboarding.propertyAddress}</p>
            {onboardingComplete ? (
              <StatusBadge label="Completed" variant="success" />
            ) : null}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Application: {leasingOnboarding.applicationStatus.toLowerCase()} · Leasing:{' '}
            {onboardingComplete
              ? 'Completed'
              : leasingOnboarding.lifecycleStep.replace(/_/g, ' ')}
          </p>
        </div>
      )}

      {applicationDocs.length > 0 && (
        <div className="mb-4 rounded-xl border bg-card">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
            onClick={() => setApplicationDocsOpen((value) => !value)}
            aria-expanded={applicationDocsOpen}
          >
            <span className="text-sm font-semibold">Application documents</span>
            <span className="text-muted-foreground flex items-center gap-2 text-[11px]">
              {applicationDocs.length} file{applicationDocs.length === 1 ? '' : 's'}
              <ChevronDown
                className={cn(
                  'size-4 shrink-0 transition-transform',
                  applicationDocsOpen && 'rotate-180',
                )}
              />
            </span>
          </button>
          {applicationDocsOpen ? (
            <div className="space-y-2 border-t px-4 py-3">
              <p className="text-muted-foreground text-xs">
                Files you uploaded with your NSW tenancy application — stored under new-leasing
                onboarding.
              </p>
              <ul className="space-y-2">
                {applicationDocs.map((doc) => (
                  <li
                    key={`${doc.documentType}-${doc.url}`}
                    className="rounded-lg border p-3 text-sm"
                  >
                    <p className="font-medium">{doc.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {doc.category}
                      {doc.points != null ? ` · ${doc.points} pts` : ''} · {doc.fileName}
                    </p>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary mt-1 inline-block text-xs underline"
                    >
                      View uploaded file
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">
            {completed}/{onboardingSteps.length}
          </span>
        </div>
        <div className="bg-secondary h-2 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full transition-all"
            style={{
              width: `${onboardingSteps.length ? (completed / onboardingSteps.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {onboardingSteps.map((step, i) => (
          <Link
            key={step.id}
            href={step.href}
            className="flex items-center justify-between rounded-xl border bg-card p-4 active:bg-secondary/50"
          >
            <div className="min-w-0 pr-3">
              <p className="text-muted-foreground text-xs">Step {i + 1}</p>
              <p className="font-medium">{step.title}</p>
              <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{step.description}</p>
            </div>
            <StatusBadge
              label={STATUS_LABEL[step.status]}
              variant={STATUS_VARIANT[step.status]}
            />
          </Link>
        ))}
      </div>

      {onboardingSteps.length === 0 && !loading && (
        <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
          No onboarding steps yet. After your agent opens a new-leasing case and approves your
          application, your move-in checklist will appear here.
        </p>
      )}
    </TenantShell>
  );
}

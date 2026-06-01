'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/utils';

export default function IngoingReportPage() {
  const { id } = useParams<{ id: string }>();
  const { ingoingReport, confirmIngoingSection } = useTenantData();
  const [disputeText, setDisputeText] = useState<Record<string, string>>({});

  if (!ingoingReport || ingoingReport.id !== id) {
    return (
      <TenantShell title="Ingoing report" backHref={ROUTES.ONBOARDING}>
        <p className="text-sm text-muted-foreground">Report not found.</p>
      </TenantShell>
    );
  }

  const total = ingoingReport.sections.length;

  return (
    <TenantShell title="Ingoing report" backHref={ROUTES.ONBOARDING}>
      <p className="text-muted-foreground mb-2 text-sm">{ingoingReport.propertyAddress}</p>
      <p className="mb-4 text-xs">
        Confirm section-by-section · Due {formatDate(ingoingReport.dueBy)} ·{' '}
        {ingoingReport.confirmedCount}/{total} confirmed · Status:{' '}
        {ingoingReport.status.replace(/_/g, ' ')}
      </p>
      <div className="space-y-4">
        {ingoingReport.sections.map((section) => (
          <div key={section.id} className="rounded-xl border bg-card p-4">
            <p className="font-semibold">{section.room}</p>
            <p className="text-muted-foreground mt-1 text-sm">{section.description}</p>
            {section.tenantConfirmed && (
              <p className="text-primary mt-2 text-xs">Confirmed</p>
            )}
            {section.tenantDispute && (
              <p className="text-amber-400 mt-2 text-xs">Dispute: {section.tenantDispute}</p>
            )}
            {!section.tenantConfirmed && !section.tenantDispute && (
              <div className="mt-3 space-y-2">
                <textarea
                  className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Optional comment or dispute"
                  value={disputeText[section.id] ?? ''}
                  onChange={(e) =>
                    setDisputeText((prev) => ({ ...prev, [section.id]: e.target.value }))
                  }
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const d = disputeText[section.id]?.trim();
                      if (d) {
                        confirmIngoingSection(section.id, d);
                        toast.info('Dispute recorded — timestamped for audit');
                      } else {
                        toast.error('Enter a dispute comment or confirm without dispute');
                      }
                    }}
                  >
                    Raise dispute
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      confirmIngoingSection(section.id);
                      toast.success(`${section.room} confirmed`);
                    }}
                  >
                    Confirm section
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </TenantShell>
  );
}

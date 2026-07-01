'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AlertTriangle, Calendar, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { EmptyState } from '@/components/tenant/empty-state';
import { InfoCard } from '@/components/tenant/info-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/utils';

export default function TerminationPage() {
  const { terminationNotice, startVacating } = useTenantData();
  const [moveOut, setMoveOut] = useState('');

  if (!terminationNotice) {
    return (
      <TenantShell title="Termination" backHref={ROUTES.DASHBOARD}>
        <EmptyState
          icon={AlertTriangle}
          title="No termination notice"
          description="If CROSSUB or your property manager needs to end your lease, you will receive a notification here with next steps."
        />
      </TenantShell>
    );
  }

  return (
    <TenantShell title="Termination notice" backHref={ROUTES.DASHBOARD}>
      <div className="space-y-5">
        <InfoCard icon={AlertTriangle} label="Notice from CROSSUB" accent="danger">
          <p className="font-semibold">{terminationNotice.propertyAddress}</p>
          <p className="mt-3 text-sm leading-relaxed">{terminationNotice.reason}</p>
          <p className="text-muted-foreground mt-4 text-xs">
            Please respond by <strong className="text-foreground">{formatDate(terminationNotice.respondBy)}</strong>
          </p>
          {terminationNotice.vacateDeadline && (
            <p className="text-muted-foreground mt-1 text-xs">
              Vacate deadline: {formatDate(terminationNotice.vacateDeadline)}
            </p>
          )}
        </InfoCard>

        <Button asChild variant="outline" className="h-11 w-full">
          <Link href={ROUTES.MESSAGES_NEW}>
            <MessageSquare className="size-4" />
            Message CROSSUB
          </Link>
        </Button>

        <InfoCard icon={Calendar} label="Select move-out date">
          <p className="text-muted-foreground mb-3 text-sm">
            Confirm when you plan to vacate. We can then suggest moving and cleaning services.
          </p>
          <Input
            type="date"
            value={moveOut}
            onChange={(e) => setMoveOut(e.target.value)}
          />
          <Button
            className="mt-4 w-full"
            onClick={() => {
              if (!moveOut) return toast.error('Select a date');
              void startVacating(moveOut, terminationNotice.reason).then(() => {
                toast.success('Vacating case started');
                window.location.href = ROUTES.VACATING;
              });
            }}
          >
            Confirm vacating date
          </Button>
        </InfoCard>
      </div>
    </TenantShell>
  );
}

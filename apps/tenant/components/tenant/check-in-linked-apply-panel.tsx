'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ApplicationRentalFacts } from '@/components/tenant/application-rental-facts';
import { PageIntro } from '@/components/tenant/page-intro';
import { Button } from '@/components/ui/button';
import { propertyCheckIn } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/api-error-message';
import {
  defaultMoveInDate,
  loadOpenInspectionCheckIn,
  type StoredOpenInspectionCheckIn,
} from '@/lib/open-inspection-check-in-store';
import { submitGuestApplication } from '@/lib/crossub-api/public-listings-client';
import type { ListingProperty } from '@/lib/types';

function CheckInSummary({ checkIn }: { checkIn: StoredOpenInspectionCheckIn }) {
  const rows = [
    { label: 'Full name', value: checkIn.name },
    { label: 'Mobile', value: checkIn.phone },
    { label: 'E-mail', value: checkIn.email },
    { label: 'Lease term', value: checkIn.leaseTerm },
    { label: 'Pets', value: checkIn.pets },
    { label: 'Visitor special request', value: checkIn.specialRequest },
    { label: 'Comments', value: checkIn.comments },
  ].filter((row) => row.value?.trim());

  return (
    <dl className="space-y-2 rounded-xl border bg-card p-4 text-sm">
      {rows.map((row) => (
        <div key={row.label}>
          <dt className="text-muted-foreground text-xs font-medium">{row.label}</dt>
          <dd className="mt-0.5 font-medium">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CheckInLinkedApplyPanel({
  property,
  viewingSessionId,
  onApplied,
}: {
  property: ListingProperty;
  viewingSessionId?: string;
  onApplied: (reference: string) => void;
}) {
  const [checkIn, setCheckIn] = useState<StoredOpenInspectionCheckIn | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!viewingSessionId) {
      setCheckIn(null);
      return;
    }
    setCheckIn(loadOpenInspectionCheckIn(property.id, viewingSessionId));
  }, [property.id, viewingSessionId]);

  const onApply = async () => {
    if (!checkIn || !viewingSessionId) return;

    setSubmitting(true);
    try {
      const result = await submitGuestApplication(property.id, {
        fullName: checkIn.name,
        email: checkIn.email,
        phone: checkIn.phone,
        annualIncome: 0,
        employmentStatus: 'employed',
        moveInDate: defaultMoveInDate(property.availableFrom),
        viewingSessionId,
        formData: {
          source: 'open_inspection_check_in',
          attendeeId: checkIn.attendeeId,
          checkIn: {
            sessionId: checkIn.sessionId,
            leaseTerm: checkIn.leaseTerm,
            pets: checkIn.pets,
            specialRequest: checkIn.specialRequest,
            comments: checkIn.comments,
            checkedInAt: checkIn.checkedInAt,
          },
        },
      });

      toast.success('Application submitted', {
        description: `Reference ${result.reference} — linked to your open inspection check-in.`,
      });
      onApplied(result.reference);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not submit application'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!viewingSessionId) {
    return (
      <div className="space-y-4">
        <PageIntro
          title={property.address}
          description="Apply using your open inspection check-in details. Use the check-in link from the property first, then return here to apply."
        />
        <ApplicationRentalFacts property={property} />
        <p className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
          This apply link is missing the open inspection session. Scan the check-in QR at the
          property, complete check-in, then use the apply link from that flow.
        </p>
      </div>
    );
  }

  if (!checkIn) {
    return (
      <div className="space-y-4">
        <PageIntro
          title={property.address}
          description="Check in at the open inspection first — your application will use those details."
        />
        <ApplicationRentalFacts property={property} />
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <p className="text-muted-foreground text-sm">
            We could not find a check-in for this viewing on this device. Complete check-in, then
            come back to apply with one tap.
          </p>
          <Button asChild className="w-full">
            <Link href={propertyCheckIn(property.id, viewingSessionId)}>Check in first</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageIntro
        title={property.address}
        description="Submit your application using the details from your open inspection check-in."
      />
      <ApplicationRentalFacts property={property} />
      <div className="space-y-2">
        <p className="text-sm font-semibold">Your check-in details</p>
        <CheckInSummary checkIn={checkIn} />
      </div>
      <Button type="button" className="w-full" disabled={submitting} onClick={() => void onApply()}>
        {submitting ? 'Submitting…' : 'Apply using check-in details'}
      </Button>
      <p className="text-muted-foreground text-center text-xs">
        Need to update your details?{' '}
        <Link href={propertyCheckIn(property.id, viewingSessionId)} className="text-primary underline">
          Check in again
        </Link>
      </p>
    </div>
  );
}

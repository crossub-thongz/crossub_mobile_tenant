'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { propertyDetail, ROUTES } from '@/constants/routes';

export default function ApplySuccessPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const reference = searchParams.get('ref');
  const { listings } = useTenantData();
  const property = listings.find((p) => p.id === id);

  return (
    <TenantShell title="Application received" backHref={ROUTES.PROPERTIES}>
      <div className="flex flex-col items-center rounded-2xl border bg-card px-6 py-10 text-center">
        <div className="bg-primary/15 text-primary mb-4 flex size-14 items-center justify-center rounded-2xl">
          <CheckCircle2 className="size-7" />
        </div>
        <h1 className="text-lg font-semibold">Thank you — application submitted</h1>
        {property && (
          <p className="text-muted-foreground mt-2 text-sm">{property.address}</p>
        )}
        {reference && (
          <p className="mt-4 rounded-lg bg-secondary px-4 py-2 text-sm font-medium">
            Reference: {reference}
          </p>
        )}
        <p className="text-muted-foreground mt-4 max-w-sm text-sm">
          Your details are now in CROSSUB leasing. The team will review your application
          and contact you by email.
        </p>
        <div className="mt-6 flex w-full flex-col gap-2">
          <Button asChild variant="outline" className="w-full">
            <Link href={property ? propertyDetail(property.id) : ROUTES.PROPERTIES}>
              Back to property
            </Link>
          </Button>
          <Button asChild className="w-full">
            <Link href={ROUTES.PROPERTIES}>Browse more properties</Link>
          </Button>
        </div>
      </div>
    </TenantShell>
  );
}

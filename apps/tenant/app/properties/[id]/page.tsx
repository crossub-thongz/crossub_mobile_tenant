'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { propertyApply, ROUTES } from '@/constants/routes';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { listings } = useTenantData();
  const property = listings.find((p) => p.id === id);

  if (!property) {
    return (
      <TenantShell title="Property" backHref={ROUTES.PROPERTIES}>
        <p className="text-muted-foreground text-sm">Property not found.</p>
      </TenantShell>
    );
  }

  return (
    <TenantShell title={property.address} backHref={ROUTES.PROPERTIES}>
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-primary text-lg font-semibold">
            {formatCurrency(property.rentWeekly)}/week
          </p>
          <p className="text-muted-foreground text-sm">
            {property.suburb} · {property.propertyType} · Available {property.availableFrom}
          </p>
          {property.openInspectionAt && (
            <p className="mt-2 text-sm">
              Open inspection: {formatDateTime(property.openInspectionAt)}
            </p>
          )}
        </div>
        <div>
          <h2 className="text-sm font-semibold">Features</h2>
          <ul className="text-muted-foreground mt-2 list-inside list-disc text-sm">
            {property.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
        <Button asChild className="w-full">
          <Link href={propertyApply(property.id)}>Apply for this property</Link>
        </Button>
      </div>
    </TenantShell>
  );
}

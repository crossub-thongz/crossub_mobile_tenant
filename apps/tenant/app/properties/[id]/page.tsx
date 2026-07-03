'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { propertyApply, ROUTES } from '@/constants/routes';
import {
  fetchPublicListing,
} from '@/lib/crossub-api/public-listings-client';
import type { ListingProperty } from '@/lib/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { listings } = useTenantData();
  const fromList = listings.find((p) => p.id === id);
  const [property, setProperty] = useState<ListingProperty | null>(fromList ?? null);
  const [loading, setLoading] = useState(!fromList);

  useEffect(() => {
    if (fromList) {
      setProperty(fromList);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchPublicListing(id)
      .then((row) => {
        if (!cancelled) setProperty(row);
      })
      .catch(() => {
        if (!cancelled) setProperty(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fromList, id]);

  if (loading) {
    return (
      <TenantShell title="Property" backHref={ROUTES.PROPERTIES}>
        <p className="text-muted-foreground text-sm">Loading property…</p>
      </TenantShell>
    );
  }

  if (!property) {
    return (
      <TenantShell title="Property" backHref={ROUTES.PROPERTIES}>
        <p className="text-muted-foreground text-sm">Property not found.</p>
      </TenantShell>
    );
  }

  const canApply = property.canApply !== false;

  return (
    <TenantShell title={property.address} backHref={ROUTES.PROPERTIES}>
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-4">
          {property.rentWeekly > 0 ? (
            <p className="text-primary text-lg font-semibold">
              {formatCurrency(property.rentWeekly)}/week
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">Rent on application</p>
          )}
          <p className="text-muted-foreground text-sm">
            {property.propertyType}
            {property.status ? ` · ${property.status.replace('_', ' ')}` : ''}
            {property.availableFrom !== 'TBC' ? ` · Available ${property.availableFrom}` : ''}
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
        {canApply ? (
          <Button asChild className="w-full">
            <Link href={propertyApply(property.id)}>Apply for this property</Link>
          </Button>
        ) : (
          <p className="text-muted-foreground rounded-xl border border-dashed p-4 text-center text-sm">
            This property is not accepting applications right now.
          </p>
        )}
      </div>
    </TenantShell>
  );
}

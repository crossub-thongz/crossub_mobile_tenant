'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Calendar, MapPin } from 'lucide-react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { PropertyFiltersBar } from '@/components/tenant/property-filters';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { DEFAULT_PROPERTY_FILTERS, filterListings } from '@/lib/filter-listings';
import { propertyDetail } from '@/constants/routes';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function PropertiesPage() {
  const { listings } = useTenantData();
  const [filters, setFilters] = useState(DEFAULT_PROPERTY_FILTERS);
  const suburbs = useMemo(
    () => [...new Set(listings.map((p) => p.suburb))].sort(),
    [listings],
  );
  const filtered = useMemo(
    () => filterListings(listings, filters),
    [listings, filters],
  );

  return (
    <TenantShell title="Available properties">
      <p className="text-muted-foreground mb-4 text-sm">
        Listings from the leasing workflow — filter by suburb, rent, type, and open inspection.
      </p>
      <PropertyFiltersBar filters={filters} onChange={setFilters} suburbs={suburbs} />
      <p className="text-muted-foreground my-3 text-xs">
        {filtered.length} propert{filtered.length === 1 ? 'y' : 'ies'}
      </p>
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
            No properties match your filters.
          </p>
        ) : (
          filtered.map((p) => (
            <Link
              key={p.id}
              href={propertyDetail(p.id)}
              className="block rounded-xl border bg-card p-4 hover:bg-secondary/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{p.address}</p>
                  <p className="text-muted-foreground flex items-center gap-1 text-xs">
                    <MapPin className="size-3" /> {p.suburb}
                  </p>
                </div>
                <StatusBadge label={p.propertyType} />
              </div>
              <p className="text-primary mt-2 text-sm font-medium">
                {formatCurrency(p.rentWeekly)}/week
              </p>
              <p className="text-muted-foreground text-xs">
                Available {p.availableFrom} · {p.bedrooms} bed · {p.bathrooms} bath
              </p>
              {p.openInspectionAt && (
                <p className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
                  <Calendar className="size-3" />
                  Open inspection {formatDateTime(p.openInspectionAt)}
                </p>
              )}
              <span className="text-primary mt-3 inline-block text-xs font-medium">
                View & apply →
              </span>
            </Link>
          ))
        )}
      </div>
    </TenantShell>
  );
}

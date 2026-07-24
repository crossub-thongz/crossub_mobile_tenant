'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { PropertyFiltersBar } from '@/components/tenant/property-filters';
import { ListingOpenInspectionFacts } from '@/components/tenant/listing-open-inspection-facts';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { DEFAULT_PROPERTY_FILTERS, filterAndSortListings } from '@/lib/filter-listings';
import { propertyDetail } from '@/constants/routes';
import { formatCurrency } from '@/lib/utils';

export default function PropertiesPage() {
  const { listings, listingsLoading, listingsError } = useTenantData();
  const [filters, setFilters] = useState(DEFAULT_PROPERTY_FILTERS);
  const availableListings = listings;
  const suburbs = useMemo(
    () =>
      [...new Set(availableListings.map((p) => p.suburb).filter(Boolean))].sort(),
    [availableListings],
  );
  const filtered = useMemo(
    () => filterAndSortListings(availableListings, filters),
    [availableListings, filters],
  );

  return (
    <TenantShell title="Browse listings">
      {/* <p className="text-muted-foreground mb-4 text-sm">
        Same property registry as crossub_web Properties — loaded from staging via{' '}
        <code className="text-xs">{PUBLIC_LISTINGS_ENDPOINT}</code>.
      </p> */}

      {listingsError && (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {listingsError}
        </div>
      )}

      <PropertyFiltersBar filters={filters} onChange={setFilters} suburbs={suburbs} />
      <p className="text-muted-foreground my-3 text-xs">
        {listingsLoading
          ? 'Loading listings…'
          : `${filtered.length} propert${filtered.length === 1 ? 'y' : 'ies'}`}
      </p>
      <div className="space-y-3">
        {listingsLoading ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
            Loading properties…
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
            {availableListings.length === 0
              ? listings.length === 0
                ? 'No properties are available right now. Properties appear here when crossub_web has an active leasing cycle in open inspection, open report, or application approval.'
                : 'No properties are accepting applications right now.'
              : 'No properties match your filters.'}
          </p>
        ) : (
          filtered.map((p) => (
            <Link
              key={p.id}
              href={propertyDetail(p.id)}
              className="block rounded-xl border bg-card p-4 hover:bg-secondary/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold leading-snug">{p.address}</p>
                  {p.suburb && (
                    <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                      <MapPin className="size-3 shrink-0" /> {p.suburb}
                    </p>
                  )}
                </div>
                <StatusBadge label={p.propertyType} />
              </div>
              <p className="text-primary mt-2 text-sm font-medium">
                {p.rentWeekly != null && p.rentWeekly > 0
                  ? `${formatCurrency(p.rentWeekly)}/week`
                  : 'Rent on application'}
              </p>
              {(p.bondAmount != null && p.bondAmount > 0) ||
              (p.depositAmount != null && p.depositAmount > 0) ? (
                <p className="text-muted-foreground mt-1 text-xs">
                  {p.bondAmount != null && p.bondAmount > 0
                    ? `Bond ${formatCurrency(p.bondAmount)}`
                    : null}
                  {p.bondAmount != null &&
                  p.bondAmount > 0 &&
                  p.depositAmount != null &&
                  p.depositAmount > 0
                    ? ' · '
                    : null}
                  {p.depositAmount != null && p.depositAmount > 0
                    ? `Deposit ${formatCurrency(p.depositAmount)}`
                    : null}
                </p>
              ) : null}
              <p className="text-muted-foreground text-xs">
                {p.status ? `${p.status.replace('_', ' ')} · ` : ''}
                {p.bedrooms} bed · {p.bathrooms} bath
                {p.parking != null && p.parking > 0 ? ` · ${p.parking} parking` : ''}
                {p.availableFrom !== 'TBC' ? ` · Available ${p.availableFrom}` : ''}
              </p>
              <ListingOpenInspectionFacts property={p} compact />
              <span className="text-primary mt-3 inline-block text-xs font-medium">
                {p.canApply ? 'View & apply →' : 'View details →'}
              </span>
            </Link>
          ))
        )}
      </div>
    </TenantShell>
  );
}

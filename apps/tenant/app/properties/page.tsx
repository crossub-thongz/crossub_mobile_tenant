'use client';

import Link from 'next/link';
import { Calendar, MapPin } from 'lucide-react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { propertyApply, propertyDetail } from '@/constants/routes';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function PropertiesPage() {
  const { listings } = useTenantData();

  return (
    <TenantShell title="Available properties">
      <p className="text-muted-foreground mb-4 text-sm">
        CROSSUB rental listings with open inspection times from the leasing workflow.
      </p>
      <div className="space-y-3">
        {listings.map((p) => (
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
        ))}
      </div>
      <p className="text-muted-foreground mt-6 text-center text-xs">
        <Link href={propertyApply(listings[0]?.id ?? 'prop-101')} className="text-primary">
          Apply online
        </Link>{' '}
        — documents required per agent (confirm with Leasing).
      </p>
    </TenantShell>
  );
}

'use client';

import { Input } from '@/components/ui/input';
import type { PropertyFilters } from '@/lib/types';

const PROPERTY_TYPES = ['All', 'Apartment', 'Townhouse', 'Unit'] as const;

export function PropertyFiltersBar({
  filters,
  onChange,
  suburbs,
}: {
  filters: PropertyFilters;
  onChange: (next: PropertyFilters) => void;
  suburbs: string[];
}) {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <p className="text-xs font-medium uppercase text-muted-foreground">Search & filter</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-muted-foreground mb-1 block text-xs">Suburb</label>
          <select
            className="border-input bg-background w-full rounded-md border px-2 py-2 text-sm"
            value={filters.suburb}
            onChange={(e) => onChange({ ...filters, suburb: e.target.value })}
          >
            <option value="">All suburbs</option>
            {suburbs.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-muted-foreground mb-1 block text-xs">Property type</label>
          <select
            className="border-input bg-background w-full rounded-md border px-2 py-2 text-sm"
            value={filters.propertyType}
            onChange={(e) => onChange({ ...filters, propertyType: e.target.value })}
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t === 'All' ? '' : t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-muted-foreground mb-1 block text-xs">Min rent / week</label>
          <Input
            type="number"
            min={0}
            value={filters.minRent || ''}
            onChange={(e) =>
              onChange({ ...filters, minRent: Number(e.target.value) || 0 })
            }
          />
        </div>
        <div>
          <label className="text-muted-foreground mb-1 block text-xs">Max rent / week</label>
          <Input
            type="number"
            min={0}
            value={filters.maxRent || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                maxRent: Number(e.target.value) || 9999,
              })
            }
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={filters.hasOpenInspection}
          onChange={(e) =>
            onChange({ ...filters, hasOpenInspection: e.target.checked })
          }
          className="accent-primary size-4"
        />
        Open inspection scheduled only
      </label>
    </div>
  );
}

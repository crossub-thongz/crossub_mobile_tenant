'use client';

import { Input } from '@/components/ui/input';
import { parseFilterNumber } from '@/lib/filter-listings';
import type { ListingSortBy, PropertyFilters } from '@/lib/types';

const PROPERTY_TYPES = [
  'All',
  'Apartment',
  'House',
  'Studio',
  'Townhouse',
  'Unit',
] as const;

const SORT_OPTIONS: { value: ListingSortBy; label: string }[] = [
  { value: 'address_asc', label: 'Address (A–Z)' },
  { value: 'rent_asc', label: 'Rent (low to high)' },
  { value: 'rent_desc', label: 'Rent (high to low)' },
  { value: 'available_asc', label: 'Available soonest' },
  { value: 'inspection_asc', label: 'Open inspection soonest' },
];

function numberInputValue(value: number | null): string {
  return value == null ? '' : String(value);
}

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

      <div>
        <label className="text-muted-foreground mb-1 block text-xs">Sort by</label>
        <select
          className="border-input bg-background w-full rounded-md border px-2 py-2 text-sm"
          value={filters.sortBy}
          onChange={(e) =>
            onChange({ ...filters, sortBy: e.target.value as ListingSortBy })
          }
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

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
            placeholder="Any"
            value={numberInputValue(filters.minRent)}
            onChange={(e) =>
              onChange({ ...filters, minRent: parseFilterNumber(e.target.value) })
            }
          />
        </div>
        <div>
          <label className="text-muted-foreground mb-1 block text-xs">Max rent / week</label>
          <Input
            type="number"
            min={0}
            placeholder="No max"
            value={numberInputValue(filters.maxRent)}
            onChange={(e) =>
              onChange({ ...filters, maxRent: parseFilterNumber(e.target.value) })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-muted-foreground mb-1 block text-xs">Min bedrooms</label>
          <Input
            type="number"
            min={0}
            placeholder="Any"
            value={numberInputValue(filters.minBedrooms)}
            onChange={(e) =>
              onChange({ ...filters, minBedrooms: parseFilterNumber(e.target.value) })
            }
          />
        </div>
        <div>
          <label className="text-muted-foreground mb-1 block text-xs">Min bathrooms</label>
          <Input
            type="number"
            min={0}
            placeholder="Any"
            value={numberInputValue(filters.minBathrooms)}
            onChange={(e) =>
              onChange({ ...filters, minBathrooms: parseFilterNumber(e.target.value) })
            }
          />
        </div>
      </div>

      <div>
        <label className="text-muted-foreground mb-1 block text-xs">Available from</label>
        <Input
          type="date"
          value={filters.availableFrom}
          onChange={(e) => onChange({ ...filters, availableFrom: e.target.value })}
        />
      </div>

      <div className="space-y-2 text-sm">
        <label className="flex items-center gap-2">
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
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.knownRentOnly}
            onChange={(e) =>
              onChange({ ...filters, knownRentOnly: e.target.checked })
            }
            className="accent-primary size-4"
          />
          Priced listings only
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.hasParking}
            onChange={(e) => onChange({ ...filters, hasParking: e.target.checked })}
            className="accent-primary size-4"
          />
          Parking available
        </label>
      </div>
    </div>
  );
}

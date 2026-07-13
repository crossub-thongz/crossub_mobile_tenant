import type { ListingProperty, ListingSortBy, PropertyFilters } from '@/lib/types';

export const DEFAULT_PROPERTY_FILTERS: PropertyFilters = {
  suburb: '',
  minRent: null,
  maxRent: null,
  propertyType: '',
  minBedrooms: null,
  minBathrooms: null,
  hasParking: false,
  hasOpenInspection: false,
  knownRentOnly: false,
  availableFrom: '',
  sortBy: 'address_asc',
};

function listingHasKnownRent(rentWeekly: number | null): boolean {
  return rentWeekly != null && rentWeekly > 0;
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function parseFilterNumber(value: string): number | null {
  return parseOptionalNumber(value);
}

export function filterListings(
  listings: ListingProperty[],
  filters: PropertyFilters,
): ListingProperty[] {
  return listings.filter((p) => {
    if (filters.suburb && p.suburb !== filters.suburb) return false;
    if (filters.propertyType && p.propertyType !== filters.propertyType) return false;

    if (filters.minBedrooms != null && p.bedrooms < filters.minBedrooms) return false;
    if (filters.minBathrooms != null && p.bathrooms < filters.minBathrooms) return false;
    if (filters.hasParking && !(p.parking != null && p.parking > 0)) return false;
    if (filters.hasOpenInspection && !p.openInspectionAt) return false;
    if (filters.knownRentOnly && !listingHasKnownRent(p.rentWeekly)) return false;

    if (filters.availableFrom && p.availableFrom !== 'TBC') {
      if (p.availableFrom < filters.availableFrom) return false;
    }

    const rent = p.rentWeekly;
    if (filters.minRent != null) {
      if (!listingHasKnownRent(rent) || rent! < filters.minRent) return false;
    }
    if (filters.maxRent != null) {
      if (!listingHasKnownRent(rent) || rent! > filters.maxRent) return false;
    }

    return true;
  });
}

function rentSortKey(rentWeekly: number | null): number {
  return listingHasKnownRent(rentWeekly) ? rentWeekly! : Number.POSITIVE_INFINITY;
}

function dateSortKey(value: string | undefined, missingLast = true): number {
  if (!value || value === 'TBC') return missingLast ? Number.POSITIVE_INFINITY : 0;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : missingLast ? Number.POSITIVE_INFINITY : 0;
}

export function sortListings(
  listings: ListingProperty[],
  sortBy: ListingSortBy,
): ListingProperty[] {
  const sorted = [...listings];
  sorted.sort((a, b) => {
    switch (sortBy) {
      case 'rent_asc':
        return rentSortKey(a.rentWeekly) - rentSortKey(b.rentWeekly);
      case 'rent_desc': {
        const aRent = listingHasKnownRent(a.rentWeekly) ? a.rentWeekly! : -1;
        const bRent = listingHasKnownRent(b.rentWeekly) ? b.rentWeekly! : -1;
        return bRent - aRent;
      }
      case 'available_asc':
        return dateSortKey(a.availableFrom) - dateSortKey(b.availableFrom);
      case 'inspection_asc':
        return dateSortKey(a.openInspectionAt, false) - dateSortKey(b.openInspectionAt, false);
      case 'address_asc':
      default:
        return a.address.localeCompare(b.address, undefined, { sensitivity: 'base' });
    }
  });
  return sorted;
}

export function filterAndSortListings(
  listings: ListingProperty[],
  filters: PropertyFilters,
): ListingProperty[] {
  return sortListings(filterListings(listings, filters), filters.sortBy);
}

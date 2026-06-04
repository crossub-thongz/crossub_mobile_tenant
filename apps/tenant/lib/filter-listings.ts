import type { ListingProperty, PropertyFilters } from '@/lib/types';

export const DEFAULT_PROPERTY_FILTERS: PropertyFilters = {
  suburb: '',
  minRent: 0,
  maxRent: 9999,
  propertyType: '',
  hasOpenInspection: false,
};

export function filterListings(
  listings: ListingProperty[],
  filters: PropertyFilters,
): ListingProperty[] {
  return listings.filter((p) => {
    if (filters.suburb && p.suburb !== filters.suburb) return false;
    if (filters.propertyType && p.propertyType !== filters.propertyType) return false;
    if (p.rentWeekly < filters.minRent) return false;
    if (filters.maxRent < 9999 && p.rentWeekly > filters.maxRent) return false;
    if (filters.hasOpenInspection && !p.openInspectionAt) return false;
    return true;
  });
}

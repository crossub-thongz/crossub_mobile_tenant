/**
 * Tenant self-routine room list from property bedroom count.
 * Bathroom count is not consulted — bedrooms alone pick the template.
 */
const ONE_BED_AREAS: string[] = [
  'Lounge Room',
  'Dining Room',
  'Kitchen',
  'Laundry',
  'Bathroom',
  'Bedroom 1',
];

export function tenantSelfRoutineAreasFromBedrooms(
  bedrooms: number | null | undefined,
): string[] {
  const count = Number.isFinite(bedrooms) ? Math.floor(Number(bedrooms)) : 1;
  const names = [...ONE_BED_AREAS];
  if (count <= 1) return names;

  names.push('Ensuite', 'Bedroom 2');
  if (count === 2) return names;

  names.push('Bedroom 3');
  if (count === 3) return names;

  names.push('Bedroom 4', 'Bathroom 2');
  return names;
}

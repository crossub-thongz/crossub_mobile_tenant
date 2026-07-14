export interface PropertyAddressParts {
  address?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
}

/** Join street, suburb, state, and postcode into one display line. */
export function formatFullAddress(parts: PropertyAddressParts): string {
  const street = parts.address?.trim();
  if (!street) return '—';
  const suburb = parts.suburb?.trim() ?? '';
  const statePost = [parts.state?.trim(), parts.postcode?.trim()].filter(Boolean).join(' ');
  const segments: string[] = [street];
  const joined = () => segments.join(', ').toLowerCase();
  if (suburb && !joined().includes(suburb.toLowerCase())) {
    segments.push(suburb);
  }
  if (statePost && !joined().includes(statePost.toLowerCase())) {
    segments.push(statePost);
  }
  return segments.join(', ');
}

/** Prefer a formatted API line; enrich with parts when the API only sent street. */
export function resolvePropertyAddress(
  propertyAddress: string | null | undefined,
  parts?: PropertyAddressParts,
): string {
  const street = propertyAddress?.trim();
  if (street && parts) {
    const enriched = formatFullAddress({ address: street, ...parts });
    if (enriched !== '—') return enriched;
  }
  if (street) return street;
  if (parts) {
    const fromParts = formatFullAddress(parts);
    if (fromParts !== '—') return fromParts;
  }
  return '—';
}

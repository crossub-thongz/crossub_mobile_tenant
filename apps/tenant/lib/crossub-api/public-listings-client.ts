import type { ListingProperty } from '@/lib/types';
import { parseApiErrorMessage } from '@/lib/api-error-message';

/** Browser → tenant Next proxy → crossub API (see apps/tenant/.env API_INTERNAL_URL). */
export const PUBLIC_LISTINGS_ENDPOINT = '/api/v1/public/listings';

/** Always proxy guest listing calls through the tenant Next BFF (same-origin). */
const PUBLIC_API_V1 = '/api/v1';

export type EmploymentStatus =
  | 'employed'
  | 'self_employed'
  | 'unemployed'
  | 'retired';

export interface PublicListingDto {
  id: string;
  address: string;
  suburb: string | null;
  status: string;
  acceptingApplications: boolean;
  propertyType: string;
  rentWeekly: number | null;
  bondAmount: number | null;
  depositAmount: number | null;
  availableFrom: string | null;
  leaseTerm: string | null;
  openInspectionAt: string | null;
  listedAt: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  imageUrl: string | null;
  features: string[];
}

export interface SubmitGuestApplicationInput {
  fullName: string;
  email: string;
  phone: string;
  annualIncome: number;
  employmentStatus: EmploymentStatus;
  moveInDate: string;
  viewingSessionId?: string;
}

export interface GuestApplicationResult {
  id: string;
  reference: string;
  status: string;
  propertyId: string;
  propertyAddress: string;
  submittedAt: string;
}

function propertyTypeLabel(type: string): string {
  return type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ');
}

/** Suburb line for cards — hide when already part of the address string. */
function displaySuburb(address: string, suburb: string | null): string {
  if (!suburb?.trim()) return '';
  if (address.toLowerCase().includes(suburb.trim().toLowerCase())) return '';
  return suburb.trim();
}

export function mapPublicListingToProperty(dto: PublicListingDto): ListingProperty {
  const suburb = displaySuburb(dto.address, dto.suburb);
  return {
    id: dto.id,
    address: dto.address,
    suburb,
    rentWeekly: dto.rentWeekly,
    bondAmount: dto.bondAmount ?? undefined,
    depositAmount: dto.depositAmount ?? undefined,
    propertyType: propertyTypeLabel(dto.propertyType),
    bedrooms: dto.bedrooms ?? 0,
    bathrooms: dto.bathrooms ?? 0,
    parking: dto.parking ?? undefined,
    availableFrom: dto.availableFrom ?? 'TBC',
    leaseTerm: dto.leaseTerm ?? undefined,
    openInspectionAt: dto.openInspectionAt ?? undefined,
    listedAt: dto.listedAt ?? undefined,
    features: dto.features.length > 0 ? dto.features : ['Contact agent for details'],
    imageUrl: dto.imageUrl ?? undefined,
    status: dto.status,
    canApply: dto.acceptingApplications,
  };
}

/**
 * Property registry for applicants — same staging rows as crossub_web
 * `GET /api/properties`, public read facade.
 */
export async function fetchPublicListings(): Promise<ListingProperty[]> {
  const res = await fetch(`${PUBLIC_API_V1}/public/listings`, {
    credentials: 'omit',
    cache: 'no-store',
  });
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        'Public listings API is not deployed on this server yet. Deploy the latest crossub_web API to staging.',
      );
    }
    throw new Error('Failed to load property listings');
  }
  const data = (await res.json()) as { items: PublicListingDto[] };
  return data.items.map(mapPublicListingToProperty);
}

/** Single listing for deep-links when the browse list has not loaded yet. */
export async function fetchPublicListing(
  propertyId: string,
  viewingSessionId?: string,
): Promise<ListingProperty> {
  const query = viewingSessionId
    ? `?sessionId=${encodeURIComponent(viewingSessionId)}`
    : '';
  const res = await fetch(`${PUBLIC_API_V1}/public/listings/${propertyId}${query}`, {
    credentials: 'omit',
    cache: 'no-store',
  });
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Property not found or not available.');
    }
    throw new Error('Failed to load property');
  }
  const dto = (await res.json()) as PublicListingDto;
  return mapPublicListingToProperty(dto);
}

/** Guest application submit (`POST /api/v1/public/listings/:id/applications`). */
export async function submitGuestApplication(
  propertyId: string,
  body: SubmitGuestApplicationInput,
): Promise<GuestApplicationResult> {
  let res: Response;
  try {
    res = await fetch(`${PUBLIC_API_V1}/public/listings/${propertyId}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'omit',
      redirect: 'manual',
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Could not reach the application server. Try again in a moment.');
  }

  if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
    throw new Error(
      'Application submit was redirected — refresh the page and try again.',
    );
  }

  const contentType = res.headers.get('content-type') ?? '';
  const payload: unknown = contentType.includes('application/json')
    ? await res.json().catch(() => null)
    : null;

  if (!res.ok) {
    throw new Error(
      parseApiErrorMessage(payload, res.status, 'Failed to submit application'),
    );
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('Unexpected response from the application server.');
  }

  return payload as GuestApplicationResult;
}

export const EMPLOYMENT_OPTIONS: { value: EmploymentStatus; label: string }[] = [
  { value: 'employed', label: 'Employed' },
  { value: 'self_employed', label: 'Self employed' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'retired', label: 'Retired' },
];

import type { ListingProperty } from '@/lib/types';

/** Browser → tenant Next proxy → crossub API (see apps/tenant/.env API_INTERNAL_URL). */
export const PUBLIC_LISTINGS_ENDPOINT = '/api/v1/public/listings';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/v1`;

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
  openInspectionAt: string | null;
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
    rentWeekly: dto.rentWeekly ?? 0,
    bondAmount: dto.bondAmount ?? undefined,
    depositAmount: dto.depositAmount ?? undefined,
    propertyType: propertyTypeLabel(dto.propertyType),
    bedrooms: dto.bedrooms ?? 0,
    bathrooms: dto.bathrooms ?? 0,
    availableFrom: dto.availableFrom ?? 'TBC',
    openInspectionAt: dto.openInspectionAt ?? undefined,
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
  const res = await fetch(`${API_BASE}/public/listings`, {
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
export async function fetchPublicListing(propertyId: string): Promise<ListingProperty> {
  const res = await fetch(`${API_BASE}/public/listings/${propertyId}`, {
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
  const res = await fetch(`${API_BASE}/public/listings/${propertyId}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'omit',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const raw = err?.message;
    const message = Array.isArray(raw) ? raw[0] : raw;
    throw new Error(message ?? 'Failed to submit application');
  }
  return res.json() as Promise<GuestApplicationResult>;
}

export const EMPLOYMENT_OPTIONS: { value: EmploymentStatus; label: string }[] = [
  { value: 'employed', label: 'Employed' },
  { value: 'self_employed', label: 'Self employed' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'retired', label: 'Retired' },
];

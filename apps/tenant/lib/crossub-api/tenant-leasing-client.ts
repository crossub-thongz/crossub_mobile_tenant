import type { OnboardingStep } from '@/lib/types';
import { ingoingReport, onboardingStep } from '@/constants/routes';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/v1`;

export const TENANT_LEASING_AGREEMENT_PDF_URL = `${API_BASE}/tenant/leasing/onboarding/agreement.pdf`;

export interface UploadTenantPhotoInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  contentBase64: string;
}

export interface TenantLeasingOnboardingDto {
  cycleId: string;
  propertyId: string;
  propertyAddress: string;
  lifecycleStep: string;
  applicationStatus: string;
  keyCustody: 'crossub' | 'agent' | string;
  steps: {
    id: string;
    title: string;
    description: string;
    status: string;
  }[];
  keyCollection: {
    status: string;
    time: string | null;
    timeEnd: string | null;
    location: string | null;
    photos: string[];
  };
  depositProof: {
    fileName: string | null;
    proofUrl: string | null;
  };
  bondProof: {
    fileName: string | null;
    proofUrl: string | null;
  };
  agreement: {
    status: string;
    signingStatus: string;
    uploadedFileName: string | null;
    signedAt: string | null;
    available: boolean;
    contract: {
      template: string | null;
      leaseTerm: string | null;
      weeklyRent: number | null;
    };
  };
  ingoingInspectionId: string | null;
}

export interface SetKeyCollectionInput {
  time: string;
  location: string;
  photoUrls: string[];
}

async function readApiError(res: Response, fallback: string): Promise<string> {
  const err = (await res.json().catch(() => null)) as {
    message?: string | string[];
  } | null;
  const raw = err?.message;
  const message = Array.isArray(raw) ? raw[0] : raw;
  return message ?? fallback;
}

function mapStepStatus(
  status: string,
): OnboardingStep['status'] {
  if (status === 'done') return 'completed';
  if (status === 'in_progress' || status === 'waiting') return 'uploaded';
  if (status === 'blocked') return 'pending';
  return 'pending';
}

export function mapLeasingOnboardingToSteps(
  dto: TenantLeasingOnboardingDto,
): OnboardingStep[] {
  return dto.steps.map((s) => ({
    id: s.id as OnboardingStep['id'],
    title: s.title,
    description: s.description,
    status: mapStepStatus(s.status),
    href:
      s.id === 'ingoing_report' && dto.ingoingInspectionId
        ? ingoingReport(dto.ingoingInspectionId)
        : onboardingStep(s.id),
  }));
}

/** Live leasing onboarding for the signed-in tenant (`GET /tenant/leasing/onboarding`). */
export async function fetchLeasingOnboarding(): Promise<TenantLeasingOnboardingDto> {
  const res = await fetch(`${API_BASE}/tenant/leasing/onboarding`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Leasing onboarding has not started yet for your application.');
    }
    throw new Error('Failed to load leasing onboarding');
  }
  return res.json() as Promise<TenantLeasingOnboardingDto>;
}

/** Stage a key-collection proof photo (`POST /tenant/leasing/onboarding/key-collection/photos/upload`). */
export async function uploadKeyCollectionPhoto(
  body: UploadTenantPhotoInput,
): Promise<string> {
  const res = await fetch(
    `${API_BASE}/tenant/leasing/onboarding/key-collection/photos/upload`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    throw new Error('Failed to upload key collection photo');
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

/** Stage a deposit proof file (`POST /tenant/leasing/onboarding/deposit/proof/upload`). */
export async function uploadDepositProofPhoto(
  body: UploadTenantPhotoInput,
): Promise<string> {
  const res = await fetch(
    `${API_BASE}/tenant/leasing/onboarding/deposit/proof/upload`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    throw new Error(await readApiError(res, 'Failed to upload deposit proof'));
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

/** Submit deposit proof for staff review (`PATCH /tenant/leasing/onboarding/deposit/proof`). */
export async function submitDepositProof(body: {
  proofUrl: string;
  fileName: string;
}): Promise<TenantLeasingOnboardingDto> {
  const res = await fetch(`${API_BASE}/tenant/leasing/onboarding/deposit/proof`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const raw = err?.message;
    const message = Array.isArray(raw) ? raw[0] : raw;
    throw new Error(message ?? 'Failed to submit deposit proof');
  }
  return res.json() as Promise<TenantLeasingOnboardingDto>;
}

/** Stage a bond proof file (`POST /tenant/leasing/onboarding/bond/proof/upload`). */
export async function uploadBondProofPhoto(
  body: UploadTenantPhotoInput,
): Promise<string> {
  const res = await fetch(
    `${API_BASE}/tenant/leasing/onboarding/bond/proof/upload`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    throw new Error(await readApiError(res, 'Failed to upload bond proof'));
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

/** Submit bond proof for staff review (`PATCH /tenant/leasing/onboarding/bond/proof`). */
export async function submitBondProof(body: {
  proofUrl: string;
  fileName: string;
}): Promise<TenantLeasingOnboardingDto> {
  const res = await fetch(`${API_BASE}/tenant/leasing/onboarding/bond/proof`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const raw = err?.message;
    const message = Array.isArray(raw) ? raw[0] : raw;
    throw new Error(message ?? 'Failed to submit bond proof');
  }
  return res.json() as Promise<TenantLeasingOnboardingDto>;
}

/** Tenant acknowledges they signed the lease agreement (`PATCH /tenant/leasing/onboarding/agreement/signed`). */
export async function acknowledgeAgreementSigned(): Promise<TenantLeasingOnboardingDto> {
  const res = await fetch(`${API_BASE}/tenant/leasing/onboarding/agreement/signed`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(await readApiError(res, 'Failed to submit agreement signing'));
  }
  return res.json() as Promise<TenantLeasingOnboardingDto>;
}

/** Stage up to 5 key-collection photos; returns public URLs for the key-collection report. */
export async function uploadKeyCollectionPhotos(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files.slice(0, 5)) {
    const contentBase64 = await fileToBase64(file);
    const url = await uploadKeyCollectionPhoto({
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      contentBase64,
    });
    urls.push(url);
  }
  return urls;
}

/** Tenant confirms key collection (`PATCH /tenant/leasing/onboarding/key-collection`). */
export async function submitKeyCollection(
  body: SetKeyCollectionInput,
): Promise<TenantLeasingOnboardingDto> {
  const res = await fetch(`${API_BASE}/tenant/leasing/onboarding/key-collection`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const raw = err?.message;
    const message = Array.isArray(raw) ? raw[0] : raw;
    throw new Error(message ?? 'Failed to save key collection details');
  }
  return res.json() as Promise<TenantLeasingOnboardingDto>;
}

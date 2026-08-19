import type { OnboardingStep } from '@/lib/types';
import { onboardingStep } from '@/constants/routes';
import {
  postJson,
  postJsonWithUploadProgress,
  uploadFileDirectToR2,
  type DirectUploadSession,
} from '@/lib/direct-upload';
import { resolveEvidenceMimeType } from '@/lib/utils';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/v1`;

export const TENANT_LEASING_AGREEMENT_PDF_URL = `${API_BASE}/tenant/leasing/onboarding/agreement.pdf`;

type PaymentProofKind = 'deposit' | 'bond';

export interface TenantLeasingContractRevisionDto {
  version: number;
  contractRef: string;
  confirmedAt: string;
  sentToTenantAt: string | null;
  supersededAt: string | null;
  isCurrent: boolean;
  leaseTerm: string | null;
  weeklyRent: number | null;
  startDate: string | null;
  endDate: string | null;
}

const agreementSignedPaths = {
  upload: '/tenant/leasing/onboarding/agreement/signed/upload',
  session: '/tenant/leasing/onboarding/agreement/signed/upload-session',
  complete: '/tenant/leasing/onboarding/agreement/signed/upload-complete',
} as const;

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
  onboardingComplete?: boolean;
  steps: {
    id: string;
    title: string;
    description: string;
    status: string;
    amount?: number | null;
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
    signedProofUrl: string | null;
    signedProofFileName: string | null;
    signedAt: string | null;
    rejectReason: string | null;
    available: boolean;
    contract: {
      template: string | null;
      leaseTerm: string | null;
      weeklyRent: number | null;
      contractRef: string | null;
      currentVersion: number | null;
    };
    revisions: TenantLeasingContractRevisionDto[];
  };
  ingoingInspectionId: string | null;
  applicationDocuments: {
    category: string;
    documentType: string;
    label: string;
    points?: number;
    fileName: string;
    url: string;
    uploadedAt: string;
  }[];
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

function paymentProofPaths(kind: PaymentProofKind): {
  session: string;
  complete: string;
  inlineUpload: string;
} {
  const base = `/tenant/leasing/onboarding/${kind}/proof`;
  return {
    session: `${base}/upload-session`,
    complete: `${base}/upload-complete`,
    inlineUpload: `${base}/upload`,
  };
}

function leasingPostJson<T>(path: string, body: unknown, fallback: string): Promise<T> {
  return postJson<T>(`${API_BASE}${path}`, body, fallback);
}

/**
 * Upload a deposit or bond proof — uses direct-to-R2 on staging/production (presigned PUT)
 * so large files never pass through the tenant BFF or API body. Falls back to base64 JSON locally.
 */
export async function uploadPaymentProofFileWithProgress(
  kind: PaymentProofKind,
  file: File,
  mimeType: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const paths = paymentProofPaths(kind);
  return uploadFileDirectToR2({
    file,
    mimeType,
    onProgress,
    beginSession: (meta) =>
      leasingPostJson<DirectUploadSession>(
        paths.session,
        meta,
        'Failed to start payment proof upload',
      ),
    completeSession: async (storageKey, meta) => {
      const data = await leasingPostJson<{ url: string }>(
        paths.complete,
        { storageKey, ...meta },
        'Failed to finalize payment proof upload',
      );
      return data.url;
    },
    inlineUpload: async (contentBase64, meta, networkProgress) => {
      const data = await postJsonWithUploadProgress<{ url: string }>(
        `${API_BASE}${paths.inlineUpload}`,
        { ...meta, contentBase64 },
        kind === 'deposit' ? 'Failed to upload deposit proof' : 'Failed to upload bond proof',
        networkProgress,
      );
      return data.url;
    },
  });
}

export async function uploadAgreementSignedFileWithProgress(
  file: File,
  mimeType: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  return uploadFileDirectToR2({
    file,
    mimeType,
    onProgress,
    beginSession: (meta) =>
      leasingPostJson<DirectUploadSession>(
        agreementSignedPaths.session,
        meta,
        'Failed to start signed agreement upload',
      ),
    completeSession: async (storageKey, meta) => {
      const data = await leasingPostJson<{ url: string }>(
        agreementSignedPaths.complete,
        { storageKey, ...meta },
        'Failed to finalize signed agreement upload',
      );
      return data.url;
    },
    inlineUpload: async (contentBase64, meta, networkProgress) => {
      const data = await postJsonWithUploadProgress<{ url: string }>(
        `${API_BASE}${agreementSignedPaths.upload}`,
        { ...meta, contentBase64 },
        'Failed to upload signed agreement',
        networkProgress,
      );
      return data.url;
    },
  });
}

/** Submit a signed lease agreement for agent confirmation. */
export async function submitAgreementSigned(body: {
  proofUrl: string;
  fileName: string;
}): Promise<TenantLeasingOnboardingDto> {
  const res = await fetch(`${API_BASE}/tenant/leasing/onboarding/agreement/signed`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readApiError(res, 'Failed to submit signed agreement'));
  }
  return res.json() as Promise<TenantLeasingOnboardingDto>;
}

/** Record signing — server generates a PDF with the tenant name and submits for review. */
export async function recordAgreementSigning(): Promise<TenantLeasingOnboardingDto> {
  const res = await fetch(`${API_BASE}/tenant/leasing/onboarding/agreement/record-signing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(await readApiError(res, 'Failed to record agreement signing'));
  }
  return res.json() as Promise<TenantLeasingOnboardingDto>;
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
  return dto.steps
    .filter((s) => s.id !== 'ingoing_report')
    .map((s) => ({
      id: s.id as OnboardingStep['id'],
      title: s.title,
      description: s.description,
      status: mapStepStatus(s.status),
      amount: s.amount ?? undefined,
      href: onboardingStep(s.id),
    }));
}

function normalizeLeasingOnboarding(
  dto: TenantLeasingOnboardingDto,
): TenantLeasingOnboardingDto {
  const agreement = dto.agreement;
  return {
    ...dto,
    applicationDocuments: dto.applicationDocuments ?? [],
    agreement: agreement
      ? {
          ...agreement,
          contract: agreement.contract ?? {
            template: null,
            leaseTerm: null,
            weeklyRent: null,
            contractRef: null,
            currentVersion: null,
          },
          revisions: agreement.revisions ?? [],
        }
      : agreement,
  };
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
  const dto = (await res.json()) as TenantLeasingOnboardingDto;
  return normalizeLeasingOnboarding(dto);
}

/** Stage a key-collection proof photo (direct-to-R2, with base64 fallback). */
export async function uploadKeyCollectionPhoto(
  body: UploadTenantPhotoInput,
): Promise<string> {
  const data = await postJsonWithUploadProgress<{ url: string }>(
    `${API_BASE}/tenant/leasing/onboarding/key-collection/photos/upload`,
    body,
    'Failed to upload key collection photo',
  );
  return data.url;
}

export async function uploadKeyCollectionPhotoFile(file: File): Promise<string> {
  const mimeType = resolveEvidenceMimeType(file);
  return uploadFileDirectToR2({
    file,
    mimeType,
    beginSession: (meta) =>
      leasingPostJson<DirectUploadSession>(
        '/tenant/leasing/onboarding/key-collection/photos/upload-session',
        meta,
        'Failed to start key collection upload',
      ),
    completeSession: async (storageKey, meta) => {
      const data = await leasingPostJson<{ url: string }>(
        '/tenant/leasing/onboarding/key-collection/photos/upload-complete',
        { storageKey, ...meta },
        'Failed to finalize key collection upload',
      );
      return data.url;
    },
    inlineUpload: (contentBase64, meta) =>
      uploadKeyCollectionPhoto({ ...meta, contentBase64 }),
  });
}

/** Stage a deposit proof file (`POST /tenant/leasing/onboarding/deposit/proof/upload`). */
export async function uploadDepositProofPhoto(
  body: UploadTenantPhotoInput,
): Promise<string> {
  const data = await postJsonWithUploadProgress<{ url: string }>(
    `${API_BASE}/tenant/leasing/onboarding/deposit/proof/upload`,
    body,
    'Failed to upload deposit proof',
  );
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
  const data = await postJsonWithUploadProgress<{ url: string }>(
    `${API_BASE}/tenant/leasing/onboarding/bond/proof/upload`,
    body,
    'Failed to upload bond proof',
  );
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

/** Stage up to 5 key-collection photos; returns public URLs for the key-collection report. */
export async function uploadKeyCollectionPhotos(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files.slice(0, 5)) {
    urls.push(await uploadKeyCollectionPhotoFile(file));
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

import type { components } from '@crossub-thongz/api-contract';

import { fetchAuthenticatedBlob } from '@/lib/api';
import {
  postJson,
  postJsonWithUploadProgress,
  uploadFileDirectToR2,
  type DirectUploadMeta,
  type DirectUploadSession,
} from '@/lib/direct-upload';
import { resolveEvidenceMimeType } from '@/lib/utils';

import { crossub } from './client';
import { collectPages } from './paged';
import { parseApiErrorMessage } from '@/lib/api-error-message';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/v1`;

function throwTenantApiError(
  error: unknown,
  response: Response | undefined,
  fallback: string,
): never {
  const body =
    error && typeof error === 'object' && !Array.isArray(error) ? error : undefined;
  throw new Error(parseApiErrorMessage(body, response?.status, fallback));
}

/** Inline PDF preview for a dispatched rent-review notice (tenant session required). */
export function tenantRentReviewNoticePdfUrl(reviewId: string): string {
  return `${API_BASE}/tenant/rent-reviews/${reviewId}/notice-of-rent-increase.pdf`;
}

/** Fixed-term residential tenancy agreement PDF (tenant session required). */
export function tenantRentReviewLeaseAgreementPdfUrl(
  reviewId: string,
  options?: { cacheBuster?: string | number },
): string {
  const base = `${API_BASE}/tenant/rent-reviews/${reviewId}/residential-tenancy-agreement.pdf`;
  if (options?.cacheBuster == null) return base;
  return `${base}?v=${encodeURIComponent(String(options.cacheBuster))}`;
}

/** Download the lease agreement PDF with the tenant session (handles refresh on 401). */
export async function downloadTenantRentReviewLeaseAgreementPdf(
  reviewId: string,
  fileName: string,
  options?: { cacheBuster?: string | number },
): Promise<void> {
  const blob = await fetchAuthenticatedBlob(
    tenantRentReviewLeaseAgreementPdfUrl(reviewId, options),
  );
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** CROSSUB notice of rent review summary for a dispatched rent review. */
export function tenantRentReviewNoticeOfRentReviewUrl(reviewId: string): string {
  return `${API_BASE}/tenant/rent-reviews/${reviewId}/notice-of-rent-review.html`;
}

export function resolveTenantRentReviewAttachmentUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/v1/')) {
    const base = process.env.NEXT_PUBLIC_API_URL ?? '/api';
    return `${base}${url.slice('/api'.length)}`;
  }
  return url;
}

export type TenantTenancy = components['schemas']['TenantTenancyResponseDto'];
export type TenantLedgerEntry = components['schemas']['TenantLedgerEntryResponseDto'];
export type TenantProperty = components['schemas']['TenantPropertyResponseDto'];
export type TenantMaintenanceRequest =
  components['schemas']['TenantMaintenanceRequestResponseDto'];
export type TenantMaintenanceRequestSummary =
  components['schemas']['TenantMaintenanceRequestSummaryDto'];
export type CreateTenantMaintenanceRequest =
  components['schemas']['CreateTenantMaintenanceRequestDto'];
export type UploadTenantPhoto =
  components['schemas']['UploadTenantPhotoDto'];
export type TenantMessageThread =
  components['schemas']['TenantMessageThreadResponseDto'];
export type CreateTenantMessageThread =
  components['schemas']['CreateTenantMessageThreadDto'];
export type SendTenantMessage = components['schemas']['SendTenantMessageDto'];
export type TenantNotificationDto =
  components['schemas']['TenantNotificationResponseDto'];
export type TenantInspection =
  components['schemas']['TenantInspectionResponseDto'];
export type TenantDocument = components['schemas']['TenantDocumentResponseDto'];
export type TenantApplication =
  components['schemas']['TenantApplicationResponseDto'];

/** Full application detail including submitted NSW form data. */
export type TenantApplicationDetail = {
  id: string;
  reference: string;
  status: TenantApplication['status'];
  propertyId: string | null;
  propertyAddress: string | null;
  isRenewal: boolean;
  submittedAt: string;
  formData: Record<string, unknown> | null;
  documents: {
    category: string;
    documentType: string;
    label: string;
    points?: number;
    fileName: string;
    url: string;
    uploadedAt: string;
  }[];
};
export type TenantRentReview =
  components['schemas']['TenantRentReviewResponseDto'];
export type TenantRentReviewRespond =
  components['schemas']['TenantRentReviewRespondDto'];
export type TenantVacatingCase =
  components['schemas']['TenantVacatingCaseResponseDto'];
export type TenantNewLeasing =
  components['schemas']['TenantNewLeasingResponseDto'];
export type TenantIngoingInspection =
  components['schemas']['TenantIngoingInspectionResponseDto'];
export type TenantIngoingDispute =
  components['schemas']['TenantIngoingDisputeDto'];
export type TenantOutgoingInspection =
  components['schemas']['TenantOutgoingInspectionResponseDto'];
export type TenantOutgoingDispute =
  components['schemas']['TenantOutgoingDisputeDto'];
export type TenantRoutineInspection =
  components['schemas']['TenantRoutineInspectionResponseDto'];
export type TenantRoutineSelfInspectionSectionSubmission =
  components['schemas']['SubmitTenantRoutineSelfInspectionSectionDto'] & {
    areaName?: string;
    itemName?: string;
    conditionTags?: string[];
    maintenanceRequest?: boolean;
  };
export type TenantDeclineVacatingSettlement =
  components['schemas']['TenantDeclineVacatingSettlementDto'];

/** Active leases for the signed-in tenant (`GET /api/v1/tenant/tenancies`, all pages). */
export async function fetchTenancies(): Promise<TenantTenancy[]> {
  return collectPages(async (page, pageSize) => {
    const { data, error } = await crossub.GET('/tenant/tenancies', {
      params: { query: { page, pageSize } },
    });
    if (error || !data) throw new Error('Failed to load tenancies');
    return { items: data.items, hasMore: data.hasMore };
  });
}

/**
 * Payment ledger for the signed-in tenant (`GET /api/v1/tenant/ledger`, all pages).
 * A weekly tenancy passes 20 entries in five months, so this one has to page.
 */
export async function fetchLedger(): Promise<TenantLedgerEntry[]> {
  return collectPages(async (page, pageSize) => {
    const { data, error } = await crossub.GET('/tenant/ledger', {
      params: { query: { page, pageSize } },
    });
    if (error || !data) throw new Error('Failed to load ledger');
    return { items: data.items, hasMore: data.hasMore };
  });
}

/** Leased properties for the signed-in tenant (`GET /api/v1/tenant/properties`, all pages). */
export async function fetchTenantProperties(): Promise<TenantProperty[]> {
  return collectPages(async (page, pageSize) => {
    const { data, error } = await crossub.GET('/tenant/properties', {
      params: { query: { page, pageSize } },
    });
    if (error || !data) throw new Error('Failed to load properties');
    return { items: data.items, hasMore: data.hasMore };
  });
}

/** Inspections on the tenant's leased property (`GET /api/v1/tenant/inspections`, all pages). */
export async function fetchTenantInspections(): Promise<TenantInspection[]> {
  return collectPages(async (page, pageSize) => {
    const { data, error } = await crossub.GET('/tenant/inspections', {
      params: { query: { page, pageSize } },
    });
    if (error || !data) throw new Error('Failed to load inspections');
    return { items: data.items, hasMore: data.hasMore };
  });
}

/** Documents on the signed-in tenant's leased property (`GET /api/v1/tenant/documents`). */
export async function fetchTenantDocuments(): Promise<TenantDocument[]> {
  const { data, error } = await crossub.GET('/tenant/documents');
  if (error || !data) throw new Error('Failed to load documents');
  return data;
}

/** The tenant's own rental applications (`GET /api/v1/tenant/applications`, all pages). */
export async function fetchTenantApplications(): Promise<TenantApplication[]> {
  return collectPages(async (page, pageSize) => {
    const { data, error } = await crossub.GET('/tenant/applications', {
      params: { query: { page, pageSize } },
    });
    if (error || !data) throw new Error('Failed to load applications');
    return { items: data.items, hasMore: data.hasMore };
  });
}

/** Full rental application detail (`GET /api/v1/tenant/applications/:applicationId`). */
export async function fetchTenantApplicationDetail(
  applicationId: string,
): Promise<TenantApplicationDetail> {
  const res = await fetch(`${API_BASE}/tenant/applications/${applicationId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to load application');
  return (await res.json()) as TenantApplicationDetail;
}

/** Agent-scheduled ingoing inspections (`GET /api/v1/tenant/ingoing-inspections`). */
export async function fetchTenantIngoingInspections(): Promise<TenantIngoingInspection[]> {
  const { data, error } = await crossub.GET('/tenant/ingoing-inspections');
  if (error || !data) throw new Error('Failed to load ingoing inspections');
  return data;
}

/** Ingoing inspection detail with sections (`GET /api/v1/tenant/ingoing-inspections/:id`). */
export async function fetchTenantIngoingInspection(
  inspectionId: string,
): Promise<TenantIngoingInspection> {
  const { data, error } = await crossub.GET('/tenant/ingoing-inspections/{inspectionId}', {
    params: { path: { inspectionId } },
  });
  if (error || !data) throw new Error('Failed to load ingoing inspection');
  return data;
}

export async function disputeTenantIngoingSection(
  inspectionId: string,
  body: TenantIngoingDispute,
): Promise<TenantIngoingInspection> {
  const { data, error } = await crossub.POST(
    '/tenant/ingoing-inspections/{inspectionId}/disputes',
    {
      params: { path: { inspectionId } },
      body,
    },
  );
  if (error || !data) throw new Error('Failed to submit ingoing dispute');
  return data;
}

export async function submitTenantIngoingSectionFeedback(
  inspectionId: string,
  sectionId: string,
  body: { status: 'confirmed' | 'disputed'; comment?: string },
): Promise<TenantIngoingInspection> {
  const { data, error } = await crossub.POST(
    '/tenant/ingoing-inspections/{inspectionId}/sections/{sectionId}/feedback',
    {
      params: { path: { inspectionId, sectionId } },
      body,
    },
  );
  if (error || !data) throw new Error('Failed to save section feedback');
  return data;
}

export async function approveTenantIngoingInspection(
  inspectionId: string,
): Promise<TenantIngoingInspection> {
  const { data, error } = await crossub.PATCH(
    '/tenant/ingoing-inspections/{inspectionId}/approve',
    {
      params: { path: { inspectionId } },
    },
  );
  if (error || !data) throw new Error('Failed to approve ingoing inspection');
  return data;
}

export async function rejectTenantIngoingInspection(
  inspectionId: string,
  reason: string,
): Promise<TenantIngoingInspection> {
  const { data, error } = await crossub.POST(
    '/tenant/ingoing-inspections/{inspectionId}/reject',
    {
      params: { path: { inspectionId } },
      body: { reason },
    },
  );
  if (error || !data) throw new Error('Failed to reject ingoing inspection');
  return data;
}

/** Upload the tenant-completed/signed ingoing report and submit it back. */
export async function submitTenantIngoingReturnedReport(
  inspectionId: string,
  body: {
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    contentBase64: string;
  },
): Promise<TenantIngoingInspection> {
  const res = await fetch(
    `${API_BASE}/tenant/ingoing-inspections/${inspectionId}/return-report`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const raw = err?.message;
    throw new Error(
      (Array.isArray(raw) ? raw[0] : raw) ?? 'Failed to submit the signed report',
    );
  }
  return (await res.json()) as TenantIngoingInspection;
}

/** Yes/No answers on the NSW special-conditions page. */
export async function submitTenantIngoingSpecialReporting(
  inspectionId: string,
  answers: Array<{ questionId: string; answer: 'yes' | 'no' }>,
): Promise<TenantIngoingInspection> {
  const res = await fetch(
    `${API_BASE}/tenant/ingoing-inspections/${inspectionId}/special-reporting`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ answers }),
    },
  );
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const raw = err?.message;
    throw new Error(
      (Array.isArray(raw) ? raw[0] : raw) ?? 'Failed to save NSW special conditions',
    );
  }
  return (await res.json()) as TenantIngoingInspection;
}

/** Agent-scheduled outgoing inspections (`GET /api/v1/tenant/outgoing-inspections`). */
export async function fetchTenantOutgoingInspections(): Promise<TenantOutgoingInspection[]> {
  const { data, error } = await crossub.GET('/tenant/outgoing-inspections');
  if (error || !data) throw new Error('Failed to load outgoing inspections');
  return data;
}

/** Outgoing inspection detail with sections (`GET /api/v1/tenant/outgoing-inspections/:id`). */
export async function fetchTenantOutgoingInspection(
  inspectionId: string,
): Promise<TenantOutgoingInspection> {
  const { data, error } = await crossub.GET('/tenant/outgoing-inspections/{inspectionId}', {
    params: { path: { inspectionId } },
  });
  if (error || !data) throw new Error('Failed to load outgoing inspection');
  return data;
}

export async function disputeTenantOutgoingSection(
  inspectionId: string,
  body: TenantOutgoingDispute,
): Promise<TenantOutgoingInspection> {
  const { data, error } = await crossub.POST(
    '/tenant/outgoing-inspections/{inspectionId}/disputes',
    {
      params: { path: { inspectionId } },
      body,
    },
  );
  if (error || !data) throw new Error('Failed to submit outgoing dispute');
  return data;
}

export async function approveTenantOutgoingInspection(
  inspectionId: string,
): Promise<TenantOutgoingInspection> {
  const { data, error } = await crossub.PATCH(
    '/tenant/outgoing-inspections/{inspectionId}/approve',
    {
      params: { path: { inspectionId } },
    },
  );
  if (error || !data) throw new Error('Failed to approve outgoing inspection');
  return data;
}

/** Agent-created routine inspections (`GET /api/v1/tenant/routine-inspections`). */
export async function fetchTenantRoutineInspections(): Promise<TenantRoutineInspection[]> {
  const { data, error } = await crossub.GET('/tenant/routine-inspections');
  if (error || !data) throw new Error('Failed to load routine inspections');
  return data;
}

/** Routine inspection detail (`GET /api/v1/tenant/routine-inspections/:id`). */
export async function fetchTenantRoutineInspection(
  id: string,
): Promise<TenantRoutineInspection> {
  const { data, error } = await crossub.GET('/tenant/routine-inspections/{id}', {
    params: { path: { id } },
  });
  if (error || !data) throw new Error('Failed to load routine inspection');
  return data;
}

/** Start tenant self-inspection checklist (`POST .../start-self`). */
export async function startTenantRoutineSelfInspection(
  id: string,
): Promise<TenantRoutineInspection> {
  const { data, error, response } = await crossub.POST('/tenant/routine-inspections/{id}/start-self', {
    params: { path: { id } },
  });
  if (error || !data) {
    throwTenantApiError(error, response, 'Failed to start self-inspection');
  }
  return data;
}

/** Save in-progress self-inspection photos so they restore after logout or reconnect. */
export async function saveTenantRoutineSelfInspectionDraft(
  id: string,
  body: {
    areaIndex?: number;
    areaOrder?: string[];
    areas: Array<{
      areaName: string;
      skipped?: boolean;
      notes?: string;
      maintenanceRequest?: boolean | null;
      photoUrls: string[];
    }>;
  },
): Promise<TenantRoutineInspection> {
  const res = await fetch(
    `${API_BASE}/tenant/routine-inspections/${encodeURIComponent(id)}/self-draft`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throwTenantApiError(error, res, 'Failed to save self-inspection progress');
  }
  return res.json() as Promise<TenantRoutineInspection>;
}

/** Submit tenant self-inspection (`POST .../submit-self`). */
export async function submitTenantRoutineSelfInspection(
  id: string,
  sections: TenantRoutineSelfInspectionSectionSubmission[],
): Promise<TenantRoutineInspection> {
  const { data, error, response } = await crossub.POST('/tenant/routine-inspections/{id}/submit-self', {
    params: { path: { id } },
    body: { sections },
  });
  if (error || !data) {
    throwTenantApiError(error, response, 'Failed to submit self-inspection');
  }
  return data;
}

/** Agent-opened new-leasing cases for the tenant (`GET /api/v1/tenant/new-leasing`). */
export async function fetchTenantNewLeasingCases(): Promise<TenantNewLeasing[]> {
  const { data, error } = await crossub.GET('/tenant/new-leasing');
  if (error || !data) throw new Error('Failed to load new-leasing cases');
  return data;
}

/** Rent reviews on the signed-in tenant's leased property (`GET /api/v1/tenant/rent-reviews`). */
export async function fetchTenantRentReviews(): Promise<TenantRentReview[]> {
  const { data, error } = await crossub.GET('/tenant/rent-reviews');
  if (error || !data) throw new Error('Failed to load rent reviews');
  return data;
}

/** Respond to a dispatched rent-review notice (`PATCH /api/v1/tenant/rent-reviews/:id/respond`). */
export async function submitTenantRentReviewResponse(
  reviewId: string,
  body: TenantRentReviewRespond,
): Promise<TenantRentReview> {
  const { data, error } = await crossub.PATCH('/tenant/rent-reviews/{reviewId}/respond', {
    params: { path: { reviewId } },
    body,
  });
  if (error || !data) throw new Error('Failed to submit rent review response');
  return data;
}

/** Virtually sign the residential tenancy agreement before accepting a fixed-term increase. */
export async function signTenantRentReviewLeaseAgreement(
  reviewId: string,
): Promise<TenantRentReview> {
  const res = await fetch(
    `${API_BASE}/tenant/rent-reviews/${reviewId}/sign-lease-agreement`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    },
  );
  if (!res.ok) throw new Error('Failed to sign lease agreement');
  return (await res.json()) as TenantRentReview;
}

/** Agent-opened end-leasing cases on the tenant's leased property (`GET /api/v1/tenant/vacating-cases`). */
export async function fetchTenantVacatingCases(): Promise<TenantVacatingCase[]> {
  const { data, error } = await crossub.GET('/tenant/vacating-cases');
  if (error || !data) throw new Error('Failed to load end-leasing cases');
  return data;
}

/** Open a vacating case (`POST /api/v1/tenant/vacating-cases`) — demo / legacy self-initiate only. */
export async function createTenantVacatingCase(input: {
  expectedVacateDate: string;
  propertyId?: string;
  terminationReason?: string;
}): Promise<TenantVacatingCase> {
  const { data, error } = await crossub.POST('/tenant/vacating-cases', {
    body: {
      expectedVacateDate: new Date(input.expectedVacateDate).toISOString(),
      propertyId: input.propertyId,
      terminationReason: input.terminationReason,
    },
  });
  if (error || !data) throw new Error('Failed to start vacating case');
  return data;
}

/** Withdraw a vacating case (`PATCH /api/v1/tenant/vacating-cases/:caseId/cancel`). */
export async function cancelTenantVacatingCase(
  caseId: string,
  reason?: string,
): Promise<TenantVacatingCase> {
  const { data, error } = await crossub.PATCH('/tenant/vacating-cases/{caseId}/cancel', {
    params: { path: { caseId } },
    body: { reason },
  });
  if (error || !data) throw new Error('Failed to withdraw vacating case');
  return data;
}

/** Update vacate date (`PATCH /api/v1/tenant/vacating-cases/:caseId/vacate-date`). */
export async function updateTenantVacateDate(
  caseId: string,
  date: string,
): Promise<TenantVacatingCase> {
  const { data, error } = await crossub.PATCH('/tenant/vacating-cases/{caseId}/vacate-date', {
    params: { path: { caseId } },
    body: { date: new Date(date).toISOString() },
  });
  if (error || !data) throw new Error('Failed to update vacate date');
  return data;
}

/** Accept bond settlement (`PATCH /api/v1/tenant/vacating-cases/:caseId/settlement/accept`). */
export async function acceptTenantVacatingSettlement(
  caseId: string,
): Promise<TenantVacatingCase> {
  const { data, error } = await crossub.PATCH(
    '/tenant/vacating-cases/{caseId}/settlement/accept',
    { params: { path: { caseId } } },
  );
  if (error || !data) throw new Error('Failed to accept settlement');
  return data;
}

/** Decline bond settlement (`PATCH /api/v1/tenant/vacating-cases/:caseId/settlement/decline`). */
export async function declineTenantVacatingSettlement(
  caseId: string,
  body: TenantDeclineVacatingSettlement,
): Promise<TenantVacatingCase> {
  const { data, error } = await crossub.PATCH(
    '/tenant/vacating-cases/{caseId}/settlement/decline',
    { params: { path: { caseId } }, body },
  );
  if (error || !data) throw new Error('Failed to decline settlement');
  return data;
}

/** Record outgoing inspection attendance (`PATCH /api/v1/tenant/vacating-cases/:caseId/outgoing-attendance`). */
export async function setTenantVacatingOutgoingAttendance(
  caseId: string,
  attendance: 'yes' | 'no',
): Promise<TenantVacatingCase> {
  const { data, error } = await crossub.PATCH(
    '/tenant/vacating-cases/{caseId}/outgoing-attendance',
    { params: { path: { caseId } }, body: { attendance } },
  );
  if (error || !data) throw new Error('Failed to update outgoing inspection attendance');
  return data;
}

/** Agree to bond-deduction items from the quote step. */
export async function acceptTenantVacatingRepairQuote(
  caseId: string,
): Promise<TenantVacatingCase> {
  const response = await fetch(
    `${API_BASE}/tenant/vacating-cases/${encodeURIComponent(caseId)}/repair-quote/accept`,
    { method: 'PATCH', credentials: 'include' },
  );
  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }
    throwTenantApiError(body, response, 'Failed to accept repair quote');
  }
  return (await response.json()) as TenantVacatingCase;
}

/** Disagree with bond-deduction items from the quote step. */
export async function declineTenantVacatingRepairQuote(
  caseId: string,
  body: { reason?: string; acknowledgedPrice?: string },
): Promise<TenantVacatingCase> {
  const response = await fetch(
    `${API_BASE}/tenant/vacating-cases/${encodeURIComponent(caseId)}/repair-quote/decline`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    let errBody: unknown;
    try {
      errBody = await response.json();
    } catch {
      errBody = undefined;
    }
    throwTenantApiError(errBody, response, 'Failed to decline repair quote');
  }
  return (await response.json()) as TenantVacatingCase;
}

/** Upload a key-return proof photo (direct-to-R2, with base64 fallback). */
export async function uploadTenantKeyReturnPhoto(input: {
  caseId: string;
  file: File;
  mimeType?: string;
}): Promise<string> {
  const mimeType = input.mimeType || resolveEvidenceMimeType(input.file);
  const caseId = encodeURIComponent(input.caseId);
  const sessionPath = `${API_BASE}/tenant/vacating-cases/${caseId}/key-return/photos/upload-session`;
  const completePath = `${API_BASE}/tenant/vacating-cases/${caseId}/key-return/photos/upload-complete`;
  const inlinePath = `${API_BASE}/tenant/vacating-cases/${caseId}/key-return/photos/upload`;

  return uploadFileDirectToR2({
    file: input.file,
    mimeType,
    beginSession: (meta) =>
      postJson<DirectUploadSession>(sessionPath, meta, 'Failed to start key return upload'),
    completeSession: async (storageKey, meta) => {
      const data = await postJson<{ url?: string }>(
        completePath,
        { storageKey, ...meta },
        'Failed to finalize key return upload',
      );
      if (!data.url) throw new Error('Upload succeeded but no URL returned');
      return data.url;
    },
    inlineUpload: async (contentBase64, meta, onProgress) => {
      const data = await postJsonWithUploadProgress<{ url?: string }>(
        inlinePath,
        { ...meta, contentBase64 },
        'Failed to upload key return photo',
        onProgress,
      );
      if (!data.url) throw new Error('Upload succeeded but no URL returned');
      return data.url;
    },
  });
}

/** Submit key return proof (`PATCH .../key-return`). */
export async function submitTenantKeyReturn(input: {
  caseId: string;
  photoUrls: string[];
}): Promise<TenantVacatingCase> {
  const response = await fetch(
    `${API_BASE}/tenant/vacating-cases/${encodeURIComponent(input.caseId)}/key-return`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoUrls: input.photoUrls }),
    },
  );
  if (!response.ok) {
    let errBody: unknown;
    try {
      errBody = await response.json();
    } catch {
      errBody = undefined;
    }
    throwTenantApiError(errBody, response, 'Failed to submit key return');
  }
  return (await response.json()) as TenantVacatingCase;
}

/** Acknowledge tenant responsibility items from the compare step. */
export async function acceptTenantVacatingResponsibilities(
  caseId: string,
): Promise<TenantVacatingCase> {
  const response = await fetch(
    `${API_BASE}/tenant/vacating-cases/${encodeURIComponent(caseId)}/responsibilities/accept`,
    { method: 'PATCH', credentials: 'include' },
  );
  if (!response.ok) {
    let errBody: unknown;
    try {
      errBody = await response.json();
    } catch {
      errBody = undefined;
    }
    throwTenantApiError(errBody, response, 'Failed to acknowledge responsibilities');
  }
  return (await response.json()) as TenantVacatingCase;
}

/** Decline tenant responsibility items from the compare step. */
export async function declineTenantVacatingResponsibilities(
  caseId: string,
  body: { reason: string },
): Promise<TenantVacatingCase> {
  const response = await fetch(
    `${API_BASE}/tenant/vacating-cases/${encodeURIComponent(caseId)}/responsibilities/decline`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    let errBody: unknown;
    try {
      errBody = await response.json();
    } catch {
      errBody = undefined;
    }
    throwTenantApiError(errBody, response, 'Failed to decline responsibilities');
  }
  return (await response.json()) as TenantVacatingCase;
}

export type TenantMaintenanceResponsibilityAck =
  components['schemas']['TenantMaintenanceResponsibilityAckDto'];

/**
 * Maintenance on the tenant’s leased property (`GET /api/v1/tenant/maintenance-requests`,
 * all pages).
 *
 * Reading only the first page silently truncated the list — and because the provider kept
 * the rows the response was missing, the repairs that fell off page one stuck to the top of
 * the screen, frozen at their last-seen status.
 */
export async function fetchMaintenanceRequests(): Promise<
  TenantMaintenanceRequestSummary[]
> {
  return collectPages(async (page, pageSize) => {
    const { data, error } = await crossub.GET('/tenant/maintenance-requests', {
      params: { query: { page, pageSize } },
    });
    if (error || !data) throw new Error('Failed to load maintenance requests');
    return { items: data.items, hasMore: data.hasMore };
  });
}

/** Acknowledge or disagree with tenant-responsibility (`PATCH .../responsibility-ack`). */
export async function respondMaintenanceResponsibilityAck(
  requestId: string,
  body: TenantMaintenanceResponsibilityAck,
): Promise<TenantMaintenanceRequestSummary> {
  const { data, error, response } = await crossub.PATCH(
    '/tenant/maintenance-requests/{requestId}/responsibility-ack',
    {
      params: { path: { requestId } },
      body,
    },
  );
  // The API refuses this call with a specific, human reason — the case is already closed, an
  // answer is already recorded, a reason is required. Collapsing all of them into one generic
  // "failed" left the tenant nothing to act on and made the cause invisible from the outside.
  if (error || !data) {
    throwTenantApiError(error, response, 'Failed to record maintenance responsibility response');
  }
  return data;
}

export type TenantMaintenanceCompletionApproval =
  components['schemas']['TenantMaintenanceCompletionApprovalDto'];

/** Approve contractor completion evidence (`PATCH .../completion-approval`). */
export async function approveMaintenanceCompletion(
  requestId: string,
  body: TenantMaintenanceCompletionApproval = { approved: true },
): Promise<TenantMaintenanceRequestSummary> {
  const { data, error, response } = await crossub.PATCH(
    '/tenant/maintenance-requests/{requestId}/completion-approval',
    {
      params: { path: { requestId } },
      body,
    },
  );
  if (error || !data) {
    throwTenantApiError(error, response, 'Failed to record maintenance completion approval');
  }
  return data;
}

/** Approve or decline contractor-proposed visit times (`PATCH .../schedule-response`). */
export async function respondToMaintenanceSchedule(
  requestId: string,
  body: { decision: 'approved' | 'declined'; declineReason?: string },
): Promise<TenantMaintenanceRequestSummary> {
  const base = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/v1`;
  const res = await fetch(
    `${base}/tenant/maintenance-requests/${requestId}/schedule-response`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: body.decision,
        ...(body.declineReason?.trim() ? { declineReason: body.declineReason.trim() } : {}),
      }),
    },
  );
  if (!res.ok) {
    let detail = '';
    try {
      const payload = (await res.json()) as { message?: string | string[] };
      const msg = payload?.message;
      detail = Array.isArray(msg) ? msg.join(', ') : typeof msg === 'string' ? msg : '';
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(detail.trim() || 'Failed to record schedule response');
  }
  return res.json() as Promise<TenantMaintenanceRequestSummary>;
}

/** Raise a maintenance request (`POST /api/v1/tenant/maintenance-requests`). */
export async function submitMaintenanceRequest(
  body: CreateTenantMaintenanceRequest,
): Promise<TenantMaintenanceRequest> {
  const { data, error } = await crossub.POST('/tenant/maintenance-requests', { body });
  if (error || !data) throw new Error('Failed to submit maintenance request');
  return data;
}

/**
 * Stage a single repair photo before creating the request.
 * Uses direct-to-R2 on staging/production; falls back to base64 JSON locally.
 */
export async function uploadMaintenancePhoto(
  body: UploadTenantPhoto,
): Promise<string> {
  const { data, error } = await crossub.POST(
    '/tenant/maintenance-requests/photos/upload',
    { body },
  );
  if (error || !data) throw new Error('Failed to upload photo');
  return data.url;
}

export async function uploadMaintenancePhotoFile(
  file: File,
  mimeType = resolveEvidenceMimeType(file),
): Promise<string> {
  return uploadFileDirectToR2({
    file,
    mimeType,
    beginSession: (meta) =>
      postJson<DirectUploadSession>(
        `${API_BASE}/tenant/maintenance-requests/photos/upload-session`,
        meta,
        'Failed to start photo upload',
      ),
    completeSession: async (storageKey, meta: DirectUploadMeta) => {
      const data = await postJson<{ url?: string }>(
        `${API_BASE}/tenant/maintenance-requests/photos/upload-complete`,
        { storageKey, ...meta },
        'Failed to finalize photo upload',
      );
      if (!data.url) throw new Error('Upload succeeded but no URL returned');
      return data.url;
    },
    inlineUpload: async (contentBase64, meta) =>
      uploadMaintenancePhoto({ ...meta, contentBase64 }),
  });
}

/**
 * Stage up to 5 repair photos in order, returning their public urls. Direct-to-R2
 * when configured; the first failure rejects so evidence stays on the form.
 */
export async function uploadRepairPhotos(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files.slice(0, 5)) {
    urls.push(await uploadMaintenancePhotoFile(file));
  }
  return urls;
}

/** Message threads about the tenant's leased property (`GET /api/v1/tenant/messages`). */
export async function fetchTenantMessages(): Promise<TenantMessageThread[]> {
  const { data, error } = await crossub.GET('/tenant/messages');
  if (error || !data) throw new Error('Failed to load messages');
  return data;
}

/** Open a new message thread (`POST /api/v1/tenant/messages`). */
export async function createTenantMessageThread(
  body: CreateTenantMessageThread,
): Promise<TenantMessageThread> {
  const { data, error } = await crossub.POST('/tenant/messages', { body });
  if (error || !data) throw new Error('Failed to create message thread');
  return data;
}

/** Reply to a message thread (`POST /api/v1/tenant/messages/:threadId/reply`). */
export async function replyToTenantMessageThread(
  threadId: string,
  body: SendTenantMessage,
): Promise<TenantMessageThread> {
  const { data, error } = await crossub.POST('/tenant/messages/{threadId}/reply', {
    params: { path: { threadId } },
    body,
  });
  if (error || !data) throw new Error('Failed to send message');
  return data;
}

/** Mark a message thread read (`PATCH /api/v1/tenant/messages/:threadId/read`). */
export async function markTenantMessageThreadRead(
  threadId: string,
): Promise<TenantMessageThread> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/v1/tenant/messages/${encodeURIComponent(threadId)}/read`,
    { method: 'PATCH', credentials: 'include' },
  );
  if (!res.ok) throw new Error('Failed to mark thread read');
  return res.json() as Promise<TenantMessageThread>;
}

/** Notifications for the signed-in tenant (`GET /api/v1/tenant/notifications`). */
export async function fetchTenantNotifications(): Promise<TenantNotificationDto[]> {
  const { data, error } = await crossub.GET('/tenant/notifications');
  if (error || !data) throw new Error('Failed to load notifications');
  return data;
}

/** Mark one notification read (`PATCH /api/v1/tenant/notifications/:id/read`). */
export async function markTenantNotificationRead(
  notificationId: string,
): Promise<TenantNotificationDto> {
  const { data, error } = await crossub.PATCH(
    '/tenant/notifications/{notificationId}/read',
    { params: { path: { notificationId } } },
  );
  if (error || !data) throw new Error('Failed to mark notification read');
  return data;
}

/** Mark all notifications read (`POST /api/v1/tenant/notifications/read-all`). */
export async function markAllTenantNotificationsRead(): Promise<number> {
  const { data, error } = await crossub.POST('/tenant/notifications/read-all', {});
  if (error || !data) throw new Error('Failed to mark all notifications read');
  return data.updated;
}

export type TenantTenancyWelcomeStatus = {
  acknowledged: boolean;
};

/** Welcome guide acknowledgement state (`GET /api/v1/tenant/onboarding/welcome`). */
export async function fetchTenancyWelcomeStatus(): Promise<TenantTenancyWelcomeStatus> {
  const res = await fetch(`${API_BASE}/tenant/onboarding/welcome`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to load welcome guide status');
  return (await res.json()) as TenantTenancyWelcomeStatus;
}

/** Persist welcome guide acknowledgement (`POST /api/v1/tenant/onboarding/welcome/acknowledge`). */
export async function acknowledgeTenancyWelcomeGuide(): Promise<TenantTenancyWelcomeStatus> {
  const res = await fetch(`${API_BASE}/tenant/onboarding/welcome/acknowledge`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to acknowledge welcome guide');
  return (await res.json()) as TenantTenancyWelcomeStatus;
}

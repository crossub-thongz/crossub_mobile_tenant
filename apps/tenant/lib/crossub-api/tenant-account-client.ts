import type { components } from '@crossub-thongz/api-contract';

import { fileToBase64 } from '@/lib/utils';

import { crossub } from './client';

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
export type TenantRentReview =
  components['schemas']['TenantRentReviewResponseDto'];

/** Vacating case from tenant vacating API. */
export type TenantVacatingCase = {
  id: string;
  propertyId: string | null;
  propertyAddress: string | null;
  status: 'open' | 'cancelled';
  currentStage: VacatingStage;
  vacatingDate: string | null;
  initialVacatingDate: string | null;
  vacateDateChanged: boolean;
  keysReturned: boolean;
  inspectionDate: string | null;
  outgoingInspectionId: string | null;
  inspectionReportAvailable: boolean;
  tenantSettlementStatus: 'pending' | 'accepted' | 'declined';
  tenantConfirmationDueAt: string | null;
  refundAmount: number | null;
  debtAmount: number | null;
  bondRefundPaid: boolean;
  terminationReason: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
};

type VacatingStage =
  import('@/constants/vacating').VacatingStage;

/** Active leases for the signed-in tenant (`GET /api/v1/tenant/tenancies`). */
export async function fetchTenancies(): Promise<TenantTenancy[]> {
  const { data, error } = await crossub.GET('/tenant/tenancies');
  if (error || !data) throw new Error('Failed to load tenancies');
  return data.items;
}

/** Payment ledger for the signed-in tenant (`GET /api/v1/tenant/ledger`). */
export async function fetchLedger(): Promise<TenantLedgerEntry[]> {
  const { data, error } = await crossub.GET('/tenant/ledger');
  if (error || !data) throw new Error('Failed to load ledger');
  return data.items;
}

/** Leased properties for the signed-in tenant (`GET /api/v1/tenant/properties`). */
export async function fetchTenantProperties(): Promise<TenantProperty[]> {
  const { data, error } = await crossub.GET('/tenant/properties');
  if (error || !data) throw new Error('Failed to load properties');
  return data.items;
}

/** Inspections on the signed-in tenant's leased property (`GET /api/v1/tenant/inspections`). */
export async function fetchTenantInspections(): Promise<TenantInspection[]> {
  const { data, error } = await crossub.GET('/tenant/inspections');
  if (error || !data) throw new Error('Failed to load inspections');
  return data.items;
}

/** Documents on the signed-in tenant's leased property (`GET /api/v1/tenant/documents`). */
export async function fetchTenantDocuments(): Promise<TenantDocument[]> {
  const { data, error } = await crossub.GET('/tenant/documents');
  if (error || !data) throw new Error('Failed to load documents');
  return data;
}

/** The signed-in tenant's own rental applications (`GET /api/v1/tenant/applications`). */
export async function fetchTenantApplications(): Promise<TenantApplication[]> {
  const { data, error } = await crossub.GET('/tenant/applications');
  if (error || !data) throw new Error('Failed to load applications');
  return data.items;
}

/** Rent reviews on the signed-in tenant's leased property (`GET /api/v1/tenant/rent-reviews`). */
export async function fetchTenantRentReviews(): Promise<TenantRentReview[]> {
  const { data, error } = await crossub.GET('/tenant/rent-reviews');
  if (error || !data) throw new Error('Failed to load rent reviews');
  return data;
}

/** Vacating cases on the signed-in tenant's leased property (`GET /api/v1/tenant/vacating-cases`). */
export async function fetchTenantVacatingCases(): Promise<TenantVacatingCase[]> {
  const base = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/v1`;
  const res = await fetch(`${base}/tenant/vacating-cases`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load vacating cases');
  return (await res.json()) as TenantVacatingCase[];
}

/** Open a vacating case (`POST /api/v1/tenant/vacating-cases`). */
export async function createTenantVacatingCase(input: {
  expectedVacateDate: string;
  propertyId?: string;
  terminationReason?: string;
}): Promise<TenantVacatingCase> {
  const base = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/v1`;
  const res = await fetch(`${base}/tenant/vacating-cases`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      expectedVacateDate: new Date(input.expectedVacateDate).toISOString(),
      propertyId: input.propertyId,
      terminationReason: input.terminationReason,
    }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? 'Failed to start vacating case');
  }
  return (await res.json()) as TenantVacatingCase;
}

/** Withdraw a vacating case (`PATCH /api/v1/tenant/vacating-cases/:caseId/cancel`). */
export async function cancelTenantVacatingCase(
  caseId: string,
  reason?: string,
): Promise<TenantVacatingCase> {
  const base = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/v1`;
  const res = await fetch(`${base}/tenant/vacating-cases/${caseId}/cancel`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error('Failed to withdraw vacating case');
  return (await res.json()) as TenantVacatingCase;
}

/** Update vacate date (`PATCH /api/v1/tenant/vacating-cases/:caseId/vacate-date`). */
export async function updateTenantVacateDate(
  caseId: string,
  date: string,
): Promise<TenantVacatingCase> {
  const base = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/v1`;
  const res = await fetch(`${base}/tenant/vacating-cases/${caseId}/vacate-date`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: new Date(date).toISOString() }),
  });
  if (!res.ok) throw new Error('Failed to update vacate date');
  return (await res.json()) as TenantVacatingCase;
}

/** Maintenance requests the signed-in tenant has filed (`GET /api/v1/tenant/maintenance-requests`). */
export async function fetchMaintenanceRequests(): Promise<
  TenantMaintenanceRequestSummary[]
> {
  const { data, error } = await crossub.GET('/tenant/maintenance-requests');
  if (error || !data) throw new Error('Failed to load maintenance requests');
  return data.items;
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
 * Stage a single repair photo before creating the request
 * (`POST /api/v1/tenant/maintenance-requests/photos/upload`). Returns the stored file's
 * public url; the caller collects the urls and passes them to `submitMaintenanceRequest`.
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

/**
 * Stage up to 5 repair photos in order, returning their public urls. Each file is read to
 * base64 and uploaded individually; the first failure rejects so the caller can block the
 * submit and keep the evidence on the form (never lost). Returns [] for no files.
 */
export async function uploadRepairPhotos(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files.slice(0, 5)) {
    const contentBase64 = await fileToBase64(file);
    const url = await uploadMaintenancePhoto({
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      contentBase64,
    });
    urls.push(url);
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

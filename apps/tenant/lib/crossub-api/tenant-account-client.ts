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
export type TenantDeclineVacatingSettlement =
  components['schemas']['TenantDeclineVacatingSettlementDto'];

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

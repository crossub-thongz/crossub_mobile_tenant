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

import type { components } from '@crossub-thongz/api-contract';

import { crossub } from './client';

export type TenantTenancy = components['schemas']['TenantTenancyResponseDto'];
export type TenantLedgerEntry = components['schemas']['TenantLedgerEntryResponseDto'];
export type TenantProperty = components['schemas']['TenantPropertyResponseDto'];
export type TenantMaintenanceRequest =
  components['schemas']['TenantMaintenanceRequestResponseDto'];
export type CreateTenantMaintenanceRequest =
  components['schemas']['CreateTenantMaintenanceRequestDto'];

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

/** Raise a maintenance request (`POST /api/v1/tenant/maintenance-requests`). */
export async function submitMaintenanceRequest(
  body: CreateTenantMaintenanceRequest,
): Promise<TenantMaintenanceRequest> {
  const { data, error } = await crossub.POST('/tenant/maintenance-requests', { body });
  if (error || !data) throw new Error('Failed to submit maintenance request');
  return data;
}

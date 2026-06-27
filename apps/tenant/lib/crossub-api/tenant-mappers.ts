/**
 * Pure adapters from the typed CROSSUB API DTOs (`@crossub-thongz/api-contract`) to the
 * view-model types the tenant screens already render (`lib/types.ts`). Keeping the
 * translation here means the screens stay agnostic about where their data came from —
 * the provider swaps seed data for these mapped results with no component changes.
 */
import {
  LEASE_STATUS,
  LEDGER_DIRECTION,
  LEDGER_ENTRY_TYPE,
  MAINTENANCE_STATUS,
} from '@/constants/api-enums';
import type {
  LeaseSummary,
  MaintenanceRequest,
  MaintenanceTenantStatus,
  RentReceipt,
} from '@/lib/types';

import type {
  TenantLedgerEntry,
  TenantMaintenanceRequestSummary,
  TenantTenancy,
} from './tenant-account-client';

const MS_PER_DAY = 86_400_000;

/**
 * The generated contract types nullable columns inconsistently — some surface as
 * `T | Record<string, never>` rather than `T | null` (an openapi-typescript rendering of
 * a `nullable: true` schema with no explicit `type`). So every scalar we read is funnelled
 * through these guards to land a clean primitive or null, never a stray `{}`.
 */
function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}
function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Whole days from now until `iso`, or undefined when it's missing/past/unparseable. */
function daysUntil(iso: string | null): number | undefined {
  if (!iso) return undefined;
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return undefined;
  const days = Math.ceil((end - Date.now()) / MS_PER_DAY);
  return days >= 0 ? days : undefined;
}

/** Map the API's LeaseStatus onto the app's lease-status badge union. */
function toLeaseViewStatus(status: TenantTenancy['status']): LeaseSummary['status'] {
  if (status === LEASE_STATUS.ENDED) return 'vacating';
  // DRAFT/SENT/PARTIALLY_SIGNED/SIGNED/ACTIVE all read as a live lease to the tenant.
  return 'active';
}

/**
 * Collapse the tenant's tenancies into the single lease card the app shows. Prefers an
 * ACTIVE lease, else the first returned (the API sorts newest-first). Returns null when
 * the tenant has no tenancy so the Lease/Property screens render their empty state.
 * `documents` is left empty — the tenancy DTO carries no lease attachments yet.
 */
export function toLeaseSummary(tenancies: TenantTenancy[]): LeaseSummary | null {
  if (!tenancies.length) return null;
  const lease =
    tenancies.find((t) => t.status === LEASE_STATUS.ACTIVE) ?? tenancies[0];
  const term = `${asString(lease.leaseTerm) ?? ''} ${
    asString(lease.contractType) ?? ''
  }`.toLowerCase();
  const endDate = asString(lease.endDate);
  return {
    id: lease.id,
    propertyAddress:
      asString(lease.propertyAddress) ??
      asString(lease.propertySuburb) ??
      'Your property',
    rentWeekly: asNumber(lease.weeklyRent) ?? 0,
    leaseStart: asString(lease.startDate) ?? '',
    leaseEnd: endDate ?? '',
    periodic: term.includes('periodic'),
    status: toLeaseViewStatus(lease.status),
    documents: [],
    renewalDueInDays: daysUntil(endDate),
  };
}

/**
 * Project the tenant's rent payments out of the ledger into the receipt cards the
 * Accounting screen lists. A rent payment is a RENT line the tenant paid OUT; charges
 * and other line types are excluded from "payment history". The thin ledger has no
 * receipt number or billing period, so the line description and settlement date stand in.
 */
export function toRentPaymentReceipts(
  entries: TenantLedgerEntry[],
): RentReceipt[] {
  return entries
    .filter(
      (e) =>
        e.type === LEDGER_ENTRY_TYPE.RENT &&
        e.direction === LEDGER_DIRECTION.OUT,
    )
    .map((e) => {
      const when = asString(e.occurredAt) ?? '';
      return {
        id: e.id,
        receiptNumber: asString(e.description) ?? 'Rent payment',
        periodStart: when,
        periodEnd: when,
        amount: asNumber(e.amount) ?? 0,
        receivedAt: when,
        issuedAt: when,
        pdfAvailable: false,
      };
    });
}

const MAINTENANCE_VIEW_STATUS: Record<
  TenantMaintenanceRequestSummary['status'],
  MaintenanceTenantStatus
> = {
  [MAINTENANCE_STATUS.OPEN]: 'submitted',
  [MAINTENANCE_STATUS.APPROVED]: 'under_review',
  [MAINTENANCE_STATUS.QUOTING]: 'under_review',
  [MAINTENANCE_STATUS.SCHEDULED]: 'contractor_assigned',
  [MAINTENANCE_STATUS.INVOICED]: 'in_progress',
  [MAINTENANCE_STATUS.COMPLETED]: 'completed',
  [MAINTENANCE_STATUS.CANCELLED]: 'closed',
};

const MAINTENANCE_STATUS_LABEL: Record<
  TenantMaintenanceRequestSummary['status'],
  string
> = {
  [MAINTENANCE_STATUS.OPEN]: 'Submitted',
  [MAINTENANCE_STATUS.APPROVED]: 'Approved',
  [MAINTENANCE_STATUS.QUOTING]: 'Getting quotes',
  [MAINTENANCE_STATUS.SCHEDULED]: 'Scheduled',
  [MAINTENANCE_STATUS.INVOICED]: 'Work completed',
  [MAINTENANCE_STATUS.COMPLETED]: 'Completed',
  [MAINTENANCE_STATUS.CANCELLED]: 'Closed',
};

const MAINTENANCE_PROGRESS: Record<
  TenantMaintenanceRequestSummary['status'],
  number
> = {
  [MAINTENANCE_STATUS.OPEN]: 10,
  [MAINTENANCE_STATUS.APPROVED]: 30,
  [MAINTENANCE_STATUS.QUOTING]: 45,
  [MAINTENANCE_STATUS.SCHEDULED]: 65,
  [MAINTENANCE_STATUS.INVOICED]: 85,
  [MAINTENANCE_STATUS.COMPLETED]: 100,
  [MAINTENANCE_STATUS.CANCELLED]: 100,
};

/**
 * Map the tenant's submitted maintenance requests (API summaries) onto the app's
 * MaintenanceRequest cards. The summary carries no contractor/timeline internals, so
 * those stay empty; the tenant sees status, category, urgency and a derived progress.
 * `fallbackAddress` (the lease address) fills in when a ticket carries no property.
 */
export function toTenantMaintenanceRequests(
  summaries: TenantMaintenanceRequestSummary[],
  fallbackAddress?: string,
): MaintenanceRequest[] {
  return summaries.map((s) => ({
    id: s.id,
    trackingNumber: asString(s.orderNumber) ?? s.id,
    propertyAddress: asString(s.propertyAddress) ?? fallbackAddress ?? '—',
    category: asString(s.categoryName) ?? 'General',
    description: asString(s.description) ?? '',
    area: '—',
    urgency: s.urgent ? 'urgent' : 'normal',
    status: MAINTENANCE_VIEW_STATUS[s.status] ?? 'submitted',
    statusLabel: MAINTENANCE_STATUS_LABEL[s.status] ?? 'Submitted',
    progressPercent: MAINTENANCE_PROGRESS[s.status] ?? 10,
    scheduledAt: asString(s.scheduledDate) ?? undefined,
    timeline: [],
    createdAt: asString(s.createdAt) ?? '',
  }));
}

/**
 * Pure adapters from the typed CROSSUB API DTOs (`@crossub-thongz/api-contract`) to the
 * view-model types the tenant screens already render (`lib/types.ts`). Keeping the
 * translation here means the screens stay agnostic about where their data came from —
 * the provider swaps seed data for these mapped results with no component changes.
 */
import {
  COMM_CHANNEL,
  COMM_DEPARTMENT,
  INSPECTION_STATUS,
  INSPECTION_TYPE,
  LEASE_STATUS,
  LEDGER_DIRECTION,
  LEDGER_ENTRY_TYPE,
  MAINTENANCE_STATUS,
  TENANT_NOTIFICATION_TYPE,
} from '@/constants/api-enums';
import type {
  InspectionListType,
  InspectionSummary,
  LeaseSummary,
  MaintenanceRequest,
  MaintenanceTenantStatus,
  MessageCategory,
  MessageThread,
  MessageType,
  RentReceipt,
  TenantNotification,
  ThreadMessage,
} from '@/lib/types';

import type {
  TenantDocument,
  TenantInspection,
  TenantLedgerEntry,
  TenantMaintenanceRequestSummary,
  TenantMessageThread,
  TenantNotificationDto,
  TenantTenancy,
} from './tenant-account-client';

/** The app's stored-document card shape (the provider's `storedDocuments` items). */
export interface TenantDocumentView {
  id: string;
  name: string;
  category: string;
  uploadedAt: string;
}

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

/** Map the API conversation department onto the app's inbox category tag. */
function departmentToCategory(
  department: TenantMessageThread['department'],
): MessageCategory {
  switch (department) {
    case COMM_DEPARTMENT.MAINTENANCE:
      return 'maintenance';
    case COMM_DEPARTMENT.INSPECTION:
      return 'inspection';
    case COMM_DEPARTMENT.ACCOUNTING:
      return 'accounting';
    case COMM_DEPARTMENT.LEASING:
      return 'leasing';
    default:
      return 'other';
  }
}

/** Map the API conversation department onto the app's MessageType (drives linked-case routing). */
function departmentToType(
  department: TenantMessageThread['department'],
): MessageType {
  switch (department) {
    case COMM_DEPARTMENT.MAINTENANCE:
      return 'maintenance';
    case COMM_DEPARTMENT.INSPECTION:
      return 'inspection';
    case COMM_DEPARTMENT.ACCOUNTING:
      return 'accounting';
    default:
      return 'general';
  }
}

/** Map the app's compose category onto the API conversation department for a new thread. */
export function categoryToDepartment(
  category: MessageCategory,
): TenantMessageThread['department'] {
  switch (category) {
    case 'maintenance':
      return COMM_DEPARTMENT.MAINTENANCE;
    case 'inspection':
      return COMM_DEPARTMENT.INSPECTION;
    case 'accounting':
      return COMM_DEPARTMENT.ACCOUNTING;
    case 'leasing':
      return COMM_DEPARTMENT.LEASING;
    default:
      return COMM_DEPARTMENT.GENERAL;
  }
}

/** Project one API message onto the app's ThreadMessage (perspective via `fromSelf`). */
function toThreadMessage(
  m: TenantMessageThread['messages'][number],
): ThreadMessage {
  return {
    id: m.id,
    at: asString(m.at) ?? '',
    direction: m.fromSelf ? 'outbound' : 'inbound',
    // Tenant threads are with CROSSUB staff; the app models the counterpart as `agent`.
    party: 'agent',
    fromName: asString(m.from) ?? (m.fromSelf ? 'You' : 'CROSSUB'),
    body: asString(m.body) ?? '',
    channel: m.channel === COMM_CHANNEL.EMAIL ? 'email' : 'app',
  };
}

/** Map the API notification type onto the app's lowercase category tag (drives the icon). */
function notificationCategory(type: TenantNotificationDto['type']): string {
  switch (type) {
    case TENANT_NOTIFICATION_TYPE.RENT_DUE:
    case TENANT_NOTIFICATION_TYPE.RENT_RECEIVED:
      return 'payment';
    case TENANT_NOTIFICATION_TYPE.MAINTENANCE:
      return 'maintenance';
    case TENANT_NOTIFICATION_TYPE.INSPECTION:
      return 'inspection';
    case TENANT_NOTIFICATION_TYPE.RENT_REVIEW:
      return 'rent_review';
    case TENANT_NOTIFICATION_TYPE.MESSAGE:
      return 'message';
    default:
      return 'lease';
  }
}

/** Project the tenant's API notifications onto the app's notification cards. */
export function toTenantNotifications(
  notifications: TenantNotificationDto[],
): TenantNotification[] {
  return notifications.map((n) => ({
    id: n.id,
    title: asString(n.title) ?? '',
    body: asString(n.body) ?? '',
    type: notificationCategory(n.type),
    read: Boolean(n.read),
    href: asString(n.href) ?? '/notifications',
    createdAt: asString(n.createdAt) ?? '',
    actionRequired: asString(n.actionRequired) ?? undefined,
  }));
}

/**
 * Project the tenant's API message threads onto the app's MessageThread cards, returning
 * the threads plus a per-thread map of their nested messages (the list response carries
 * the full history, so a single fetch fills both the inbox and each thread detail). The
 * tenant always converses with CROSSUB staff, so every thread's `recipient` is `agent`.
 */
export function toMessageThreads(threads: TenantMessageThread[]): {
  threads: MessageThread[];
  messagesById: Record<string, ThreadMessage[]>;
} {
  const messagesById: Record<string, ThreadMessage[]> = {};
  const mapped: MessageThread[] = threads.map((t) => {
    messagesById[t.id] = (t.messages ?? []).map(toThreadMessage);
    return {
      id: t.id,
      subject: asString(t.subject) ?? 'Conversation',
      type: departmentToType(t.department),
      category: departmentToCategory(t.department),
      recipient: 'agent',
      propertyAddress: asString(t.propertyAddress) ?? undefined,
      lastMessage: asString(t.lastMessage) ?? '',
      lastAt: asString(t.lastAt) ?? '',
      unread: asNumber(t.unread) ?? 0,
      channel: 'app',
    };
  });
  return { threads: mapped, messagesById };
}

/** Collapse the API inspection type onto the app's three-way list type. */
function inspectionListType(type: TenantInspection['type']): InspectionListType {
  if (type === INSPECTION_TYPE.INGOING) return 'ingoing';
  if (type === INSPECTION_TYPE.OUTGOING) return 'outgoing';
  return 'routine';
}

/** Friendly label for the API inspection status (the screen shows it verbatim). */
function inspectionStatusLabel(status: TenantInspection['status']): string {
  switch (status) {
    case INSPECTION_STATUS.DRAFT:
      return 'Draft';
    case INSPECTION_STATUS.IN_PROGRESS:
      return 'In progress';
    case INSPECTION_STATUS.FIRST_REVIEW:
    case INSPECTION_STATUS.SECOND_REVIEW:
      return 'Under review';
    case INSPECTION_STATUS.COMPLETED:
      return 'Completed';
    case INSPECTION_STATUS.PUBLISHED:
      return 'Published';
    case INSPECTION_STATUS.CANCELLED:
      return 'Cancelled';
    default:
      return 'Scheduled';
  }
}

/**
 * Project the tenant's API inspections onto the app's InspectionSummary cards. The href
 * opens the published report PDF when one exists, otherwise stays on the list (the
 * ingoing/outgoing confirmation flows are not wired here — read-only).
 */
export function toTenantInspections(
  inspections: TenantInspection[],
): InspectionSummary[] {
  return inspections.map((i) => {
    const scheduledAt =
      asString(i.scheduledDate) ?? asString(i.inspectionDate) ?? undefined;
    const reportUrl = asString(i.reportUrl);
    return {
      id: i.id,
      type: inspectionListType(i.type),
      propertyAddress: asString(i.propertyAddress) ?? '—',
      status: inspectionStatusLabel(i.status),
      scheduledAt,
      href: reportUrl ?? '/inspections',
    };
  });
}

/** Friendly label for the aggregated document category (the screen shows it verbatim). */
function documentCategoryLabel(category: TenantDocument['category']): string {
  switch (category) {
    case 'inspection':
      return 'Inspection report';
    case 'lease':
      return 'Lease';
    case 'maintenance_invoice':
    case 'maintenance_quote':
      return 'Maintenance';
    case 'statement':
      return 'Statement';
    default:
      return 'Document';
  }
}

/**
 * Project the tenant's API documents onto the app's stored-document cards. The aggregator
 * already filters to rows that have a real file URL, so every item here is a real document
 * (inspection report, maintenance report, or lease PDF), newest first.
 */
export function toTenantDocuments(
  documents: TenantDocument[],
): TenantDocumentView[] {
  return documents.map((d) => ({
    id: asString(d.id) ?? '',
    name: asString(d.name) ?? 'Document',
    category: documentCategoryLabel(d.category),
    uploadedAt: asString(d.uploadedAt) ?? '',
  }));
}

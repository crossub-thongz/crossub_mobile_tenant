/**
 * Pure adapters from the typed CROSSUB API DTOs (`@crossub-thongz/api-contract`) to the
 * view-model types the tenant screens already render (`lib/types.ts`). Keeping the
 * translation here means the screens stay agnostic about where their data came from —
 * the provider swaps seed data for these mapped results with no component changes.
 */
import { VACATING_STAGE } from '@/constants/vacating';
import { routineInspection } from '@/constants/routes';
import {
  APPLICATION_STATUS,
  COMM_CHANNEL,
  COMM_DEPARTMENT,
  INSPECTION_STATUS,
  INSPECTION_TYPE,
  LEASE_STATUS,
  LEDGER_DIRECTION,
  LEDGER_ENTRY_TYPE,
  RENT_REVIEW_WORKFLOW_STATE,
  TENANT_NOTIFICATION_TYPE,
} from '@/constants/api-enums';
import { toPlainTextBody } from '@/lib/message-body';
import { routineInspectionStatusLabel } from '@/lib/routine-inspection';
import { normalizePaymentCycle } from '@/lib/rent-calculations';
import { recipientPartyFromSubject } from '@/lib/tenant-message-recipients';
import { resolvePropertyAddress } from '@/lib/format-address';
import {
  buildTenantMaintenanceTimeline,
  mapTenantMaintenancePresentation,
} from '@/lib/tenant-maintenance-status';
import type {
  ApplicationStatus,
  IngoingReport,
  InspectionListType,
  InspectionSummary,
  LeaseSummary,
  MaintenancePropertyContact,
  MaintenanceRequest,
  MessageCategory,
  MessageThread,
  MessageType,
  NewLeasingCase,
  OutgoingReport,
  RentReceipt,
  RentReviewCase,
  RentReviewTenantStatus,
  RentalApplication,
  TenantNotification,
  ThreadMessage,
  VacatingCase,
} from '@/lib/types';

import type {
  TenantApplication,
  TenantDocument,
  TenantIngoingInspection,
  TenantInspection,
  TenantLedgerEntry,
  TenantMaintenanceRequestSummary,
  TenantMessageThread,
  TenantNewLeasing,
  TenantNotificationDto,
  TenantOutgoingInspection,
  TenantRentReview,
  TenantRoutineInspection,
  TenantTenancy,
  TenantVacatingCase,
} from './tenant-account-client';

/** The app's stored-document card shape (the provider's `storedDocuments` items). */
export interface TenantDocumentView {
  id: string;
  name: string;
  category: string;
  uploadedAt: string;
  url?: string;
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
function mapPropertyAddress(propertyAddress: unknown): string {
  return resolvePropertyAddress(asString(propertyAddress));
}
function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readMaintenancePropertyContact(
  value: unknown,
): MaintenancePropertyContact | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const contact = value as Record<string, unknown>;
  const name = asString(contact.name) ?? undefined;
  const email = asString(contact.email) ?? undefined;
  const phone = asString(contact.phone) ?? undefined;
  if (!name && !email && !phone) return undefined;
  return { name, email, phone };
}

export function readTenantPropertyMessageContacts(property: unknown): {
  strataContact?: MaintenancePropertyContact;
  buildingManager?: MaintenancePropertyContact;
} {
  if (!property || typeof property !== 'object') return {};
  const row = property as Record<string, unknown>;
  const strataContact = readMaintenancePropertyContact(row.strataContact);
  const buildingManager = readMaintenancePropertyContact(row.buildingManager);
  return {
    ...(strataContact ? { strataContact } : {}),
    ...(buildingManager ? { buildingManager } : {}),
  };
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
    propertyId: asString(lease.propertyId) ?? undefined,
    propertyAddress:
      resolvePropertyAddress(asString(lease.propertyAddress), {
        suburb: asString(lease.propertySuburb),
      }) || 'Your property',
    rentWeekly: asNumber(lease.weeklyRent) ?? 0,
    leaseStart: asString(lease.startDate) ?? '',
    leaseEnd: endDate ?? '',
    periodic: term.includes('periodic'),
    status: toLeaseViewStatus(lease.status),
    documents: [],
    renewalDueInDays: daysUntil(endDate),
    nextRentReviewAt: asString(
      (lease as { nextRentReviewAt?: string | null }).nextRentReviewAt,
    ) ?? undefined,
    routineInspectionFrequency:
      asNumber(
        (lease as { routineInspectionFrequency?: number | null })
          .routineInspectionFrequency,
      ) ?? undefined,
    routineInspectionFrequencyMonths:
      asNumber(
        (lease as { routineInspectionFrequencyMonths?: number | null })
          .routineInspectionFrequencyMonths,
      ) ?? undefined,
    nextRoutineInspectionAt:
      asString(
        (lease as { nextRoutineInspectionAt?: string | null }).nextRoutineInspectionAt,
      ) ?? undefined,
    paymentCycle:
      normalizePaymentCycle(
        asString((lease as { paymentCycle?: string | null }).paymentCycle),
      ),
    rentPaidTo:
      asString((lease as { rentPaidTo?: string | null }).rentPaidTo) ?? undefined,
    paymentReference:
      asString((lease as { paymentReference?: string | null }).paymentReference) ??
      undefined,
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

/**
 * Map maintenance request summaries onto repair cards. Includes tenant-filed tickets
 * and agent/admin jobs on the leased property.
 */
function maintenanceCategoryLabel(
  categoryName: string | null,
  description: string | null,
): string {
  if (categoryName?.trim()) return categoryName.trim();
  const raw = description?.trim() ?? '';
  const colon = raw.indexOf(':');
  if (colon > 0) {
    const prefix = raw.slice(0, colon).trim();
    if (prefix.length > 0 && prefix.length <= 120) return prefix;
  }
  return 'General';
}

export function toTenantMaintenanceRequests(
  summaries: TenantMaintenanceRequestSummary[],
  fallbackAddress?: string,
): MaintenanceRequest[] {
  return summaries.map((s) => {
    const createdAt = asString(s.createdAt) ?? '';
    const presentation = mapTenantMaintenancePresentation({
      status: s.status,
      urgent: s.urgent,
      scheduledDate: asString(s.scheduledDate),
      responsibility: s.responsibility ?? null,
      responsibilityAckRequired: s.responsibilityAckRequired ?? false,
      responsibilityAckStatus: s.responsibilityAckStatus ?? null,
      completionApprovalPending: s.completionApprovalPending ?? false,
      tenantCompletionApproved: s.tenantCompletionApproved ?? false,
    });

    const completionEvidenceUrls = Array.isArray(s.completionEvidenceUrls)
      ? s.completionEvidenceUrls.filter(
          (url): url is string => typeof url === 'string' && url.trim().length > 0,
        )
      : [];

    const mapped: MaintenanceRequest = {
      id: s.id,
      trackingNumber: asString(s.orderNumber) ?? s.id,
      propertyAddress: (() => {
        const mappedAddress = mapPropertyAddress(s.propertyAddress);
        return mappedAddress !== '—' ? mappedAddress : (fallbackAddress ?? '—');
      })(),
      category: maintenanceCategoryLabel(
        asString(s.categoryName),
        asString(s.description),
      ),
      description: (() => {
        const raw = asString(s.description) ?? '';
        const colon = raw.indexOf(':');
        if (colon > 0 && colon < 120) {
          const body = raw.slice(colon + 1).trim();
          if (body) return body;
        }
        return raw;
      })(),
      area: '',
      urgency: s.urgent ? 'urgent' : 'normal',
      status: presentation.status,
      statusLabel: presentation.statusLabel,
      statusHint: presentation.statusHint,
      progressPercent: presentation.progressPercent,
      scheduledAt: asString(s.scheduledDate) ?? undefined,
      timeline: buildTenantMaintenanceTimeline({
        id: s.id,
        createdAt,
        statusLabel: presentation.statusLabel,
        statusHint: presentation.statusHint,
        responsibility: s.responsibility ?? null,
        responsibilityAckRequired: s.responsibilityAckRequired ?? false,
        responsibilityAckStatus: s.responsibilityAckStatus ?? null,
        completionApprovalPending: s.completionApprovalPending ?? false,
        tenantCompletionApproved: s.tenantCompletionApproved ?? false,
        completionEvidenceUploaded: s.completionEvidenceUploaded ?? completionEvidenceUrls.length > 0,
        status: presentation.status,
      }),
      createdAt,
      responsibility: s.responsibility ?? null,
      responsibilityAckRequired: s.responsibilityAckRequired ?? false,
      responsibilityAckStatus: s.responsibilityAckStatus ?? null,
      responsibilityAckDeadline: asString(s.responsibilityAckDeadline) ?? null,
      photos: Array.isArray(s.photos) ? s.photos.filter((url): url is string => typeof url === 'string' && url.trim().length > 0) : [],
      completionEvidenceUrls,
      completionEvidenceUploaded: s.completionEvidenceUploaded ?? completionEvidenceUrls.length > 0,
      completionApprovalPending: s.completionApprovalPending ?? false,
      scheduleApprovalPending: s.scheduleApprovalPending ?? false,
      scheduleProposedTimes: asString(s.scheduleProposedTimes) ?? null,
      tenantCompletionApproved: s.tenantCompletionApproved ?? false,
      buildingName: asString(s.buildingName),
      strataPlanNumber: asString(s.strataPlanNumber),
      buildingManager: readMaintenancePropertyContact(s.buildingManager),
      strataContact: readMaintenancePropertyContact(s.strataContact),
    };

    return mapped;
  });
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
    // API bodies are email-shaped (plain text + an inline portal CTA button).
    body: toPlainTextBody(asString(m.body) ?? ''),
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
    body: toPlainTextBody(asString(n.body) ?? ''),
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
 * the full history, so a single fetch fills both the inbox and each thread detail). Delivery
 * still routes through CROSSUB staff — `recipient` reflects who the tenant is addressing.
 */
export function toMessageThreads(threads: TenantMessageThread[]): {
  threads: MessageThread[];
  messagesById: Record<string, ThreadMessage[]>;
} {
  const messagesById: Record<string, ThreadMessage[]> = {};
  const mapped: MessageThread[] = threads.map((t) => {
    const subject = asString(t.subject) ?? 'Conversation';
    messagesById[t.id] = (t.messages ?? []).map(toThreadMessage);
    return {
      id: t.id,
      subject,
      type: departmentToType(t.department),
      category: departmentToCategory(t.department),
      recipient: recipientPartyFromSubject(subject),
      propertyAddress: asString(t.propertyAddress)
        ? mapPropertyAddress(t.propertyAddress)
        : undefined,
      lastMessage: toPlainTextBody(asString(t.lastMessage) ?? ''),
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
      propertyAddress: mapPropertyAddress(i.propertyAddress),
      status: inspectionStatusLabel(i.status),
      scheduledAt,
      href: reportUrl ?? '/inspections',
    };
  });
}

/** Project agent-created routine inspections onto inspection list cards. */
export function toRoutineInspectionSummaries(
  items: TenantRoutineInspection[],
): InspectionSummary[] {
  return items.map((r) => ({
    id: r.id,
    type: 'routine' as const,
    propertyAddress: mapPropertyAddress(r.propertyAddress),
    status: routineInspectionStatusLabel(r.status),
    scheduledAt: asString(r.scheduledAt) ?? undefined,
    href: routineInspection(r.id),
  }));
}

/** Friendly label for the aggregated document category (the screen shows it verbatim). */
function documentCategoryLabel(category: TenantDocument['category'] | string): string {
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
    case 'application':
      return 'Application';
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
    url: asString(d.url) ?? undefined,
  }));
}

/** Map the API application status onto the app's application-status union. */
function applicationStatus(status: TenantApplication['status']): ApplicationStatus {
  switch (status) {
    case APPLICATION_STATUS.APPROVED:
    case APPLICATION_STATUS.LEASED:
      return 'approved';
    case APPLICATION_STATUS.DECLINED:
    case APPLICATION_STATUS.WITHDRAWN:
      return 'declined';
    default:
      // DRAFT / SUBMITTED — both read as "received and under review" to the tenant.
      return 'submitted';
  }
}

export function toIngoingReport(dto: TenantIngoingInspection): IngoingReport {
  const sections =
    dto.sections?.map((section) => ({
      id: section.id,
      room: section.room,
      description: section.description,
      photos: section.photos ?? [],
      tenantConfirmed: Boolean(section.confirmed) || (dto.tenantApproved && !section.disputed),
      tenantFeedback: section.feedbackComment ?? undefined,
      tenantDispute: section.disputeComment ?? undefined,
      confirmedAt: section.confirmedAt ?? undefined,
    })) ?? [];

  const confirmedCount = sections.filter(
    (s) => s.tenantConfirmed || s.tenantDispute,
  ).length;
  const hasDispute = sections.some((s) => s.tenantDispute);
  let status: IngoingReport['status'] = 'pending_tenant_review';
  if (dto.tenantApproved || dto.status === 'confirmed') status = 'confirmed';
  else if (dto.tenantRejected || dto.status === 'rejected') status = 'rejected';
  else if (hasDispute) status = 'disputed';
  else if (confirmedCount > 0) status = 'partially_confirmed';

  return {
    id: dto.id,
    propertyAddress: mapPropertyAddress(dto.propertyAddress),
    status,
    dueBy: asString(dto.dueBy)?.slice(0, 10) ?? '',
    reportUrl: dto.reportUrl ?? undefined,
    sections,
    confirmedCount,
    tenantApproved: dto.tenantApproved,
    tenantRejected: dto.tenantRejected,
    rejectReason: dto.rejectReason ?? undefined,
  };
}

/** Lightweight ingoing cards from the list endpoint (sections loaded on detail). */
export function toIngoingReportSummaries(
  inspections: TenantIngoingInspection[],
): IngoingReport[] {
  return inspections.map((dto) => toIngoingReport({ ...dto, sections: [] }));
}

export function toOutgoingReport(dto: TenantOutgoingInspection): OutgoingReport {
  const sections =
    dto.sections?.map((section) => {
      const refPhotos = (
        section as { referencePhotos?: string[] | null }
      ).referencePhotos;
      return {
        id: section.id,
        room: section.room,
        description: section.description,
        photos: section.photos ?? [],
        referencePhotos: refPhotos ?? [],
        tenantConfirmed: dto.tenantApproved ? !section.disputed : false,
        tenantDispute: section.disputeComment ?? undefined,
        confirmedAt: undefined,
      };
    }) ?? [];

  const confirmedCount = sections.filter(
    (s) => s.tenantConfirmed || s.tenantDispute,
  ).length;
  const hasDispute = sections.some((s) => s.tenantDispute);
  let status: OutgoingReport['status'] = 'report_sent';
  if (dto.tenantApproved || dto.status === 'confirmed') status = 'confirmed';
  else if (hasDispute) status = 'disputed';
  else if (confirmedCount > 0) status = 'report_sent';

  return {
    id: dto.id,
    propertyAddress: mapPropertyAddress(dto.propertyAddress),
    status,
    sections,
    confirmedCount,
    reportUrl: dto.reportUrl ?? undefined,
  };
}

/** Lightweight outgoing cards from the list endpoint (sections loaded on detail). */
export function toOutgoingReportSummaries(
  inspections: TenantOutgoingInspection[],
): OutgoingReport[] {
  return inspections.map((dto) => toOutgoingReport({ ...dto, sections: [] }));
}

/** Project the tenant's API applications onto the app's RentalApplication cards. */
export function toTenantApplications(
  applications: TenantApplication[],
): RentalApplication[] {
  return applications.map((a) => ({
    id: a.id,
    referenceNumber: asString(a.reference) ?? a.id.slice(0, 8).toUpperCase(),
    propertyId: asString(a.propertyId) ?? '',
    propertyAddress: mapPropertyAddress(a.propertyAddress),
    status: applicationStatus(a.status),
    submittedAt: asString(a.submittedAt) ?? '',
  }));
}

/** Project agent-opened new-leasing cases onto the app's NewLeasingCase cards. */
export function toTenantNewLeasingCases(cases: TenantNewLeasing[]): NewLeasingCase[] {
  return cases.map((c) => ({
    applicationId: c.applicationId,
    referenceNumber: asString(c.reference) ?? c.applicationId.slice(0, 8).toUpperCase(),
    propertyId: c.propertyId,
    propertyAddress: mapPropertyAddress(c.propertyAddress),
    applicationStatus: applicationStatus(c.applicationStatus),
    cycleId: c.cycleId,
    lifecycleStep: c.lifecycleStep,
    onboardingActive: c.onboardingActive,
    submittedAt: asString(c.submittedAt) ?? '',
  }));
}

/** Map the API rent-review workflow state onto the app's tenant-facing status. */
function rentReviewStatus(
  state: TenantRentReview['workflowState'],
  tenantCounterWeekly: number | null,
  tenantMoveOutDate: string | null,
): RentReviewTenantStatus {
  switch (state) {
    case RENT_REVIEW_WORKFLOW_STATE.TENANT_ACCEPTED:
    case RENT_REVIEW_WORKFLOW_STATE.ACCOUNTING:
      return 'accepted';
    case RENT_REVIEW_WORKFLOW_STATE.COMPLETED:
      return tenantMoveOutDate ? 'rejected' : 'accepted';
    case RENT_REVIEW_WORKFLOW_STATE.TENANT_REJECTED:
    case RENT_REVIEW_WORKFLOW_STATE.CANCELLED:
      return 'rejected';
    case RENT_REVIEW_WORKFLOW_STATE.NEGOTIATION:
      return 'countered';
    case RENT_REVIEW_WORKFLOW_STATE.AGENT_REVIEW:
      return tenantCounterWeekly != null ? 'countered' : 'pending';
    default:
      // TENANT_NOTIFIED / POSTPONED — awaiting tenant action or follow-up.
      return 'pending';
  }
}

/**
 * Project the tenant's API rent reviews onto the app's RentReviewCase cards. Only
 * tenant-visible reviews are returned by the API (dispatched notices and history).
 */
export function toTenantRentReviews(
  reviews: TenantRentReview[],
): RentReviewCase[] {
  return reviews.map((r) => {
    const effectiveDate = asString(r.effectiveDate) ?? '';
    const counter = asNumber(r.tenantCounterWeekly);
    const moveOut = asString(r.tenantMoveOutDate);
    const createdAt = asString(r.createdAt) ?? effectiveDate;
    const rawEmails = (r as { emails?: Array<Record<string, unknown>> }).emails ?? [];
    const rawNoticeTerms = (r as { noticeTerms?: Record<string, unknown> | null }).noticeTerms;
    const noticeTerms = rawNoticeTerms
      ? {
          newRentWeekly: asNumber(rawNoticeTerms.newRentWeekly) ?? 0,
          leaseType:
            rawNoticeTerms.leaseType === 'fixed' || rawNoticeTerms.leaseType === 'periodic'
              ? rawNoticeTerms.leaseType
              : null,
          leaseTerm: asString(rawNoticeTerms.leaseTerm) ?? '—',
          rentIncreaseOn: asString(rawNoticeTerms.rentIncreaseOn),
          newLeaseStart: asString(rawNoticeTerms.newLeaseStart),
          noticePdfAvailable: rawNoticeTerms.noticePdfAvailable === true,
          leaseAgreementPdfAvailable: rawNoticeTerms.leaseAgreementPdfAvailable === true,
          leaseAgreementSigned: rawNoticeTerms.leaseAgreementSigned === true,
          requiresLeaseAgreementSign: rawNoticeTerms.requiresLeaseAgreementSign === true,
        }
      : null;
    return {
      id: r.id,
      propertyAddress: mapPropertyAddress(r.propertyAddress),
      currentRentWeekly: asNumber(r.currentRentWeekly) ?? 0,
      proposedRentWeekly: asNumber(r.proposedRentWeekly) ?? 0,
      effectiveDate,
      explanation: asString(r.explanation) ?? undefined,
      rentNegotiable: r.rentNegotiable ?? null,
      status: rentReviewStatus(r.workflowState, counter, moveOut),
      counterHistory:
        counter != null
          ? [{ at: createdAt, amount: counter, by: 'tenant' as const }]
          : [],
      moveOutDate: moveOut?.slice(0, 10),
      noticeDispatchedAt: asString(
        (r as { noticeDispatchedAt?: string | null }).noticeDispatchedAt,
      ),
      noticeTerms,
      nextRentReviewOpensOn: asString(
        (r as { nextRentReviewOpensOn?: string | null }).nextRentReviewOpensOn,
      ),
      emails: rawEmails.map((email) => ({
        subject: asString(email.subject) ?? '',
        body: toPlainTextBody(asString(email.body) ?? ''),
        from: asString(email.from) ?? 'Managing Agent',
        to: asString(email.to) ?? 'Tenant',
        fromEmail: asString(email.fromEmail) ?? undefined,
        toEmail: asString(email.toEmail) ?? undefined,
        sentAt: asString(email.sentAt) ?? createdAt,
        kind: email.kind === 'reminder' ? ('reminder' as const) : ('notice' as const),
        attachments: Array.isArray(email.attachments)
          ? email.attachments
              .map((attachment) => {
                if (!attachment || typeof attachment !== 'object') return null;
                const record = attachment as Record<string, unknown>;
                const name = asString(record.name);
                const url = asString(record.url);
                if (!name || !url) return null;
                return {
                  name,
                  url,
                  mimeType: asString(record.mimeType) ?? 'application/octet-stream',
                };
              })
              .filter((attachment): attachment is NonNullable<typeof attachment> => attachment != null)
          : undefined,
      })),
    };
  });
}

/** Active (non-withdrawn) vacating case, if any. Cancelled cases are ignored. */
export function pickActiveVacatingCase(cases: VacatingCase[]): VacatingCase | null {
  return cases.find((c) => c.status === 'open') ?? null;
}

/**
 * Case to show on the Vacating screen: prefer an open case; otherwise the most
 * recently completed one; otherwise the most recently withdrawn one (Deleted tag).
 */
export function pickDisplayVacatingCase(cases: VacatingCase[]): VacatingCase | null {
  const open = pickActiveVacatingCase(cases);
  if (open) return open;
  const completed = cases.filter((c) => c.status === 'completed');
  if (completed.length > 0) {
    return completed.sort(
      (a, b) =>
        new Date(b.vacatingDate || 0).getTime() - new Date(a.vacatingDate || 0).getTime(),
    )[0]!;
  }
  const cancelled = cases.filter((c) => c.status === 'cancelled');
  if (cancelled.length === 0) return null;
  return cancelled.sort(
    (a, b) =>
      new Date(b.vacatingDate || 0).getTime() - new Date(a.vacatingDate || 0).getTime(),
  )[0]!;
}

/** Project API vacating cases onto the app's VacatingCase card (newest first from API). */
export function toTenantVacatingCases(cases: TenantVacatingCase[]): VacatingCase[] {
  return cases.map((c) => {
    const outgoingReportId =
      asString(c.outgoingInspectionId) ?? undefined;
    let outgoingStatus: VacatingCase['outgoingStatus'] = 'report_sent';
    if (c.status === 'cancelled' || c.bondRefundPaid) {
      outgoingStatus = 'finalized';
    } else if (c.tenantSettlementStatus === 'accepted') {
      outgoingStatus = 'confirmed';
    } else if (c.tenantSettlementStatus === 'declined') {
      outgoingStatus = 'disputed';
    } else if (c.inspectionReportAvailable) {
      outgoingStatus = 'report_sent';
    }

    return {
      id: c.id,
      propertyId: asString(c.propertyId) ?? undefined,
      propertyAddress: mapPropertyAddress(c.propertyAddress),
      vacatingDate:
        asString(c.vacatingDate)?.slice(0, 10) ??
        asString(c.createdAt)?.slice(0, 10) ??
        '',
      initialVacatingDate: asString(c.initialVacatingDate)?.slice(0, 10) ?? undefined,
      vacateDateChanged: c.vacateDateChanged,
      status: c.status,
      cancellationReason: asString(c.cancellationReason) ?? undefined,
      terminationReason: asString(c.terminationReason) ?? undefined,
      currentStage: c.currentStage ?? VACATING_STAGE.KEY_RETURN,
      keysReturned: c.keysReturned ?? false,
      keysReturnAddress:
        asString((c as { keysReturnAddress?: string | null }).keysReturnAddress) ?? null,
      keyReturnPhotoUrls:
        (c as { keyReturnPhotoUrls?: string[] }).keyReturnPhotoUrls ?? [],
      tenantKeyReturnSubmittedAt:
        asString(
          (c as { tenantKeyReturnSubmittedAt?: string | null }).tenantKeyReturnSubmittedAt,
        ) ?? null,
      inspectionDate: asString(c.inspectionDate)?.slice(0, 10) ?? undefined,
      outgoingInspectionId: outgoingReportId,
      inspectionReportAvailable: c.inspectionReportAvailable ?? false,
      tenantSettlementStatus: c.tenantSettlementStatus ?? 'pending',
      tenantConfirmationDueAt: asString(c.tenantConfirmationDueAt) ?? undefined,
      refundAmount: c.refundAmount,
      debtAmount: c.debtAmount,
      bondRefundPaid: c.bondRefundPaid ?? false,
      outgoingStatus,
      outgoingReportId,
      tenantOutgoingAttendance: c.tenantOutgoingAttendance ?? 'pending',
      tenantRepairQuoteStatus:
        (c as { tenantRepairQuoteStatus?: VacatingCase['tenantRepairQuoteStatus'] })
          .tenantRepairQuoteStatus ?? 'none',
      tenantResponsibilityReviewStatus:
        (c as { tenantResponsibilityReviewStatus?: VacatingCase['tenantResponsibilityReviewStatus'] })
          .tenantResponsibilityReviewStatus ?? 'none',
      tenantResponsibilityDeclineReason:
        asString(
          (c as { tenantResponsibilityDeclineReason?: string | null }).tenantResponsibilityDeclineReason,
        ) ?? null,
      tenantBondAckSentAt:
        asString(
          (c as { tenantBondAckSentAt?: string | null }).tenantBondAckSentAt,
        ) ?? undefined,
      tenantResponsibilityItems:
        (c as { tenantResponsibilityItems?: VacatingCase['tenantResponsibilityItems'] })
          .tenantResponsibilityItems ?? [],
      repairQuoteSettlementSummary:
        (c as { repairQuoteSettlementSummary?: VacatingCase['repairQuoteSettlementSummary'] })
          .repairQuoteSettlementSummary ?? null,
    };
  });
}

import type { VacatingStage } from '@/constants/vacating';

export type Priority = 'urgent' | 'high' | 'normal' | 'low';

export type TenantLifecyclePhase =
  | 'searching'
  | 'applied'
  | 'onboarding'
  | 'active'
  | 'renewal'
  | 'vacating'
  | 'completed';

export type ApplicationStatus =
  | 'submitted'
  | 'missing_information'
  | 'under_review'
  | 'approved'
  | 'declined';

export type OnboardingStepId =
  | 'deposit'
  | 'bond'
  | 'lease_signing'
  | 'key_pickup'
  | 'account_setup'
  | 'ingoing_report';

export type OnboardingStepStatus = 'pending' | 'uploaded' | 'approved' | 'completed';

export type IngoingReportStatus =
  | 'pending_tenant_review'
  | 'partially_confirmed'
  | 'disputed'
  | 'confirmed'
  | 'rejected'
  | 'overdue';

export type MaintenanceTenantStatus =
  | 'submitted'
  | 'under_review'
  | 'waiting_for_approval'
  | 'contractor_assigned'
  | 'appointment_required'
  | 'in_progress'
  | 'completed'
  | 'closed';

export type MessageType =
  | 'general'
  | 'maintenance'
  | 'inspection'
  | 'rent_review'
  | 'accounting'
  | 'vacating';

export type RentReviewTenantStatus = 'pending' | 'accepted' | 'rejected' | 'countered';

export type ArrearsStage =
  | 'late_reminder'
  | 'follow_up'
  | 'termination_notice'
  | 'resolved';

export type OutgoingReportStatus =
  | 'report_sent'
  | 'confirmed'
  | 'disputed'
  | 'supporting_photos_required'
  | 'finalized';

export type MessageChannel = 'app' | 'email';

export type PaymentProofType = 'deposit' | 'bond';

export type PaymentProofStatus = 'pending' | 'uploaded' | 'approved' | 'rejected';

export interface TimelineEntry {
  id: string;
  at: string;
  actor: string;
  title: string;
  detail?: string;
}

export interface PendingAction {
  id: string;
  module:
    | 'application'
    | 'onboarding'
    | 'ingoing'
    | 'maintenance'
    | 'rent_review'
    | 'renewal'
    | 'vacating'
    | 'outgoing'
    | 'payment'
    | 'message';
  title: string;
  subtitle: string;
  status: string;
  priority: Priority;
  dueAt?: string;
  href: string;
  updatedAt: string;
}

export interface TenantNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  href: string;
  createdAt: string;
  actionRequired?: string;
}

export interface ListingProperty {
  id: string;
  address: string;
  suburb: string;
  /** Null when the agent has not set weekly rent on the listing cycle. */
  rentWeekly: number | null;
  bondAmount?: number;
  depositAmount?: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  parking?: number;
  availableFrom: string;
  leaseTerm?: string;
  openInspectionAt?: string;
  openInspectionEndAt?: string;
  /** When the agent opened the new-leasing case. */
  listedAt?: string;
  features: string[];
  imageUrl?: string;
  /** Matches crossub_web property status (VACANT, SHOWING, OCCUPIED, …). */
  status?: string;
  /** True when vacant/showing — apply flow is enabled. */
  canApply?: boolean;
}

export interface RentalApplication {
  id: string;
  referenceNumber: string;
  propertyId: string;
  propertyAddress: string;
  status: ApplicationStatus;
  submittedAt: string;
  missingDocuments?: string[];
  declineReason?: string;
}

/** Agent-opened new-leasing engagement linked to the tenant's application. */
export interface NewLeasingCase {
  applicationId: string;
  referenceNumber: string;
  propertyId: string;
  propertyAddress: string;
  applicationStatus: ApplicationStatus;
  cycleId: string;
  lifecycleStep: 'open_inspection' | 'open_report' | 'application_approval' | 'onboarding';
  onboardingActive: boolean;
  submittedAt: string;
}

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  description: string;
  status: OnboardingStepStatus;
  dueAt?: string;
  amount?: number;
  href: string;
}

export interface LeaseSummary {
  id: string;
  propertyId?: string;
  propertyAddress: string;
  rentWeekly: number;
  leaseStart: string;
  leaseEnd: string;
  periodic: boolean;
  status: 'active' | 'periodic' | 'expiring' | 'vacating';
  documents: { id: string; name: string; uploadedAt: string }[];
  renewalDueInDays?: number;
  /** When the managing agent can next open a rent review (after an accepted increase). */
  nextRentReviewAt?: string;
}

export interface ReportSection {
  id: string;
  room: string;
  description: string;
  photos: string[];
  tenantConfirmed: boolean;
  /** Optional feedback left when confirming the section. */
  tenantFeedback?: string;
  tenantDispute?: string;
  confirmedAt?: string;
}

export interface IngoingReport {
  id: string;
  propertyAddress: string;
  status: IngoingReportStatus;
  dueBy: string;
  reportUrl?: string;
  sections: ReportSection[];
  confirmedCount: number;
  tenantApproved?: boolean;
  tenantRejected?: boolean;
  rejectReason?: string;
}

export interface MaintenanceRequest {
  id: string;
  trackingNumber: string;
  propertyAddress: string;
  category: string;
  description: string;
  area: string;
  urgency: Priority;
  status: MaintenanceTenantStatus;
  statusLabel: string;
  contractorName?: string;
  contractorPhone?: string;
  scheduledAt?: string;
  progressPercent: number;
  completionApprovalPending?: boolean;
  tenantCompletionApproved?: boolean;
  timeline: TimelineEntry[];
  createdAt: string;
}

export type InspectionListType = 'ingoing' | 'outgoing' | 'routine';

export interface InspectionSummary {
  id: string;
  type: InspectionListType;
  propertyAddress: string;
  status: string;
  scheduledAt?: string;
  href: string;
}

export type MessageCategory =
  | 'leasing'
  | 'maintenance'
  | 'inspection'
  | 'accounting'
  | 'other';

/** Who the tenant is messaging — landlord, agency, or repair contractor. */
export type MessageParty = 'landlord' | 'agent' | 'contractor';

export interface TerminationNotice {
  id: string;
  propertyAddress: string;
  reason: string;
  respondBy: string;
  vacateDeadline?: string;
}

export interface MessageThread {
  id: string;
  /**
   * Server conversation id, stamped after a real `POST /tenant/messages` reconciles an
   * optimistic thread (whose `id` is a local temp). Replies route to this id; the inbox
   * still keys off `id` so the open detail view keeps working. Equals `id` for threads
   * fetched from the API.
   */
  serverThreadId?: string;
  subject: string;
  type: MessageType;
  /** Topic tag for inbox filtering — leasing, maintenance, inspection, accounting, other. */
  category?: MessageCategory;
  /** Primary party this thread was opened with. */
  recipient: MessageParty;
  propertyAddress?: string;
  leaseId?: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
  linkedCaseId?: string;
  channel?: MessageChannel;
  /** Maintenance threads can also message the assigned contractor. */
  contractorEnabled?: boolean;
  contractorName?: string;
}

export interface ThreadMessage {
  id: string;
  at: string;
  direction: 'inbound' | 'outbound';
  /** Sender (inbound) or recipient (outbound) party. */
  party: MessageParty;
  fromName: string;
  body: string;
  channel?: MessageChannel;
  /** @deprecated legacy seed — use direction + party */
  from?: 'tenant' | 'crossub' | 'contractor' | 'landlord' | 'agent';
}

export interface PaymentProofRecord {
  id: string;
  type: PaymentProofType;
  amount: number;
  uploadedAt?: string;
  status: PaymentProofStatus;
  fileName?: string;
}

export interface OutstandingBalance {
  amount: number;
  reason: string;
  dueDate: string;
}

export interface OutgoingReport {
  id: string;
  propertyAddress: string;
  status: OutgoingReportStatus;
  sections: ReportSection[];
  confirmedCount: number;
}

export interface RentReceipt {
  id: string;
  receiptNumber: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  receivedAt: string;
  issuedAt: string;
  pdfAvailable: boolean;
}

export interface RentReviewEmail {
  subject: string;
  body: string;
  from: string;
  to: string;
  sentAt: string;
  kind: 'notice' | 'reminder';
}

export interface RentReviewNoticeTerms {
  newRentWeekly: number;
  leaseType: 'fixed' | 'periodic' | null;
  leaseTerm: string;
  rentIncreaseOn: string | null;
  newLeaseStart: string | null;
  noticePdfAvailable: boolean;
}

export interface RentReviewCase {
  id: string;
  propertyAddress: string;
  currentRentWeekly: number;
  proposedRentWeekly: number;
  effectiveDate: string;
  explanation?: string;
  reportAttachmentName?: string;
  status: RentReviewTenantStatus;
  /** When false, tenant may only accept or decline — no counter-offer. */
  rentNegotiable?: boolean | null;
  counterHistory: { at: string; amount: number; by: 'tenant' | 'agent' }[];
  moveOutDate?: string;
  noticeDispatchedAt?: string;
  noticeTerms?: RentReviewNoticeTerms | null;
  nextRentReviewOpensOn?: string | null;
  emails: RentReviewEmail[];
}

export interface RenewalDecision {
  dueBy: string;
  leaseEnd: string;
  status: 'pending' | 'renew' | 'not_renew' | 'overdue';
  selectedMoveOutDate?: string;
}

export interface VacatingCase {
  id: string;
  propertyAddress: string;
  propertyId?: string;
  vacatingDate: string;
  status: 'open' | 'cancelled';
  vacateDateChanged?: boolean;
  initialVacatingDate?: string;
  cancellationReason?: string;
  terminationReason?: string;
  currentStage: VacatingStage;
  keysReturned: boolean;
  inspectionDate?: string;
  outgoingInspectionId?: string;
  inspectionReportAvailable?: boolean;
  tenantSettlementStatus: 'pending' | 'accepted' | 'declined';
  tenantConfirmationDueAt?: string;
  refundAmount?: number | null;
  debtAmount?: number | null;
  bondRefundPaid?: boolean;
  outgoingStatus:
    | 'report_sent'
    | 'confirmed'
    | 'disputed'
    | 'supporting_photos_required'
    | 'finalized';
  outgoingReportId?: string;
}

export interface FinalStatement {
  id: string;
  propertyAddress: string;
  totalBond: number;
  rentArrears: number;
  unpaidBills: number;
  deductions: number;
  finalRefund: number;
  finalizedAt: string;
  pdfAvailable?: boolean;
}

export type ListingSortBy =
  | 'newest_desc'
  | 'address_asc'
  | 'rent_asc'
  | 'rent_desc'
  | 'available_asc'
  | 'inspection_asc';

export interface PropertyFilters {
  suburb: string;
  minRent: number | null;
  maxRent: number | null;
  propertyType: string;
  minBedrooms: number | null;
  minBathrooms: number | null;
  hasParking: boolean;
  hasOpenInspection: boolean;
  knownRentOnly: boolean;
  availableFrom: string;
  sortBy: ListingSortBy;
}

export interface ArrearsNotice {
  stage: ArrearsStage;
  outstandingAmount: number;
  dueDate: string;
  message: string;
  documentUrl?: string;
}

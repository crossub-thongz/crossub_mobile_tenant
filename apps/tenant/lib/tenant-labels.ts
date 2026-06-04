import type {
  ApplicationStatus,
  ArrearsStage,
  IngoingReportStatus,
  MaintenanceTenantStatus,
  MessageType,
} from '@/lib/types';

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  submitted: 'Application received and under review',
  missing_information: 'Upload required missing documents',
  under_review: 'Being reviewed by CROSSUB',
  approved: 'Approved — onboarding will open',
  declined: 'Application declined',
};

export const MAINTENANCE_STATUS_LABEL: Record<MaintenanceTenantStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under review',
  waiting_for_approval: 'Waiting for approval',
  contractor_assigned: 'Contractor assigned',
  appointment_required: 'Appointment required',
  in_progress: 'In progress',
  completed: 'Completed',
  closed: 'Closed',
};

export const INGOING_STATUS_LABEL: Record<IngoingReportStatus, string> = {
  pending_tenant_review: 'Pending your review',
  partially_confirmed: 'Partially confirmed',
  disputed: 'Disputed',
  confirmed: 'Confirmed',
  overdue: 'Overdue — please complete',
};

export const MESSAGE_TYPE_LABEL: Record<MessageType, string> = {
  general: 'General CROSSUB',
  maintenance: 'Maintenance',
  inspection: 'Inspection',
  rent_review: 'Rent review',
  accounting: 'Accounting',
  vacating: 'Vacating',
};

export const ARREARS_STAGE_LABEL: Record<ArrearsStage, string> = {
  late_reminder: 'Late payment reminder',
  follow_up: 'Follow-up reminder',
  termination_notice: 'Termination notice issued',
  resolved: 'Resolved',
};

export const OUTGOING_STATUS_LABEL: Record<
  import('@/lib/types').OutgoingReportStatus,
  string
> = {
  report_sent: 'Report sent — review required',
  confirmed: 'Confirmed',
  disputed: 'Disputed',
  supporting_photos_required: 'Supporting photos required',
  finalized: 'Finalized',
};

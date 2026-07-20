import { MAINTENANCE_STATUS } from '@/constants/api-enums';
import type { TenantMaintenanceRequestSummary } from '@/lib/crossub-api/tenant-account-client';
import type { MaintenanceTenantStatus, TimelineEntry } from '@/lib/types';

type MaintenanceApiStatus = TenantMaintenanceRequestSummary['status'];

export interface TenantMaintenancePresentation {
  status: MaintenanceTenantStatus;
  statusLabel: string;
  statusHint?: string;
  progressPercent: number;
}

function baseFromPrisma(status: MaintenanceApiStatus): TenantMaintenancePresentation {
  switch (status) {
    case MAINTENANCE_STATUS.OPEN:
      return {
        status: 'submitted',
        statusLabel: 'Submitted',
        statusHint: 'CROSSUB has received your repair request.',
        progressPercent: 15,
      };
    case MAINTENANCE_STATUS.APPROVED:
      return {
        status: 'under_review',
        statusLabel: 'Under review',
        statusHint: 'Your property manager is reviewing this repair.',
        progressPercent: 30,
      };
    case MAINTENANCE_STATUS.QUOTING:
      return {
        status: 'under_review',
        statusLabel: 'Getting quotes',
        statusHint: 'Contractors are being invited to quote for this repair.',
        progressPercent: 45,
      };
    case MAINTENANCE_STATUS.SCHEDULED:
      return {
        status: 'in_progress',
        statusLabel: 'In progress',
        statusHint: 'Repair work is underway or being coordinated.',
        progressPercent: 65,
      };
    case MAINTENANCE_STATUS.INVOICED:
      return {
        status: 'in_progress',
        statusLabel: 'Work finished',
        statusHint: 'The repair work is complete and being finalised.',
        progressPercent: 85,
      };
    case MAINTENANCE_STATUS.COMPLETED:
      return {
        status: 'completed',
        statusLabel: 'Completed',
        statusHint: 'This repair has been completed.',
        progressPercent: 100,
      };
    case MAINTENANCE_STATUS.CANCELLED:
      return {
        status: 'closed',
        statusLabel: 'Closed',
        statusHint: 'This repair case is closed.',
        progressPercent: 100,
      };
    default:
      return {
        status: 'submitted',
        statusLabel: 'Submitted',
        progressPercent: 15,
      };
  }
}

/** Tenant-facing status label, progress, and helper copy from API maintenance summary fields. */
export function mapTenantMaintenancePresentation(input: {
  status: MaintenanceApiStatus;
  urgent: boolean;
  scheduledDate: string | null;
  responsibility?: TenantMaintenanceRequestSummary['responsibility'];
  responsibilityAckRequired?: boolean;
  responsibilityAckStatus?: TenantMaintenanceRequestSummary['responsibilityAckStatus'];
}): TenantMaintenancePresentation {
  const base = baseFromPrisma(input.status);

  if (input.responsibilityAckRequired) {
    return {
      status: 'waiting_for_approval',
      statusLabel: 'Action required',
      statusHint:
        'Please acknowledge or disagree with the responsibility decision. If you do not respond within 48 hours, the case will automatically close.',
      progressPercent: 55,
    };
  }

  if (input.responsibilityAckStatus === 'disagreed') {
    return {
      status: 'closed',
      statusLabel: 'Closed — disputed',
      statusHint: 'You disagreed with the responsibility decision. CROSSUB has closed this case.',
      progressPercent: 100,
    };
  }

  if (input.responsibility === 'tenant') {
    if (
      input.status === MAINTENANCE_STATUS.SCHEDULED ||
      input.status === MAINTENANCE_STATUS.INVOICED
    ) {
      if (input.responsibilityAckStatus === 'agreed') {
        return {
          status: 'in_progress',
          statusLabel: 'Your responsibility',
          statusHint: 'You acknowledged this repair is your responsibility. Arrange your own contractor to resolve it.',
          progressPercent: 70,
        };
      }
    }
    if (
      input.status === MAINTENANCE_STATUS.APPROVED ||
      input.status === MAINTENANCE_STATUS.OPEN
    ) {
      return {
        ...base,
        statusHint: 'CROSSUB is reviewing who is responsible for this repair.',
      };
    }
  }

  if (input.responsibility === 'landlord') {
    if (input.status === MAINTENANCE_STATUS.QUOTING) {
      return {
        status: 'under_review',
        statusLabel: 'Getting quotes',
        statusHint: 'The landlord is responsible. CROSSUB is obtaining contractor quotes.',
        progressPercent: 45,
      };
    }
    if (input.status === MAINTENANCE_STATUS.SCHEDULED) {
      const scheduled = input.scheduledDate?.trim();
      return {
        status: scheduled ? 'contractor_assigned' : 'in_progress',
        statusLabel: scheduled ? 'Work scheduled' : 'Contractor assigned',
        statusHint: scheduled
          ? 'A contractor visit has been scheduled for this repair.'
          : 'A contractor has been assigned and work is being arranged.',
        progressPercent: 75,
      };
    }
  }

  if (input.responsibility === 'strata') {
    if (
      input.status === MAINTENANCE_STATUS.SCHEDULED ||
      input.status === MAINTENANCE_STATUS.INVOICED
    ) {
      return {
        status: 'in_progress',
        statusLabel: 'Strata coordinating',
        statusHint: 'This repair is being handled through the strata body.',
        progressPercent: 65,
      };
    }
  }

  if (input.scheduledDate?.trim() && input.status === MAINTENANCE_STATUS.SCHEDULED) {
    return {
      status: 'contractor_assigned',
      statusLabel: 'Work scheduled',
      statusHint: 'A contractor visit has been scheduled for this repair.',
      progressPercent: 75,
    };
  }

  if (input.urgent && input.status === MAINTENANCE_STATUS.OPEN) {
    return {
      ...base,
      statusLabel: 'Submitted — urgent',
      statusHint: 'Your urgent repair request is being prioritised.',
    };
  }

  return base;
}

/** Synthetic timeline milestones when the API does not yet expose audit history to tenants. */
export function buildTenantMaintenanceTimeline(input: {
  id: string;
  createdAt: string;
  statusLabel: string;
  statusHint?: string;
  responsibility?: TenantMaintenanceRequestSummary['responsibility'];
  responsibilityAckRequired?: boolean;
  responsibilityAckStatus?: TenantMaintenanceRequestSummary['responsibilityAckStatus'];
  status: MaintenanceTenantStatus;
}): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    {
      id: `${input.id}-submitted`,
      at: input.createdAt,
      actor: 'You',
      title: 'Repair submitted',
      detail: 'Your request was sent to CROSSUB.',
    },
  ];

  if (input.responsibility) {
    const responsibilityDetail =
      input.responsibility === 'tenant'
        ? 'Classified as your responsibility.'
        : input.responsibility === 'landlord'
          ? 'Classified as landlord responsibility.'
          : 'Classified as strata responsibility.';
    entries.push({
      id: `${input.id}-responsibility`,
      at: input.createdAt,
      actor: 'CROSSUB',
      title: 'Responsibility determined',
      detail: responsibilityDetail,
    });
  }

  if (input.responsibilityAckRequired) {
    entries.push({
      id: `${input.id}-ack-required`,
      at: input.createdAt,
      actor: 'CROSSUB',
      title: 'Acknowledgement required',
      detail: 'Waiting for you to agree or disagree with the responsibility decision.',
    });
  } else if (input.responsibilityAckStatus === 'agreed') {
    entries.push({
      id: `${input.id}-ack-agreed`,
      at: input.createdAt,
      actor: 'You',
      title: 'Responsibility acknowledged',
      detail: 'You agreed to handle this repair.',
    });
  } else if (input.responsibilityAckStatus === 'disagreed') {
    entries.push({
      id: `${input.id}-ack-disagreed`,
      at: input.createdAt,
      actor: 'You',
      title: 'Responsibility disputed',
      detail: 'You disagreed with the responsibility decision.',
    });
  }

  if (input.status !== 'submitted') {
    entries.push({
      id: `${input.id}-current`,
      at: input.createdAt,
      actor: 'CROSSUB',
      title: input.statusLabel,
      detail: input.statusHint,
    });
  }

  return entries;
}

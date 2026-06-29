/**
 * Runtime mirrors of the CROSSUB API's Prisma enums, as consumed by the tenant app's
 * API→view-model mappers (`lib/crossub-api/tenant-mappers.ts`).
 *
 * The published contract (`@crossub-thongz/api-contract`) ships these enums as
 * string-literal *types* only — there are no runtime values to compare against — so we
 * name the literals here instead of sprinkling raw strings through the mappers. Keep in
 * sync with `crossub_web/apps/api/prisma/schema.prisma`.
 */

/** `LeaseStatus` — the lifecycle of a tenancy agreement. */
export const LEASE_STATUS = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PARTIALLY_SIGNED: 'PARTIALLY_SIGNED',
  SIGNED: 'SIGNED',
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED',
} as const;

/** `LedgerEntryType` — what a ledger line represents. */
export const LEDGER_ENTRY_TYPE = {
  RENT: 'RENT',
  SERVICE: 'SERVICE',
  PACKAGE: 'PACKAGE',
  BOND: 'BOND',
  WITHDRAW: 'WITHDRAW',
  TOPUP: 'TOPUP',
  INSPECTION: 'INSPECTION',
  COMMISSION: 'COMMISSION',
  CONTRACT: 'CONTRACT',
  OTHER: 'OTHER',
} as const;

/**
 * Direction of a ledger line from the signed-in tenant's perspective (a derived,
 * FE-facing label — not a stored column). OUT = money the tenant paid; IN = received.
 */
export const LEDGER_DIRECTION = {
  IN: 'IN',
  OUT: 'OUT',
} as const;

/** `MaintenanceStatus` — progress of a maintenance work order. */
export const MAINTENANCE_STATUS = {
  OPEN: 'OPEN',
  APPROVED: 'APPROVED',
  QUOTING: 'QUOTING',
  SCHEDULED: 'SCHEDULED',
  INVOICED: 'INVOICED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

/** `CommDepartment` — the staff queue a message thread is routed to. */
export const COMM_DEPARTMENT = {
  LEASING: 'LEASING',
  MAINTENANCE: 'MAINTENANCE',
  INSPECTION: 'INSPECTION',
  ACCOUNTING: 'ACCOUNTING',
  TRIBUNAL: 'TRIBUNAL',
  GENERAL: 'GENERAL',
} as const;

/** `CommChannel` — the channel a message was sent on. */
export const COMM_CHANNEL = {
  APP: 'APP',
  EMAIL: 'EMAIL',
  VOICE: 'VOICE',
  SMS: 'SMS',
} as const;

/** `InspectionType` — the kind of inspection. */
export const INSPECTION_TYPE = {
  CONDITION: 'CONDITION',
  ROUTINE: 'ROUTINE',
  INGOING: 'INGOING',
  OUTGOING: 'OUTGOING',
  WARD_ROUND: 'WARD_ROUND',
  OPEN: 'OPEN',
} as const;

/** `InspectionStatus` — review/lifecycle state of an inspection. */
export const INSPECTION_STATUS = {
  DRAFT: 'DRAFT',
  IN_PROGRESS: 'IN_PROGRESS',
  FIRST_REVIEW: 'FIRST_REVIEW',
  SECOND_REVIEW: 'SECOND_REVIEW',
  COMPLETED: 'COMPLETED',
  PUBLISHED: 'PUBLISHED',
  CANCELLED: 'CANCELLED',
} as const;

/** `TenantNotificationType` — the kind of tenant notification (drives the app's icon/category). */
export const TENANT_NOTIFICATION_TYPE = {
  RENT_DUE: 'RENT_DUE',
  RENT_RECEIVED: 'RENT_RECEIVED',
  MAINTENANCE: 'MAINTENANCE',
  INSPECTION: 'INSPECTION',
  RENT_REVIEW: 'RENT_REVIEW',
  MESSAGE: 'MESSAGE',
  LEASE: 'LEASE',
} as const;

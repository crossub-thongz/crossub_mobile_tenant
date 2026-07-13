export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  DEPARTMENT_HEAD: 'DEPARTMENT_HEAD',
  ACCOUNT_MANAGER: 'ACCOUNT_MANAGER',
  ACCOUNT_MANAGER_FULL: 'ACCOUNT_MANAGER_FULL',
  ACCOUNTING: 'ACCOUNTING',
  STAFF: 'STAFF',
  TENANT: 'TENANT',
  LANDLORD: 'LANDLORD',
  CONTRACTOR: 'CONTRACTOR',
  INSPECTOR: 'INSPECTOR',
  /** @deprecated legacy local enum */
  HR: 'HR',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const UserStatus = {
  PENDING_INVITE: 'PENDING_INVITE',
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

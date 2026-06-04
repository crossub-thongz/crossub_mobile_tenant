import type { AuthUser } from '@/lib/auth-types';
import { Role, UserStatus } from '@/constants/roles';

function isRole(value: unknown): value is AuthUser['role'] {
  return (
    value === Role.SUPER_ADMIN || value === Role.HR || value === Role.STAFF
  );
}

function isUserStatus(value: unknown): value is AuthUser['status'] {
  return (
    value === UserStatus.ACTIVE ||
    value === UserStatus.PENDING_INVITE ||
    value === UserStatus.DISABLED
  );
}

/** Normalizes /auth/login and /auth/me payloads into AuthUser. */
export function parseAuthUserPayload(body: unknown): AuthUser | null {
  if (!body || typeof body !== 'object') return null;

  const record = body as Record<string, unknown>;
  const raw =
    record.user && typeof record.user === 'object'
      ? (record.user as Record<string, unknown>)
      : record;

  if (typeof raw.id !== 'string' || typeof raw.email !== 'string') {
    return null;
  }

  const role = isRole(raw.role) ? raw.role : Role.STAFF;
  const status = isUserStatus(raw.status) ? raw.status : UserStatus.ACTIVE;

  return {
    id: raw.id,
    email: raw.email,
    role,
    status,
    profileCompleted: Boolean(raw.profileCompleted),
    firstName: typeof raw.firstName === 'string' ? raw.firstName : null,
    lastName: typeof raw.lastName === 'string' ? raw.lastName : null,
    phone: typeof raw.phone === 'string' ? raw.phone : null,
  };
}

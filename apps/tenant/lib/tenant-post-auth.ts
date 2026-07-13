import { ROUTES } from '@/constants/routes';
import type { AuthUser } from '@/lib/auth-types';

export interface SystemAccessAgreementView {
  agreementType: string;
  title: string;
  version: string;
  fileName: string;
  documentPath: string;
}

export function needsSystemAccessAgreement(user: {
  systemAccessAgreementRequired?: boolean;
  systemAccessAccepted?: boolean;
}): boolean {
  return Boolean(user.systemAccessAgreementRequired && !user.systemAccessAccepted);
}

const ONBOARDING_GUIDE_KEY = (userId: string) =>
  `crossub_tenant_onboarding_guide_done_${userId}`;

export function isOnboardingGuideDone(userId: string): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(ONBOARDING_GUIDE_KEY(userId)) === '1';
}

export function markOnboardingGuideDone(userId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ONBOARDING_GUIDE_KEY(userId), '1');
}

/** First authenticated route after login — SAA, then onboarding guide, then property. */
export function tenantPostAuthPath(user: AuthUser): string {
  if (needsSystemAccessAgreement(user)) return ROUTES.SYSTEM_ACCESS_AGREEMENT;
  if (!isOnboardingGuideDone(user.id)) return ROUTES.ONBOARDING_GUIDE;
  return ROUTES.PROPERTY;
}

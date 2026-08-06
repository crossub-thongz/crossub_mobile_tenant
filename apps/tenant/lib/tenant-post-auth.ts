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

export function needsTenancyWelcomeGuide(user: {
  tenancyWelcomeGuideAcknowledged?: boolean;
}): boolean {
  return !user.tenancyWelcomeGuideAcknowledged;
}

/** First authenticated route after login — SAA, then onboarding guide, then property. */
export function tenantPostAuthPath(user: AuthUser): string {
  if (needsSystemAccessAgreement(user)) return ROUTES.SYSTEM_ACCESS_AGREEMENT;
  if (needsTenancyWelcomeGuide(user)) return ROUTES.ONBOARDING_GUIDE;
  return ROUTES.PROPERTY;
}

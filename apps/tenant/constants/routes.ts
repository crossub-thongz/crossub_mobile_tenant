export const ROUTES = {
  DASHBOARD: '/dashboard',
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  PROPERTIES: '/properties',
  APPLICATIONS: '/applications',
  ONBOARDING: '/onboarding',
  PROPERTY: '/property',
  INSPECTIONS: '/inspections',
  REPAIRS: '/repairs',
  ACCOUNTING: '/accounting',
  MESSAGES: '/messages',
  /** @deprecated use REPAIRS — kept for redirects */
  MAINTENANCE: '/repairs',
  LEASE: '/lease',
  PAYMENTS: '/accounting',
  RENT_REVIEW: '/rent-review',
  RENEWAL: '/renewal',
  VACATING: '/vacating',
  MOVE_OUT_SERVICES: '/vacating/services',
  TERMINATION: '/termination',
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  MESSAGES_NEW: '/messages/new',
  STATEMENT: '/accounting/statement',
  DOCUMENTS: '/documents',
  TUTORIAL: '/tutorial',
  FAQ: '/faq',
  ONBOARDING_GUIDE: '/onboarding-guide',
  SYSTEM_ACCESS_AGREEMENT: '/system-access-agreement',
} as const;

export const PUBLIC_ROUTE_PATTERNS = [
  /^\/login\/?$/,
  /^\/forgot-password\/?$/,
  /^\/properties(\/|$)/,
];

/** Guest applicant journey — browse listings and submit without signing in. */
export const isApplicantRoute = (pathname: string): boolean =>
  /^\/properties(\/|$)/.test(pathname);

export const isPublicRoute = (pathname: string): boolean =>
  PUBLIC_ROUTE_PATTERNS.some((rx) => rx.test(pathname));

export const propertyDetail = (id: string, sessionId?: string) =>
  sessionId
    ? `/properties/${id}?sessionId=${encodeURIComponent(sessionId)}`
    : `/properties/${id}`;
export const propertyApply = (id: string, sessionId?: string) =>
  sessionId
    ? `/properties/${id}/apply?sessionId=${encodeURIComponent(sessionId)}`
    : `/properties/${id}/apply`;
export const propertyCheckIn = (id: string, sessionId?: string) =>
  sessionId
    ? `/properties/${id}/check-in?sessionId=${encodeURIComponent(sessionId)}`
    : `/properties/${id}/check-in`;
export const propertyApplySuccess = (id: string) => `/properties/${id}/apply/success`;
export const applicationDetail = (id: string) => `/applications/${id}`;
export const onboardingStep = (step: string) => `/onboarding/${step}`;
export const repairDetail = (id: string) => `/repairs/${id}`;
export const repairNew = () => `/repairs/new`;
/** @deprecated */
export const maintenanceDetail = repairDetail;
export const maintenanceNew = repairNew;
export const messageDetail = (id: string) => `/messages/${id}`;
export const rentReviewDetail = (id: string) => `/rent-review/${id}`;
export const ingoingReport = (id: string) => `/inspections/ingoing/${id}`;
export const routineInspection = (id: string) => `/inspections/routine/${id}`;
export const outgoingReport = (id: string) => `/vacating/outgoing/${id}`;
export const statementDetail = () => ROUTES.STATEMENT;
export const leaseDocumentView = (id: string) => `/lease/documents/${id}`;

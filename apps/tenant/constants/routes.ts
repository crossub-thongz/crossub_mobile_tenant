export const ROUTES = {
  DASHBOARD: '/dashboard',
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  PROPERTIES: '/properties',
  APPLICATIONS: '/applications',
  ONBOARDING: '/onboarding',
  LEASE: '/lease',
  MAINTENANCE: '/maintenance',
  MESSAGES: '/messages',
  PAYMENTS: '/payments',
  RENT_REVIEW: '/rent-review',
  RENEWAL: '/renewal',
  VACATING: '/vacating',
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

export const PUBLIC_ROUTE_PATTERNS = [
  /^\/login\/?$/,
  /^\/forgot-password\/?$/,
  /^\/properties\/?$/,
  /^\/properties\/[^/]+\/?$/,
];

export const isPublicRoute = (pathname: string): boolean =>
  PUBLIC_ROUTE_PATTERNS.some((rx) => rx.test(pathname));

export const propertyDetail = (id: string) => `/properties/${id}`;
export const propertyApply = (id: string) => `/properties/${id}/apply`;
export const applicationDetail = (id: string) => `/applications/${id}`;
export const onboardingStep = (step: string) => `/onboarding/${step}`;
export const maintenanceDetail = (id: string) => `/maintenance/${id}`;
export const maintenanceNew = () => `/maintenance/new`;
export const messageDetail = (id: string) => `/messages/${id}`;
export const rentReviewDetail = (id: string) => `/rent-review/${id}`;
export const ingoingReport = (id: string) => `/inspections/ingoing/${id}`;
export const outgoingReport = (id: string) => `/vacating/outgoing/${id}`;

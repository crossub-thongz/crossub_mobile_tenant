import { ROUTES } from '@/constants/routes';

/** Where the user navigated from — drives the shell back button. */
export type NavFrom =
  | 'inspections'
  | 'vacating'
  | 'onboarding'
  | 'dashboard'
  | 'notifications'
  | 'property';

const FROM_TO_ROUTE: Record<NavFrom, string> = {
  inspections: ROUTES.INSPECTIONS,
  vacating: ROUTES.VACATING,
  onboarding: ROUTES.ONBOARDING,
  dashboard: ROUTES.DASHBOARD,
  notifications: ROUTES.NOTIFICATIONS,
  property: ROUTES.PROPERTY,
};

export function hrefWithFrom(path: string, from: NavFrom): string {
  const [base, search = ''] = path.split('?');
  const params = new URLSearchParams(search);
  params.set('from', from);
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

export function resolveBackHref(
  from: string | null | undefined,
  defaultHref: string,
): string {
  if (!from) return defaultHref;
  return FROM_TO_ROUTE[from as NavFrom] ?? defaultHref;
}

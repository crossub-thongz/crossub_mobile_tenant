import { type NextRequest, NextResponse } from 'next/server';

import { COOKIE_ACCESS } from '@/constants/auth';
import { ROUTES, isPublicRoute } from '@/constants/routes';
import { isLocalAccessCookieValue } from '@/lib/local-auth';

export function proxy(req: NextRequest) {
  const access = req.cookies.get(COOKIE_ACCESS)?.value;
  const hasAccess = Boolean(access && !isLocalAccessCookieValue(access));
  const path = req.nextUrl.pathname;
  const publicRoute = isPublicRoute(path);

  if (!hasAccess && !publicRoute) {
    const url = req.nextUrl.clone();
    url.pathname = ROUTES.LOGIN;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|.*\\..*).*)',
  ],
};

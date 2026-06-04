'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/components/providers/auth-provider';
import { clearLocalSession } from '@/lib/local-auth';
import { ROUTES, isPublicRoute } from '@/constants/routes';

/**
 * Middleware only checks that csb_at exists — not that the session is valid.
 * This gate sends guests back to login when the cookie is stale or /auth/me failed.
 */
export function AuthSessionGate() {
  const { status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'guest' || isPublicRoute(pathname)) return;
    clearLocalSession();
    router.replace(ROUTES.LOGIN);
  }, [status, pathname, router]);

  return null;
}

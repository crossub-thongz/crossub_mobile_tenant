'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/components/providers/auth-provider';
import { ROUTES, isPublicRoute } from '@/constants/routes';

export function TutorialGate() {
  const { status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'authed' || isPublicRoute(pathname)) return;
    if (pathname === ROUTES.TUTORIAL) return;
    const done =
      typeof window !== 'undefined' &&
      localStorage.getItem('crossub_tenant_tutorial_done') === '1';
    if (!done) router.replace(ROUTES.TUTORIAL);
  }, [status, pathname, router]);

  return null;
}

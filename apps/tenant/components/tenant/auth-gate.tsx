'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/components/providers/auth-provider';
import { ROUTES, isPublicRoute } from '@/constants/routes';

/** Redirects to login when session is missing; avoids "logged in" shell with null user. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const publicRoute = isPublicRoute(pathname);

  useEffect(() => {
    if (publicRoute) return;
    if (status === 'guest') {
      router.replace(ROUTES.LOGIN);
    }
  }, [status, publicRoute, router]);

  if (publicRoute) return <>{children}</>;

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (status === 'guest') {
    return null;
  }

  return <>{children}</>;
}

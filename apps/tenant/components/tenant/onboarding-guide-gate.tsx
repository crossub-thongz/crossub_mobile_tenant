'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/components/providers/auth-provider';
import { ROUTES, isPublicRoute } from '@/constants/routes';
import {
  isOnboardingGuideDone,
  needsSystemAccessAgreement,
} from '@/lib/tenant-post-auth';

const GUIDE_EXEMPT = [
  ROUTES.SYSTEM_ACCESS_AGREEMENT,
  ROUTES.ONBOARDING_GUIDE,
];

export function OnboardingGuideGate() {
  const { user, status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'authed' || !user || isPublicRoute(pathname)) return;
    if (needsSystemAccessAgreement(user)) return;
    if (GUIDE_EXEMPT.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return;
    if (isOnboardingGuideDone(user.id)) return;
    router.replace(ROUTES.ONBOARDING_GUIDE);
  }, [status, user, pathname, router]);

  return null;
}

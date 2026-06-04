'use client';

import Link from 'next/link';

import { useAuth } from '@/components/providers/auth-provider';
import { ROUTES } from '@/constants/routes';

/** Shown when the app shell loaded but API session could not be restored. */
export function AuthSessionBanner() {
  const { status } = useAuth();

  if (status !== 'guest') return null;

  return (
    <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs">
      <p className="font-medium text-destructive">Session not connected</p>
      <p className="text-muted-foreground mt-1">
        Your browser may have a login cookie, but the app could not load your account from the API.
        Check that <strong>API_INTERNAL_URL</strong> is set on Render to your crossub_web API URL,
        then sign in again.
      </p>
      <Link href={ROUTES.LOGIN} className="text-primary mt-2 inline-block font-medium">
        Sign in again →
      </Link>
    </div>
  );
}

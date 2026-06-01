'use client';

import Link from 'next/link';
import { KeyRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <KeyRound className="text-primary mb-4 size-10" />
      <h1 className="text-lg font-semibold">Reset password</h1>
      <p className="text-muted-foreground mt-2 max-w-sm text-center text-sm">
        Password reset is handled by crossub_web. Contact your property manager or use the
        email link when reset is enabled on your API environment.
      </p>
      <Button asChild className="mt-6">
        <Link href={ROUTES.LOGIN}>Back to sign in</Link>
      </Button>
    </div>
  );
}

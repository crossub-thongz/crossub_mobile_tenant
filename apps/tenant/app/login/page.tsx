'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { useLayoutEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useAuth } from '@/components/providers/auth-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PASSWORD_MAX } from '@/constants/auth';
import { ROUTES } from '@/constants/routes';
import { ApiError, api } from '@/lib/api';
import type { AuthUser } from '@/lib/auth-types';
import { clearForeignPortalSession, isTenantPortalUser } from '@/lib/tenant-auth';
import { tenantPostAuthPath } from '@/lib/tenant-post-auth';

/**
 * ⚠️ `password` deliberately carries NO `.min(PASSWORD_MIN)`. Signing in VERIFIES a password;
 * it does not SET one. The length policy belongs on the screens that set a password, and the
 * setup/reset page on crossub_web still enforces it. A minimum here cannot admit an account
 * the API would reject; it can only lock out an account whose password predates the policy,
 * and it does so in the BROWSER, so the request never reaches the API and nothing is logged
 * server-side.
 *
 * `LoginDto` dropped this same rule on 10 Aug 2026 after it locked out 23 of the 43 migrated
 * agent logins, and `login-dto-validation.spec.ts` pins it there. The agent app's copy was
 * fixed with it; this one was missed, and it fails in a nastier way than a 401 — the form
 * greys out with "Min 10 characters" under a password that is perfectly correct, which reads
 * as "my password is wrong" rather than "this app will not let me try".
 *
 * `.max(PASSWORD_MAX)` stays: it bounds what is handed to Argon2 and is a cost guard, not a
 * policy statement. Do not "restore" the minimum here for symmetry with the setter forms.
 */
const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password').max(PASSWORD_MAX),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { refresh, status, user } = useAuth();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const wrongPortal = searchParams.get('wrongPortal') === '1';

  useLayoutEffect(() => {
    if (status !== 'authed' || !user) return;
    window.location.replace(tenantPostAuthPath(user));
  }, [status, user]);

  useLayoutEffect(() => {
    if (!wrongPortal) return;
    toast.error(
      'This portal is for tenants only. Staff accounts should use the CROSSUB admin portal.',
    );
  }, [wrongPortal]);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onLogin = async (values: LoginValues) => {
    try {
      const result = await api.post<{ user: AuthUser }>('/auth/login', values);
      if (!isTenantPortalUser(result.user)) {
        await clearForeignPortalSession();
        toast.error(
          'This portal is for tenants only. Use the CROSSUB admin portal for staff accounts.',
        );
        return;
      }
      await refresh();
      const me = await api.get<{ user: AuthUser }>('/auth/me');
      window.location.assign(tenantPostAuthPath(me.user));
      return;
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          toast.error('Invalid email or password.');
          return;
        }
        toast.error(`Sign in failed (${err.status}). Is crossub_web API running?`);
        return;
      }
      toast.error('Unable to sign in. Check your connection and try again.');
    }
  };

  const isSubmitting = loginForm.formState.isSubmitting;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <KeyRound className="size-5" />
        </div>
        <div>
          <p className="text-lg font-semibold">CROSSUB Tenant App</p>
          <p className="text-sm text-muted-foreground">Your rental lifecycle in one place</p>
        </div>
      </div>
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-lg">
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-xl font-semibold">Sign in</h1>
          {/*
            The old line — "use the email and password your agent gave you" — described a
            handover that never happened. Nobody was given a password: accounts were
            provisioned with an emailed setup link, and most have never been opened. Telling
            a tenant to use a password they were never issued sends them looking for a
            message that does not exist, instead of to the link below that mints one.
          */}
          <p className="text-sm text-muted-foreground">
            Sign in with the email address your lease is under. No password yet, or cannot
            find the email we sent? Use the link below.
          </p>
        </div>

        <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Username (email)</Label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                className="pl-10"
                placeholder="you@email.com"
                autoComplete="email"
                {...loginForm.register('email')}
              />
            </div>
            {loginForm.formState.errors.email && (
              <p className="text-xs text-destructive">
                {loginForm.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="pl-10 pr-10"
                placeholder="Enter your password"
                autoComplete="current-password"
                {...loginForm.register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {loginForm.formState.errors.password && (
              <p className="text-xs text-destructive">
                {loginForm.formState.errors.password.message}
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              className="text-sm text-primary hover:underline"
            >
              Set or reset my password
            </Link>
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Signing in...
              </>
            ) : (
              <>
                Sign in <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          Looking for a rental?{' '}
          <Link href={ROUTES.PROPERTIES} className="text-primary hover:underline">
            Browse properties
          </Link>
        </p>
      </div>
    </div>
  );
}

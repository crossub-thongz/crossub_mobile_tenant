'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  Receipt,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLayoutEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useAuth } from '@/components/providers/auth-provider';
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

/** Sampled from the Crossub mark (crossub-logo.png / crossub-mark.png). Not the lighter #61C1B0 guess. */
const TENANT_GREEN = '#2AC48D';

export default function LoginPage() {
  const { refresh, status, user } = useAuth();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
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
    <div
      className="relative flex min-h-[calc(100dvh-var(--env-banner-height,0px))] flex-col justify-center pt-6 pb-16 text-[#0D1836]"
      style={{
        backgroundColor: '#F6FCFC',
        backgroundImage: 'url(/login/tenant-bg.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <header className="mx-auto mb-2 w-full max-w-6xl px-5 sm:px-8 lg:-mt-4 lg:px-10">
        <div className="flex items-center gap-2.5">
          <Image src="/crossub-logo.png" alt="" width={36} height={36} priority className="size-9" />
          <span className="text-[15px] font-bold tracking-[0.16em]">CROSSUB</span>
        </div>
      </header>

      <main className="mx-auto mt-12 grid w-full max-w-6xl items-center gap-10 px-5 sm:px-8 lg:mt-16 lg:grid-cols-[minmax(0,1.05fr)_440px] lg:gap-16 lg:px-10">
        <section className="max-w-xl">
          <div className="flex items-center gap-3">
            <span className="h-0.5 w-8 rounded-full" style={{ backgroundColor: TENANT_GREEN }} />
            <p className="text-xs font-semibold tracking-[0.16em]" style={{ color: TENANT_GREEN }}>
              TENANT PORTAL
            </p>
          </div>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#0D1836] sm:text-5xl sm:leading-[1.05]">
            Manage your rental with ease
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-[#52647C]">
            Pay rent, submit maintenance requests and stay connected with your property, all in one
            place.
          </p>
          <ul className="mt-10 space-y-7">
            <Feature
              icon={Receipt}
              title="Simple rent payments"
              body="Pay securely and view your payment history."
            />
            <Feature
              icon={Wrench}
              title="Request maintenance"
              body="Report issues and track progress in real time."
            />
            <Feature
              icon={MessageCircle}
              title="Stay connected"
              body="Get important updates from your property team."
            />
          </ul>
        </section>

        <section className="w-full justify-self-end rounded-[22px] bg-white p-6 shadow-[0_18px_48px_rgba(13,24,54,0.10)] sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
          {/*
            The old line — "use the email and password your agent gave you" — described a
            handover that never happened. Nobody was given a password: accounts were
            provisioned with an emailed setup link. "Create an account" below opens the
            setup/reset screen, which re-sends that link.
          */}
          <p className="mt-1 text-sm text-[#52647C]">Sign in to your tenant account</p>

          <form onSubmit={loginForm.handleSubmit(onLogin)} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8AA0B5]" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-12 w-full rounded-[9px] border border-[#CED9E4] bg-white pr-3 pl-10 text-sm outline-none placeholder:text-[#9AADC0] focus:border-[#2AC48D]"
                  {...loginForm.register('email')}
                />
              </div>
              {loginForm.formState.errors.email ? (
                <p className="text-xs text-[#D45656]">{loginForm.formState.errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8AA0B5]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="h-12 w-full rounded-[9px] border border-[#CED9E4] bg-white pr-10 pl-10 text-sm outline-none placeholder:text-[#9AADC0] focus:border-[#2AC48D]"
                  {...loginForm.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-[#8AA0B5]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {loginForm.formState.errors.password ? (
                <p className="text-xs text-[#D45656]">{loginForm.formState.errors.password.message}</p>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <label className="inline-flex items-center gap-2 text-[#52647C]">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(event) => setKeepSignedIn(event.target.checked)}
                  className="size-4 rounded border-[#CED9E4] accent-[#2AC48D]"
                />
                Keep me signed in
              </label>
              <Link href={ROUTES.FORGOT_PASSWORD} className="font-medium" style={{ color: TENANT_GREEN }}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-[9px] text-sm font-semibold text-white disabled:opacity-70"
              style={{ backgroundColor: TENANT_GREEN }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#52647C]">
            First time here?{' '}
            <Link href={ROUTES.FORGOT_PASSWORD} className="font-semibold" style={{ color: TENANT_GREEN }}>
              Create a tenant account
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: '#E7F8F3', color: TENANT_GREEN }}
      >
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-1.5 block text-sm leading-6 text-[#52647C]">{body}</span>
      </span>
    </li>
  );
}

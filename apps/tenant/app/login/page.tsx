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
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useAuth } from '@/components/providers/auth-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PASSWORD_MAX, PASSWORD_MIN } from '@/constants/auth';
import { ROUTES } from '@/constants/routes';
import { ApiError, api } from '@/lib/api';
import type { AuthUser } from '@/lib/auth-types';
import { loginLocalAccount } from '@/lib/local-auth';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(PASSWORD_MIN, `Min ${PASSWORD_MIN} characters`)
    .max(PASSWORD_MAX),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { refresh, status } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  useLayoutEffect(() => {
    if (status !== 'authed') return;
    window.location.replace(ROUTES.DASHBOARD);
  }, [status]);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onLogin = async (values: LoginValues) => {
    try {
      await api.post<{ user: AuthUser }>('/auth/login', values);
      await refresh();
      window.location.assign(ROUTES.DASHBOARD);
      return;
    } catch (err) {
      if (err instanceof ApiError && err.status !== 401 && err.status >= 400) {
        if (err.status >= 500 || err.status === 0) {
          /* API unreachable — fall through to the local demo account */
        } else if (err.status !== 401) {
          toast.error(`Sign in failed (${err.status}). Is crossub_web API running?`);
          return;
        }
      }
    }

    const localUser = loginLocalAccount(values.email, values.password);
    if (localUser) {
      await refresh();
      window.location.assign(ROUTES.DASHBOARD);
      return;
    }

    toast.error('Invalid email or password.');
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
          <p className="text-sm text-muted-foreground">
            Use the email and password your agent gave you after your lease was set up
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
              Forgot password?
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

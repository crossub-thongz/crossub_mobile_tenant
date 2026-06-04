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
  User,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PASSWORD_MAX, PASSWORD_MIN } from '@/constants/auth';
import { ROUTES } from '@/constants/routes';
import { ApiError, api } from '@/lib/api';
import { parseAuthUserPayload } from '@/lib/parse-auth-response';
import {
  clearLocalSession,
  loginLocalAccount,
  registerLocalAccount,
} from '@/lib/local-auth';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(PASSWORD_MIN, `Min ${PASSWORD_MIN} characters`)
    .max(PASSWORD_MAX),
});

const registerSchema = loginSchema.extend({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

type AuthMode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const { refresh, establishSession, status } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (status === 'authed') router.replace(ROUTES.DASHBOARD);
  }, [status, router]);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
    },
  });

  const onLogin = async (values: LoginValues) => {
    clearLocalSession();
    try {
      const body = await api.post<unknown>('/auth/login', values);
      const sessionUser = parseAuthUserPayload(body);
      if (!sessionUser) {
        toast.error(
          'Login returned an unexpected response. Check the API proxy and try again.',
        );
        return;
      }
      establishSession(sessionUser);
      router.replace(ROUTES.DASHBOARD);
      return;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        toast.error('Invalid email or password for your agency account.');
        return;
      }
      if (err instanceof ApiError) {
        toast.error(`Sign in failed (${err.status}). Check API connection on Render.`);
        return;
      }
      if (process.env.NODE_ENV === 'development' && err instanceof Error) {
        toast.error(err.message);
        return;
      }
    }

    const localUser = loginLocalAccount(values.email, values.password);
    if (localUser) {
      establishSession(localUser);
      router.replace(ROUTES.DASHBOARD);
      toast.message('Signed in with device account', {
        description: 'Use Sign in (not Register) for system@crossub.com.au agency access.',
      });
      return;
    }

    toast.error('Could not sign in. Check password or API connection.');
  };

  const onRegister = async (values: RegisterValues) => {
    try {
      const user = registerLocalAccount({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
      });
      establishSession(user);
      await refresh();
      toast.success('Account created — you are signed in.');
      router.replace(ROUTES.DASHBOARD);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Registration failed.';
      toast.error(message);
    }
  };

  const isSubmitting =
    mode === 'login'
      ? loginForm.formState.isSubmitting
      : registerForm.formState.isSubmitting;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
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
        <div className="bg-muted mb-6 flex rounded-lg p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors',
              mode === 'login'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground',
            )}
          >
            <KeyRound className="size-4" />
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors',
              mode === 'register'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground',
            )}
          >
            <UserPlus className="size-4" />
            Register
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-10"
                  placeholder="you@email.com"
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
        ) : (
          <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <div className="relative">
                  <User className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="firstName"
                    className="pl-10"
                    {...registerForm.register('firstName')}
                  />
                </div>
                {registerForm.formState.errors.firstName && (
                  <p className="text-xs text-destructive">
                    {registerForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" {...registerForm.register('lastName')} />
                {registerForm.formState.errors.lastName && (
                  <p className="text-xs text-destructive">
                    {registerForm.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reg-email"
                  type="email"
                  className="pl-10"
                  placeholder="you@email.com"
                  {...registerForm.register('email')}
                />
              </div>
              {registerForm.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {registerForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" type="tel" {...registerForm.register('phone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Password</Label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="pl-10 pr-10"
                  placeholder={`At least ${PASSWORD_MIN} characters`}
                  {...registerForm.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {registerForm.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              Creates a new account on this device with your own profile and empty tenancy
              (applications, repairs, and payments are not shared with other logins). When your
              agency enables server registration, the same email can sign in against crossub_web.
            </p>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Creating account...
                </>
              ) : (
                <>
                  Create account <UserPlus className="size-4" />
                </>
              )}
            </Button>
          </form>
        )}

        <p className="text-muted-foreground mt-6 text-center text-xs">
          Browse listings without signing in —{' '}
          <Link href={ROUTES.PROPERTIES} className="text-primary hover:underline">
            Available properties
          </Link>
        </p>
      </div>
    </div>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';
import { ApiError, api } from '@/lib/api';

/**
 * Self-service way back in.
 *
 * This page used to be a static paragraph — "Password reset is handled by crossub_web.
 * Contact your property manager" — with no field and no request, while
 * `POST /api/auth/forgot-password` was public, live, and already did the right thing. That
 * combination is what turned "I mislaid the email" into a permanent lockout: the app told
 * people to ask their property manager, and the property manager had no button either.
 *
 * ⭐ It matters most for an account that has never been used. On 11 Aug 2026, 1,470 of 1,569
 * production tenant accounts were PENDING_INVITE — provisioned, holding a live setup link,
 * no password ever set. Such an account answers EVERY password with 401, which the sign-in
 * screen renders as "Invalid email or password", indistinguishable from a typo. The API's
 * `forgotPassword` handles exactly this: a PENDING_INVITE user is re-sent a fresh SETUP link
 * rather than being met with silence, so one screen closes the whole loop.
 *
 * The link in that email lands on the crossub_web reset page — this app deliberately has no
 * `/reset-password` route — so there is nothing more to build here than the request.
 *
 * The response is identical whether or not the address has an account (the API says so in
 * `AuthService.forgotPassword`), so the confirmation below must NOT confirm existence.
 */
const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await api.post('/auth/forgot-password', values);
      toast.success('If that address has an account, we have emailed you a link.');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error('Unable to send the email right now. Please try again shortly.');
        return;
      }
      toast.error('Something went wrong. Check your connection and try again.');
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-lg">
        <Link
          href={ROUTES.LOGIN}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to sign in
        </Link>

        <div className="mb-6 space-y-1">
          <h1 className="text-xl font-semibold">Set or reset your password</h1>
          <p className="text-sm text-muted-foreground">
            Enter the email address your property manager has on file and we&apos;ll send
            you a link. This works whether you have signed in before or have never set a
            password.
          </p>
        </div>

        {isSubmitSuccessful ? (
          <div className="space-y-3">
            {/*
              No expiry figure here on purpose. A first-time setup link lives for
              SETUP_TTL_HOURS (72h) and a reset for RESET_TTL_MINUTES (24h) — naming either
              would tell the reader which of the two they got, and therefore whether the
              address already has a password. The identical-response rule is the point.
            */}
            <p className="text-sm text-muted-foreground">
              If that address has an account, the link is on its way. Open it soon — it
              expires for security — then choose a password and come back to sign in.
            </p>
            <p className="text-sm text-muted-foreground">
              Nothing after a few minutes? Check your junk folder, and make sure you used
              the address your lease is under.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href={ROUTES.LOGIN}>Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@email.com"
                  autoComplete="email"
                  className="pl-10"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Email me a link'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

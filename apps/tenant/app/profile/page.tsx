'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useAuth } from '@/components/providers/auth-provider';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PASSWORD_MAX, PASSWORD_MIN } from '@/constants/auth';
import { applicationDetail, ROUTES } from '@/constants/routes';
import { api } from '@/lib/api';
import { apiErrorMessage } from '@/lib/api-error-message';
import { APPLICATION_STATUS_LABEL } from '@/lib/tenant-labels';
import { displayName, formatDateTime } from '@/lib/utils';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z
      .string()
      .min(PASSWORD_MIN, `Min ${PASSWORD_MIN} characters`)
      .max(PASSWORD_MAX),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
  const { user, status, refresh } = useAuth();
  const { applications } = useTenantData();
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onChangePassword = async (values: ChangePasswordValues) => {
    try {
      try {
        await api.post('/auth/refresh');
      } catch {
        /* request layer will refresh again on 401 if needed */
      }

      await api.post('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      await api.post('/auth/refresh');
      await refresh();
      reset();
      toast.success('Password updated');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Unable to change password.'));
    }
  };

  return (
    <TenantShell title="Profile">
      {status === 'loading' ? (
        <p className="text-muted-foreground text-sm">Loading profile…</p>
      ) : user ? (
        <div className="space-y-5 text-sm">
          <div className="rounded-xl border bg-card p-4">
            <p className="font-semibold">{displayName(user)}</p>
            <p className="text-muted-foreground">{user.email}</p>
            {user.phone && <p className="text-muted-foreground mt-1">{user.phone}</p>}
          </div>

          <section className="space-y-3 rounded-xl border bg-card p-4">
            <div>
              <h2 className="font-semibold">Change password</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Enter your current password, then choose a new one.
              </p>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit(onChangePassword)}>
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrent ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="pr-10"
                    {...register('currentPassword')}
                  />
                  <button
                    type="button"
                    className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    onClick={() => setShowCurrent((v) => !v)}
                    aria-label={showCurrent ? 'Hide password' : 'Show password'}
                  >
                    {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.currentPassword ? (
                  <p className="text-destructive text-xs">{errors.currentPassword.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNew ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="pr-10"
                    {...register('newPassword')}
                  />
                  <button
                    type="button"
                    className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    onClick={() => setShowNew((v) => !v)}
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  At least {PASSWORD_MIN} characters.
                </p>
                {errors.newPassword ? (
                  <p className="text-destructive text-xs">{errors.newPassword.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="pr-10"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.confirmPassword ? (
                  <p className="text-destructive text-xs">{errors.confirmPassword.message}</p>
                ) : null}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Update password
              </Button>
            </form>

            <p className="text-muted-foreground text-center text-xs">
              Forgot your current password?{' '}
              <Link
                href={ROUTES.FORGOT_PASSWORD}
                className="text-primary underline-offset-2 hover:underline"
              >
                Reset via email
              </Link>
            </p>
          </section>

          <section className="space-y-3 rounded-xl border bg-card p-4">
            <h2 className="font-semibold">Emergency contact</h2>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => toast.success('Emergency contact saved')}
            >
              Save contact
            </Button>
          </section>

          <section className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Rental applications</h2>
              <Link href={ROUTES.APPLICATIONS} className="text-primary text-xs font-medium">
                View all
              </Link>
            </div>
            {applications.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                Applications you submit will appear here with the full NSW form on file.
              </p>
            ) : (
              <ul className="space-y-2">
                {applications.slice(0, 3).map((app) => (
                  <li key={app.id}>
                    <Link
                      href={applicationDetail(app.id)}
                      className="hover:bg-muted/50 block rounded-lg border p-3"
                    >
                      <p className="font-medium">{app.propertyAddress}</p>
                      <p className="text-muted-foreground text-xs">
                        Ref {app.referenceNumber} · {formatDateTime(app.submittedAt)}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {APPLICATION_STATUS_LABEL[app.status]}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-semibold">Document storage</h2>
            <p className="text-muted-foreground mt-1">
              Lease, receipts, deposit/bond proofs, and statements.
            </p>
            <Link href={ROUTES.DOCUMENTS} className="text-primary mt-2 inline-block text-xs font-medium">
              View all documents →
            </Link>
          </section>

          <Link href={ROUTES.SETTINGS} className="text-primary text-xs font-medium">
            Notification preferences in Settings →
          </Link>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Sign in to view your profile.</p>
      )}
    </TenantShell>
  );
}

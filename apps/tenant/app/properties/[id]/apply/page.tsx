'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ApplicationRentalFacts } from '@/components/tenant/application-rental-facts';
import { TenantShell } from '@/components/layout/tenant-shell';
import { PageIntro } from '@/components/tenant/page-intro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import {
  EMPLOYMENT_OPTIONS,
  fetchPublicListing,
  submitGuestApplication,
  type EmploymentStatus,
  type SubmitGuestApplicationInput,
} from '@/lib/crossub-api/public-listings-client';
import type { ListingProperty } from '@/lib/types';
import { propertyApplySuccess, ROUTES } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/api-error-message';

export default function ApplyPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const viewingSessionId = searchParams.get('sessionId') ?? undefined;
  const router = useRouter();
  const { listings } = useTenantData();
  const cachedProperty = listings.find((p) => p.id === id);
  const [property, setProperty] = useState<ListingProperty | null>(cachedProperty ?? null);
  const [loadingListing, setLoadingListing] = useState(!cachedProperty);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<SubmitGuestApplicationInput>({
    fullName: '',
    email: '',
    phone: '',
    annualIncome: 0,
    employmentStatus: 'employed',
    moveInDate: '',
  });

  useEffect(() => {
    let cancelled = false;
    setLoadingListing(true);
    void fetchPublicListing(id, viewingSessionId)
      .then((listing) => {
        if (!cancelled) setProperty(listing);
      })
      .catch(() => {
        if (!cancelled && cachedProperty) setProperty(cachedProperty);
      })
      .finally(() => {
        if (!cancelled) setLoadingListing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cachedProperty, id, viewingSessionId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;

    if (!form.moveInDate) {
      toast.error('Select your preferred move-in date');
      return;
    }
    if (!form.annualIncome || form.annualIncome <= 0) {
      toast.error('Enter your annual income');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitGuestApplication(property.id, {
        ...form,
        annualIncome: Number(form.annualIncome),
        ...(viewingSessionId ? { viewingSessionId } : {}),
      });

      toast.success('Application submitted', {
        description: `Reference ${result.reference} — your agent can review it under Tenant selection.`,
      });
      router.push(
        `${propertyApplySuccess(property.id)}?ref=${encodeURIComponent(result.reference)}`,
      );
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not submit application'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingListing && !property) {
    return (
      <TenantShell title="Apply" backHref={`/properties/${id}`}>
        <p className="text-muted-foreground text-sm">Loading application details…</p>
      </TenantShell>
    );
  }

  if (!property) {
    return (
      <TenantShell title="Apply" backHref={ROUTES.PROPERTIES}>
        <p className="text-sm text-muted-foreground">Property not found.</p>
      </TenantShell>
    );
  }

  if (property.canApply === false) {
    return (
      <TenantShell title="Apply" backHref={`/properties/${id}`}>
        <p className="text-muted-foreground text-sm">
          This property is not accepting applications right now.
        </p>
      </TenantShell>
    );
  }

  return (
    <TenantShell title="Application form" backHref={`/properties/${id}`}>
      <PageIntro
        title={property.address}
        description={
          viewingSessionId
            ? `${property.address} — open inspection application. Your details are linked to this viewing and sent to the managing agent.`
            : `${property.address} — submitted to CROSSUB leasing. Your assigned agent sees it in Tenant selection after you apply.`
        }
      />

      <ApplicationRentalFacts property={property} />

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            required
            placeholder="Michael Lee"
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            placeholder="michael.l@email.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            required
            placeholder="+61 400 345 678"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="annualIncome">Annual income (AUD)</Label>
          <Input
            id="annualIncome"
            type="number"
            min={0}
            step={1000}
            required
            placeholder="168000"
            value={form.annualIncome || ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, annualIncome: Number(e.target.value) || 0 }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="employmentStatus">Employment</Label>
          <select
            id="employmentStatus"
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            value={form.employmentStatus}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                employmentStatus: e.target.value as EmploymentStatus,
              }))
            }
          >
            {EMPLOYMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="moveInDate">Move-in date</Label>
          <Input
            id="moveInDate"
            type="date"
            required
            value={form.moveInDate}
            onChange={(e) => setForm((f) => ({ ...f, moveInDate: e.target.value }))}
          />
        </div>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Submitting…' : 'Submit application'}
        </Button>
      </form>

      <p className="text-muted-foreground mt-4 text-center text-xs">
        Already a tenant?{' '}
        <Link href={ROUTES.LOGIN} className="text-primary font-medium">
          Sign in
        </Link>
      </p>
    </TenantShell>
  );
}

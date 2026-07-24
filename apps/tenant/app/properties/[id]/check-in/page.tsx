'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { PageIntro } from '@/components/tenant/page-intro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import {
  fetchPublicListing,
} from '@/lib/crossub-api/public-listings-client';
import { submitOpenViewingCheckIn } from '@/lib/crossub-api/open-viewings-client';
import { saveOpenInspectionCheckIn } from '@/lib/open-inspection-check-in-store';
import type { ListingProperty } from '@/lib/types';
import { propertyApply, propertyDetail, ROUTES } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/api-error-message';

export default function CheckInPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId') ?? '';
  const { listings } = useTenantData();
  const cachedProperty = listings.find((p) => p.id === id);
  const [property, setProperty] = useState<ListingProperty | null>(cachedProperty ?? null);
  const [loadingListing, setLoadingListing] = useState(!cachedProperty);
  const [submitting, setSubmitting] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    leaseTerm: '',
    pets: '',
    specialRequest: '',
    comments: '',
  });

  useEffect(() => {
    let cancelled = false;
    setLoadingListing(true);
    void fetchPublicListing(id, sessionId || undefined)
      .then((listing) => {
        if (!cancelled) {
          setProperty(listing);
          const defaultLeaseTerm = listing.leaseTerm?.trim();
          if (defaultLeaseTerm) {
            setForm((current) =>
              current.leaseTerm.trim() ? current : { ...current, leaseTerm: defaultLeaseTerm },
            );
          }
        }
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
  }, [cachedProperty, id, sessionId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    if (!sessionId) {
      toast.error('This check-in link is missing the inspection session.');
      return;
    }
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error('Enter your name, email, and phone number.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitOpenViewingCheckIn(sessionId, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        leaseTerm: form.leaseTerm.trim() || undefined,
        pets: form.pets.trim() || undefined,
        notes: form.specialRequest.trim() || undefined,
        comments: form.comments.trim() || undefined,
      });
      saveOpenInspectionCheckIn({
        propertyId: property.id,
        sessionId,
        attendeeId: result.attendeeId,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        leaseTerm: form.leaseTerm.trim() || undefined,
        pets: form.pets.trim() || undefined,
        specialRequest: form.specialRequest.trim() || undefined,
        comments: form.comments.trim() || undefined,
        checkedInAt: new Date().toISOString(),
      });
      toast.success('Check-in recorded — thank you for visiting.');
      setCheckedIn(true);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to submit check-in'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!sessionId) {
    return (
      <TenantShell title="Check in" backHref={propertyDetail(id)}>
        <p className="text-muted-foreground text-sm">
          Invalid check-in link. Scan the QR code at the property or ask your agent for a new link.
        </p>
      </TenantShell>
    );
  }

  if (loadingListing) {
    return (
      <TenantShell title="Check in" backHref={ROUTES.PROPERTIES}>
        <p className="text-muted-foreground text-sm">Loading property…</p>
      </TenantShell>
    );
  }

  if (!property) {
    return (
      <TenantShell title="Check in" backHref={ROUTES.PROPERTIES}>
        <p className="text-muted-foreground text-sm">Property not found.</p>
      </TenantShell>
    );
  }

  if (checkedIn) {
    return (
      <TenantShell title="Check-in complete" backHref={ROUTES.PROPERTIES}>
        <PageIntro
          title={property.address}
          description="Your attendance has been recorded. The agent will see your details on the open inspection report."
        />
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <p className="text-sm">
            Thank you for checking in, <span className="font-medium">{form.name.trim()}</span>.
          </p>
          <p className="text-muted-foreground text-sm">
            Ready to apply? Submit your rental application for this property — your check-in will
            stay linked to your application.
          </p>
          <Button asChild className="w-full">
            <Link href={propertyApply(property.id, sessionId)}>Apply for this property</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href={propertyDetail(property.id, sessionId)}>View property details</Link>
          </Button>
        </div>
      </TenantShell>
    );
  }

  return (
    <TenantShell title="Open inspection check-in" backHref={propertyDetail(property.id, sessionId)}>
      <PageIntro
        title={property.address}
        description="Register your attendance at this open inspection. Your agent will see your details on the inspection report."
      />

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            autoComplete="name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Mobile</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            autoComplete="tel"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="leaseTerm">Lease term</Label>
          <Input
            id="leaseTerm"
            value={form.leaseTerm}
            onChange={(e) => setForm((f) => ({ ...f, leaseTerm: e.target.value }))}
            placeholder={property.leaseTerm?.trim() || 'e.g. 12 months'}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pets">Pets</Label>
          <Input
            id="pets"
            value={form.pets}
            onChange={(e) => setForm((f) => ({ ...f, pets: e.target.value }))}
            placeholder="e.g. 1 small dog, or leave blank if none"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="specialRequest">Visitor special request</Label>
          <textarea
            id="specialRequest"
            value={form.specialRequest}
            onChange={(e) => setForm((f) => ({ ...f, specialRequest: e.target.value }))}
            placeholder="e.g. ground-floor parking, accessibility needs, preferred move-in date"
            rows={3}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[72px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="comments">Comments</Label>
          <textarea
            id="comments"
            value={form.comments}
            onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))}
            placeholder="Anything else for the agent or inspection report"
            rows={3}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[72px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Check in'}
        </Button>

        <p className="text-muted-foreground text-center text-xs">
          Want to apply for this property?{' '}
          <Link href={propertyApply(property.id, sessionId)} className="text-primary underline">
            Submit a rental application
          </Link>
        </p>
      </form>
    </TenantShell>
  );
}

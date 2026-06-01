'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';

export default function ApplyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { listings } = useTenantData();
  const property = listings.find((p) => p.id === id);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    toast.success('Application submitted', {
      description: 'Reference APP-2026-NEW · Track status in Applications.',
    });
    router.push(ROUTES.APPLICATIONS);
  };

  if (!property) {
    return (
      <TenantShell title="Apply" backHref={ROUTES.PROPERTIES}>
        <p className="text-sm text-muted-foreground">Property not found.</p>
      </TenantShell>
    );
  }

  return (
    <TenantShell title="Online application" backHref={`/properties/${id}`}>
      <p className="text-muted-foreground mb-4 text-sm">{property.address}, {property.suburb}</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Required documents (identity, income, employment, references) — confirm exact list with
          Leasing/Fay before production.
        </p>
        <div className="space-y-2">
          <Label>Full name</Label>
          <Input required placeholder="As on ID" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" required />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input type="tel" required />
        </div>
        <div className="space-y-2">
          <Label>Employment & income (summary)</Label>
          <Input required placeholder="Employer, role, annual income" />
        </div>
        <div className="space-y-2">
          <Label>Upload ID (PDF/image)</Label>
          <Input type="file" accept="image/*,.pdf" />
        </div>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Submitting...' : 'Submit application'}
        </Button>
      </form>
    </TenantShell>
  );
}

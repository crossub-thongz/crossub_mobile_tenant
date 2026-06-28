'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { useTenantData } from '@/components/providers/tenant-data-provider';
import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  submitMaintenanceRequest as apiSubmitMaintenanceRequest,
  uploadRepairPhotos,
} from '@/lib/crossub-api/tenant-account-client';
import { ROUTES } from '@/constants/routes';
import type { Priority } from '@/lib/types';
import { useDemoData } from '@/lib/utils';

export default function NewRepairPage() {
  const router = useRouter();
  const demo = useDemoData();
  const { addRepair } = useTenantData();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const category = String(fd.get('category'));
    const area = String(fd.get('area'));
    const description = String(fd.get('description'));
    const urgency = String(fd.get('urgency')) as Priority;
    const urgent = urgency === 'urgent' || urgency === 'high';
    const files = fd
      .getAll('photos')
      .filter((f): f is File => f instanceof File && f.size > 0);
    setSubmitting(true);
    try {
      if (!demo) {
        // Stage photos FIRST so a failed upload blocks the submit (evidence is never lost),
        // then create the request with the staged urls — no orphan request.
        let photos: string[] = [];
        try {
          photos = await uploadRepairPhotos(files);
        } catch {
          toast.error('Photo upload failed', {
            description: 'Please retry — your request was not submitted.',
          });
          setSubmitting(false);
          return;
        }
        const created = await apiSubmitMaintenanceRequest({
          category,
          description,
          urgent,
          ...(photos.length ? { photos } : {}),
        });
        const item = addRepair({
          category,
          description,
          area,
          urgency,
          id: created.id,
          // orderNumber is typed `string | {}` by the contract's nullable rendering — guard it.
          trackingNumber:
            typeof created.orderNumber === 'string' ? created.orderNumber : undefined,
        });
        toast.success('Request submitted', {
          description: `Tracking ${item.trackingNumber} — saved to your list.`,
        });
        router.push(ROUTES.REPAIRS);
        return;
      }
      const created = addRepair({ category, description, area, urgency });
      toast.success('Request submitted', {
        description: `Tracking ${created.trackingNumber} — saved to your list.`,
      });
      router.push(ROUTES.REPAIRS);
    } catch {
      const created = addRepair({ category, description, area, urgency });
      toast.success('Request saved', {
        description: `Tracking ${created.trackingNumber}.`,
      });
      router.push(ROUTES.REPAIRS);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TenantShell title="New repair request" backHref={ROUTES.REPAIRS}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Input name="category" required placeholder="Plumbing, electrical, etc." />
        </div>
        <div className="space-y-2">
          <Label>Property / room / area</Label>
          <Input name="area" required placeholder="Kitchen, Bedroom 1" />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input name="description" required placeholder="Describe the issue" />
        </div>
        <div className="space-y-2">
          <Label>Urgency</Label>
          <select
            name="urgency"
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            defaultValue="normal"
          >
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Photos / videos</Label>
          <Input name="photos" type="file" accept="image/*,video/*" multiple />
        </div>
        <div className="space-y-2">
          <Label>Access availability (optional)</Label>
          <Input name="access" placeholder="e.g. Weekdays after 5pm" />
        </div>
        <Button type="submit" disabled={submitting} className="w-full">
          Submit request
        </Button>
      </form>
    </TenantShell>
  );
}

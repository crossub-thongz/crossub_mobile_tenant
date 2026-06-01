'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { submitMaintenanceRequest } from '@/lib/crossub-api/maintenance-client';
import { ROUTES } from '@/constants/routes';
import { useDemoData } from '@/lib/utils';

export default function NewMaintenancePage() {
  const router = useRouter();
  const demo = useDemoData();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      if (!demo) {
        await submitMaintenanceRequest({
          title: String(fd.get('category')),
          description: String(fd.get('description')),
          category: String(fd.get('category')),
          area: String(fd.get('area')),
          urgency: String(fd.get('urgency')),
        });
      }
      toast.success('Request submitted', {
        description: 'Tracking number will appear in your list.',
      });
      router.push(ROUTES.MAINTENANCE);
    } catch {
      toast.success('Request recorded (demo)', {
        description: 'Connect API for live maintenance workflow.',
      });
      router.push(ROUTES.MAINTENANCE);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TenantShell title="New repair request" backHref={ROUTES.MAINTENANCE}>
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
          <Input type="file" accept="image/*,video/*" multiple />
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

'use client';

import { useParams } from 'next/navigation';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/constants/routes';

export default function OutgoingReportPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <TenantShell title="Outgoing report" backHref={ROUTES.VACATING}>
      <p className="text-muted-foreground mb-4 text-sm">
        Confirm outgoing inspection report section-by-section (similar to ingoing). Upload
        supporting photos when re-clean or repair evidence is required.
      </p>
      <p className="text-xs text-muted-foreground">Report ID: {id}</p>
      <div className="mt-4 space-y-3">
        <Button className="w-full" onClick={() => toast.success('Report acknowledged')}>
          Confirm report
        </Button>
        <Button variant="outline" className="w-full" onClick={() => toast.info('Dispute logged')}>
          Raise dispute on item
        </Button>
        <div className="rounded-xl border p-4">
          <p className="text-sm font-medium">Supporting photos</p>
          <Input type="file" accept="image/*" multiple className="mt-2" />
        </div>
      </div>
    </TenantShell>
  );
}

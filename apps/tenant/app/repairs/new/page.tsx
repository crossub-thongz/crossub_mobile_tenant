'use client';

import { TenantMaintenanceNewJobForm } from '@/components/maintenance/tenant-maintenance-new-job-form';
import { TenantShell } from '@/components/layout/tenant-shell';
import { ROUTES } from '@/constants/routes';

export default function NewRepairPage() {
  return (
    <TenantShell title="Log maintenance job" backHref={ROUTES.REPAIRS}>
      <TenantMaintenanceNewJobForm />
    </TenantShell>
  );
}

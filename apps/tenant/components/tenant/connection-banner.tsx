'use client';

import { useTenantData } from '@/components/providers/tenant-data-provider';

export function ConnectionBanner() {
  const { apiConnected, loading } = useTenantData();

  if (loading || apiConnected) return null;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
      Unable to reach the CROSSUB API — some data may be out of date. Check your connection.
    </div>
  );
}

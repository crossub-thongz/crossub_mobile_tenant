'use client';

import { useTenantData } from '@/components/providers/tenant-data-provider';
import { useDemoData } from '@/lib/utils';

export function ConnectionBanner() {
  const { apiConnected, loading } = useTenantData();
  const demo = useDemoData();

  if (loading || apiConnected || !demo) return null;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
      Demo data mode — connect to crossub_web API for live maintenance and auth.
    </div>
  );
}

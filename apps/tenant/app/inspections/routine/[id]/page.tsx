'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { TenantShell } from '@/components/layout/tenant-shell';
import { ReportSectionCard } from '@/components/tenant/report-section-card';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { resolveBackHref } from '@/lib/back-navigation';
import { fetchTenantRoutineInspection } from '@/lib/crossub-api/tenant-account-client';
import type { TenantRoutineInspection } from '@/lib/crossub-api/tenant-account-client';
import {
  needsRoutineInspectionAction,
  routineInspectionStatusLabel,
} from '@/lib/routine-inspection';
import type { ReportSection } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

type RoutineSectionDto = {
  id: string;
  room: string;
  description: string;
  photos?: string[];
  referencePhotos?: string[];
};

export default function RoutineInspectionPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const backHref = resolveBackHref(searchParams.get('from'), ROUTES.INSPECTIONS);
  const { routineInspections, apiConnected } = useTenantData();
  const [loaded, setLoaded] = useState<TenantRoutineInspection | null>(null);
  const [loading, setLoading] = useState(false);

  const summary =
    routineInspections.find((r) => r.id === id || r.inspectionId === id) ?? null;
  const inspection = loaded ?? summary;

  useEffect(() => {
    if (!apiConnected) return;
    setLoading(true);
    void fetchTenantRoutineInspection(id)
      .then(setLoaded)
      .catch(() => setLoaded(summary))
      .finally(() => setLoading(false));
  }, [apiConnected, id, summary]);

  if (loading && !inspection) {
    return (
      <TenantShell title="Routine inspection" backHref={backHref}>
        <p className="text-muted-foreground text-sm">Loading inspection…</p>
      </TenantShell>
    );
  }

  if (!inspection) {
    return (
      <TenantShell title="Routine inspection" backHref={backHref}>
        <p className="text-muted-foreground text-sm">
          {apiConnected
            ? 'This routine inspection is not available. Your property manager will schedule one when required.'
            : 'Inspection not found.'}
        </p>
      </TenantShell>
    );
  }

  const flowLabel =
    inspection.flow === 'self' ? 'Tenant self-inspection' : 'In-person visit';

  const sections: ReportSection[] = (
    (inspection as { sections?: RoutineSectionDto[] }).sections ?? []
  ).map((section) => ({
    id: section.id,
    room: section.room,
    description: section.description,
    photos: section.photos ?? [],
    referencePhotos: section.referencePhotos ?? [],
    tenantConfirmed: false,
  }));

  return (
    <TenantShell title="Routine inspection" backHref={backHref}>
      <p className="text-muted-foreground mb-2 text-sm">{inspection.propertyAddress}</p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge
          label={routineInspectionStatusLabel(inspection.status)}
          variant={
            inspection.status === 'completed'
              ? 'success'
              : needsRoutineInspectionAction(inspection)
                ? 'action'
                : 'default'
          }
        />
        <span className="text-muted-foreground text-xs">{flowLabel}</span>
      </div>
      {inspection.scheduledAt && (
        <p className="text-muted-foreground mb-4 text-sm">
          Scheduled {formatDateTime(inspection.scheduledAt)}
        </p>
      )}
      {needsRoutineInspectionAction(inspection) && (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <p className="font-medium">Action required</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {inspection.flow === 'self'
              ? 'Complete your self-inspection checklist when you are ready.'
              : 'Please be available for the scheduled in-person visit.'}
          </p>
        </div>
      )}

      {sections.length > 0 ? (
        <div className="mb-4 space-y-4">
          <p className="text-muted-foreground text-xs">
            Latest move-in (ingoing) photos are shown beside routine evidence for each
            section.
          </p>
          {sections.map((section) => (
            <ReportSectionCard
              key={section.id}
              section={section}
              currentPhotoLabel="Routine"
              readOnly
            />
          ))}
        </div>
      ) : null}

      {inspection.reportUrl && (
        <Link
          href={inspection.reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-sm font-medium"
        >
          View inspection report →
        </Link>
      )}
    </TenantShell>
  );
}

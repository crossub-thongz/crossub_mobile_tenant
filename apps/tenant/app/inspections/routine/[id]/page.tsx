'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { TenantShell } from '@/components/layout/tenant-shell';
import { RoutineSelfInspectionWizard } from '@/components/tenant/routine-self-inspection-wizard';
import { RoutinePreviousSubmissionPanel } from '@/components/tenant/routine-previous-submission-panel';
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
  shouldLivePollRoutineInspection,
} from '@/lib/routine-inspection';
import { useLivePoll } from '@/lib/use-live-poll';
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
    routineInspections.find((r) => r.id === id || r.inspectionId === id || r.scheduleId === id) ??
    null;
  const inspection = loaded ?? summary;

  const loadInspection = useCallback(async () => {
    if (!apiConnected) return;
    try {
      const next = await fetchTenantRoutineInspection(id);
      setLoaded(next);
    } catch {
      // keep last good snapshot on transient poll errors
    }
  }, [apiConnected, id]);

  useEffect(() => {
    if (!apiConnected) return;
    setLoading(true);
    void fetchTenantRoutineInspection(id)
      .then(setLoaded)
      .catch(() => {
        if (summary) setLoaded(summary);
      })
      .finally(() => setLoading(false));
  }, [apiConnected, id, summary]);

  useLivePoll(
    loadInspection,
    apiConnected && shouldLivePollRoutineInspection(inspection),
  );

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
    referencePhotos: [],
    tenantConfirmed: false,
  }));

  const showSelfChecklist =
    inspection.flow === 'self' &&
    needsRoutineInspectionAction(inspection) &&
    inspection.status !== 'completed';

  const showSubmittedSections =
    inspection.flow === 'self' &&
    !needsRoutineInspectionAction(inspection) &&
    !inspection.previousSubmission &&
    sections.length > 0;

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

      {inspection.flow === 'in_person' ? (
        <div className="mb-4 rounded-xl border border-sky-500/40 bg-sky-500/5 p-4 text-sm">
          <p className="font-medium">In-person inspector visit</p>
          <p className="text-muted-foreground mt-1 text-xs">
            This routine inspection is scheduled as an in-person visit. An inspector will attend
            at the scheduled time — you do not need to upload photos in the tenant app.
          </p>
          {inspection.scheduledAt ? (
            <p className="text-muted-foreground mt-2 text-xs">
              Please ensure the property is accessible for the inspector.
            </p>
          ) : null}
        </div>
      ) : null}

      {inspection.flow === 'self' && inspection.declineReason ? (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <p className="font-medium text-amber-900 dark:text-amber-100">Changes requested</p>
          <p className="text-muted-foreground mt-1 text-xs">{inspection.declineReason}</p>
          <p className="text-muted-foreground mt-2 text-xs">
            Upload a revised routine self-inspection below. Your first submission is kept in the
            collapsed section for reference.
          </p>
        </div>
      ) : null}

      {inspection.flow === 'self' && inspection.previousSubmission ? (
        <RoutinePreviousSubmissionPanel
          submission={inspection.previousSubmission}
          declineReason={inspection.declineReason}
        />
      ) : null}

      {inspection.flow === 'self' && inspection.status === 'under_review' ? (
        <div className="mb-4 rounded-xl border bg-muted/30 p-4 text-sm">
          <p className="font-medium">Submitted for review</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Your property manager is reviewing your self-inspection. You will be notified when
            the report is available.
          </p>
        </div>
      ) : null}

      {showSelfChecklist ? (
        <RoutineSelfInspectionWizard
          inspection={inspection}
          onUpdated={(next) => setLoaded(next)}
        />
      ) : null}

      {showSubmittedSections ? (
        <div className="mb-4 space-y-4">
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

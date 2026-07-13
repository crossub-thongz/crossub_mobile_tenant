import { Calendar, FileText } from 'lucide-react';

import type { ListingProperty } from '@/lib/types';
import { formatOpenInspectionWindow } from '@/lib/utils';

export function ListingOpenInspectionFacts({
  property,
  compact = false,
}: {
  property: Pick<
    ListingProperty,
    'openInspectionAt' | 'openInspectionEndAt' | 'leaseTerm'
  >;
  compact?: boolean;
}) {
  const inspectionWindow = formatOpenInspectionWindow(
    property.openInspectionAt,
    property.openInspectionEndAt,
  );
  const leaseTerm = property.leaseTerm?.trim();

  if (!inspectionWindow && !leaseTerm) return null;

  if (compact) {
    return (
      <div className="text-muted-foreground mt-2 space-y-1 text-xs">
        {inspectionWindow ? (
          <p className="flex items-start gap-1.5">
            <Calendar className="mt-0.5 size-3 shrink-0" />
            <span>
              <span className="text-foreground font-medium">Open inspection</span>{' '}
              {inspectionWindow}
            </span>
          </p>
        ) : null}
        {leaseTerm ? (
          <p className="flex items-start gap-1.5">
            <FileText className="mt-0.5 size-3 shrink-0" />
            <span>
              <span className="text-foreground font-medium">Lease term</span> {leaseTerm}
            </span>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {inspectionWindow ? (
        <div className="rounded-lg bg-muted/40 px-3 py-2.5">
          <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
            Open inspection
          </p>
          <p className="mt-1 text-sm font-medium leading-snug">{inspectionWindow}</p>
        </div>
      ) : null}
      <div className="rounded-lg bg-muted/40 px-3 py-2.5">
        <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
          Lease term
        </p>
        <p className="mt-1 text-sm font-medium">{leaseTerm || 'TBC'}</p>
      </div>
    </div>
  );
}

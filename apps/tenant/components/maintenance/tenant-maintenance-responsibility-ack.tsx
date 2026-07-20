'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatRemainingHms(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

export function TenantMaintenanceResponsibilityAckTimer({
  deadline,
  onExpire,
}: {
  deadline: string;
  onExpire?: () => void;
}) {
  const endAt = useMemo(() => Date.parse(deadline), [deadline]);
  const [remainingMs, setRemainingMs] = useState(() =>
    Number.isNaN(endAt) ? 0 : Math.max(0, endAt - Date.now()),
  );
  const expiredRef = useRef(false);

  useEffect(() => {
    if (Number.isNaN(endAt)) return;
    expiredRef.current = false;

    const tick = () => {
      const nextRemaining = Math.max(0, endAt - Date.now());
      setRemainingMs(nextRemaining);
      if (nextRemaining === 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [endAt, onExpire]);

  const isExpired = remainingMs === 0;

  return (
    <div className="bg-muted/40 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs">
      {isExpired ? (
        <AlertTriangle className="text-destructive mt-0.5 size-4 shrink-0" />
      ) : (
        <Clock className="text-primary mt-0.5 size-4 shrink-0" />
      )}
      <p className="leading-relaxed">
        {isExpired
          ? 'The 48-hour window has ended. Refresh to see the updated case status.'
          : `If you do not respond, the system will automatically agree in ${formatRemainingHms(remainingMs)} and close this case.`}
      </p>
    </div>
  );
}

export function responsibilityLabel(
  responsibility: 'tenant' | 'landlord' | 'strata' | null | undefined,
): string | null {
  switch (responsibility) {
    case 'tenant':
      return 'Your responsibility';
    case 'landlord':
      return 'Landlord responsibility';
    case 'strata':
      return 'Strata responsibility';
    default:
      return null;
  }
}

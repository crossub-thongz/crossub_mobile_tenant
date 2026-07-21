/** Smaller subtext under weekly rent when a tenant-accepted increase has a future start date. */
export function UpcomingRentHint({ hint }: { hint?: string | null }) {
  if (!hint) return null;
  return (
    <p className="text-muted-foreground mt-1 text-xs leading-snug tabular-nums">
      → {hint}
    </p>
  );
}

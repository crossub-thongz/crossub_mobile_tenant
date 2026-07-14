import type { Priority } from '@/lib/types';
import { cn } from '@/lib/utils';

const PRIORITY: Record<Priority, { className: string }> = {
  urgent: { className: 'bg-destructive/15 text-destructive border-destructive/30' },
  high: { className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  normal: { className: 'bg-secondary text-muted-foreground border-border' },
  low: { className: 'bg-secondary text-muted-foreground border-border' },
};

export function StatusBadge({
  label,
  priority,
  variant = 'default',
  className,
}: {
  label: string;
  priority?: Priority;
  variant?: 'default' | 'action' | 'success' | 'danger' | 'warning';
  className?: string;
}) {
  const styles =
    variant === 'action'
      ? 'bg-primary/15 text-primary border-primary/30'
      : variant === 'success'
        ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300'
        : variant === 'danger'
          ? 'bg-destructive/15 text-destructive border-destructive/30'
          : variant === 'warning'
            ? 'bg-amber-500/15 text-amber-800 border-amber-500/30 dark:text-amber-200'
            : priority
            ? PRIORITY[priority].className
            : 'bg-secondary text-muted-foreground border-border';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase',
        styles,
        className,
      )}
    >
      {label}
    </span>
  );
}

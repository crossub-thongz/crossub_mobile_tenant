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
  variant?: 'default' | 'action' | 'success';
  className?: string;
}) {
  const styles =
    variant === 'action'
      ? 'bg-primary/15 text-primary border-primary/30'
      : variant === 'success'
        ? 'bg-primary/10 text-primary border-primary/20'
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

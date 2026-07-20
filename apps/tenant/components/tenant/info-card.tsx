import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export function InfoCard({
  icon: Icon,
  label,
  children,
  className,
  accent = 'default',
}: {
  icon?: LucideIcon;
  label?: string;
  children: React.ReactNode;
  className?: string;
  accent?: 'default' | 'primary' | 'warning' | 'danger';
}) {
  const accentBorder = {
    default: 'border-border',
    primary: 'border-primary/25',
    warning: 'border-amber-500/30',
    danger: 'border-destructive/35',
  }[accent];

  const iconBg = {
    default: 'bg-secondary text-muted-foreground',
    primary: 'bg-primary/15 text-primary',
    warning: 'bg-amber-500/15 text-amber-400',
    danger: 'bg-destructive/15 text-destructive',
  }[accent];

  return (
    <div
      className={cn(
        'rounded-2xl border bg-card p-4 shadow-sm',
        accentBorder,
        className,
      )}
    >
      {(Icon || label) && (
        <div className="mb-3 flex items-center gap-2.5">
          {Icon && (
            <div
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-xl',
                iconBg,
              )}
            >
              <Icon className="size-4" />
            </div>
          )}
          {label && (
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {label}
            </p>
          )}
        </div>
      )}
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}

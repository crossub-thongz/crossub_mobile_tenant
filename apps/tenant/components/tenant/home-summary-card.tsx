import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

export function HomeSummaryCard({
  title,
  summary,
  href,
  badge,
  icon: Icon,
  variant = 'default',
}: {
  title: string;
  summary: string;
  href: string;
  badge?: string;
  icon: LucideIcon;
  variant?: 'default' | 'urgent';
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-3.5 rounded-2xl border p-4 transition-all',
        variant === 'urgent'
          ? 'border-destructive/30 bg-destructive/5 hover:border-destructive/50'
          : 'border-border bg-card hover:border-primary/25 hover:shadow-md hover:shadow-primary/5',
      )}
    >
      <div
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors',
          variant === 'urgent'
            ? 'bg-destructive/15 text-destructive'
            : 'bg-primary/10 text-primary group-hover:bg-primary/15',
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{title}</p>
          {badge && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                variant === 'urgent'
                  ? 'bg-destructive/20 text-destructive'
                  : 'bg-primary/15 text-primary',
              )}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed">
          {summary}
        </p>
      </div>
      <ChevronRight className="text-muted-foreground size-4 shrink-0 transition group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

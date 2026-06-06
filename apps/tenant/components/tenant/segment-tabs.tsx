'use client';

import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface SegmentTab<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

export function SegmentTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: SegmentTab<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-1 rounded-xl bg-secondary/80 p-1', className)}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-medium transition-all',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {Icon && <Icon className="size-3.5 shrink-0" />}
            <span>{tab.label}</span>
            {tab.count != null && tab.count > 0 && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px]',
                  active ? 'bg-primary/15 text-primary' : 'bg-background/60',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import type { PendingAction } from '@/lib/types';
import { cn } from '@/lib/utils';

export function ActionCard({ item }: { item: PendingAction }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'block rounded-xl border bg-card transition-colors active:bg-secondary/50',
        item.priority === 'urgent' && 'border-destructive/40',
        item.priority === 'high' && 'border-primary/30',
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <span className="text-primary text-[10px] font-semibold uppercase">
            Action needed
          </span>
          <p className="text-sm font-semibold leading-snug">{item.title}</p>
          <p className="text-muted-foreground text-xs">{item.subtitle}</p>
          <p className="text-primary text-xs font-medium">{item.status}</p>
        </div>
        <ChevronRight className="text-muted-foreground mt-1 size-4 shrink-0" />
      </div>
    </Link>
  );
}

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function HomeSummaryCard({
  title,
  summary,
  href,
  badge,
}: {
  title: string;
  summary: string;
  href: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-secondary/40"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{title}</p>
          {badge && (
            <span className="bg-primary/15 text-primary rounded-full px-2 py-0.5 text-[10px] font-medium">
              {badge}
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{summary}</p>
      </div>
      <ChevronRight className="text-muted-foreground size-4 shrink-0" />
    </Link>
  );
}

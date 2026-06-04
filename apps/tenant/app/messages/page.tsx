'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { messageDetail, ROUTES } from '@/constants/routes';
import {
  MESSAGE_CATEGORY_TAG,
  MESSAGE_TOPIC_FILTERS,
  threadCategory,
  threadMatchesFilter,
  type MessageTopicFilter,
} from '@/lib/message-categories';
import { MESSAGE_RECIPIENT_LABEL } from '@/lib/message-parties';
import { cn, formatRelative } from '@/lib/utils';

export default function MessagesPage() {
  const { messages } = useTenantData();
  const [topicFilter, setTopicFilter] = useState<MessageTopicFilter>('all');

  const filtered = useMemo(
    () => messages.filter((m) => threadMatchesFilter(m, topicFilter)),
    [messages, topicFilter],
  );

  const counts = useMemo(() => {
    const map: Record<MessageTopicFilter, number> = {
      all: messages.length,
      leasing: 0,
      maintenance: 0,
      inspection: 0,
      accounting: 0,
      other: 0,
    };
    for (const m of messages) {
      const cat = threadCategory(m);
      map[cat] += 1;
    }
    return map;
  }, [messages]);

  return (
    <TenantShell title="Communication hub">
      <p className="text-muted-foreground mb-4 text-sm">
        Message your <strong>landlord</strong>, <strong>agent</strong>, or{' '}
        <strong>contractor</strong> — filter by topic below.
      </p>
      <Button asChild className="mb-4 w-full">
        <Link href={ROUTES.MESSAGES_NEW}>
          <Plus className="size-4" /> New message
        </Link>
      </Button>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Button variant="outline" size="sm" asChild className="text-xs">
          <Link href={`${ROUTES.MESSAGES_NEW}?to=landlord`}>Landlord</Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="text-xs">
          <Link href={`${ROUTES.MESSAGES_NEW}?to=agent`}>Agent</Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="text-xs">
          <Link href={`${ROUTES.MESSAGES_NEW}?to=contractor`}>Contractor</Link>
        </Button>
      </div>

      <div className="mb-4 -mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max gap-1.5">
          {MESSAGE_TOPIC_FILTERS.map((f) => {
            const active = topicFilter === f.value;
            const count = counts[f.value];
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setTopicFilter(f.value)}
                aria-pressed={active}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-secondary',
                )}
              >
                {f.tag}
                {f.value !== 'all' && count > 0 && (
                  <span className={cn('ml-1.5', active ? 'opacity-90' : 'opacity-70')}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
            No messages in this category yet.
            {topicFilter !== 'all' && (
              <>
                {' '}
                <button
                  type="button"
                  className="text-primary font-medium"
                  onClick={() => setTopicFilter('all')}
                >
                  Show all
                </button>
              </>
            )}
          </p>
        ) : (
          filtered.map((m) => {
            const cat = threadCategory(m);
            return (
              <Link
                key={m.id}
                href={messageDetail(m.id)}
                className="block rounded-xl border bg-card p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-secondary text-foreground rounded px-2 py-0.5 text-[10px] font-bold tracking-wider">
                    {MESSAGE_CATEGORY_TAG[cat]}
                  </span>
                  <StatusBadge
                    label={MESSAGE_RECIPIENT_LABEL[m.recipient] ?? m.recipient}
                    variant="action"
                  />
                  {m.channel && (
                    <span className="text-muted-foreground text-[10px] uppercase">
                      {m.channel === 'email' ? 'Email' : 'App'}
                    </span>
                  )}
                  {m.unread > 0 && (
                    <span className="bg-destructive rounded-full px-2 py-0.5 text-[10px] text-white">
                      {m.unread}
                    </span>
                  )}
                </div>
                {m.propertyAddress && (
                  <p className="text-muted-foreground mt-1 truncate text-xs">{m.propertyAddress}</p>
                )}
                <p className="mt-2 font-semibold">{m.subject}</p>
                <p className="text-muted-foreground line-clamp-2 text-sm">{m.lastMessage}</p>
                <p className="text-muted-foreground mt-1 text-xs">{formatRelative(m.lastAt)}</p>
              </Link>
            );
          })
        )}
      </div>
    </TenantShell>
  );
}

'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';

import { TenantShell } from '@/components/layout/tenant-shell';
import { EmptyState } from '@/components/tenant/empty-state';
import { PageIntro, SectionTitle } from '@/components/tenant/page-intro';
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
      <PageIntro description="Message your landlord, agent, or contractor. Filter by leasing, maintenance, inspection, accounting, or other." />

      <Button asChild className="mb-4 w-full shadow-lg shadow-primary/10">
        <Link href={ROUTES.MESSAGES_NEW}>
          <Plus className="size-4" /> New message
        </Link>
      </Button>

      <SectionTitle>Quick contact</SectionTitle>
      <div className="mb-5 grid grid-cols-3 gap-2">
        {(['landlord', 'agent', 'contractor'] as const).map((to) => (
          <Button key={to} variant="outline" size="sm" asChild className="rounded-xl text-xs">
            <Link href={`${ROUTES.MESSAGES_NEW}?to=${to}`}>
              {MESSAGE_RECIPIENT_LABEL[to]}
            </Link>
          </Button>
        ))}
      </div>

      <SectionTitle>Category</SectionTitle>
      <div className="mb-5 -mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max gap-2">
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
                  'shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold tracking-wide transition-all',
                  active
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/30',
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
          <EmptyState
            icon={MessageSquare}
            title="No messages in this category"
            description={
              topicFilter === 'all'
                ? 'Start a conversation with your landlord, agent, or contractor.'
                : 'Try another category or compose a new message.'
            }
            action={
              topicFilter === 'all' ? (
                <Button asChild size="sm">
                  <Link href={ROUTES.MESSAGES_NEW}>New message</Link>
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setTopicFilter('all')}>
                  Show all
                </Button>
              )
            }
          />
        ) : (
          filtered.map((m) => {
            const cat = threadCategory(m);
            return (
              <Link
                key={m.id}
                href={messageDetail(m.id)}
                className="group block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/25"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-primary/15 text-primary rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider">
                    {MESSAGE_CATEGORY_TAG[cat]}
                  </span>
                  <StatusBadge
                    label={MESSAGE_RECIPIENT_LABEL[m.recipient] ?? m.recipient}
                    variant="action"
                  />
                  {m.unread > 0 && (
                    <span className="bg-destructive ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium text-white">
                      {m.unread} new
                    </span>
                  )}
                </div>
                <p className="mt-2 font-semibold group-hover:text-primary">{m.subject}</p>
                <p className="text-muted-foreground line-clamp-2 text-sm">{m.lastMessage}</p>
                <p className="text-muted-foreground mt-2 text-xs">{formatRelative(m.lastAt)}</p>
              </Link>
            );
          })
        )}
      </div>
    </TenantShell>
  );
}

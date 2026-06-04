'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { maintenanceDetail, rentReviewDetail, ROUTES } from '@/constants/routes';
import { cn, formatDateTime } from '@/lib/utils';

const DEMO_MESSAGES = [
  {
    id: '1',
    from: 'crossub' as const,
    fromName: 'CROSSUB Leasing',
    body: 'Please review the attached market report and respond by 15 June.',
    at: '2026-05-27T16:00:00+10:00',
    channel: 'email' as const,
  },
  {
    id: '2',
    from: 'tenant' as const,
    fromName: 'You',
    body: 'Thanks — I will review this week.',
    at: '2026-05-28T10:00:00+10:00',
    channel: 'app' as const,
  },
];

export default function MessageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { messages } = useTenantData();
  const thread = messages.find((m) => m.id === id);
  const [reply, setReply] = useState('');
  const [party, setParty] = useState<'crossub' | 'contractor'>('crossub');

  const composeBar = (
    <div className="space-y-2">
      {thread?.contractorEnabled && (
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          <button
            type="button"
            onClick={() => setParty('crossub')}
            className={cn(
              'flex-1 rounded-md py-1.5 text-xs font-medium',
              party === 'crossub' ? 'bg-background' : 'text-muted-foreground',
            )}
          >
            CROSSUB
          </button>
          <button
            type="button"
            onClick={() => setParty('contractor')}
            className={cn(
              'flex-1 rounded-md py-1.5 text-xs font-medium',
              party === 'contractor' ? 'bg-background' : 'text-muted-foreground',
            )}
          >
            Contractor
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <Input
          className="flex-1"
          placeholder={
            party === 'contractor' ? 'Message contractor…' : 'Reply to CROSSUB…'
          }
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />
        <Button
          className="shrink-0"
          onClick={() => {
            if (!reply.trim()) return;
            toast.success('Message sent — audit logged');
            setReply('');
          }}
        >
          Send
        </Button>
      </div>
    </div>
  );

  if (!thread) {
    return (
      <TenantShell title="Message" backHref={ROUTES.MESSAGES}>
        <p className="text-sm text-muted-foreground">Thread not found.</p>
      </TenantShell>
    );
  }

  const caseLink =
    thread.type === 'maintenance' && thread.linkedCaseId
      ? maintenanceDetail(thread.linkedCaseId)
      : thread.type === 'rent_review' && thread.linkedCaseId
        ? rentReviewDetail(thread.linkedCaseId)
        : null;

  return (
    <TenantShell
      title={thread.subject}
      backHref={ROUTES.MESSAGES}
      bottomBar={composeBar}
    >
      <div className="mb-4 space-y-2 rounded-xl border bg-card p-3 text-xs">
        {thread.propertyAddress && <p>{thread.propertyAddress}</p>}
        {thread.leaseId && (
          <p className="text-muted-foreground">Lease ref: {thread.leaseId}</p>
        )}
        {caseLink && (
          <Link href={caseLink} className="text-primary font-medium">
            View linked case →
          </Link>
        )}
      </div>
      <div className="space-y-3">
        {DEMO_MESSAGES.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'max-w-[92%] rounded-xl border p-3 text-sm',
              msg.from === 'tenant' ? 'border-primary/30 ml-auto' : 'mr-auto bg-card',
            )}
          >
            <div className="text-muted-foreground mb-1 flex items-center gap-1 text-xs">
              {msg.channel === 'email' ? (
                <Mail className="size-3" />
              ) : (
                <MessageSquare className="size-3" />
              )}
              {msg.fromName} · {formatDateTime(msg.at)}
              {msg.channel === 'email' && ' · Email'}
            </div>
            <p className="leading-relaxed">{msg.body}</p>
          </div>
        ))}
      </div>
    </TenantShell>
  );
}

'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { maintenanceDetail, rentReviewDetail, ROUTES } from '@/constants/routes';
import { MESSAGE_CATEGORY_TAG, threadCategory } from '@/lib/message-categories';
import { MESSAGE_RECIPIENT_LABEL } from '@/lib/message-parties';
import { LIVE_POLL_MS } from '@/lib/live-sync';
import { cn, formatDateTime } from '@/lib/utils';

export default function MessageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { messages, getThreadMessages, sendThreadMessage, markThreadRead, syncMessageThreads } =
    useTenantData();
  const thread = messages.find((m) => m.id === id);
  const threadMessages = useMemo(
    () => (id ? getThreadMessages(id) : []),
    [id, getThreadMessages],
  );

  const [reply, setReply] = useState('');

  useEffect(() => {
    if (thread && thread.unread > 0) {
      markThreadRead(thread.id);
    }
  }, [thread, markThreadRead]);

  /**
   * Keep an OPEN conversation live.
   *
   * A reply typed by an officer in the staff console lands in this same thread, and a tenant
   * staring at it should see it arrive rather than having to leave the screen and come back. The
   * provider's background tick also refetches threads, but this screen should not depend on it:
   * that tick is gated on `apiConnected` and is rebuilt whenever auth state moves, and nothing
   * about "I am reading a conversation" should be invisible to the screen doing the reading.
   * Pulls immediately on open, then on the shared cadence, and stops when the screen closes.
   */
  useEffect(() => {
    void syncMessageThreads();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void syncMessageThreads();
    }, LIVE_POLL_MS);
    return () => window.clearInterval(id);
  }, [syncMessageThreads]);

  const composeBar = thread ? (
    <div className="flex gap-2">
      <Input
        className="flex-1"
        placeholder={`Write a reply to ${MESSAGE_RECIPIENT_LABEL[thread.recipient]}…`}
        value={reply}
        onChange={(e) => setReply(e.target.value)}
      />
      <Button
        className="shrink-0"
        onClick={() => {
          if (!reply.trim()) return;
          sendThreadMessage(thread.id, reply, thread.recipient);
          toast.success('Message sent', {
            description: `Sent to ${MESSAGE_RECIPIENT_LABEL[thread.recipient]} via CROSSUB.`,
          });
          setReply('');
        }}
      >
        Send
      </Button>
    </div>
  ) : null;

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
        <div className="flex flex-wrap gap-2">
          <span className="bg-secondary text-foreground rounded px-2 py-0.5 text-[10px] font-bold tracking-wider">
            {MESSAGE_CATEGORY_TAG[threadCategory(thread)]}
          </span>
          <span className="bg-primary/10 text-primary rounded px-2 py-0.5 text-[10px] font-semibold">
            To {MESSAGE_RECIPIENT_LABEL[thread.recipient]}
          </span>
        </div>
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
      <div className="space-y-3 pb-2">
        {threadMessages.length === 0 ? (
          <p className="text-muted-foreground text-sm">No messages in this thread yet.</p>
        ) : (
          threadMessages.map((msg) => {
            const isOutbound = msg.direction === 'outbound';
            const label = isOutbound ? 'You' : 'CROSSUB';
            return (
              <div
                key={msg.id}
                className={cn(
                  'max-w-[92%] rounded-xl border p-3 text-sm',
                  isOutbound ? 'border-primary/30 ml-auto' : 'mr-auto bg-card',
                )}
              >
                <div className="text-muted-foreground mb-1 flex items-center gap-1 text-xs">
                  {msg.channel === 'email' ? (
                    <Mail className="size-3" />
                  ) : (
                    <MessageSquare className="size-3" />
                  )}
                  {label} · {formatDateTime(msg.at)}
                  {msg.channel === 'email' && ' · Email'}
                </div>
                <p className="leading-relaxed break-words whitespace-pre-line">
                  {msg.body}
                </p>
              </div>
            );
          })
        )}
      </div>
    </TenantShell>
  );
}

'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/tenant/status-badge';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { maintenanceDetail, rentReviewDetail, ROUTES } from '@/constants/routes';
import { MESSAGE_CATEGORY_TAG, threadCategory } from '@/lib/message-categories';
import {
  MESSAGE_RECIPIENT_LABEL,
  partiesForThread,
  recipientDisplayName,
} from '@/lib/message-parties';
import type { MessageParty } from '@/lib/types';
import { cn, formatDateTime } from '@/lib/utils';

export default function MessageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { messages, getThreadMessages, sendThreadMessage } = useTenantData();
  const thread = messages.find((m) => m.id === id);
  const threadMessages = useMemo(
    () => (id ? getThreadMessages(id) : []),
    [id, getThreadMessages],
  );

  const allowedParties = useMemo(
    () => (thread ? partiesForThread(thread) : (['landlord', 'agent', 'contractor'] as MessageParty[])),
    [thread],
  );

  const [reply, setReply] = useState('');
  const [recipient, setRecipient] = useState<MessageParty>(
    thread?.recipient ?? 'agent',
  );

  const composeBar = thread ? (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium">Send to</p>
      {allowedParties.length > 1 ? (
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          {allowedParties.map((party) => (
            <button
              key={party}
              type="button"
              onClick={() => setRecipient(party)}
              className={cn(
                'flex-1 rounded-md py-1.5 text-xs font-medium',
                recipient === party ? 'bg-background' : 'text-muted-foreground',
              )}
            >
              {MESSAGE_RECIPIENT_LABEL[party]}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          To: {MESSAGE_RECIPIENT_LABEL[allowedParties[0]!]}
        </p>
      )}
      <div className="flex gap-2">
        <Input
          className="flex-1"
          placeholder={`Message ${recipientDisplayName(recipient, thread.contractorName).toLowerCase()}…`}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />
        <Button
          className="shrink-0"
          onClick={() => {
            if (!reply.trim()) return;
            sendThreadMessage(thread.id, reply, recipient);
            toast.success('Message sent', {
              description: `Sent to ${recipientDisplayName(recipient, thread.contractorName)}.`,
            });
            setReply('');
          }}
        >
          Send
        </Button>
      </div>
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
          <StatusBadge
            label={`To: ${MESSAGE_RECIPIENT_LABEL[thread.recipient]}`}
            variant="action"
          />
          {thread.contractorName && (
            <span className="text-muted-foreground">Contractor: {thread.contractorName}</span>
          )}
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
            const label = isOutbound
              ? `You → ${MESSAGE_RECIPIENT_LABEL[msg.party]}`
              : recipientDisplayName(msg.party, thread.contractorName);
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
                <p className="leading-relaxed">{msg.body}</p>
              </div>
            );
          })
        )}
      </div>
    </TenantShell>
  );
}

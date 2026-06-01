'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { ROUTES } from '@/constants/routes';
import { formatDateTime } from '@/lib/utils';

const DEMO_MESSAGES = [
  {
    id: '1',
    from: 'crossub' as const,
    fromName: 'CROSSUB Leasing',
    body: 'Please review the attached market report and respond by 15 June.',
    at: '2026-05-27T16:00:00+10:00',
  },
  {
    id: '2',
    from: 'tenant' as const,
    fromName: 'You',
    body: 'Thanks — I will review this week.',
    at: '2026-05-28T10:00:00+10:00',
  },
];

export default function MessageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { messages } = useTenantData();
  const thread = messages.find((m) => m.id === id);
  const [reply, setReply] = useState('');

  if (!thread) {
    return (
      <TenantShell title="Message" backHref={ROUTES.MESSAGES}>
        <p className="text-sm text-muted-foreground">Thread not found.</p>
      </TenantShell>
    );
  }

  return (
    <TenantShell title={thread.subject} backHref={ROUTES.MESSAGES}>
      <div className="space-y-3">
        {DEMO_MESSAGES.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-xl border p-3 text-sm ${
              msg.from === 'tenant' ? 'border-primary/30 ml-6' : 'mr-6'
            }`}
          >
            <p className="text-muted-foreground text-xs">
              {msg.fromName} · {formatDateTime(msg.at)}
            </p>
            <p className="mt-1">{msg.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex gap-2">
        <input
          className="border-input bg-background flex-1 rounded-md border px-3 py-2 text-sm"
          placeholder="Reply to CROSSUB..."
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />
        <Button
          onClick={() => {
            if (!reply.trim()) return;
            toast.success('Message sent — audit logged');
            setReply('');
          }}
        >
          Send
        </Button>
      </div>
    </TenantShell>
  );
}

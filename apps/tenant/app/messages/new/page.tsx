'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useTenantData } from '@/components/providers/tenant-data-provider';
import { MessageRecipientPicker } from '@/components/tenant/message-recipient-picker';
import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';
import { recipientDisplayName } from '@/lib/message-parties';
import type { MessageCategory, MessageParty } from '@/lib/types';

const CATEGORIES: { value: MessageCategory; label: string }[] = [
  { value: 'leasing', label: 'Leasing' },
  { value: 'maintenance', label: 'Maintenance / repair' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'other', label: 'Other' },
];

export default function NewMessagePage() {
  const router = useRouter();
  const { addMessageThread, maintenance } = useTenantData();
  const searchParams = useSearchParams();
  const defaultCat = searchParams.get('category') as MessageCategory | null;
  const defaultTo = searchParams.get('to') as MessageParty | null;

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<MessageCategory>(
    defaultCat && CATEGORIES.some((c) => c.value === defaultCat) ? defaultCat : 'leasing',
  );
  const [recipient, setRecipient] = useState<MessageParty>(
    defaultTo === 'landlord' || defaultTo === 'agent' || defaultTo === 'contractor'
      ? defaultTo
      : 'agent',
  );

  const activeRepair = maintenance.find(
    (m) => m.status !== 'closed' && m.contractorName,
  );

  const contractorName = useMemo(() => {
    if (recipient !== 'contractor') return undefined;
    return activeRepair?.contractorName;
  }, [recipient, activeRepair]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      toast.error('Enter subject and message');
      return;
    }
    const thread = addMessageThread({
      subject,
      body,
      category,
      recipient,
      contractorName,
    });
    toast.success('Message sent', {
      description: `Delivered to ${recipientDisplayName(recipient, contractorName)} — saved in your inbox.`,
    });
    router.push(`${ROUTES.MESSAGES}/${thread.id}`);
  };

  return (
    <TenantShell title="New message" backHref={ROUTES.MESSAGES}>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label>Who do you want to message?</Label>
          <MessageRecipientPicker value={recipient} onChange={setRecipient} />
          {recipient === 'contractor' && !contractorName && (
            <p className="text-muted-foreground text-xs">
              No contractor assigned yet — your message goes to CROSSUB to coordinate trades.
            </p>
          )}
          {recipient === 'contractor' && contractorName && (
            <p className="text-muted-foreground text-xs">
              Assigned contractor: <strong>{contractorName}</strong>
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>What is this about?</Label>
          <select
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value as MessageCategory)}
          >
            {CATEGORIES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label>Message</Label>
          <textarea
            className="border-input bg-background min-h-[120px] w-full rounded-md border px-3 py-2 text-sm"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            placeholder={`Write your message to the ${recipientDisplayName(recipient, contractorName).toLowerCase()}…`}
          />
        </div>

        <Button type="submit" className="w-full">
          Send to {recipientDisplayName(recipient, contractorName)}
        </Button>
      </form>
    </TenantShell>
  );
}

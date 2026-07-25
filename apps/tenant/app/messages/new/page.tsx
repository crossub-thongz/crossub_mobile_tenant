'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { TenantNewMessageRecipients } from '@/components/tenant/tenant-new-message-recipients';
import { useTenantData } from '@/components/providers/tenant-data-provider';
import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES, messageDetail } from '@/constants/routes';
import {
  buildTenantMessageRecipients,
  parseTenantMessageRecipientParam,
  type TenantMessageRecipient,
} from '@/lib/tenant-message-recipients';
import type { MessageCategory } from '@/lib/types';
import { MESSAGE_RECIPIENT_LABEL } from '@/lib/message-parties';

const CATEGORIES: { value: MessageCategory; label: string }[] = [
  { value: 'leasing', label: 'Leasing' },
  { value: 'maintenance', label: 'Maintenance / repair' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'other', label: 'Other' },
];

export default function NewMessagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addMessageThread, propertyContacts } = useTenantData();
  const defaultCat = searchParams.get('category') as MessageCategory | null;
  const legacyTo = searchParams.get('to');

  const recipients = useMemo(
    () => buildTenantMessageRecipients(propertyContacts),
    [propertyContacts],
  );

  const initialRecipient = useMemo(() => {
    const kind = parseTenantMessageRecipientParam(legacyTo);
    if (kind) return recipients.find((r) => r.kind === kind) ?? null;
    return null;
  }, [legacyTo, recipients]);

  const legacyContractor = legacyTo === 'contractor';

  const [step, setStep] = useState<'recipient' | 'compose'>(
    initialRecipient || legacyContractor ? 'compose' : 'recipient',
  );
  const [selectedRecipient, setSelectedRecipient] = useState<TenantMessageRecipient | null>(
    initialRecipient ??
      (legacyContractor
        ? {
            kind: 'agent',
            party: 'contractor',
            label: 'Contractor',
            name: 'Assigned contractor',
            subject: 'Contractor — repair update',
          }
        : null),
  );
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<MessageCategory>(
    defaultCat && CATEGORIES.some((c) => c.value === defaultCat) ? defaultCat : 'leasing',
  );

  const handleSelectRecipient = (recipient: TenantMessageRecipient) => {
    setSelectedRecipient(recipient);
    setSubject((prev) => prev.trim() || recipient.subject);
    setStep('compose');
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipient) {
      toast.error('Choose who to message');
      setStep('recipient');
      return;
    }
    if (!subject.trim() || !body.trim()) {
      toast.error('Enter subject and message');
      return;
    }
    const thread = addMessageThread({
      subject,
      body,
      category,
      recipient: selectedRecipient.party,
    });
    toast.success('Message sent', {
      description: `Delivered to ${selectedRecipient.label} via CROSSUB.`,
    });
    router.push(messageDetail(thread.id));
  };

  if (step === 'recipient') {
    return (
      <TenantShell title="New message" backHref={ROUTES.MESSAGES}>
        <TenantNewMessageRecipients
          strataContact={propertyContacts.strataContact}
          buildingManager={propertyContacts.buildingManager}
          onSelect={handleSelectRecipient}
        />
      </TenantShell>
    );
  }

  const recipientLabel =
    selectedRecipient?.label ??
    (legacyContractor ? 'Contractor' : MESSAGE_RECIPIENT_LABEL.agent);

  return (
    <TenantShell
      title="New message"
      backHref={ROUTES.MESSAGES}
    >
      <button
        type="button"
        onClick={() => setStep('recipient')}
        className="text-muted-foreground hover:text-foreground mb-4 text-left text-xs font-medium"
      >
        To: {recipientLabel}
        {selectedRecipient?.name ? ` · ${selectedRecipient.name}` : ''} — change
      </button>

      <form onSubmit={onSubmit} className="space-y-5">
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
            placeholder={`Write your message to ${recipientLabel}…`}
          />
        </div>

        <Button type="submit" className="w-full">
          Send message
        </Button>
      </form>
    </TenantShell>
  );
}

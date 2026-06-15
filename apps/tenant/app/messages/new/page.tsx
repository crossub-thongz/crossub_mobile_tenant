'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { useTenantData } from '@/components/providers/tenant-data-provider';
import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';
import type { MessageCategory } from '@/lib/types';

const CATEGORIES: { value: MessageCategory; label: string }[] = [
  { value: 'leasing', label: 'Leasing' },
  { value: 'maintenance', label: 'Maintenance / repair' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'other', label: 'Other' },
];

export default function NewMessagePage() {
  const router = useRouter();
  const { addMessageThread } = useTenantData();
  const searchParams = useSearchParams();
  const defaultCat = searchParams.get('category') as MessageCategory | null;

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<MessageCategory>(
    defaultCat && CATEGORIES.some((c) => c.value === defaultCat) ? defaultCat : 'leasing',
  );

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
      recipient: 'agent',
    });
    toast.success('Message sent', {
      description: 'Delivered to CROSSUB — saved in your inbox.',
    });
    router.push(`${ROUTES.MESSAGES}/${thread.id}`);
  };

  return (
    <TenantShell title="New message" backHref={ROUTES.MESSAGES}>
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
            placeholder="Write your message to CROSSUB…"
          />
        </div>

        <Button type="submit" className="w-full">
          Send message
        </Button>
      </form>
    </TenantShell>
  );
}

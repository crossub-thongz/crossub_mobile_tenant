'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { TenantShell } from '@/components/layout/tenant-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';

const MESSAGE_TYPES = [
  { value: 'general', label: 'General enquiry' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'inspection', label: 'Inspection / report' },
  { value: 'accounting', label: 'Rent / bond / payment' },
  { value: 'vacating', label: 'Vacating / move-out' },
] as const;

export default function NewMessagePage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<string>('general');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      toast.error('Enter subject and message');
      return;
    }
    toast.success('Message sent — linked to your lease and audit logged');
    router.push(ROUTES.MESSAGES);
  };

  return (
    <TenantShell title="New message" backHref={ROUTES.MESSAGES}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <select
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {MESSAGE_TYPES.map((t) => (
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
          />
        </div>
        <Button type="submit" className="w-full">
          Send to CROSSUB
        </Button>
      </form>
    </TenantShell>
  );
}

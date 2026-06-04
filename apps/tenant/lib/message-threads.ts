import type { ThreadMessage } from '@/lib/types';

/** Demo conversation bodies keyed by thread id. */
export const SEED_THREAD_MESSAGES: Record<string, ThreadMessage[]> = {
  'msg-600': [
    {
      id: 'm600-1',
      at: '2026-05-14T11:00:00+10:00',
      direction: 'outbound',
      party: 'agent',
      fromName: 'You',
      body: 'Hi — can you confirm visitor parking rules for 12 River Lane?',
      channel: 'app',
    },
    {
      id: 'm600-2',
      at: '2026-05-15T14:00:00+10:00',
      direction: 'inbound',
      party: 'agent',
      fromName: 'CROSSUB Agent',
      body: 'Thanks for confirming visitor parking rules. One visitor bay per apartment — register plates in the app.',
      channel: 'app',
    },
  ],
  'msg-601': [
    {
      id: 'm601-1',
      at: '2026-05-22T09:00:00+10:00',
      direction: 'inbound',
      party: 'agent',
      fromName: 'CROSSUB Agent',
      body: 'QuickFix Plumbing has been assigned to your kitchen tap repair.',
      channel: 'app',
    },
    {
      id: 'm601-2',
      at: '2026-05-28T09:15:00+10:00',
      direction: 'inbound',
      party: 'contractor',
      fromName: 'QuickFix Plumbing',
      body: 'Contractor can attend Tuesday 10am–12pm. Does that work?',
      channel: 'app',
    },
  ],
  'msg-602': [
    {
      id: 'm602-1',
      at: '2026-05-27T16:00:00+10:00',
      direction: 'inbound',
      party: 'agent',
      fromName: 'CROSSUB Agent',
      body: 'Please review the attached market report and respond by 15 June.',
      channel: 'email',
    },
    {
      id: 'm602-2',
      at: '2026-05-28T10:00:00+10:00',
      direction: 'outbound',
      party: 'agent',
      fromName: 'You',
      body: 'Thanks — I will review this week.',
      channel: 'app',
    },
  ],
  'msg-603': [
    {
      id: 'm603-1',
      at: '2026-06-01T08:00:00+10:00',
      direction: 'inbound',
      party: 'agent',
      fromName: 'CROSSUB Agent',
      body: 'Your rent receipt for June is now available in Accounting.',
      channel: 'app',
    },
  ],
};

export function normalizeThreadMessage(msg: ThreadMessage): ThreadMessage {
  if (msg.direction && msg.party) return msg;
  const from = msg.from ?? 'crossub';
  const direction: ThreadMessage['direction'] =
    from === 'tenant' ? 'outbound' : 'inbound';
  let party: ThreadMessage['party'] = 'agent';
  if (from === 'contractor') party = 'contractor';
  else if (from === 'landlord') party = 'landlord';
  else if (from === 'tenant' && msg.party) party = msg.party;
  return { ...msg, direction, party };
}

export function mergeThreadMessages(
  threadId: string,
  seed: Record<string, ThreadMessage[]>,
  persisted: Record<string, ThreadMessage[]> | undefined,
): ThreadMessage[] {
  const seedMsgs = (seed[threadId] ?? []).map(normalizeThreadMessage);
  const extra = (persisted?.[threadId] ?? []).map(normalizeThreadMessage);
  const seedIds = new Set(seedMsgs.map((m) => m.id));
  const added = extra.filter((m) => !seedIds.has(m.id));
  return [...seedMsgs, ...added].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );
}

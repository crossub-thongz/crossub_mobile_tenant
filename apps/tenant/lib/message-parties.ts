import type { MessageParty, MessageThread, ThreadMessage } from '@/lib/types';

export const MESSAGE_RECIPIENTS: { value: MessageParty; label: string; description: string }[] = [
  {
    value: 'landlord',
    label: 'Landlord',
    description: 'Property owner — lease, rent, and property decisions',
  },
  {
    value: 'agent',
    label: 'Agent',
    description: 'CROSSUB / property manager — leasing, inspections, accounting',
  },
  {
    value: 'contractor',
    label: 'Contractor',
    description: 'Tradesperson assigned to a repair — access times and work updates',
  },
];

export const MESSAGE_RECIPIENT_LABEL: Record<MessageParty, string> = {
  landlord: 'Landlord',
  agent: 'Agent',
  contractor: 'Contractor',
};

export function recipientDisplayName(
  party: MessageParty,
  contractorName?: string | null,
): string {
  if (party === 'landlord') return 'Landlord';
  if (party === 'agent') return 'CROSSUB Agent';
  return contractorName?.trim() || 'Contractor';
}

export function threadAllowsContractor(thread: MessageThread): boolean {
  return thread.contractorEnabled ?? thread.recipient === 'contractor';
}

export function partiesForThread(thread: MessageThread): MessageParty[] {
  const parties: MessageParty[] = ['landlord', 'agent'];
  if (threadAllowsContractor(thread)) parties.push('contractor');
  return parties;
}

/** Map legacy inbound sender to a party. */
export function inboundPartyFromLegacy(
  from: ThreadMessage['from'],
): MessageParty {
  if (from === 'contractor') return 'contractor';
  if (from === 'landlord') return 'landlord';
  return 'agent';
}

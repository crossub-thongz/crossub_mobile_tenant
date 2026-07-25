import type { MessageParty, MessageThread, ThreadMessage } from '@/lib/types';

export const MESSAGE_RECIPIENTS: { value: MessageParty; label: string; description: string }[] = [
  {
    value: 'agent',
    label: 'Property manager',
    description: 'CROSSUB — leasing, inspections, repairs, and accounting',
  },
  {
    value: 'strata',
    label: 'Strata',
    description: 'Strata body for the building',
  },
  {
    value: 'building_manager',
    label: 'Building manager',
    description: 'On-site building manager when one is recorded',
  },
  {
    value: 'landlord',
    label: 'Landlord',
    description: 'Property owner — lease, rent, and property decisions',
  },
  {
    value: 'contractor',
    label: 'Contractor',
    description: 'Tradesperson assigned to a repair — access times and work updates',
  },
];

export const MESSAGE_RECIPIENT_LABEL: Record<MessageParty, string> = {
  landlord: 'Landlord',
  agent: 'Property manager',
  strata: 'Strata',
  building_manager: 'Building manager',
  contractor: 'Contractor',
};

export function recipientDisplayName(
  party: MessageParty,
  contractorName?: string | null,
): string {
  if (party === 'landlord') return 'Landlord';
  if (party === 'agent') return 'CROSSUB';
  if (party === 'strata') return 'Strata';
  if (party === 'building_manager') return 'Building manager';
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

import type { MaintenancePropertyContact, MessageParty } from '@/lib/types';

export type TenantMessageRecipientKind = 'agent' | 'strata' | 'building_manager';

export interface TenantMessageRecipient {
  kind: TenantMessageRecipientKind;
  party: MessageParty;
  label: string;
  name: string;
  detail?: string;
  subject: string;
}

function hasContact(contact?: MaintenancePropertyContact | null): boolean {
  if (!contact) return false;
  return Boolean(contact.name?.trim() || contact.email?.trim() || contact.phone?.trim());
}

function contactDetail(contact: MaintenancePropertyContact): string | undefined {
  const parts = [contact.email?.trim(), contact.phone?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

/** Recipients a tenant can start a message with — agent always; strata/BM when on file. */
export function buildTenantMessageRecipients(input: {
  strataContact?: MaintenancePropertyContact | null;
  buildingManager?: MaintenancePropertyContact | null;
}): TenantMessageRecipient[] {
  const recipients: TenantMessageRecipient[] = [
    {
      kind: 'agent',
      party: 'agent',
      label: 'Property manager',
      name: 'CROSSUB',
      detail: 'Leasing, inspections, repairs, and accounting',
      subject: 'Property manager — CROSSUB',
    },
  ];

  if (hasContact(input.strataContact)) {
    const contact = input.strataContact!;
    const name = contact.name?.trim() || 'Strata';
    recipients.push({
      kind: 'strata',
      party: 'strata',
      label: 'Strata',
      name,
      detail: contactDetail(contact),
      subject: `Strata — ${name}`,
    });
  }

  if (hasContact(input.buildingManager)) {
    const contact = input.buildingManager!;
    const name = contact.name?.trim() || 'Building manager';
    recipients.push({
      kind: 'building_manager',
      party: 'building_manager',
      label: 'Building manager',
      name,
      detail: contactDetail(contact),
      subject: `Building manager — ${name}`,
    });
  }

  return recipients;
}

/** Merge property contacts with any maintenance row that already carries them. */
export function resolveTenantPropertyContacts(input: {
  property?: {
    strataContact?: MaintenancePropertyContact | null;
    buildingManager?: MaintenancePropertyContact | null;
  } | null;
  maintenance?: Array<{
    strataContact?: MaintenancePropertyContact;
    buildingManager?: MaintenancePropertyContact;
  }>;
}): {
  strataContact?: MaintenancePropertyContact;
  buildingManager?: MaintenancePropertyContact;
} {
  for (const row of input.maintenance ?? []) {
    if (hasContact(row.strataContact) || hasContact(row.buildingManager)) {
      return {
        ...(hasContact(row.strataContact) ? { strataContact: row.strataContact } : {}),
        ...(hasContact(row.buildingManager) ? { buildingManager: row.buildingManager } : {}),
      };
    }
  }

  return {
    ...(hasContact(input.property?.strataContact)
      ? { strataContact: input.property!.strataContact! }
      : {}),
    ...(hasContact(input.property?.buildingManager)
      ? { buildingManager: input.property!.buildingManager! }
      : {}),
  };
}

export function parseTenantMessageRecipientParam(
  value: string | null,
): TenantMessageRecipientKind | null {
  if (
    value === 'agent' ||
    value === 'strata' ||
    value === 'building_manager'
  ) {
    return value;
  }
  if (value === 'manager') return 'building_manager';
  return null;
}

/** Infer the intended recipient from a thread subject written by the tenant compose flow. */
export function recipientPartyFromSubject(subject: string): MessageParty {
  const trimmed = subject.trim();
  if (/^strata\s*[—-]/i.test(trimmed)) return 'strata';
  if (/^building manager\s*[—-]/i.test(trimmed)) return 'building_manager';
  if (/^landlord\s*[—-]/i.test(trimmed)) return 'landlord';
  if (/^contractor\s*[—-]/i.test(trimmed)) return 'contractor';
  return 'agent';
}

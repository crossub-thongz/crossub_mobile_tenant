'use client';

import { Building2, ChevronLeft, UserRound } from 'lucide-react';

import {
  buildTenantMessageRecipients,
  type TenantMessageRecipient,
} from '@/lib/tenant-message-recipients';
import type { MaintenancePropertyContact } from '@/lib/types';
import { cn } from '@/lib/utils';

const RECIPIENT_ICONS = {
  agent: UserRound,
  strata: Building2,
  building_manager: Building2,
} as const;

function RecipientRow({
  recipient,
  onSelect,
}: {
  recipient: TenantMessageRecipient;
  onSelect: (recipient: TenantMessageRecipient) => void;
}) {
  const Icon = RECIPIENT_ICONS[recipient.kind];
  return (
    <button
      type="button"
      onClick={() => onSelect(recipient)}
      className="flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition hover:bg-secondary/50"
    >
      <Icon className="text-primary size-4 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{recipient.label}</span>
        <span className="text-muted-foreground block truncate text-xs">{recipient.name}</span>
        {recipient.detail ? (
          <span className="text-muted-foreground block truncate text-[11px]">{recipient.detail}</span>
        ) : null}
      </span>
    </button>
  );
}

export function TenantNewMessageRecipients({
  strataContact,
  buildingManager,
  onBack,
  onSelect,
  className,
}: {
  strataContact?: MaintenancePropertyContact | null;
  buildingManager?: MaintenancePropertyContact | null;
  onBack?: () => void;
  onSelect: (recipient: TenantMessageRecipient) => void;
  className?: string;
}) {
  const recipients = buildTenantMessageRecipients({ strataContact, buildingManager });

  return (
    <div className={cn('space-y-2', className)}>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground mb-1 flex items-center gap-1 text-xs font-medium"
        >
          <ChevronLeft className="size-4" />
          Back
        </button>
      ) : null}
      <p className="text-muted-foreground text-xs">Send a message to</p>
      {recipients.map((recipient) => (
        <RecipientRow key={recipient.kind} recipient={recipient} onSelect={onSelect} />
      ))}
      {recipients.length === 1 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed px-3 py-3 text-center text-xs">
          Strata and building manager contacts will appear here when recorded for your property.
        </p>
      ) : null}
    </div>
  );
}

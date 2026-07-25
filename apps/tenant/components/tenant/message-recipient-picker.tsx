'use client';

import { Building2, HardHat, UserRound } from 'lucide-react';

import type { MessageParty } from '@/lib/types';
import { MESSAGE_RECIPIENTS } from '@/lib/message-parties';
import { cn } from '@/lib/utils';

const ICONS = {
  landlord: UserRound,
  agent: Building2,
  strata: Building2,
  building_manager: Building2,
  contractor: HardHat,
} as const;

export function MessageRecipientPicker({
  value,
  onChange,
  allowed,
}: {
  value: MessageParty;
  onChange: (party: MessageParty) => void;
  allowed?: MessageParty[];
}) {
  const options = allowed
    ? MESSAGE_RECIPIENTS.filter((r) => allowed.includes(r.value))
    : MESSAGE_RECIPIENTS;

  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const Icon = ICONS[opt.value];
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition-colors',
              selected
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:bg-secondary/50',
            )}
          >
            <div
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-lg',
                selected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
              )}
            >
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="font-medium">{opt.label}</p>
              <p className="text-muted-foreground text-xs">{opt.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

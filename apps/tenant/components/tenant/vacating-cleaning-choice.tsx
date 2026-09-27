'use client';

import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { useTenantData } from '@/components/providers/tenant-data-provider';
import {
  VACATING_CLEANING,
  VACATING_CLEANING_CHOICES,
  VACATING_CLEANING_CHOICE_HINT,
  VACATING_CLEANING_CHOICE_LABEL,
  VACATING_CLEANING_CHOSEN_BY,
  type VacatingCleaningChoice,
} from '@/constants/vacating';
import type { VacatingCase } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';

function isChoice(value: string | undefined): value is VacatingCleaningChoice {
  return VACATING_CLEANING_CHOICES.some((choice) => choice === value);
}

/**
 * End-of-lease cleaning — the tenant says whether they arrange the clean or CROSSUB books its
 * partner (Daniel Zhou, 27 Sep 2026). The answer goes straight to the property manager's
 * vacating task; they can still change it, and once the clean is recorded done the card only
 * reports it.
 */
export function VacatingCleaningChoice({
  vacating,
  readOnly = false,
}: {
  vacating: VacatingCase;
  readOnly?: boolean;
}) {
  const { setVacatingCleaning, apiConnected } = useTenantData();
  const [saving, setSaving] = useState<VacatingCleaningChoice | null>(null);
  const current = vacating.cleaningArrangement ?? VACATING_CLEANING.PENDING;
  const chosen = isChoice(current) ? current : null;
  const locked = readOnly || vacating.cleaningDone === true || vacating.status !== 'open';
  const asked = Boolean(vacating.cleaningChoiceRequestedAt) && !chosen;

  const choose = async (choice: VacatingCleaningChoice) => {
    if (choice === chosen) return;
    setSaving(choice);
    try {
      await setVacatingCleaning(choice);
      toast.success('Thanks — your property manager can see your choice.');
    } catch {
      toast.error('Could not save your choice. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 text-sm',
        asked && !locked && 'border-primary/40 ring-1 ring-primary/20',
      )}
    >
      <div className="mb-1 flex items-center gap-2 font-medium">
        <Sparkles className="text-primary size-4" />
        End-of-lease cleaning
      </div>
      <p className="text-muted-foreground text-xs">
        {vacating.cleaningDone
          ? 'The end-of-lease clean is recorded as done.'
          : chosen
            ? vacating.cleaningChosenBy === VACATING_CLEANING_CHOSEN_BY.AGENT
              ? 'Your property manager has set how the clean is arranged. Change it here if that is not right.'
              : 'You can change your choice until the clean is done.'
            : asked
              ? `Your property manager asked on ${formatDate(vacating.cleaningChoiceRequestedAt ?? '')} how the clean will be arranged.`
              : 'Let your property manager know how the end-of-lease clean will be arranged.'}
      </p>
      <div className="mt-3 grid gap-2">
        {VACATING_CLEANING_CHOICES.map((choice) => {
          const selected = chosen === choice;
          return (
            <button
              key={choice}
              type="button"
              disabled={locked || saving !== null || (!apiConnected && !selected)}
              onClick={() => void choose(choice)}
              aria-pressed={selected}
              className={cn(
                'flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors disabled:cursor-default',
                selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
                locked && !selected && 'opacity-60',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
                  selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                )}
              >
                {selected ? <Check className="size-3" strokeWidth={3} /> : null}
              </span>
              <span className="min-w-0">
                <span className="block font-medium">
                  {saving === choice ? 'Saving…' : VACATING_CLEANING_CHOICE_LABEL[choice]}
                </span>
                <span className="text-muted-foreground block text-xs">
                  {VACATING_CLEANING_CHOICE_HINT[choice]}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

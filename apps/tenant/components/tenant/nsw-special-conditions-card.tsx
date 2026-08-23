'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { IngoingSpecialQuestion } from '@/lib/types';

export function NswSpecialConditionsCard({
  title,
  questions,
  disabled,
  onSave,
}: {
  title: string;
  questions: IngoingSpecialQuestion[];
  disabled?: boolean;
  onSave: (
    answers: Array<{ questionId: string; answer: 'yes' | 'no' }>,
  ) => Promise<void>;
}) {
  const [answers, setAnswers] = useState<Record<string, 'yes' | 'no'>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const next: Record<string, 'yes' | 'no'> = {};
    for (const q of questions) {
      if (q.tenantAnswer === 'yes' || q.tenantAnswer === 'no') {
        next[q.id] = q.tenantAnswer;
      }
    }
    setAnswers(next);
  }, [questions]);

  const unanswered = questions.filter((q) => !answers[q.id]).length;

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-muted-foreground mt-1 text-xs">
        Answer Yes or No for each NSW special condition before signing the
        report.
      </p>
      <div className="mt-3 space-y-3">
        {questions.map((question) => (
          <div key={question.id} className="rounded-lg border px-3 py-2">
            <p className="text-sm">{question.prompt}</p>
            {question.inspectorAnswer ? (
              <p className="text-muted-foreground mt-1 text-[11px]">
                Inspector recorded:{' '}
                {question.inspectorAnswer === 'n/a'
                  ? 'N/A'
                  : question.inspectorAnswer === 'yes'
                    ? 'Yes'
                    : 'No'}
              </p>
            ) : null}
            <div className="mt-2 flex gap-2">
              {(['yes', 'no'] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={answers[question.id] === value ? 'default' : 'outline'}
                  disabled={disabled || busy}
                  onClick={() =>
                    setAnswers((prev) => ({ ...prev, [question.id]: value }))
                  }
                >
                  {value === 'yes' ? 'Yes' : 'No'}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          {unanswered === 0
            ? 'All questions answered.'
            : `${unanswered} left to answer.`}
        </p>
        <Button
          size="sm"
          disabled={disabled || busy || unanswered > 0}
          onClick={() => {
            setBusy(true);
            void onSave(
              questions.map((q) => ({
                questionId: q.id,
                answer: answers[q.id] ?? 'no',
              })),
            ).finally(() => setBusy(false));
          }}
        >
          Save answers
        </Button>
      </div>
    </div>
  );
}

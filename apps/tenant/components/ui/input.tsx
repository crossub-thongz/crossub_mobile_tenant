import * as React from 'react';

import { bindTextValueWithoutEmojis, propAllowsEmoji, stripEmojis } from '@/lib/strip-emojis';
import { cn } from '@/lib/utils';

function Input({ className, type, onChange, value, defaultValue, ...props }: React.ComponentProps<'input'>) {
  const allowEmoji = propAllowsEmoji(props['data-allow-emoji']);
  const textValue = typeof value === 'string' && !allowEmoji ? stripEmojis(value) : value;
  const textDefault =
    typeof defaultValue === 'string' && !allowEmoji ? stripEmojis(defaultValue) : defaultValue;
  return (
    <input
      type={type}
      className={cn(
        'placeholder:text-muted-foreground border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        (type === 'date' || type === 'datetime-local') &&
          '[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert',
        className,
      )}
      {...props}
      value={textValue}
      defaultValue={textDefault}
      onChange={allowEmoji ? onChange : bindTextValueWithoutEmojis(onChange)}
    />
  );
}

export { Input };

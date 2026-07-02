'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ThemeSetting() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const theme = mounted ? resolvedTheme : 'light';

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="font-semibold">Appearance</h2>
      <p className="text-muted-foreground mt-1 text-xs">Choose light or dark theme.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={theme === 'light' ? 'default' : 'outline'}
          className={cn('h-10 justify-start gap-2', theme === 'light' && 'pointer-events-none')}
          onClick={() => setTheme('light')}
        >
          <Sun className="size-4" />
          Light
        </Button>
        <Button
          type="button"
          variant={theme === 'dark' ? 'default' : 'outline'}
          className={cn('h-10 justify-start gap-2', theme === 'dark' && 'pointer-events-none')}
          onClick={() => setTheme('dark')}
        >
          <Moon className="size-4" />
          Dark
        </Button>
      </div>
    </section>
  );
}

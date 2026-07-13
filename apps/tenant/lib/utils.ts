import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function displayName(user: {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.email;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Open inspection window for browse cards and property detail. */
export function formatOpenInspectionWindow(
  startIso?: string,
  endIso?: string,
): string | null {
  if (!startIso) return null;
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return null;

  const datePart = start.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeFmt: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
  };
  const startTime = start.toLocaleTimeString('en-AU', timeFmt);

  if (!endIso) {
    return `${datePart} · ${startTime}`;
  }

  const end = new Date(endIso);
  if (Number.isNaN(end.getTime())) {
    return `${datePart} · ${startTime}`;
  }

  const sameDay = start.toDateString() === end.toDateString();
  const endTime = end.toLocaleTimeString('en-AU', timeFmt);
  if (sameDay) {
    return `${datePart} · ${startTime} – ${endTime}`;
  }

  const endDatePart = end.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return `${datePart} · ${startTime} – ${endDatePart} · ${endTime}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-AU')}`;
}

/** Opt-in only — live API data is the default. */
export const useDemoData = (): boolean =>
  process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true';

/**
 * Read a browser File into raw base64 (no `data:<mime>;base64,` prefix) for the
 * base64-through-API photo upload. The API's UploadTenantPhotoDto expects raw base64, so
 * the data-URI prefix the FileReader produces is stripped here.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Unexpected file read result'));
        return;
      }
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

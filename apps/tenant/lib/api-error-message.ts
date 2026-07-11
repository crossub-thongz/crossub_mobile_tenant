/** Normalize Nest / Next BFF error JSON into a user-facing string. */
export function parseApiErrorMessage(
  body: unknown,
  status?: number,
  fallback = 'Something went wrong',
): string {
  if (!body || typeof body !== 'object') {
    return status ? `${fallback} (${status})` : fallback;
  }

  const record = body as { message?: unknown };
  const raw = record.message;

  if (typeof raw === 'string' && raw.trim()) return raw;
  if (Array.isArray(raw)) {
    const parts = raw
      .map((entry) => formatErrorEntry(entry))
      .filter((entry) => entry.length > 0);
    if (parts.length > 0) return parts.join(', ');
  }
  if (raw && typeof raw === 'object') {
    const nested = (raw as { message?: unknown }).message;
    if (typeof nested === 'string' && nested.trim()) return nested;
    if (Array.isArray(nested)) {
      const parts = nested
        .map((entry) => formatErrorEntry(entry))
        .filter((entry) => entry.length > 0);
      if (parts.length > 0) return parts.join(', ');
    }
  }

  return status ? `${fallback} (${status})` : fallback;
}

function formatErrorEntry(entry: unknown): string {
  if (typeof entry === 'string') return entry;
  if (entry && typeof entry === 'object') {
    const constraints = (entry as { constraints?: Record<string, string> }).constraints;
    if (constraints) {
      return Object.values(constraints).join(', ');
    }
  }
  return '';
}

export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof Error && err.message.trim() && err.message !== '[object Object]') {
    return err.message;
  }
  if (typeof err === 'string' && err.trim()) return err;
  return fallback;
}

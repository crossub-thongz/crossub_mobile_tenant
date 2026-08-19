import { fileToBase64WithProgress, mapNetworkUploadProgress } from '@/lib/file-upload';

export type DirectUploadSession =
  | { mode: 'inline' }
  | { mode: 'direct'; uploadUrl: string; storageKey: string };

export type DirectUploadMeta = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

type JsonErrorBody = { message?: string | string[] };

function parseXhrError(xhr: XMLHttpRequest, fallback: string): string {
  try {
    const body = JSON.parse(xhr.responseText) as JsonErrorBody;
    const raw = body.message;
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw) && raw[0]) return raw[0];
  } catch {
    // ignore
  }
  return fallback;
}

async function readApiError(res: Response, fallback: string): Promise<string> {
  const err = (await res.json().catch(() => null)) as JsonErrorBody | null;
  const raw = err?.message;
  const message = Array.isArray(raw) ? raw[0] : raw;
  return message ?? fallback;
}

export async function postJson<T>(
  url: string,
  body: unknown,
  fallback: string,
  credentials: RequestCredentials = 'include',
): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readApiError(res, fallback));
  }
  return res.json() as Promise<T>;
}

export function putFileToPresignedUrl(
  uploadUrl: string,
  file: File,
  mimeType: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', mimeType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      reject(new Error(`Direct upload failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('Direct upload failed'));
    xhr.send(file);
  });
}

/** POST JSON through the BFF with XMLHttpRequest so inline fallbacks report progress. */
export function postJsonWithUploadProgress<T>(
  url: string,
  body: unknown,
  fallback: string,
  onNetworkProgress?: (networkPercent: number) => void,
  credentials: RequestCredentials = 'include',
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.withCredentials = credentials === 'include';
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onNetworkProgress) {
        onNetworkProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onNetworkProgress?.(100);
        try {
          resolve(JSON.parse(xhr.responseText) as T);
        } catch {
          reject(new Error(fallback));
        }
        return;
      }
      reject(new Error(parseXhrError(xhr, fallback)));
    };

    xhr.onerror = () => reject(new Error(fallback));
    xhr.send(JSON.stringify(body));
  });
}

/**
 * Prefer a presigned PUT straight to R2. Local/dev without storage, or a CORS-blocked
 * PUT, falls back to the legacy base64-through-API upload.
 */
export async function uploadFileDirectToR2(options: {
  file: File;
  mimeType: string;
  beginSession: (meta: DirectUploadMeta) => Promise<DirectUploadSession>;
  completeSession: (storageKey: string, meta: DirectUploadMeta) => Promise<string>;
  inlineUpload: (
    contentBase64: string,
    meta: DirectUploadMeta,
    onProgress?: (percent: number) => void,
  ) => Promise<string>;
  onProgress?: (percent: number) => void;
}): Promise<string> {
  const meta: DirectUploadMeta = {
    fileName: options.file.name,
    mimeType: options.mimeType,
    sizeBytes: options.file.size,
  };

  let session: DirectUploadSession = { mode: 'inline' };
  try {
    session = await options.beginSession(meta);
  } catch {
    session = { mode: 'inline' };
  }

  if (session.mode === 'direct') {
    options.onProgress?.(0);
    try {
      await putFileToPresignedUrl(session.uploadUrl, options.file, options.mimeType, (pct) =>
        options.onProgress?.(Math.min(90, Math.round(pct * 0.9))),
      );
      options.onProgress?.(95);
      const url = await options.completeSession(session.storageKey, meta);
      options.onProgress?.(100);
      return url;
    } catch {
      // Direct PUT often fails when the bucket CORS policy omits this origin.
    }
  }

  const contentBase64 = await fileToBase64WithProgress(options.file, (readPct) =>
    options.onProgress?.(readPct),
  );
  return options.inlineUpload(contentBase64, meta, (networkPct) =>
    options.onProgress?.(mapNetworkUploadProgress(networkPct)),
  );
}

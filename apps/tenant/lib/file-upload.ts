export type UploadProgressCallback = (percent: number) => void;

const READ_PROGRESS_WEIGHT = 40;
const NETWORK_PROGRESS_WEIGHT = 60;

/** Read a File as base64 (no `data:` URI prefix), reporting progress from 0–40%. */
export function fileToBase64WithProgress(
  file: File,
  onProgress?: UploadProgressCallback,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const readPct = Math.round((event.loaded / event.total) * READ_PROGRESS_WEIGHT);
        onProgress(Math.min(READ_PROGRESS_WEIGHT, readPct));
      }
    };
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const comma = result.indexOf(',');
      onProgress?.(READ_PROGRESS_WEIGHT);
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/** Map network upload progress (0–100) into the 40–100% band. */
export function mapNetworkUploadProgress(networkPercent: number): number {
  return READ_PROGRESS_WEIGHT + Math.round((networkPercent / 100) * NETWORK_PROGRESS_WEIGHT);
}

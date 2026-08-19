/**
 * Downscale large photos before upload. Direct-to-R2 no longer needs the old ~80 KB
 * JSON-body cap — keep a reasonable JPEG so camera snaps stay under a few hundred KB.
 */
const JPEG_QUALITY = 0.82;

export function dataUrlToUploadParts(
  dataUrl: string,
): { mimeType: string; contentBase64: string; sizeBytes: number } | null {
  const match = /^data:([^;,]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const [, mimeType, contentBase64] = match;
  return {
    mimeType,
    contentBase64,
    sizeBytes: Math.floor((contentBase64.length * 3) / 4),
  };
}

export async function compressImageForUpload(
  file: File,
  maxEdge = 1280,
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    return readFileAsDataUrl(file);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const longest = Math.max(image.width, image.height);
    const scale = longest > maxEdge ? maxEdge / longest : 1;
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return readFileAsDataUrl(file);
    ctx.drawImage(image, 0, 0, width, height);
    return compressCanvasToDataUrl(canvas);
  } catch {
    return readFileAsDataUrl(file);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function compressCanvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

export function dataUrlToFile(dataUrl: string, fileName: string): File | null {
  const parts = dataUrlToUploadParts(dataUrl);
  if (!parts) return null;
  const binary = atob(parts.contentBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], fileName, { type: parts.mimeType });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image'));
    img.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to read photo'));
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error('Failed to read photo'));
    reader.readAsDataURL(file);
  });
}

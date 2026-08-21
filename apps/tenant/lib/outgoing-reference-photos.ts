import { parseSectionAreaName, sectionAreaName } from '@/constants/inspection-areas';

const INGOING_SUFFIX = /\s*\(ingoing\)\s*$/i;

function normalizeAreaKey(name: string): string {
  return name
    .replace(INGOING_SUFFIX, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function matchReferenceIngoingPhotos(
  roomName: string,
  referenceAreas: Array<{ name: string; photos: string[] }>,
): string[] {
  const target = normalizeAreaKey(roomName);
  if (!target) return [];

  const exact = referenceAreas.find((area) => normalizeAreaKey(area.name) === target);
  if (exact) return exact.photos.filter(Boolean);

  const startsWith = referenceAreas.find((area) => {
    const key = normalizeAreaKey(area.name);
    return key.startsWith(target) || target.startsWith(key);
  });
  if (startsWith) return startsWith.photos.filter(Boolean);

  const contains = referenceAreas.find((area) => {
    const key = normalizeAreaKey(area.name);
    return key.includes(target) || target.includes(key);
  });
  return contains ? contains.photos.filter(Boolean) : [];
}

/** Every ingoing photo that belongs to this room (room-level or section-named). */
export function matchAllReferencePhotosForRoom(
  roomName: string,
  referenceAreas: Array<{ name: string; photos: string[] }>,
): string[] {
  const target = normalizeAreaKey(roomName);
  if (!target) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const area of referenceAreas) {
    const raw = area.name.replace(INGOING_SUFFIX, '').trim();
    const parsed = parseSectionAreaName(raw);
    const room = parsed?.area ?? raw;
    if (normalizeAreaKey(room) !== target && normalizeAreaKey(raw) !== target) {
      continue;
    }
    for (const url of area.photos.filter(Boolean)) {
      if (seen.has(url)) continue;
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}

export function matchReferenceSectionPhotos(
  roomName: string,
  section: string,
  referenceAreas: Array<{ name: string; photos: string[] }>,
): string[] {
  const sectionTarget = normalizeAreaKey(sectionAreaName(roomName, section));
  const exactSection = referenceAreas.find(
    (area) => normalizeAreaKey(area.name) === sectionTarget,
  );
  if (exactSection) {
    return exactSection.photos.filter(Boolean);
  }

  for (const area of referenceAreas) {
    const parsed = parseSectionAreaName(area.name.replace(INGOING_SUFFIX, '').trim());
    if (!parsed) continue;
    if (
      normalizeAreaKey(parsed.area) === normalizeAreaKey(roomName) &&
      normalizeAreaKey(parsed.section) === normalizeAreaKey(section)
    ) {
      return area.photos.filter(Boolean);
    }
  }

  return matchReferenceIngoingPhotos(roomName, referenceAreas);
}

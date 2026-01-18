import { id } from '@/lib/instantdb/client';

export function createIdMap<T extends { id: string }>(
  items: T[]
): Map<string, string> {
  const idMap = new Map<string, string>();
  items.forEach((item) => {
    idMap.set(item.id, id());
  });
  return idMap;
}

export function remapId(
  originalId: string | null | undefined,
  idMap: Map<string, string>
): string | null {
  if (!originalId) return null;
  return idMap.get(originalId) || null;
}

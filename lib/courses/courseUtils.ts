import type { SingleSelectOption } from '@/components/ui/SingleSelectDropdown';

export const RESOURCE_TYPE_OPTIONS: readonly SingleSelectOption<'LINK' | 'ATTACHMENT'>[] = [
  { value: 'LINK', label: 'LINK' },
  { value: 'ATTACHMENT', label: 'FILE' },
];

export function isValidWebUrl(urlString: string): boolean {
  try {
    const trimmed = urlString.trim();
    if (!trimmed) return false;
    const url = new URL(trimmed);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.length > 0;
  } catch {
    return false;
  }
}

export function findDuplicateTitle<T extends { id?: string; title?: string }>(
  items: readonly T[] | undefined,
  title: string,
  excludeId?: string,
): T | undefined {
  const normalized = title.trim().toLowerCase();
  if (!normalized || !items) return undefined;
  return items.find(
    (item) =>
      (excludeId ? item.id !== excludeId : true) && item.title?.trim().toLowerCase() === normalized,
  );
}

export function compareStrings(
  a: string | undefined | null,
  b: string | undefined | null,
  order: 'asc' | 'desc' = 'asc',
): number {
  const valA = (a ?? '').toLowerCase();
  const valB = (b ?? '').toLowerCase();
  const cmp = valA.localeCompare(valB);
  return order === 'asc' ? cmp : -cmp;
}

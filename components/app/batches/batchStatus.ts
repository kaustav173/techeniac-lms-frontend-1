import type { BatchStatus } from '@/lib/validation';

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const VALID_BATCH_STATUSES: readonly BatchStatus[] = [
  'LIVE',
  'DRAFT',
  'ON_HOLD',
  'COMPLETED',
  'ARCHIVED',
];

export function isBatchStatus(val: string): val is BatchStatus {
  return VALID_BATCH_STATUSES.includes(val as BatchStatus);
}

/**
 * Standard semantic badge styles for batch lifecycle states across dashboard and tables.
 */
export function getBatchStatusBadgeClass(status: BatchStatus): string {
  switch (status) {
    case 'LIVE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'DRAFT':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'ON_HOLD':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'COMPLETED':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'ARCHIVED':
      return 'bg-slate-50 text-slate-500 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

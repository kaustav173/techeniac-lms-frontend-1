'use client';

import React from 'react';

import { Span } from '@/components/ui/Typography';
import {
  AllocationDisplayStatus,
  CourseAllocationStatus,
  isTerminalAllocationStatus,
} from '@/hooks/useAllocations';

export interface AllocationStatusBadgeProps {
  readonly status: CourseAllocationStatus;
  readonly isOverdue?: boolean | undefined;
}

export function AllocationStatusBadge({ status, isOverdue }: AllocationStatusBadgeProps) {
  const isOverdueActive = Boolean(isOverdue && !isTerminalAllocationStatus(status));

  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';
  let label: string = status;
  let title: string | undefined = undefined;

  switch (status) {
    case CourseAllocationStatus.ASSIGNED:
      badgeStyle = 'bg-blue-50 text-blue-700 border-blue-300';
      label = AllocationDisplayStatus.ASSIGNED;
      break;
    case CourseAllocationStatus.IN_PROGRESS:
      badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-300';
      label = AllocationDisplayStatus.IN_PROGRESS;
      break;
    case CourseAllocationStatus.COMPLETED:
      badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      label = AllocationDisplayStatus.COMPLETED;
      break;
    case CourseAllocationStatus.REVOKED:
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-300';
      label = AllocationDisplayStatus.REVOKED;
      break;
    case CourseAllocationStatus.CLOSED_ROLE_CHANGE:
      badgeStyle = 'bg-slate-100 text-slate-600 border-slate-300';
      label = AllocationDisplayStatus.ROLE_CHANGED;
      title = 'Closed due to mentee role change';
      break;
    case CourseAllocationStatus.CLOSED_BATCH_CHANGE:
      badgeStyle = 'bg-slate-100 text-slate-600 border-slate-300';
      label = AllocationDisplayStatus.BATCH_TRANSFERRED;
      title = 'Closed due to batch transfer';
      break;
    default: {
      const _exhaustiveCheck: never = status;
      badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';
      label = String(_exhaustiveCheck);
      break;
    }
  }

  // When overdue and non-terminal, display a single high-visibility Overdue badge instead of two badges side-by-side
  if (isOverdueActive) {
    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
    title = `${label} (Overdue)`;
    label = AllocationDisplayStatus.OVERDUE;
  }

  return (
    <div className="inline-flex items-center whitespace-nowrap">
      <Span
        title={title}
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${badgeStyle}`}
      >
        {label}
      </Span>
    </div>
  );
}

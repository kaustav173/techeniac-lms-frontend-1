'use client';

import React from 'react';

import { Span } from '@/components/ui/Typography';
import { type CourseAllocationStatus, isTerminalAllocationStatus } from '@/hooks/useAllocations';

export interface AllocationStatusBadgeProps {
  readonly status: CourseAllocationStatus;
  readonly isOverdue?: boolean | undefined;
}

export function AllocationStatusBadge({ status, isOverdue }: AllocationStatusBadgeProps) {
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';
  let label = status as string;

  switch (status) {
    case 'ASSIGNED':
      badgeStyle = 'bg-blue-50 text-blue-700 border-blue-300';
      label = 'Assigned';
      break;
    case 'IN_PROGRESS':
      badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-300';
      label = 'In Progress';
      break;
    case 'COMPLETED':
      badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      label = 'Completed';
      break;
    case 'REVOKED':
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-300';
      label = 'Revoked';
      break;
    case 'CLOSED_ROLE_CHANGE':
      badgeStyle = 'bg-slate-100 text-slate-600 border-slate-300';
      label = 'Closed (Role)';
      break;
    case 'CLOSED_BATCH_CHANGE':
      badgeStyle = 'bg-slate-100 text-slate-600 border-slate-300';
      label = 'Closed (Transfer)';
      break;
    default: {
      const _exhaustiveCheck: never = status;
      badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';
      label = String(_exhaustiveCheck);
      break;
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeStyle}`}
      >
        {label}
      </Span>
      {isOverdue && !isTerminalAllocationStatus(status) ? (
        <Span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
          Overdue
        </Span>
      ) : null}
    </div>
  );
}

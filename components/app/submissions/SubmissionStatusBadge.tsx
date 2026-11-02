import React from 'react';

import { Span } from '@/components/ui/Typography';
import { cn } from '@/lib/cn';
import { SubmissionStatus } from '@/types/grading';
import { AssignmentDerivedStatus } from '@/types/submissions';

interface SubmissionStatusBadgeProps {
  status: AssignmentDerivedStatus | SubmissionStatus;
  isLate?: boolean | undefined;
  className?: string | undefined;
}

const STATUS_CONFIG: Record<
  AssignmentDerivedStatus | SubmissionStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  [AssignmentDerivedStatus.PENDING]: {
    label: 'Pending',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
  },
  [AssignmentDerivedStatus.SUBMITTED]: {
    label: 'Submitted',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  [AssignmentDerivedStatus.RESUBMIT_REQUESTED]: {
    label: 'Resubmit Requested',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  [AssignmentDerivedStatus.GRADED]: {
    label: 'Graded',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  [AssignmentDerivedStatus.OVERDUE]: {
    label: 'Overdue',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  [AssignmentDerivedStatus.CLOSED]: {
    label: 'Closed',
    bg: 'bg-zinc-100',
    text: 'text-zinc-600',
    border: 'border-zinc-200',
  },
};

export function SubmissionStatusBadge({
  status,
  isLate,
  className,
}: Readonly<SubmissionStatusBadgeProps>) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG[AssignmentDerivedStatus.PENDING];

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <Span
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
          config.bg,
          config.text,
          config.border,
        )}
      >
        {config.label}
      </Span>
      {isLate ? (
        <Span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
          Late
        </Span>
      ) : null}
    </div>
  );
}

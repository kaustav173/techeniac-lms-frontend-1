'use client';

import { useRouter } from 'next/navigation';
import React from 'react';

import { TableCell, TableRow } from '@/components/ui/Table';
import { Tooltip } from '@/components/ui/Tooltip';
import { P, Span } from '@/components/ui/Typography';
import { cn } from '@/lib/cn';
import { formatDateDMY } from '@/lib/date';
import type { ApiMentorMappedMentee } from '@/services/batches.service';

export interface MenteeTableRowProps {
  mentee:
    | ApiMentorMappedMentee
    | {
        id: string;
        name?: string;
        email?: string;
        batchName?: string;
        batchCode?: string;
        startDate?: string;
      };
  actions?: React.ReactNode;
  isActionMenuOpen?: boolean;
}

export function MenteeTableRow({
  mentee,
  actions,
  isActionMenuOpen,
}: Readonly<MenteeTableRowProps>) {
  const router = useRouter();
  const menteeUserId = 'menteeId' in mentee && mentee.menteeId ? mentee.menteeId : mentee.id;
  const targetUrl = menteeUserId ? `/mentor/mentees/${menteeUserId}` : '/mentor/mentees';

  return (
    <TableRow
      key={mentee.id}
      tabIndex={0}
      role="button"
      onClick={() => router.push(targetUrl)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(targetUrl);
        }
      }}
      className={cn(
        'h-16 cursor-pointer transition-colors hover:bg-[#F9FAFB]/90 focus-visible:bg-[#F9FAFB] focus-visible:outline-none',
        isActionMenuOpen && 'relative z-20',
      )}
    >
      <TableCell className={actions ? 'w-[32%]' : 'w-[40%]'}>
        <div className="flex min-w-0 flex-col">
          <Tooltip
            content={mentee.name ?? 'Assigned Mentee'}
            containerClassName="inline-flex max-w-full"
          >
            <P className="truncate text-base font-semibold text-slate-900">
              {mentee.name ?? 'Assigned Mentee'}
            </P>
          </Tooltip>
          <Tooltip content={mentee.email ?? '—'} containerClassName="inline-flex max-w-full">
            <P className="truncate text-xs text-slate-500">{mentee.email ?? '—'}</P>
          </Tooltip>
        </div>
      </TableCell>
      <TableCell className="text-base font-semibold text-slate-900">
        <Tooltip content={mentee.batchName ?? '—'} containerClassName="inline-flex max-w-full">
          <Span className="block truncate">{mentee.batchName ?? '—'}</Span>
        </Tooltip>
      </TableCell>
      <TableCell>
        <Span className="inline-block rounded-full border border-[#E1E6EC] bg-[#F6F8FC] px-2.5 py-1 text-xs font-semibold text-slate-900">
          {mentee.batchCode ?? '—'}
        </Span>
      </TableCell>
      <TableCell
        className={actions ? 'text-sm text-slate-600' : 'text-right text-sm text-slate-600'}
      >
        {mentee.startDate ? formatDateDMY(mentee.startDate) : '—'}
      </TableCell>
      {actions ? (
        <TableCell
          onClick={(e) => e.stopPropagation()}
          className={cn('text-right', isActionMenuOpen && 'relative z-20')}
        >
          {actions}
        </TableCell>
      ) : null}
    </TableRow>
  );
}

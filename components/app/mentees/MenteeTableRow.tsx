'use client';

import React from 'react';

import { TableCell, TableRow } from '@/components/ui/Table';
import { P, Span } from '@/components/ui/Typography';
import { cn } from '@/lib/cn';
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
  return (
    <TableRow
      key={mentee.id}
      className={cn(
        'h-16 transition-colors hover:bg-[#F9FAFB]/90 focus-visible:bg-[#F9FAFB] focus-visible:outline-none',
        isActionMenuOpen && 'relative z-20',
      )}
    >
      <TableCell className={actions ? 'w-[32%]' : 'w-[40%]'}>
        <div className="min-w-0">
          <P className="truncate text-sm font-bold text-[#111827]">
            {mentee.name ?? 'Assigned Mentee'}
          </P>
          <P className="truncate text-xs text-[#667085]">{mentee.email ?? '—'}</P>
        </div>
      </TableCell>
      <TableCell className="text-sm font-medium text-[#111827]">
        {mentee.batchName ?? 'Course'}
      </TableCell>
      <TableCell>
        <Span className="inline-block rounded-full border border-[#E1E6EC] bg-[#F6F8FC] px-2.5 py-1 text-xs font-bold text-[#111827]">
          {mentee.batchCode ?? '—'}
        </Span>
      </TableCell>
      <TableCell
        className={actions ? 'text-sm text-[#667085]' : 'text-right text-sm text-[#667085]'}
      >
        {mentee.startDate ? mentee.startDate.slice(0, 10) : '—'}
      </TableCell>
      {actions ? (
        <TableCell className={cn('text-right', isActionMenuOpen && 'relative z-20')}>
          {actions}
        </TableCell>
      ) : null}
    </TableRow>
  );
}

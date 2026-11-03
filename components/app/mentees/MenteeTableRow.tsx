'use client';

import React from 'react';

import { TableCell, TableRow } from '@/components/ui/Table';
import { P, Span } from '@/components/ui/Typography';
import { getUserInitials } from '@/lib/user';
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
}

export function MenteeTableRow({ mentee, actions }: Readonly<MenteeTableRowProps>) {
  const initials = getUserInitials(mentee.name);

  return (
    <TableRow
      key={mentee.id}
      className="h-16 transition-colors hover:bg-[#F9FAFB]/90 focus-visible:bg-[#F9FAFB] focus-visible:outline-none"
    >
      <TableCell className={actions ? 'w-[32%]' : 'w-[40%]'}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0044D3] text-sm font-bold text-white shadow-xs">
            {initials}
          </div>
          <div className="min-w-0">
            <P className="truncate text-sm font-bold text-[#111827]">
              {mentee.name ?? 'Assigned Mentee'}
            </P>
            <P className="truncate text-xs text-[#667085]">{mentee.email ?? '—'}</P>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm font-medium text-[#111827]">
        {mentee.batchName ?? 'Course'}
      </TableCell>
      <TableCell>
        <Span className="inline-block rounded-md border border-[#E1E6EC] bg-[#F6F8FC] px-2.5 py-1 text-xs font-bold text-[#111827]">
          {mentee.batchCode ?? '—'}
        </Span>
      </TableCell>
      <TableCell
        className={actions ? 'text-sm text-[#667085]' : 'text-right text-sm text-[#667085]'}
      >
        {mentee.startDate ? mentee.startDate.slice(0, 10) : '—'}
      </TableCell>
      {actions ? <TableCell className="text-right">{actions}</TableCell> : null}
    </TableRow>
  );
}

'use client';

import React from 'react';

import { TableHead } from '@/components/ui/Table';
import { Span } from '@/components/ui/Typography';
import { cn } from '@/lib/cn';

export interface SortableColumnHeaderProps<T extends string> {
  readonly field: T;
  readonly label: string;
  readonly sortField: T | null;
  readonly sortOrder: 'asc' | 'desc';
  readonly onSort: (field: T) => void;
  readonly className?: string;
  readonly tooltip?: string;
}

export function SortableColumnHeader<T extends string>({
  field,
  label,
  sortField,
  sortOrder,
  onSort,
  className,
  tooltip,
}: Readonly<SortableColumnHeaderProps<T>>) {
  const isSorted = sortField === field;
  const ariaSort = isSorted ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none';

  return (
    <TableHead aria-sort={ariaSort} className={className}>
      <button
        type="button"
        onClick={() => onSort(field)}
        title={tooltip ?? `Sort by ${label}`}
        className="group inline-flex cursor-pointer items-center gap-1.5 p-0 text-left font-semibold hover:bg-transparent focus-visible:text-[#0044D3] focus-visible:outline-none"
      >
        <Span className="text-slate-700 transition-colors group-hover:text-slate-900">{label}</Span>
        <span className="flex flex-col items-center justify-center -space-y-1">
          <svg
            className={cn(
              'h-3 w-3 transition-colors',
              isSorted && sortOrder === 'asc'
                ? 'text-[#0044D3]'
                : 'text-slate-300 group-hover:text-slate-500',
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
          <svg
            className={cn(
              'h-3 w-3 transition-colors',
              isSorted && sortOrder === 'desc'
                ? 'text-[#0044D3]'
                : 'text-slate-300 group-hover:text-slate-500',
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
    </TableHead>
  );
}

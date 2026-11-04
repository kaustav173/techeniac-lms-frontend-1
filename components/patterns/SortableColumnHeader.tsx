'use client';

import React from 'react';

import { Button } from '@/components/ui/Button';
import { TableHead } from '@/components/ui/Table';
import { Span } from '@/components/ui/Typography';

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
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onSort(field)}
        title={tooltip ?? `Sort by ${label}`}
        className="group inline-flex h-auto cursor-pointer items-center gap-1.5 rounded-sm p-0 text-left font-semibold hover:bg-transparent focus-visible:text-[#0044D3] focus-visible:ring-2 focus-visible:ring-[#0044D3]/30 focus-visible:outline-none"
      >
        <Span className="text-slate-700 transition-colors group-hover:text-slate-900">{label}</Span>
        <Span className="inline-flex items-center">
          {isSorted ? (
            <svg
              className="h-3.5 w-3.5 text-[#0044D3]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              {sortOrder === 'asc' ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75"
                />
              )}
            </svg>
          ) : (
            <svg
              className="h-3.5 w-3.5 text-slate-400 opacity-60 transition-opacity group-hover:opacity-100"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
              />
            </svg>
          )}
        </Span>
      </Button>
    </TableHead>
  );
}

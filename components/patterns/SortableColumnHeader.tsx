'use client';

import React from 'react';

import { Button } from '@/components/ui/Button';
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
  readonly buttonClassName?: string;
  readonly tooltip?: string;
}

export function SortableColumnHeader<T extends string>({
  field,
  label,
  sortField,
  sortOrder,
  onSort,
  className,
  buttonClassName,
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
        className={cn(
          'group inline-flex h-auto cursor-pointer items-center gap-1.5 rounded-sm p-0 text-left text-[length:inherit] font-semibold text-inherit hover:bg-transparent focus-visible:text-[#0044D3] focus-visible:ring-2 focus-visible:ring-[#0044D3]/30 focus-visible:outline-none',
          buttonClassName,
        )}
      >
        <Span className="text-[length:inherit] font-semibold text-inherit transition-colors group-hover:text-slate-900">
          {label}
        </Span>
        <Span className="flex items-center justify-center">
          {isSorted ? (
            sortOrder === 'asc' ? (
              <svg
                className="h-3.5 w-3.5 shrink-0 text-[#0044D3] transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20V4m0 0l-5 5m5-5l5 5" />
              </svg>
            ) : (
              <svg
                className="h-3.5 w-3.5 shrink-0 text-[#0044D3] transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0l-5-5m5 5l5-5" />
              </svg>
            )
          ) : (
            <svg
              className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 4v16m0 0l-4-4m4 4l4-4M16 20V4m0 0l-4 4m4-4l4 4"
              />
            </svg>
          )}
        </Span>
      </Button>
    </TableHead>
  );
}

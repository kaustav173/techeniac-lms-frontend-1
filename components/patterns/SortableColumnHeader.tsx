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
  readonly labelClassName?: string;
  readonly tooltip?: string;
}

export function SortableColumnHeader<T extends string>({
  field,
  label,
  sortField,
  sortOrder,
  onSort,
  className,
  labelClassName,
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
        className="group inline-flex h-auto cursor-pointer items-center gap-1.5 rounded-sm p-0 text-left text-sm font-semibold text-slate-700 hover:bg-transparent focus-visible:text-[#0044D3] focus-visible:ring-2 focus-visible:ring-[#0044D3]/30 focus-visible:outline-none sm:text-base"
      >
        <Span
          className={cn(
            'text-sm font-semibold text-slate-700 transition-colors group-hover:text-slate-900 sm:text-base',
            labelClassName,
          )}
        >
          {label}
        </Span>
        <Span className="flex items-center justify-center">
          {isSorted ? (
            sortOrder === 'asc' ? (
              <svg
                className="h-4 w-4 shrink-0 text-[#0044D3] transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg
                className="h-4 w-4 shrink-0 text-[#0044D3] transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )
          ) : (
            <svg
              className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
              />
            </svg>
          )}
        </Span>
      </Button>
    </TableHead>
  );
}

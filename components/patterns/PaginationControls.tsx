import React from 'react';

import { Button } from '@/components/ui/Button';
import { SingleSelectDropdown } from '@/components/ui/SingleSelectDropdown';
import { Skeleton } from '@/components/ui/Skeleton';
import { Span } from '@/components/ui/Typography';
import { cn } from '@/lib/cn';

export interface PaginationControlsProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  itemLabel?: string | undefined;
  pageSizeOptions?: readonly number[] | number[] | undefined;
  isLoading?: boolean | undefined;
  className?: string | undefined;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 6) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, 'ellipsis', totalPages];
  }
  if (currentPage >= totalPages - 2) {
    return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
}

export function PaginationControls({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
  itemLabel = 'entries',
  pageSizeOptions = [10, 20, 50],
  isLoading = false,
  className,
}: Readonly<PaginationControlsProps>) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-between gap-4 border-t border-[#E1E6EC] bg-white px-6 py-4 text-sm text-slate-500 sm:flex-row',
          className,
        )}
      >
        <Skeleton className="h-5 w-48 rounded-md" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);
  const pageNumbers = getPageNumbers(page, totalPages);

  const selectOptions = pageSizeOptions.map((opt) => ({
    value: opt,
    label: `${opt} / page`,
  }));

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-4 border-t border-[#E1E6EC] bg-white px-6 py-4 text-sm text-slate-600 sm:flex-row',
        className,
      )}
    >
      {/* Informative Items Counter (Left-aligned) */}
      <div
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500"
        role="status"
        aria-live="polite"
      >
        <Span className="font-semibold text-slate-900">{startItem}</Span>
        <Span>to</Span>
        <Span className="font-semibold text-slate-900">{endItem}</Span>
        <Span>of</Span>
        <Span className="font-semibold text-slate-900">{total}</Span>
        <Span>{itemLabel}</Span>
      </div>

      {/* Right-aligned Controls: Page Navigation Buttons + Page Size Selector */}
      <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
        {/* Numbered Page Navigation Pills */}
        <div
          className="flex items-center gap-1.5"
          role="navigation"
          aria-label="Pagination Navigation"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="h-9 w-9 rounded-full border-[#E1E6EC] p-0 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40"
            aria-label="Previous page"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Button>

          {pageNumbers.map((p, idx) =>
            p === 'ellipsis' ? (
              <Span key={`ellipsis-${idx}`} className="px-1 text-slate-400 select-none">
                …
              </Span>
            ) : (
              <Button
                key={p}
                type="button"
                variant={p === page ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => onPageChange(p)}
                className={`h-9 min-w-9 rounded-full px-3 text-sm font-semibold transition-all ${
                  p === page
                    ? 'bg-[#0044D3] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </Button>
            ),
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="h-9 w-9 rounded-full border-[#E1E6EC] p-0 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40"
            aria-label="Next page"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

        {/* Page Size Selector (Opens upward to prevent clipping below table) */}
        <div className="w-32">
          <SingleSelectDropdown
            value={limit}
            onChange={(newLimit) => onLimitChange(Number(newLimit))}
            options={selectOptions}
            direction="up"
            size="sm"
            aria-label="Entries per page"
          />
        </div>
      </div>
    </div>
  );
}

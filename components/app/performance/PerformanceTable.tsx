import React from 'react';

import { PaginationControls } from '@/components/patterns/PaginationControls';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { P, Span } from '@/components/ui/Typography';
import type { MenteePerformanceRow, PerformanceFilterParams } from '@/services/performance.service';

interface PerformanceTableProps {
  readonly mentees: readonly MenteePerformanceRow[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
  readonly onLimitChange: (limit: number) => void;
  readonly sortBy?: PerformanceFilterParams['sortBy'];
  readonly sortOrder?: PerformanceFilterParams['sortOrder'];
  readonly onSortChange?: (
    sortBy?: PerformanceFilterParams['sortBy'],
    sortOrder?: PerformanceFilterParams['sortOrder'],
  ) => void;
  readonly isLoading?: boolean;
  readonly isFetching?: boolean;
  readonly isError?: boolean;
  readonly error?: unknown;
  readonly onRetry?: () => void;
}

export function PerformanceTable({
  mentees,
  total,
  page,
  limit,
  totalPages,
  onPageChange,
  onLimitChange,
  sortBy,
  sortOrder,
  onSortChange,
  isLoading = false,
  isFetching = false,
  isError = false,
  error,
  onRetry,
}: PerformanceTableProps) {
  const handleSort = (field: NonNullable<PerformanceFilterParams['sortBy']>) => {
    if (!onSortChange) return;
    if (sortBy !== field) {
      onSortChange(field, 'ASC');
    } else if (sortOrder === 'ASC') {
      onSortChange(field, 'DESC');
    } else {
      onSortChange(undefined, undefined);
    }
  };

  const renderSortIcon = (field: NonNullable<PerformanceFilterParams['sortBy']>) => {
    const isActive = sortBy === field && sortOrder !== undefined;
    if (!isActive) {
      return (
        <svg
          className="h-4 w-4 text-slate-400 opacity-60 transition-opacity group-hover:opacity-100"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    }
    return (
      <svg
        className="h-4 w-4 text-[#0044D3]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
        aria-hidden="true"
      >
        {sortOrder === 'ASC' ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        )}
      </svg>
    );
  };

  if (isError) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
        <ErrorMessage error={error} onRetry={onRetry} />
      </div>
    );
  }

  const isTableLoading = isLoading || isFetching;

  if (!isTableLoading && mentees.length === 0) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <P className="mt-3 text-sm font-semibold text-slate-800">No Mentees Found</P>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto rounded-t-3xl">
        <Table className="w-full text-left text-sm text-slate-600">
          <TableHeader className="border-b border-slate-200 bg-slate-50/75 text-sm font-semibold text-[#667085]">
            <TableRow>
              <TableHead className="px-6 py-3.5 text-sm font-semibold text-[#667085] sm:text-sm">
                <button
                  type="button"
                  onClick={() => handleSort('name')}
                  className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#667085] transition-colors hover:text-[#111827] focus-visible:outline-none"
                  title={
                    sortBy === 'name' && sortOrder
                      ? `Sorted by name (${sortOrder === 'ASC' ? 'A to Z' : 'Z to A'})`
                      : 'Sort by name'
                  }
                >
                  <Span className="text-sm font-semibold text-[#667085] transition-colors group-hover:text-[#111827]">
                    Mentee
                  </Span>
                  {renderSortIcon('name')}
                </button>
              </TableHead>
              <TableHead className="px-4 py-3.5 text-sm font-semibold text-[#667085] sm:text-sm">
                Batch
              </TableHead>
              <TableHead className="px-4 py-3.5 text-sm font-semibold text-[#667085] sm:text-sm">
                Courses
              </TableHead>
              <TableHead className="px-4 py-3.5 text-sm font-semibold text-[#667085] sm:text-sm">
                <button
                  type="button"
                  onClick={() => handleSort('completionPercentage')}
                  className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#667085] transition-colors hover:text-[#111827] focus-visible:outline-none"
                  title={
                    sortBy === 'completionPercentage' && sortOrder
                      ? `Sorted by completion (${sortOrder === 'ASC' ? 'lowest first' : 'highest first'})`
                      : 'Sort by completion'
                  }
                >
                  <Span className="text-sm font-semibold text-[#667085] transition-colors group-hover:text-[#111827]">
                    Completion
                  </Span>
                  {renderSortIcon('completionPercentage')}
                </button>
              </TableHead>
              <TableHead className="px-4 py-3.5 text-center text-sm font-semibold text-[#667085] sm:text-sm">
                <button
                  type="button"
                  onClick={() => handleSort('averageMarks')}
                  className="group inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-[#667085] transition-colors hover:text-[#111827] focus-visible:outline-none"
                  title={
                    sortBy === 'averageMarks' && sortOrder
                      ? `Sorted by average score (${sortOrder === 'ASC' ? 'lowest first' : 'highest first'})`
                      : 'Sort by average score'
                  }
                >
                  <Span className="text-sm font-semibold text-[#667085] transition-colors group-hover:text-[#111827]">
                    Avg Score
                  </Span>
                  {renderSortIcon('averageMarks')}
                </button>
              </TableHead>
              <TableHead className="px-4 py-3.5 text-center text-sm font-semibold text-[#667085] sm:text-sm">
                <button
                  type="button"
                  onClick={() => handleSort('onTimeRate')}
                  className="group inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-[#667085] transition-colors hover:text-[#111827] focus-visible:outline-none"
                  title={
                    sortBy === 'onTimeRate' && sortOrder
                      ? `Sorted by submissions on-time rate (${sortOrder === 'ASC' ? 'lowest first' : 'highest first'})`
                      : 'Sort by submissions'
                  }
                >
                  <Span className="text-sm font-semibold text-[#667085] transition-colors group-hover:text-[#111827]">
                    Submissions
                  </Span>
                  {renderSortIcon('onTimeRate')}
                </button>
              </TableHead>
              <TableHead className="px-4 py-3.5 text-center text-sm font-semibold text-[#667085] sm:text-sm">
                <button
                  type="button"
                  onClick={() => handleSort('overdueCount')}
                  className="group inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-[#667085] transition-colors hover:text-[#111827] focus-visible:outline-none"
                  title={
                    sortBy === 'overdueCount' && sortOrder
                      ? `Sorted by overdue tasks (${sortOrder === 'ASC' ? 'lowest first' : 'highest first'})`
                      : 'Sort by overdue tasks'
                  }
                >
                  <Span className="text-sm font-semibold text-[#667085] transition-colors group-hover:text-[#111827]">
                    Overdue
                  </Span>
                  {renderSortIcon('overdueCount')}
                </button>
              </TableHead>
              <TableHead className="px-6 py-3.5 text-center text-sm font-semibold text-[#667085] sm:text-sm">
                <button
                  type="button"
                  onClick={() => handleSort('grade')}
                  className="group inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-[#667085] transition-colors hover:text-[#111827] focus-visible:outline-none"
                  title={
                    sortBy === 'grade' && sortOrder
                      ? `Sorted by grade (${sortOrder === 'ASC' ? 'lowest first' : 'highest first'})`
                      : 'Sort by grade'
                  }
                >
                  <Span className="text-sm font-semibold text-[#667085] transition-colors group-hover:text-[#111827]">
                    Grade
                  </Span>
                  {renderSortIcon('grade')}
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {isTableLoading
              ? Array.from({ length: Math.min(Math.max(limit || 5, 5), 8) }).map((_, idx) => (
                  <TableRow key={`perf-skel-${idx}`} className="h-16">
                    {/* Mentee Identity */}
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <Skeleton className="h-4 w-32 rounded-md" />
                        <Skeleton className="h-3 w-44 rounded-md" />
                      </div>
                    </TableCell>

                    {/* Batch Name */}
                    <TableCell className="px-4 py-4">
                      <Skeleton className="h-5 w-20 rounded-md" />
                    </TableCell>

                    {/* Courses Count */}
                    <TableCell className="px-4 py-4">
                      <Skeleton className="h-4 w-28 rounded-md" />
                    </TableCell>

                    {/* Completion Progress Bar */}
                    <TableCell className="px-4 py-4">
                      <div className="flex w-32 flex-col gap-1.5">
                        <Skeleton className="h-3 w-10 rounded-md" />
                        <Skeleton className="h-1.5 w-full rounded-full" />
                      </div>
                    </TableCell>

                    {/* Average Marks */}
                    <TableCell className="px-4 py-4 text-center">
                      <Skeleton className="mx-auto h-4 w-10 rounded-md" />
                    </TableCell>

                    {/* Submissions & On-time Rate */}
                    <TableCell className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Skeleton className="h-4 w-8 rounded-md" />
                        <Skeleton className="h-3 w-16 rounded-md" />
                      </div>
                    </TableCell>

                    {/* Overdue Count */}
                    <TableCell className="px-4 py-4 text-center">
                      <Skeleton className="mx-auto h-5 w-16 rounded-full" />
                    </TableCell>

                    {/* Latest Grade Badge */}
                    <TableCell className="px-6 py-4 text-center">
                      <Skeleton className="mx-auto h-6 w-9 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              : mentees.map((row) => (
                  <TableRow key={row.menteeId} className="transition-colors hover:bg-slate-50/60">
                    {/* Mentee Identity */}
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col">
                        <Span className="font-semibold text-slate-900">{row.menteeName}</Span>
                        <Span className="text-xs text-slate-500">{row.menteeEmail}</Span>
                      </div>
                    </TableCell>

                    {/* Batch Name */}
                    <TableCell className="px-4 py-4">
                      <Span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {row.batchName ?? 'Unbatched'}
                      </Span>
                    </TableCell>

                    {/* Courses Count */}
                    <TableCell className="px-4 py-4">
                      <Span className="font-bold text-slate-800">{row.completedCoursesCount}</Span>
                      <Span className="text-slate-400">
                        {' '}
                        / {row.assignedCoursesCount} completed
                      </Span>
                    </TableCell>

                    {/* Completion Progress Bar */}
                    <TableCell className="px-4 py-4">
                      <div className="flex w-32 flex-col gap-1">
                        <div className="flex justify-between text-xs">
                          <Span className="font-bold text-slate-700">
                            {row.completionPercentage}%
                          </Span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{
                              width: `${Math.min(100, Math.max(0, row.completionPercentage))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    {/* Average Marks */}
                    <TableCell className="px-4 py-4 text-center">
                      {row.averageMarks !== null ? (
                        <Span className="font-bold text-slate-900">{row.averageMarks}</Span>
                      ) : (
                        <Span className="text-slate-400">—</Span>
                      )}
                    </TableCell>

                    {/* Submissions & On-time Rate */}
                    <TableCell className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <Span className="font-bold text-slate-800">{row.totalSubmissions}</Span>
                        <Span className="text-xs font-semibold text-emerald-600">
                          {row.onTimeRate}% on-time
                        </Span>
                      </div>
                    </TableCell>

                    {/* Overdue Count */}
                    <TableCell className="px-4 py-4 text-center">
                      {row.overdueCount > 0 ? (
                        <Span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
                          {row.overdueCount} overdue
                        </Span>
                      ) : (
                        <Span className="text-xs text-slate-400">0</Span>
                      )}
                    </TableCell>

                    {/* Latest Grade Badge */}
                    <TableCell className="px-6 py-4 text-center">
                      {row.latestGrade ? (
                        <Span className="inline-block w-8 rounded border border-blue-200 bg-blue-50 py-0.5 text-center text-xs font-bold text-blue-700">
                          {row.latestGrade}
                        </Span>
                      ) : (
                        <Span className="text-xs text-slate-400">—</Span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        page={page}
        limit={limit}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        itemLabel="mentees"
        className="rounded-b-3xl"
      />
    </div>
  );
}

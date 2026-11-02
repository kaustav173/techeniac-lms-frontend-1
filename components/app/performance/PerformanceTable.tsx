import React from 'react';

import { PaginationControls } from '@/components/patterns/PaginationControls';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Skeleton } from '@/components/ui/Skeleton';
import { P, Span } from '@/components/ui/Typography';
import type { MenteePerformanceRow } from '@/services/performance.service';

interface PerformanceTableProps {
  readonly mentees: readonly MenteePerformanceRow[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
  readonly onLimitChange: (limit: number) => void;
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
  isLoading = false,
  isFetching = false,
  isError = false,
  error,
  onRetry,
}: PerformanceTableProps) {
  if (isError) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
        <ErrorMessage error={error} onRetry={onRetry} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="space-y-4 p-6">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (mentees.length === 0) {
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
        <P className="mt-1 text-xs text-slate-500">
          No performance records match your current filter selection. Try adjusting or resetting
          your filters.
        </P>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-bold tracking-wider text-slate-500 uppercase">
            <tr>
              <th scope="col" className="px-6 py-3.5">
                Mentee
              </th>
              <th scope="col" className="px-4 py-3.5">
                Batch
              </th>
              <th scope="col" className="px-4 py-3.5">
                Courses
              </th>
              <th scope="col" className="px-4 py-3.5">
                Completion
              </th>
              <th scope="col" className="px-4 py-3.5 text-center">
                Avg Score
              </th>
              <th scope="col" className="px-4 py-3.5 text-center">
                Submissions
              </th>
              <th scope="col" className="px-4 py-3.5 text-center">
                Overdue
              </th>
              <th scope="col" className="px-6 py-3.5 text-center">
                Grade
              </th>
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-slate-100 ${
              isFetching && !isLoading ? 'opacity-60 transition-opacity' : ''
            }`}
          >
            {mentees.map((row) => (
              <tr key={row.menteeId} className="transition-colors hover:bg-slate-50/60">
                {/* Mentee Identity */}
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <Span className="font-semibold text-slate-900">{row.menteeName}</Span>
                    <Span className="text-xs text-slate-500">{row.menteeEmail}</Span>
                  </div>
                </td>

                {/* Batch Name */}
                <td className="px-4 py-4">
                  <Span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {row.batchName ?? 'Unbatched'}
                  </Span>
                </td>

                {/* Courses Count */}
                <td className="px-4 py-4">
                  <Span className="font-bold text-slate-800">{row.completedCoursesCount}</Span>
                  <Span className="text-slate-400"> / {row.assignedCoursesCount} completed</Span>
                </td>

                {/* Completion Progress Bar */}
                <td className="px-4 py-4">
                  <div className="flex w-32 flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <Span className="font-bold text-slate-700">{row.completionPercentage}%</Span>
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
                </td>

                {/* Average Marks */}
                <td className="px-4 py-4 text-center">
                  {row.averageMarks !== null ? (
                    <Span className="font-bold text-slate-900">{row.averageMarks}</Span>
                  ) : (
                    <Span className="text-slate-400">—</Span>
                  )}
                </td>

                {/* Submissions & On-time Rate */}
                <td className="px-4 py-4 text-center">
                  <div className="flex flex-col items-center">
                    <Span className="font-bold text-slate-800">{row.totalSubmissions}</Span>
                    <Span className="text-xs font-semibold text-emerald-600">
                      {row.onTimeRate}% on-time
                    </Span>
                  </div>
                </td>

                {/* Overdue Count */}
                <td className="px-4 py-4 text-center">
                  {row.overdueCount > 0 ? (
                    <Span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
                      {row.overdueCount} overdue
                    </Span>
                  ) : (
                    <Span className="text-xs text-slate-400">0</Span>
                  )}
                </td>

                {/* Latest Grade Badge */}
                <td className="px-6 py-4 text-center">
                  {row.latestGrade ? (
                    <Span className="inline-block w-8 rounded border border-blue-200 bg-blue-50 py-0.5 text-center text-xs font-bold text-blue-700">
                      {row.latestGrade}
                    </Span>
                  ) : (
                    <Span className="text-xs text-slate-400">—</Span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationControls
        page={page}
        limit={limit}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        itemLabel="mentees"
      />
    </div>
  );
}

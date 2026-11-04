import React from 'react';

import { PaginationControls } from '@/components/patterns/PaginationControls';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
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

function PerformanceTableSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={`perf-skel-${i}`} className="h-16">
          <TableCell className="w-[22%] px-6 py-4">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-3 w-40 rounded-md" />
            </div>
          </TableCell>
          <TableCell className="w-[12%] px-4 py-4">
            <Skeleton className="h-5 w-20 rounded-md" />
          </TableCell>
          <TableCell className="w-[14%] px-4 py-4">
            <Skeleton className="h-4 w-24 rounded-md" />
          </TableCell>
          <TableCell className="w-[14%] px-4 py-4">
            <div className="flex w-32 flex-col gap-1.5">
              <Skeleton className="h-3 w-10 rounded-md" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          </TableCell>
          <TableCell className="w-[10%] px-4 py-4 text-center">
            <Skeleton className="mx-auto h-4 w-12 rounded-md" />
          </TableCell>
          <TableCell className="w-[10%] px-4 py-4 text-center">
            <div className="flex flex-col items-center gap-1">
              <Skeleton className="h-4 w-10 rounded-md" />
              <Skeleton className="h-3 w-14 rounded-md" />
            </div>
          </TableCell>
          <TableCell className="w-[8%] px-4 py-4 text-center">
            <Skeleton className="mx-auto h-4 w-8 rounded-md" />
          </TableCell>
          <TableCell className="w-[10%] px-6 py-4 text-center">
            <Skeleton className="mx-auto h-6 w-10 rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
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

  const isTableLoading = isLoading || isFetching;

  return (
    <TableContainer className="rounded-3xl border border-slate-200 bg-white shadow-xs">
      <Table className="table-fixed text-left text-xs text-slate-600">
        <TableHeader className="border-b border-slate-200 bg-slate-50/75 text-xs font-bold tracking-wider text-slate-500 uppercase">
          <TableRow>
            <TableHead scope="col" className="w-[22%] px-6 py-3.5">
              Mentee
            </TableHead>
            <TableHead scope="col" className="w-[12%] px-4 py-3.5">
              Batch
            </TableHead>
            <TableHead scope="col" className="w-[14%] px-4 py-3.5">
              Courses
            </TableHead>
            <TableHead scope="col" className="w-[14%] px-4 py-3.5">
              Completion
            </TableHead>
            <TableHead scope="col" className="w-[10%] px-4 py-3.5 text-center">
              Avg Score
            </TableHead>
            <TableHead scope="col" className="w-[10%] px-4 py-3.5 text-center">
              Submissions
            </TableHead>
            <TableHead scope="col" className="w-[8%] px-4 py-3.5 text-center">
              Overdue
            </TableHead>
            <TableHead scope="col" className="w-[10%] px-6 py-3.5 text-center">
              Grade
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-100">
          {isTableLoading ? (
            <PerformanceTableSkeleton count={limit} />
          ) : mentees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-12 text-center">
                <P className="text-sm font-semibold text-slate-800">No Mentees Found</P>
                <P className="mt-1 text-xs text-slate-500">
                  No performance records match your current filter selection.
                </P>
              </TableCell>
            </TableRow>
          ) : (
            mentees.map((row) => (
              <TableRow key={row.menteeId} className="transition-colors hover:bg-slate-50/60">
                {/* Mentee Identity */}
                <TableCell className="w-[22%] px-6 py-4">
                  <div className="flex flex-col">
                    <Span className="font-semibold text-slate-900">{row.menteeName}</Span>
                    <Span className="text-xs text-slate-500">{row.menteeEmail}</Span>
                  </div>
                </TableCell>

                {/* Batch Name */}
                <TableCell className="w-[12%] px-4 py-4">
                  <Span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {row.batchName ?? 'Unbatched'}
                  </Span>
                </TableCell>

                {/* Courses Count */}
                <TableCell className="w-[14%] px-4 py-4">
                  <Span className="font-bold text-slate-800">{row.completedCoursesCount}</Span>
                  <Span className="text-slate-400"> / {row.assignedCoursesCount} completed</Span>
                </TableCell>

                {/* Completion Progress Bar */}
                <TableCell className="w-[14%] px-4 py-4">
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
                </TableCell>

                {/* Average Marks */}
                <TableCell className="w-[10%] px-4 py-4 text-center">
                  {row.averageMarks !== null ? (
                    <Span className="font-bold text-slate-900">{row.averageMarks}</Span>
                  ) : (
                    <Span className="text-slate-400">—</Span>
                  )}
                </TableCell>

                {/* Submissions & On-time Rate */}
                <TableCell className="w-[10%] px-4 py-4 text-center">
                  <div className="flex flex-col items-center">
                    <Span className="font-bold text-slate-800">{row.totalSubmissions}</Span>
                    <Span className="text-xs font-semibold text-emerald-600">
                      {row.onTimeRate}% on-time
                    </Span>
                  </div>
                </TableCell>

                {/* Overdue Count */}
                <TableCell className="w-[8%] px-4 py-4 text-center">
                  {row.overdueCount > 0 ? (
                    <Span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
                      {row.overdueCount} overdue
                    </Span>
                  ) : (
                    <Span className="text-xs text-slate-400">0</Span>
                  )}
                </TableCell>

                {/* Latest Grade Badge */}
                <TableCell className="w-[10%] px-6 py-4 text-center">
                  {row.latestGrade ? (
                    <Span className="inline-block w-8 rounded border border-blue-200 bg-blue-50 py-0.5 text-center text-xs font-bold text-blue-700">
                      {row.latestGrade}
                    </Span>
                  ) : (
                    <Span className="text-xs text-slate-400">—</Span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <PaginationControls
        page={page}
        limit={limit}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        isLoading={isTableLoading}
        itemLabel="mentees"
      />
    </TableContainer>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import { AllocationStatusBadge } from '@/components/app/allocations/AllocationStatusBadge';
import { MENTEE_PROGRESS_NAV } from '@/components/app/navigation/portal-nav.config';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { DebouncedSearchInput } from '@/components/patterns/DebouncedSearchInput';
import { PaginationControls } from '@/components/patterns/PaginationControls';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { MultiSelectDropdown, type MultiSelectOption } from '@/components/ui/MultiSelectDropdown';
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
import { H3, P, Span } from '@/components/ui/Typography';
import {
  AllocationDisplayStatus,
  type AllocationFilters,
  type CourseAllocation,
  CourseAllocationStatus,
  isTerminalAllocationStatus,
  useAllocationsList,
} from '@/hooks/useAllocations';
import { useAuth } from '@/hooks/useAuth';

const STATUS_FILTER_OPTIONS: readonly MultiSelectOption[] = [
  { value: CourseAllocationStatus.ASSIGNED, label: AllocationDisplayStatus.ASSIGNED },
  { value: CourseAllocationStatus.IN_PROGRESS, label: AllocationDisplayStatus.IN_PROGRESS },
  { value: 'OVERDUE', label: AllocationDisplayStatus.OVERDUE },
  { value: CourseAllocationStatus.COMPLETED, label: AllocationDisplayStatus.COMPLETED },
];

export function MenteeProgressView() {
  const router = useRouter();
  const { user } = useAuth();

  // 1. Filter & Pagination State
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // 2. Paginated & Filtered Query for the Table
  const queryFilters: AllocationFilters = useMemo(
    () => ({
      menteeId: user?.id,
      page,
      limit,
      search: search.trim() || undefined,
      statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }),
    [user?.id, page, limit, search, selectedStatuses],
  );

  const {
    data: allocationsData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAllocationsList(queryFilters);

  const isTableLoading = isLoading || isFetching;

  const allocations = useMemo<readonly CourseAllocation[]>(
    () => allocationsData?.items ?? [],
    [allocationsData],
  );

  const pagination = useMemo(
    () =>
      allocationsData?.pagination ?? {
        page,
        limit,
        total: allocations.length,
        totalPages: Math.ceil(allocations.length / limit) || 1,
      },
    [allocationsData, page, limit, allocations.length],
  );

  // 3. Action Handlers
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusChange = (vals: string[]) => {
    setSelectedStatuses(vals);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedStatuses([]);
    setPage(1);
  };

  const hasActiveFilters = Boolean(search.trim() || selectedStatuses.length > 0);

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F8FC] text-[#111827] antialiased">
      <Header {...MENTEE_PROGRESS_NAV} />
      <DashboardContent className="space-y-6">
        {/* Filter Bar (Search + Admin-style Status + Clear) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* 1. Debounced Search (Course, Batch, or Status) */}
          <div className="w-full sm:max-w-md">
            <DebouncedSearchInput
              value={search}
              onSearchChange={handleSearchChange}
              placeholder="Search by course, batch, or status..."
              className="w-full"
            />
          </div>

          {/* 2. Admin-Styled Status Filter (MultiSelectDropdown) */}
          <div className="w-full sm:w-48">
            <MultiSelectDropdown
              label="Status"
              options={STATUS_FILTER_OPTIONS}
              selectedValues={selectedStatuses}
              onChange={handleStatusChange}
              singleSelect={false}
              align="left"
              className="w-full"
            />
          </div>

          {/* 3. Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              title="Clear all filters"
              aria-label="Clear all filters"
              className="h-10 w-10 shrink-0 rounded-full border border-red-200/60 bg-[#FEE2E2] p-0 text-[#DC2626] transition-all hover:bg-[#FCD2D2] hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          )}
        </div>

        {/* Error Banner */}
        {isError && (
          <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-xs">
            <ErrorMessage
              error={error}
              title="Failed to load course progress telemetry"
              onRetry={() => void refetch()}
            />
          </div>
        )}

        {/* Progress Telemetry Data Table */}
        <TableContainer className="rounded-2xl border border-[#E1E6EC] bg-white shadow-xs">
          <Table className="w-full table-fixed text-left text-sm text-[#111827]">
            <TableHeader className="border-b border-[#E1E6EC] bg-[#F6F8FC] font-semibold text-[#667085]">
              <TableRow>
                <TableHead className="w-[28%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]">
                  Course
                </TableHead>
                <TableHead className="w-[20%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]">
                  Batch
                </TableHead>
                <TableHead className="w-[14%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]">
                  Due Date
                </TableHead>
                <TableHead className="w-[18%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]">
                  Progress
                </TableHead>
                <TableHead className="w-[14%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]">
                  Status
                </TableHead>
                <TableHead className="w-[6%] px-4 py-3.5 text-center text-xs font-semibold text-[#667085]">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-[#F2F4F7]">
              {isTableLoading ? (
                Array.from({ length: limit }).map((_, idx) => (
                  <TableRow key={`tracker-skel-${idx}`} className="animate-pulse">
                    <TableCell className="w-[28%] px-4 py-4">
                      <Skeleton className="h-4 w-44 rounded-md" />
                    </TableCell>
                    <TableCell className="w-[20%] px-4 py-4">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32 rounded-md" />
                        <Skeleton className="h-3 w-20 rounded-md" />
                      </div>
                    </TableCell>
                    <TableCell className="w-[14%] px-4 py-4">
                      <Skeleton className="h-4 w-20 rounded-md" />
                    </TableCell>
                    <TableCell className="w-[18%] px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-2 w-20 rounded-full" />
                        <Skeleton className="h-3 w-8 rounded-md" />
                      </div>
                    </TableCell>
                    <TableCell className="w-[14%] px-4 py-4">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="w-[6%] px-4 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <Skeleton className="h-5 w-5 rounded" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : allocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-5 py-14 text-center">
                    <div className="mx-auto max-w-sm space-y-2">
                      <Span className="text-3xl">📚</Span>
                      <H3 className="text-base font-bold text-[#111827]">
                        No Enrolled Courses Found
                      </H3>
                      <P className="text-xs text-[#667085]">
                        {hasActiveFilters
                          ? 'No course allocations match your current search and filter parameters.'
                          : 'You are not currently allocated to any curriculum tracks. Your mentor will assign courses shortly.'}
                      </P>
                      {hasActiveFilters && (
                        <div className="pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleClearFilters}
                          >
                            Clear Filters
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                allocations.map((alloc, idx) => {
                  const isCompleted = alloc.status === 'COMPLETED';
                  const isClosed = isTerminalAllocationStatus(alloc.status) && !isCompleted;
                  const isOverdue = Boolean(alloc.isOverdue) && !isCompleted && !isClosed;
                  const rowKey = alloc.id ? `${alloc.id}-${idx}` : `alloc-row-${idx}`;

                  return (
                    <TableRow
                      key={rowKey}
                      onClick={() => router.push(`/mentee/courses/${alloc.id}`)}
                      className="cursor-pointer transition-colors hover:bg-slate-50/70"
                    >
                      {/* 1. Course Name (truncated with full name on hover) */}
                      <TableCell className="w-[28%] px-4 py-4 align-middle">
                        <H3
                          title={alloc.course?.title ?? 'Untitled Course'}
                          className="truncate text-base font-semibold text-[#111827]"
                        >
                          {alloc.course?.title ?? 'Untitled Course'}
                        </H3>
                      </TableCell>

                      {/* 2. Batch Cohort & Code */}
                      <TableCell className="w-[20%] px-4 py-4 align-middle">
                        <div className="space-y-0.5">
                          <Span
                            title={alloc.batch?.name ?? 'Individual Allocation'}
                            className="block truncate text-sm font-semibold text-[#111827]"
                          >
                            {alloc.batch?.name ?? 'Individual Allocation'}
                          </Span>
                          <Span
                            title={alloc.batch?.code ?? 'Core Track'}
                            className="block truncate text-xs text-[#667085]"
                          >
                            {alloc.batch?.code ?? 'Core Track'}
                          </Span>
                        </div>
                      </TableCell>

                      {/* 3. Due Date */}
                      <TableCell className="w-[14%] px-4 py-4 align-middle">
                        <Span className="block text-sm font-medium text-[#111827]">
                          {new Date(alloc.dueDate).toLocaleDateString()}
                        </Span>
                      </TableCell>

                      {/* 4. Progress Bar & Percentage */}
                      <TableCell className="w-[18%] px-4 py-4 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-[#E1E6EC]">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isCompleted
                                  ? 'bg-emerald-500'
                                  : isOverdue
                                    ? 'bg-rose-500'
                                    : 'bg-[#0044D3]'
                              }`}
                              style={{
                                width: `${Math.min(100, Math.max(0, alloc.progressPercent))}%`,
                              }}
                            />
                          </div>
                          <Span
                            className={`text-xs font-bold ${
                              isCompleted
                                ? 'text-emerald-700'
                                : isOverdue
                                  ? 'text-rose-600'
                                  : 'text-[#0044D3]'
                            }`}
                          >
                            {alloc.progressPercent}%
                          </Span>
                        </div>
                      </TableCell>

                      {/* 5. Status Badge */}
                      <TableCell className="w-[14%] px-4 py-4 align-middle">
                        <AllocationStatusBadge status={alloc.status} isOverdue={isOverdue} />
                      </TableCell>

                      {/* 6. Action: Eye Icon Link */}
                      <TableCell className="w-[6%] px-4 py-4 text-center align-middle">
                        <div className="flex items-center justify-center">
                          <Link
                            href={`/mentee/courses/${alloc.id}`}
                            onClick={(e) => e.stopPropagation()}
                            title={
                              isCompleted
                                ? 'Review Syllabus'
                                : isClosed
                                  ? 'View Syllabus'
                                  : 'Continue Learning'
                            }
                            aria-label={`${isCompleted ? 'Review Syllabus' : 'Continue Learning'} for ${alloc.course?.title ?? 'course'}`}
                            className="inline-flex p-1 text-slate-400 transition-colors hover:text-[#0044D3] focus-visible:text-[#0044D3] focus-visible:outline-none"
                          >
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.75}
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 4. Pagination Controls (10 items / page default) */}
        {pagination.total > 0 && (
          <div className="mt-4">
            <PaginationControls
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={(newPage) => setPage(newPage)}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
              itemLabel="courses"
              pageSizeOptions={[10, 20, 50]}
              isLoading={isTableLoading}
            />
          </div>
        )}
      </DashboardContent>
    </div>
  );
}

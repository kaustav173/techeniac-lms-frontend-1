'use client';

import Link from 'next/link';
import React, { useCallback, useMemo, useState } from 'react';

import { AllocationStatusBadge } from '@/components/app/allocations/AllocationStatusBadge';
import { MENTEE_COURSES_NAV } from '@/components/app/navigation/portal-nav.config';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { DebouncedSearchInput } from '@/components/patterns/DebouncedSearchInput';
import { PaginationControls } from '@/components/patterns/PaginationControls';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { MultiSelectDropdown, type MultiSelectOption } from '@/components/ui/MultiSelectDropdown';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tooltip } from '@/components/ui/Tooltip';
import { H3, P, Span } from '@/components/ui/Typography';
import {
  type CourseAllocation,
  CourseAllocationStatus,
  isTerminalAllocationStatus,
  useAllocationsList,
} from '@/hooks/useAllocations';
import { useAuth } from '@/hooks/useAuth';
import { usePrefetchCourse } from '@/hooks/useCourses';
import { useHoverPrefetch } from '@/hooks/useHoverPrefetch';
import { usePrefetchAllocationProgress } from '@/hooks/useProgress';
import { formatDateDMY } from '@/lib/date';

const COURSE_STATUS_OPTIONS: MultiSelectOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'completed', label: 'Completed' },
  { value: 'closed', label: 'Closed' },
];

const COURSE_GRID_CLASS =
  'grid grid-cols-1 items-stretch gap-6 @min-[33rem]:grid-cols-2 @min-[50rem]:grid-cols-3';

const MAX_DESCRIPTION_CHARS = 90;
const DEFAULT_COURSE_DESCRIPTION =
  'Structured learning modules, milestone task submissions, and topic reviews.';

function truncateDescription(text: string, maxChars = MAX_DESCRIPTION_CHARS): string {
  const normalized = text.trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars).trimEnd()}...`;
}

export function MenteeCoursesSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div>
      <div className="flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-11 w-full rounded-xl sm:w-96 lg:w-[492px]" />
          <Skeleton className="h-11 w-[140px] rounded-xl" />
        </div>
      </div>
      <div className={`mt-6 ${COURSE_GRID_CLASS}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={`course-skel-${idx}`}
            className="flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-5"
          >
            <div>
              {/* Top Header: Badge & Status */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              {/* Title */}
              <Skeleton className="mt-3.5 h-6 w-3/4 rounded-md" />
              {/* Description: 2 lines */}
              <div className="mt-1.5 min-h-[2.75rem] space-y-1.5">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-4/5 rounded-md" />
              </div>
              {/* Progress Bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-14 rounded-md" />
                  <Skeleton className="h-3.5 w-8 rounded-md" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
              {/* Metadata Row */}
              <div className="mt-4 flex items-center justify-between">
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-4 w-28 rounded-md" />
              </div>
            </div>
            {/* Footer */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#E1E6EC] pt-3.5">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
      <div className="relative z-30 mt-8 flex items-center justify-between rounded-2xl border border-[#E1E6EC] bg-white px-6 py-4 shadow-xs">
        <Skeleton className="h-4 w-32 rounded-md" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function MenteeCoursesView() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const backendStatuses = useMemo(() => {
    if (selectedStatuses.length === 0) return undefined;
    const list: (CourseAllocationStatus | 'OVERDUE')[] = [];
    if (selectedStatuses.includes('active')) {
      list.push(CourseAllocationStatus.ASSIGNED, CourseAllocationStatus.IN_PROGRESS);
    }
    if (selectedStatuses.includes('overdue')) {
      list.push('OVERDUE');
    }
    if (selectedStatuses.includes('completed')) {
      list.push(CourseAllocationStatus.COMPLETED);
    }
    if (selectedStatuses.includes('closed')) {
      list.push(
        CourseAllocationStatus.REVOKED,
        CourseAllocationStatus.CLOSED_ROLE_CHANGE,
        CourseAllocationStatus.CLOSED_BATCH_CHANGE,
      );
    }
    return list.length > 0 ? list : undefined;
  }, [selectedStatuses]);

  const isOverdueSelected = selectedStatuses.includes('overdue');

  const { data, isLoading, isFetching, isError, error, refetch } = useAllocationsList({
    menteeId: user?.id,
    page,
    limit,
    search: search.trim() || undefined,
    statuses: backendStatuses,
    isOverdue: isOverdueSelected ? true : undefined,
  });

  const rawAllocations = data?.items;
  const allocations = useMemo(() => {
    const items = rawAllocations ?? [];
    const seen = new Set<string>();
    const unique: CourseAllocation[] = [];
    for (const item of items) {
      if (item?.id) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          unique.push(item);
        }
      } else {
        unique.push(item);
      }
    }
    return unique;
  }, [rawAllocations]);

  const total = data?.pagination.total ?? allocations.length;
  const totalPages = data?.pagination.totalPages ?? Math.max(1, Math.ceil(total / limit));

  const hasActiveFilters = search.trim() !== '' || selectedStatuses.length > 0;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (values: string[]) => {
    setSelectedStatuses(values);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedStatuses([]);
    setPage(1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F8FC] text-[#111827] antialiased">
      <Header {...MENTEE_COURSES_NAV} />

      <DashboardContent className="animate-slide-up @container space-y-6">
        {isLoading ? (
          <MenteeCoursesSkeleton count={limit} />
        ) : (
          <>
            {/* Search & Status Filter Toolbar (Admin Style) */}
            <div className="flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <div className="w-full sm:w-96 lg:w-[492px]">
                  <DebouncedSearchInput
                    value={search}
                    onSearchChange={handleSearchChange}
                    placeholder="Search courses..."
                  />
                </div>

                <MultiSelectDropdown
                  label="Status"
                  options={COURSE_STATUS_OPTIONS}
                  selectedValues={selectedStatuses}
                  onChange={handleStatusChange}
                  align="left"
                  buttonClassName="bg-white hover:bg-slate-50/70"
                  menuClassName="w-[159px] min-w-[159px] sm:min-w-[159px] sm:max-w-[160px]"
                />

                {hasActiveFilters ? (
                  <Tooltip content="Clear all filters" side="bottom">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      aria-label="Clear all filters"
                      className="h-8.5 w-8.5 rounded-full border border-red-200 bg-red-50 p-0 text-red-600 shadow-2xs transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </Button>
                  </Tooltip>
                ) : null}
              </div>
            </div>

            {/* Courses Minimal Grid */}
            <div className="mt-6">
              {isError ? (
                <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-xs">
                  <ErrorMessage
                    error={error}
                    onRetry={() => {
                      void refetch();
                    }}
                  />
                </div>
              ) : allocations.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#E1E6EC] bg-white p-8 text-center">
                  <H3 className="text-base font-bold text-[#111827]">No allocated courses found</H3>
                  <P className="mt-1 max-w-sm text-xs text-[#667085]">
                    {hasActiveFilters
                      ? 'Try modifying your search query or status filter.'
                      : 'You have no courses allocated at the moment.'}
                  </P>
                </div>
              ) : (
                <div className={COURSE_GRID_CLASS}>
                  {allocations.map((alloc, idx) => (
                    <MenteeAllocationCard key={alloc.id} allocation={alloc} index={idx} />
                  ))}
                </div>
              )}

              {/* Attached Pagination Controls */}
              {total > 0 ? (
                <div className="relative z-30 mt-8 overflow-hidden rounded-2xl border border-[#E1E6EC] bg-white shadow-xs">
                  <PaginationControls
                    page={page}
                    limit={limit}
                    total={total}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    onLimitChange={(newLimit) => {
                      setLimit(newLimit);
                      setPage(1);
                    }}
                    pageSizeOptions={[10, 20, 50]}
                    itemLabel="courses"
                    isLoading={isLoading || isFetching}
                    className="border-t-0"
                  />
                </div>
              ) : null}
            </div>
          </>
        )}
      </DashboardContent>
    </div>
  );
}

function MenteeAllocationCard({
  allocation,
  index = 0,
}: Readonly<{ allocation: CourseAllocation; index?: number }>) {
  const prefetchProgress = usePrefetchAllocationProgress();
  const prefetchCourse = usePrefetchCourse();
  const isCompleted = allocation.status === 'COMPLETED';
  const isRevokedOrClosed = isTerminalAllocationStatus(allocation.status) && !isCompleted;
  const isOverdue = Boolean(allocation.isOverdue) && !isCompleted && !isRevokedOrClosed;

  const formattedDueDate = allocation.dueDate ? formatDateDMY(allocation.dueDate) : 'No deadline';
  const rawDescription = allocation.course?.description?.trim() || DEFAULT_COURSE_DESCRIPTION;
  const truncatedDescription = truncateDescription(rawDescription);

  const prefetchCourseProgress = useCallback(() => {
    prefetchProgress(allocation.id);
    prefetchCourse(allocation.courseId);
  }, [allocation.courseId, allocation.id, prefetchCourse, prefetchProgress]);

  const { getHoverHandlers } = useHoverPrefetch();
  const hoverProps = getHoverHandlers(prefetchCourseProgress);
  const staggerClass = index < 6 ? `stagger-${index + 1}` : '';

  const actionLabel = isRevokedOrClosed ? 'View syllabus' : isCompleted ? 'Review' : 'Continue';

  return (
    <div
      className={`group animate-slide-up ${staggerClass} relative flex flex-col justify-between rounded-2xl border border-[#0044D3]/40 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0044D3] hover:shadow-md ${
        isOverdue ? 'ring-1 ring-rose-200' : isCompleted ? 'ring-1 ring-emerald-200' : ''
      }`}
    >
      <div>
        {/* Top Header: Badge & Status */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Span className="inline-block max-w-full rounded-full bg-[#F6F8FC] px-2.5 py-0.5 text-xs font-medium wrap-anywhere text-[#0044D3]">
            {allocation.batch ? allocation.batch.name : 'Individual Track'}
          </Span>
          <AllocationStatusBadge status={allocation.status} isOverdue={isOverdue} />
        </div>

        {/* Title (Stretched Link making the whole card clickable) & Description */}
        <Link
          href={`/mentee/courses/${allocation.id}`}
          {...hoverProps}
          className="mt-3.5 block after:absolute after:inset-0 after:rounded-2xl focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-[#0044D3]"
        >
          <H3 className="line-clamp-2 text-base font-bold wrap-anywhere text-[#111827] transition-colors group-hover:text-[#0044D3]">
            {allocation.course?.title ?? 'Course Track'}
          </H3>
        </Link>
        <P className="mt-1.5 line-clamp-2 min-h-[2.75rem] text-sm leading-relaxed text-[#667085]">
          {truncatedDescription}
        </P>

        {/* Minimal Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <Span className="font-medium text-[#667085]">Progress</Span>
            <Span
              className={
                isCompleted
                  ? 'font-semibold text-emerald-600'
                  : isOverdue
                    ? 'font-semibold text-rose-600'
                    : 'font-semibold text-[#0044D3]'
              }
            >
              {allocation.progressPercent}%
            </Span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F6F8FC]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCompleted ? 'bg-emerald-500' : isOverdue ? 'bg-rose-500' : 'bg-[#0044D3]'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, allocation.progressPercent))}%` }}
            />
          </div>
        </div>

        {/* Metadata Row */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#667085]">
          <div className="flex items-center gap-1.5">
            <svg
              className="h-4 w-4 shrink-0 text-[#667085]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5V12l3 1.75" />
            </svg>
            <Span>
              {allocation.estimatedMinutes != null
                ? `${Math.floor(allocation.estimatedMinutes / 60)}h ${allocation.estimatedMinutes % 60}m`
                : 'Self-paced'}
            </Span>
          </div>

          <div className="flex items-center gap-1.5 font-medium text-[#111827]">
            <svg
              className="h-4 w-4 shrink-0 text-[#667085]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="16" rx="2.5" />
              <path strokeLinecap="round" d="M16 3v4M8 3v4M3 10h18" />
            </svg>
            <Span>Due {formattedDueDate}</Span>
          </div>
        </div>
      </div>

      {/* Minimal Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#E1E6EC] pt-3.5">
        <Link
          href={`/mentee/assignments?courseId=${allocation.courseId}`}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 inline-flex items-center text-xs font-semibold text-[#667085] transition-colors hover:text-[#0044D3] hover:underline"
        >
          <Span>Assignments</Span>
        </Link>

        <Span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
            isRevokedOrClosed
              ? 'text-[#667085]'
              : isCompleted
                ? 'text-emerald-700'
                : 'text-[#0044D3]'
          }`}
        >
          <Span>{actionLabel}</Span>
          <svg
            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </Span>
      </div>
    </div>
  );
}

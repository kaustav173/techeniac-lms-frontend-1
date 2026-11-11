'use client';

import Link from 'next/link';
import React, { useCallback, useMemo, useState } from 'react';

import { AllocationStatusBadge } from '@/components/app/allocations/AllocationStatusBadge';
import { MENTEE_COURSES_NAV } from '@/components/app/navigation/portal-nav.config';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { DebouncedSearchInput } from '@/components/patterns/DebouncedSearchInput';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { MultiSelectDropdown, type MultiSelectOption } from '@/components/ui/MultiSelectDropdown';
import { Skeleton } from '@/components/ui/Skeleton';
import { H3, P, Span } from '@/components/ui/Typography';
import {
  type CourseAllocation,
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
  { value: 'completed', label: 'Completed' },
  { value: 'closed', label: 'Closed' },
];

const MAX_DESCRIPTION_CHARS = 90;
const DEFAULT_COURSE_DESCRIPTION =
  'Structured learning modules, milestone task submissions, and topic reviews.';

function truncateDescription(text: string, maxChars = MAX_DESCRIPTION_CHARS): string {
  const normalized = text.trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars).trimEnd()}...`;
}

export function MenteeCoursesSkeleton() {
  return (
    <div>
      <div className="flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-11 w-full rounded-xl sm:w-96 lg:w-[492px]" />
          <Skeleton className="h-11 w-[140px] rounded-xl" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={`course-skel-${idx}`}
            className="flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-5"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="mt-3.5 h-5 w-44 rounded-md" />
              <div className="mt-2 space-y-1.5">
                <Skeleton className="h-3.5 w-full rounded-md" />
                <Skeleton className="h-3.5 w-4/5 rounded-md" />
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-14 rounded-md" />
                  <Skeleton className="h-3 w-8 rounded-md" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Skeleton className="h-3.5 w-16 rounded-md" />
                <Skeleton className="h-3.5 w-24 rounded-md" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#E1E6EC] pt-3.5">
              <Skeleton className="h-3.5 w-20 rounded-md" />
              <Skeleton className="h-3.5 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MenteeCoursesView() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['active']);

  const { data, isLoading, isError, error, refetch } = useAllocationsList({
    menteeId: user?.id,
    limit: 100,
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

  const filteredAllocations = useMemo(() => {
    return allocations.filter((alloc) => {
      // Search filter
      const title = alloc.course?.title?.toLowerCase() ?? '';
      const batchName = alloc.batch?.name?.toLowerCase() ?? '';
      const term = search.toLowerCase().trim();
      const matchesSearch = !term || title.includes(term) || batchName.includes(term);

      if (!matchesSearch) return false;

      // Status dropdown filter
      if (selectedStatuses.length === 0) return true;
      const matchesActive =
        selectedStatuses.includes('active') &&
        (alloc.status === 'ASSIGNED' || alloc.status === 'IN_PROGRESS');
      const matchesCompleted =
        selectedStatuses.includes('completed') && alloc.status === 'COMPLETED';
      const matchesClosed =
        selectedStatuses.includes('closed') &&
        isTerminalAllocationStatus(alloc.status) &&
        alloc.status !== 'COMPLETED';

      return matchesActive || matchesCompleted || matchesClosed;
    });
  }, [allocations, search, selectedStatuses]);

  const hasActiveFilters = search.trim() !== '' || selectedStatuses.length > 0;

  const handleClearFilters = () => {
    setSearch('');
    setSelectedStatuses([]);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F8FC] text-[#111827] antialiased">
      <Header {...MENTEE_COURSES_NAV} />

      <DashboardContent>
        {isLoading ? (
          <MenteeCoursesSkeleton />
        ) : (
          <>
            {/* Search & Status Filter Toolbar (Admin Style) */}
            <div className="flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <div className="w-full sm:w-96 lg:w-[492px]">
                  <DebouncedSearchInput
                    value={search}
                    onSearchChange={setSearch}
                    placeholder="Search courses..."
                  />
                </div>

                <MultiSelectDropdown
                  label="Status"
                  options={COURSE_STATUS_OPTIONS}
                  selectedValues={selectedStatuses}
                  onChange={setSelectedStatuses}
                  align="left"
                />

                {hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    title="Clear all filters"
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
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
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
              ) : filteredAllocations.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#E1E6EC] bg-white p-8 text-center">
                  <H3 className="text-base font-bold text-[#111827]">No allocated courses found</H3>
                  <P className="mt-1 max-w-sm text-xs text-[#667085]">
                    {hasActiveFilters
                      ? 'Try modifying your search query or status filter.'
                      : 'You have no courses allocated at the moment.'}
                  </P>
                </div>
              ) : (
                <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredAllocations.map((alloc) => (
                    <MenteeAllocationCard key={alloc.id} allocation={alloc} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DashboardContent>
    </div>
  );
}

function MenteeAllocationCard({ allocation }: Readonly<{ allocation: CourseAllocation }>) {
  const prefetchProgress = usePrefetchAllocationProgress();
  const prefetchCourse = usePrefetchCourse();
  const isCompleted = allocation.status === 'COMPLETED';
  const isRevokedOrClosed = isTerminalAllocationStatus(allocation.status) && !isCompleted;
  const isOverdue = Boolean(allocation.isOverdue) && !isCompleted && !isRevokedOrClosed;

  const formattedDueDate = formatDateDMY(allocation.dueDate);
  const rawDescription = allocation.course?.description?.trim() || DEFAULT_COURSE_DESCRIPTION;
  const truncatedDescription = truncateDescription(rawDescription);

  const prefetchCourseProgress = useCallback(() => {
    prefetchProgress(allocation.id);
    prefetchCourse(allocation.courseId);
  }, [allocation.courseId, allocation.id, prefetchCourse, prefetchProgress]);

  const { getHoverHandlers } = useHoverPrefetch();
  const hoverProps = getHoverHandlers(prefetchCourseProgress);

  const actionLabel = isRevokedOrClosed ? 'View syllabus' : isCompleted ? 'Review' : 'Continue';

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
        isOverdue
          ? 'border border-rose-200 hover:border-rose-300'
          : isCompleted
            ? 'border border-emerald-200 hover:border-emerald-300'
            : 'border border-[#E1E6EC] hover:border-[#0044D3]/40'
      }`}
    >
      <div>
        {/* Top Header: Badge & Status */}
        <div className="flex items-center justify-between gap-2">
          <Span className="inline-flex items-center rounded-full bg-[#F6F8FC] px-2.5 py-0.5 text-xs font-medium text-[#0044D3]">
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
          <H3 className="line-clamp-1 text-base font-bold text-[#111827] transition-colors group-hover:text-[#0044D3]">
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
        <div className="mt-4 flex items-center justify-between text-xs text-[#667085]">
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
      <div className="mt-4 flex items-center justify-between border-t border-[#E1E6EC] pt-3.5">
        <Link
          href={`/mentee/assignments?courseId=${allocation.courseId}`}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 inline-flex items-center text-xs font-semibold text-[#667085] transition-colors hover:text-[#0044D3] hover:underline"
        >
          <Span>Assignments</Span>
        </Link>

        <Span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${
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

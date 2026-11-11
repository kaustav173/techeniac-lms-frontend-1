'use client';

import Link from 'next/link';
import React, { useCallback, useMemo, useState } from 'react';

import { AllocationStatusBadge } from '@/components/app/allocations/AllocationStatusBadge';
import { MENTEE_COURSES_NAV } from '@/components/app/navigation/portal-nav.config';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { H3, P, PageTitle, Span, SubText } from '@/components/ui/Typography';
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

export function MenteeCoursesView() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'active' | 'completed' | 'closed'>('active');

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

      // Status tab filter
      if (statusTab === 'active') {
        return alloc.status === 'ASSIGNED' || alloc.status === 'IN_PROGRESS';
      }
      if (statusTab === 'completed') {
        return alloc.status === 'COMPLETED';
      }
      if (statusTab === 'closed') {
        return isTerminalAllocationStatus(alloc.status) && alloc.status !== 'COMPLETED';
      }
      return true;
    });
  }, [allocations, search, statusTab]);

  const activeCount = allocations.filter(
    (a) => a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS',
  ).length;
  const completedCount = allocations.filter((a) => a.status === 'COMPLETED').length;
  const closedCount = allocations.filter(
    (a) => isTerminalAllocationStatus(a.status) && a.status !== 'COMPLETED',
  ).length;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
      <Header {...MENTEE_COURSES_NAV} />

      <DashboardContent>
        {/* Top Header & Search Area (Stitch Screen 11570786783180349238) */}
        <div className="border-b border-slate-200 pb-6">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </Span>
                <Span className="text-xs font-bold tracking-wider text-blue-600 uppercase">
                  Cohort Curricula
                </Span>
              </div>
              <PageTitle className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                My Courses
              </PageTitle>
              <SubText className="mt-1 max-w-2xl">
                Track ongoing curriculum modules, verify milestone progress, and reference archived
                materials.
              </SubText>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Input
                type="search"
                placeholder="Search courses or cohort codes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full bg-white pl-3.5 text-xs shadow-xs"
              />
            </div>
          </div>

          {/* Segmented Tabs & Summary Strip */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex gap-1 rounded-xl border border-slate-200/80 bg-slate-100 p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStatusTab('active')}
                className={`flex h-auto items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                  statusTab === 'active'
                    ? 'bg-white text-blue-600 shadow-xs hover:bg-white hover:text-blue-600'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <Span>Active</Span>
                <Span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-800">
                  {activeCount}
                </Span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStatusTab('completed')}
                className={`flex h-auto items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                  statusTab === 'completed'
                    ? 'bg-white text-emerald-600 shadow-xs hover:bg-white hover:text-emerald-600'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <Span>Completed</Span>
                <Span className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                  {completedCount}
                </Span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStatusTab('closed')}
                className={`flex h-auto items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                  statusTab === 'closed'
                    ? 'bg-white text-slate-800 shadow-xs hover:bg-white hover:text-slate-800'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <Span>Closed</Span>
                <Span className="inline-flex items-center justify-center rounded-full bg-slate-200 px-1.5 py-0.5 text-xs font-bold text-slate-700">
                  {closedCount}
                </Span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStatusTab('all')}
                className={`flex h-auto items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                  statusTab === 'all'
                    ? 'bg-white text-slate-900 shadow-xs hover:bg-white hover:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                <Span>All Tracks</Span>
                <Span className="inline-flex items-center justify-center rounded-full bg-slate-200 px-1.5 py-0.5 text-xs font-bold text-slate-700">
                  {allocations.length}
                </Span>
              </Button>
            </div>

            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 sm:flex">
              <Span className="h-2 w-2 rounded-full bg-emerald-500" />
              <Span>All Curricula Synchronized</Span>
            </div>
          </div>
        </div>

        {/* Course Cards Grid (Stitch 3-Col Design) */}
        <div className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((idx) => (
                <div
                  key={`mentee-skel-${idx}`}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <Skeleton className="h-3 w-20 rounded-md" />
                    </div>
                  </div>
                  <div className="mt-6 space-y-2">
                    <Skeleton className="h-5 w-48 rounded-md" />
                    <Skeleton className="h-3 w-full rounded-md" />
                  </div>
                  <Skeleton className="mt-6 h-10 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-3xl border border-rose-200 bg-white p-6">
              <ErrorMessage
                error={error}
                onRetry={() => {
                  void refetch();
                }}
              />
            </div>
          ) : filteredAllocations.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Span className="text-3xl">📚</Span>
              <H3 className="mt-3 text-base font-bold text-slate-800">
                No allocated courses found
              </H3>
              <P className="mt-1 max-w-sm text-xs text-slate-500">
                {statusTab === 'active'
                  ? 'You have no active course allocations at the moment. As courses are assigned by your mentor or administrator, they will appear here.'
                  : 'No course records found in this category.'}
              </P>
            </div>
          ) : (
            <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAllocations.map((alloc, idx) => (
                <MenteeAllocationCard key={alloc.id} allocation={alloc} index={idx} />
              ))}
            </div>
          )}
        </div>
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

  const prefetchCourseProgress = useCallback(() => {
    prefetchProgress(allocation.id);
    prefetchCourse(allocation.courseId);
  }, [allocation.courseId, allocation.id, prefetchCourse, prefetchProgress]);

  const { getHoverHandlers } = useHoverPrefetch();
  const hoverProps = getHoverHandlers(prefetchCourseProgress);
  const staggerClass = index < 6 ? `stagger-${index + 1}` : '';

  return (
    <div
      className={`animate-slide-up ${staggerClass} relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
        isOverdue
          ? 'border border-rose-200 hover:border-rose-300'
          : isCompleted
            ? 'border border-emerald-200 hover:border-emerald-300'
            : 'border border-slate-200 hover:border-blue-400'
      }`}
    >
      <div>
        {/* Top Header: Badge & Status */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-600'
                  : isOverdue
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-blue-50 text-blue-600'
              }`}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <Span className="max-w-[160px] truncate text-xs font-bold tracking-wide text-blue-600 uppercase">
                {allocation.batch ? allocation.batch.name : 'Individual Track'}
              </Span>
              <Span className="text-xs text-slate-400">
                {allocation.batch?.code ?? 'Core Curriculum'}
              </Span>
            </div>
          </div>

          <AllocationStatusBadge status={allocation.status} isOverdue={isOverdue} />
        </div>

        {/* Title & Description */}
        <Link href={`/mentee/courses/${allocation.id}`} {...hoverProps} className="group">
          <H3 className="line-clamp-1 text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600">
            {allocation.course?.title ?? 'Course Track'}
          </H3>
        </Link>
        <P className="mt-1 line-clamp-2 min-h-[2rem] text-xs text-slate-500">
          Structured learning modules, milestone task submissions, and topic reviews.
        </P>

        {/* Progress Section */}
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
            <Span className="text-slate-700">Course Pace</Span>
            <Span
              className={`${
                isCompleted
                  ? 'font-bold text-emerald-600'
                  : isOverdue
                    ? 'font-bold text-rose-600'
                    : 'font-bold text-blue-600'
              }`}
            >
              {allocation.progressPercent}%
            </Span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCompleted ? 'bg-emerald-500' : isOverdue ? 'bg-rose-500' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, allocation.progressPercent))}%` }}
            />
          </div>
        </div>

        {/* Metadata Row */}
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <svg
              className="h-3.5 w-3.5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5V12l3 1.75" />
            </svg>
            <Span className="text-xs">
              {allocation.estimatedMinutes != null
                ? `${Math.floor(allocation.estimatedMinutes / 60)}h ${allocation.estimatedMinutes % 60}m est.`
                : 'Paced track'}
            </Span>
          </div>

          <div className="flex items-center justify-end gap-1.5 text-right font-medium text-slate-700">
            <svg
              className="h-3.5 w-3.5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <rect x="3" y="5" width="18" height="16" rx="2.5" />
              <path strokeLinecap="round" d="M16 3v4M8 3v4M3 10h18" />
            </svg>
            <Span className="truncate text-xs">Due {formattedDueDate}</Span>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-3">
        <Link
          href={`/mentee/assignments?courseId=${allocation.courseId}`}
          className="flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50/70 p-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
        >
          <Span>View Course Assignments →</Span>
        </Link>
        {isRevokedOrClosed ? (
          <Link
            href={`/mentee/courses/${allocation.id}`}
            {...hoverProps}
            className="flex items-center justify-center rounded-xl bg-slate-100 p-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
          >
            <Span>Course Closed • View Syllabus</Span>
          </Link>
        ) : isCompleted ? (
          <Link
            href={`/mentee/courses/${allocation.id}`}
            {...hoverProps}
            className="flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <Span>✓ Track Completed • Review Material</Span>
          </Link>
        ) : (
          <Link
            href={`/mentee/courses/${allocation.id}`}
            {...hoverProps}
            className="flex items-center justify-center rounded-xl bg-blue-600 p-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-blue-700"
          >
            <Span>Continue Learning →</Span>
          </Link>
        )}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import React, { useCallback, useMemo, useState } from 'react';

import { AllocationStatusBadge } from '@/components/app/allocations/AllocationStatusBadge';
import { MENTEE_COURSES_NAV } from '@/components/app/navigation/portal-nav.config';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { H1, H3, P, Span } from '@/components/ui/Typography';
import {
  type CourseAllocation,
  isTerminalAllocationStatus,
  useAllocationsList,
} from '@/hooks/useAllocations';
import { useAuth } from '@/hooks/useAuth';
import { usePrefetchCourse } from '@/hooks/useCourses';
import { useHoverPrefetch } from '@/hooks/useHoverPrefetch';
import { usePrefetchAllocationProgress } from '@/hooks/useProgress';

export function MenteeCoursesView() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'active' | 'completed' | 'closed'>('active');

  const { data, isLoading, isError, error, refetch } = useAllocationsList({
    menteeId: user?.id,
    limit: 100,
  });
  const rawAllocations = data?.items;
  const allocations = useMemo(() => rawAllocations ?? [], [rawAllocations]);

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

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Header & Search Area (Stitch Screen 11570786783180349238) */}
        <div className="border-b border-slate-200 pb-6">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-xs font-bold text-blue-600">
                  📚
                </Span>
                <Span className="font-mono text-xs font-bold tracking-wider text-blue-600 uppercase">
                  Cohort Curricula
                </Span>
              </div>
              <H1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                My Courses
              </H1>
              <P className="mt-1 max-w-2xl text-sm text-slate-500">
                Track ongoing curriculum modules, verify milestone progress, and reference archived
                materials with deliberate focus (M7, M8).
              </P>
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
                <Span className="inline-flex items-center justify-center rounded-full bg-slate-200 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700">
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
                <Span className="inline-flex items-center justify-center rounded-full bg-slate-200 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                  {allocations.length}
                </Span>
              </Button>
            </div>

            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs text-slate-600 sm:flex">
              <Span className="h-2 w-2 rounded-full bg-emerald-500" />
              <Span>Enrolled Curriculum Telemetry Active</Span>
            </div>
          </div>
        </div>

        {/* Course Cards Grid (Stitch 3-Col Design) */}
        <div className="mt-8">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-rose-200 bg-white p-6">
              <ErrorMessage
                error={error}
                onRetry={() => {
                  void refetch();
                }}
              />
            </div>
          ) : filteredAllocations.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
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
              {filteredAllocations.map((alloc) => (
                <MenteeAllocationCard key={alloc.id} allocation={alloc} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function MenteeAllocationCard({ allocation }: Readonly<{ allocation: CourseAllocation }>) {
  const prefetchProgress = usePrefetchAllocationProgress();
  const prefetchCourse = usePrefetchCourse();
  const isCompleted = allocation.status === 'COMPLETED';
  const isRevokedOrClosed = isTerminalAllocationStatus(allocation.status) && !isCompleted;

  const isOverdue = Boolean(allocation.isOverdue) && !isCompleted && !isRevokedOrClosed;

  const formattedDueDate = new Date(allocation.dueDate).toLocaleDateString();

  const prefetchCourseProgress = useCallback(() => {
    prefetchProgress(allocation.id);
    prefetchCourse(allocation.courseId);
  }, [allocation.courseId, allocation.id, prefetchCourse, prefetchProgress]);

  const { getHoverHandlers } = useHoverPrefetch();
  const hoverProps = getHoverHandlers(prefetchCourseProgress);

  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
        isOverdue
          ? 'border-2 border-rose-300'
          : isCompleted
            ? 'border border-emerald-200'
            : 'border-2 border-blue-600 shadow-blue-500/5'
      }`}
    >
      <div>
        {/* Top Header: Badge & Status */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-xl font-bold ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-600'
                  : isOverdue
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-blue-50 text-blue-600'
              }`}
            >
              📖
            </div>
            <div className="flex flex-col">
              <Span className="max-w-[160px] truncate font-mono text-[11px] font-bold tracking-wide text-blue-600 uppercase">
                {allocation.batch ? allocation.batch.name : 'Individual Track'}
              </Span>
              <Span className="font-mono text-xs text-slate-400">
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
              className={`font-mono ${
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
            <Span className="text-slate-400">⏱</Span>
            <Span className="font-mono text-[11px]">
              {allocation.estimatedMinutes != null
                ? `${Math.floor(allocation.estimatedMinutes / 60)}h ${allocation.estimatedMinutes % 60}m est.`
                : 'Paced track'}
            </Span>
          </div>

          <div className="flex items-center justify-end gap-1.5 text-right font-medium text-slate-700">
            <Span className="text-slate-400">📅</Span>
            <Span className="truncate font-mono text-[11px]">Due {formattedDueDate}</Span>
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

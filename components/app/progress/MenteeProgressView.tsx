'use client';

import Link from 'next/link';
import React, { useMemo } from 'react';

import { AllocationStatusBadge } from '@/components/app/allocations/AllocationStatusBadge';
import { MENTEE_PROGRESS_NAV } from '@/components/app/navigation/portal-nav.config';
import { PortalSessionState } from '@/components/app/navigation/PortalSessionState';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { getButtonClassName } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Skeleton } from '@/components/ui/Skeleton';
import { H2, H3, P, PageTitle, Span, SubText } from '@/components/ui/Typography';
import {
  type CourseAllocation,
  isTerminalAllocationStatus,
  useAllocationsList,
} from '@/hooks/useAllocations';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';

function ProgressKpi({
  label,
  value,
  subtext,
  barPercent,
  colorClass = 'text-slate-900',
}: Readonly<{
  label: string;
  value: string | number;
  subtext: string;
  barPercent?: number;
  colorClass?: string;
}>) {
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
      <div>
        <Span className="text-xs font-bold tracking-wider text-slate-400 uppercase">{label}</Span>
        <div className="mt-2 flex items-baseline gap-2">
          <H2 className={`text-2xl font-extrabold ${colorClass}`}>{value}</H2>
          <Span className="text-xs text-slate-500">{subtext}</Span>
        </div>
      </div>
      {barPercent != null && (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, barPercent))}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function MenteeProgressView() {
  const { user, isAuthorized, sessionError } = useRoleRedirect({ allowedRoles: ['MENTEE'] });
  const {
    data: allocationsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useAllocationsList({
    menteeId: user?.id,
    limit: 100,
  });

  const allocations = useMemo<readonly CourseAllocation[]>(
    () => allocationsData?.items ?? [],
    [allocationsData],
  );

  const active = useMemo(
    () => allocations.filter((a) => a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS'),
    [allocations],
  );
  const completed = useMemo(
    () => allocations.filter((a) => a.status === 'COMPLETED'),
    [allocations],
  );
  const overdue = useMemo(
    () =>
      allocations.filter((a) => {
        const isClosed = isTerminalAllocationStatus(a.status) && a.status !== 'COMPLETED';
        return Boolean(a.isOverdue) && a.status !== 'COMPLETED' && !isClosed;
      }),
    [allocations],
  );

  const averagePace = useMemo(() => {
    if (!allocations.length) return 0;
    const total = allocations.reduce((sum, a) => sum + Number(a.progressPercent || 0), 0);
    return Math.round((total / allocations.length) * 10) / 10;
  }, [allocations]);

  if (!isAuthorized || !user) {
    return (
      <PortalSessionState
        sessionError={sessionError}
        loadingMessage="Loading student progress telemetry..."
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
      <Header {...MENTEE_PROGRESS_NAV} />
      <DashboardContent className="space-y-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-xs font-bold text-blue-600">
                📈
              </Span>
              <Span className="text-xs font-bold tracking-wider text-blue-600 uppercase">
                Learner Telemetry
              </Span>
              <Span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                Student Progress
              </Span>
            </div>
            <PageTitle>Learning Progress & Milestones</PageTitle>
            <SubText className="mt-1">
              Real-time curriculum completion pace, milestone deadlines, and syllabus tracking
              (FR-8.1, FR-8.2).
            </SubText>
          </div>
          <Span className="text-xs text-slate-500">
            {allocations.length} {allocations.length === 1 ? 'Course' : 'Courses'} Allocated
          </Span>
        </div>

        {/* Telemetry KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProgressKpi
            label="Average Completion"
            value={`${averagePace}%`}
            subtext="across tracks"
            barPercent={averagePace}
          />
          <ProgressKpi
            label="Active Courses"
            value={active.length}
            subtext="in progress"
            colorClass="text-blue-600"
          />
          <ProgressKpi
            label="Completed"
            value={completed.length}
            subtext={`of ${allocations.length} total`}
            colorClass="text-emerald-600"
          />
          <ProgressKpi
            label="Cadence Status"
            value={overdue.length}
            subtext={overdue.length === 1 ? 'course overdue' : 'courses overdue'}
            colorClass={overdue.length > 0 ? 'text-rose-600' : 'text-slate-900'}
          />
        </div>

        {/* Course Breakdown Header */}
        <div>
          <H2 className="text-base font-bold text-slate-900">Enrolled Course Breakdown</H2>
          <P className="text-xs text-slate-500">
            Per-allocation completion telemetry, milestones, and syllabus access
          </P>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            <Skeleton className="h-44 w-full rounded-3xl" />
            <Skeleton className="h-44 w-full rounded-3xl" />
            <Skeleton className="h-44 w-full rounded-3xl" />
          </div>
        ) : isError ? (
          <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-xs">
            <ErrorMessage error={error} onRetry={() => void refetch()} />
          </div>
        ) : allocations.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <Span className="text-3xl">📚</Span>
            <H3 className="mt-3 text-base font-bold text-slate-800">No Course Allocations Found</H3>
            <P className="mt-1 max-w-sm text-xs text-slate-500">
              You are not currently allocated to any curriculum tracks. Your mentor or administrator
              will assign courses shortly.
            </P>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {allocations.map((alloc) => {
              const isCompleted = alloc.status === 'COMPLETED';
              const isClosed = isTerminalAllocationStatus(alloc.status) && !isCompleted;
              const isOverdue = Boolean(alloc.isOverdue) && !isCompleted && !isClosed;
              return (
                <div
                  key={alloc.id}
                  className={`flex flex-col justify-between gap-6 rounded-3xl border bg-white p-6 shadow-xs transition-all sm:flex-row sm:items-center ${
                    isOverdue
                      ? 'border-rose-200 bg-rose-50/20'
                      : isCompleted
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-slate-200'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Span className="text-xs font-bold text-blue-600 uppercase">
                        {alloc.batch?.name ?? 'Core Track'}
                      </Span>
                      <Span className="text-slate-300">•</Span>
                      <Span className="text-xs text-slate-500">
                        {alloc.batch?.code ?? 'M7 Allocation'}
                      </Span>
                      <AllocationStatusBadge status={alloc.status} isOverdue={isOverdue} />
                    </div>
                    <H3 className="mt-2 text-lg font-bold text-slate-900">
                      {alloc.course?.title ?? 'Course Track'}
                    </H3>
                    <div className="mt-4 max-w-md">
                      <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                        <Span className="text-slate-600">Course Pace</Span>
                        <Span
                          className={
                            isCompleted
                              ? 'text-emerald-700'
                              : isOverdue
                                ? 'text-rose-600'
                                : 'text-blue-600'
                          }
                        >
                          {alloc.progressPercent}%
                        </Span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : isOverdue ? 'bg-rose-500' : 'bg-blue-600'}`}
                          style={{ width: `${Math.min(100, Math.max(0, alloc.progressPercent))}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <Span className="text-xs">
                        ⏱{' '}
                        {alloc.estimatedMinutes != null
                          ? `${Math.floor(alloc.estimatedMinutes / 60)}h ${alloc.estimatedMinutes % 60}m est.`
                          : 'Self-paced'}
                      </Span>
                      <Span className="text-xs">
                        📅 Due {new Date(alloc.dueDate).toLocaleDateString()}
                      </Span>
                      {alloc.completedAt && (
                        <Span className="text-xs text-emerald-700">
                          ✓ Finished {new Date(alloc.completedAt).toLocaleDateString()}
                        </Span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-start gap-2 sm:items-end">
                    <Link
                      href={`/mentee/courses/${alloc.id}`}
                      className={getButtonClassName(isCompleted ? 'outline' : 'primary', 'sm')}
                    >
                      {isCompleted
                        ? 'Review Syllabus →'
                        : isClosed
                          ? 'View Syllabus →'
                          : 'Continue Learning →'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DashboardContent>
    </div>
  );
}

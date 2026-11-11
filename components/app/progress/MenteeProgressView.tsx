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
import { H2, H3, P, Span } from '@/components/ui/Typography';
import {
  type CourseAllocation,
  isTerminalAllocationStatus,
  useAllocationsList,
} from '@/hooks/useAllocations';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';

interface ProgressMetricCardProps {
  readonly label: string;
  readonly value: string | number;
  readonly subtext: string;
  readonly icon: React.ReactNode;
  readonly iconBgClass: string;
  readonly valueColorClass?: string | undefined;
  readonly barPercent?: number | undefined;
  readonly badgeText?: string | undefined;
  readonly badgeClass?: string | undefined;
}

function ProgressMetricCard({
  label,
  value,
  subtext,
  icon,
  iconBgClass,
  valueColorClass = 'text-[#111827]',
  barPercent,
  badgeText,
  badgeClass,
}: ProgressMetricCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0044D3]/40 hover:shadow-md">
      <div>
        <div className="flex items-center justify-between">
          <Span className="text-xs font-bold tracking-wider text-[#667085] uppercase">{label}</Span>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBgClass}`}>
            {icon}
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <H2 className={`text-3xl font-extrabold tracking-tight ${valueColorClass}`}>{value}</H2>
          {badgeText && (
            <Span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClass}`}
            >
              {badgeText}
            </Span>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-[#F2F4F7] pt-3">
        {barPercent != null ? (
          <div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E1E6EC]">
              <div
                className="h-full rounded-full bg-[#0044D3] transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, barPercent))}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[#667085]">
              <Span>{subtext}</Span>
              <Span className="font-semibold text-[#111827]">{barPercent}%</Span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-[#667085]">
            <Span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <Span>{subtext}</Span>
          </div>
        )}
      </div>
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

  const allocations = useMemo<readonly CourseAllocation[]>(() => {
    const items = allocationsData?.items ?? [];
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
  }, [allocationsData]);

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
    <div className="flex min-h-screen flex-col bg-[#F6F8FC] text-[#111827] antialiased">
      <Header {...MENTEE_PROGRESS_NAV} />
      <DashboardContent className="space-y-6">
        {/* Metric Overview Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProgressMetricCard
            label="Average Completion"
            value={`${averagePace}%`}
            subtext="Across enrolled tracks"
            barPercent={averagePace}
            iconBgClass="bg-blue-50 text-[#0044D3]"
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            }
          />
          <ProgressMetricCard
            label="Active Courses"
            value={active.length}
            subtext="In progress & learning"
            valueColorClass="text-[#0044D3]"
            badgeText={active.length > 0 ? 'Active' : undefined}
            badgeClass="bg-blue-50 text-[#0044D3] border border-blue-100"
            iconBgClass="bg-blue-50/80 text-[#0044D3]"
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            }
          />
          <ProgressMetricCard
            label="Completed Courses"
            value={completed.length}
            subtext={`Of ${allocations.length} total tracks`}
            valueColorClass="text-emerald-600"
            badgeText={completed.length > 0 ? 'Completed' : undefined}
            badgeClass="bg-emerald-50 text-emerald-700 border border-emerald-100"
            iconBgClass="bg-emerald-50 text-emerald-600"
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <ProgressMetricCard
            label="Cadence Status"
            value={overdue.length > 0 ? `${overdue.length} Overdue` : 'On Track'}
            subtext={
              overdue.length > 0
                ? `${overdue.length} ${overdue.length === 1 ? 'course requires' : 'courses require'} attention`
                : 'All deadlines on schedule'
            }
            valueColorClass={overdue.length > 0 ? 'text-rose-600' : 'text-[#111827]'}
            badgeText={overdue.length > 0 ? 'Attention' : 'On Schedule'}
            badgeClass={
              overdue.length > 0
                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }
            iconBgClass={
              overdue.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }
            icon={
              overdue.length > 0 ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              )
            }
          />
        </div>

        {/* Course Breakdown Header */}
        <div>
          <H2 className="text-base font-bold text-[#111827]">Enrolled Course Breakdown</H2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-xs">
            <ErrorMessage error={error} onRetry={() => void refetch()} />
          </div>
        ) : allocations.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#E1E6EC] bg-white p-8 text-center">
            <Span className="text-3xl">📚</Span>
            <H3 className="mt-3 text-base font-bold text-[#111827]">No Course Allocations Found</H3>
            <P className="mt-1 max-w-sm text-xs text-[#667085]">
              You are not currently allocated to any curriculum tracks. Your mentor or administrator
              will assign courses shortly.
            </P>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {allocations.map((alloc, idx) => {
              const isCompleted = alloc.status === 'COMPLETED';
              const isClosed = isTerminalAllocationStatus(alloc.status) && !isCompleted;
              const isOverdue = Boolean(alloc.isOverdue) && !isCompleted && !isClosed;
              return (
                <div
                  key={alloc.id ? `${alloc.id}-${idx}` : `alloc-${idx}`}
                  className={`flex flex-col justify-between gap-6 rounded-2xl border bg-white p-6 shadow-xs transition-all hover:border-[#0044D3]/30 sm:flex-row sm:items-center ${
                    isOverdue
                      ? 'border-rose-200 bg-rose-50/20'
                      : isCompleted
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-[#E1E6EC]'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Span className="text-xs font-bold text-[#0044D3] uppercase">
                        {alloc.batch?.name ?? 'Core Track'}
                      </Span>
                      <Span className="text-slate-300">•</Span>
                      <Span className="text-xs text-[#667085]">
                        {alloc.batch?.code ?? 'M7 Allocation'}
                      </Span>
                      <AllocationStatusBadge status={alloc.status} isOverdue={isOverdue} />
                    </div>
                    <H3 className="mt-2 text-lg font-bold text-[#111827]">
                      {alloc.course?.title ?? 'Course Track'}
                    </H3>
                    <div className="mt-4 max-w-md">
                      <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                        <Span className="text-[#667085]">Course Pace</Span>
                        <Span
                          className={
                            isCompleted
                              ? 'text-emerald-700'
                              : isOverdue
                                ? 'text-rose-600'
                                : 'text-[#0044D3]'
                          }
                        >
                          {alloc.progressPercent}%
                        </Span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E1E6EC]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : isOverdue ? 'bg-rose-500' : 'bg-[#0044D3]'}`}
                          style={{ width: `${Math.min(100, Math.max(0, alloc.progressPercent))}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#667085]">
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

'use client';

import Link from 'next/link';
import React, { useMemo } from 'react';

import { MENTEE_PORTAL_NAV } from '@/components/app/navigation/portal-nav.config';
import { PortalSessionState } from '@/components/app/navigation/PortalSessionState';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { H1, H2, H3, P, Span } from '@/components/ui/Typography';
import {
  type CourseAllocation,
  isTerminalAllocationStatus,
  useAllocationsList,
} from '@/hooks/useAllocations';
import { useMenteeBatch } from '@/hooks/useBatches';
import { useMenteeDashboard } from '@/hooks/useDashboard';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import { formatDateIST } from '@/lib/date';
import type { ApiBatchSummary } from '@/services/batches.service';

function formatDate(dateInput?: string | null): string {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

function formatDateRange(startDate?: string | null, endDate?: string | null): string {
  if (!startDate && !endDate) return '—';
  if (startDate && endDate) {
    return `${formatDate(startDate)} – ${formatDate(endDate)}`;
  }
  return formatDate(startDate || endDate);
}

function MenteeHeaderSection({
  userName,
  userEmail,
  isLoading,
  batch,
  mentor,
}: Readonly<{
  userName: string;
  userEmail: string;
  isLoading: boolean;
  batch?: ApiBatchSummary | null | undefined;
  mentor?: { id: string; name: string; email: string } | null | undefined;
}>) {
  if (isLoading) {
    return (
      <div className="mb-8 rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-44" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="h-20 w-56 rounded-xl" />
            <Skeleton className="h-20 w-56 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <H1 className="text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
            Welcome, {userName}
          </H1>
          <P className="mt-1 text-sm font-medium text-[#667085]">{userEmail}</P>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Batch Box */}
          <div className="min-w-56 rounded-xl border border-[#E1E6EC] bg-[#F6F8FC] p-4">
            <Span className="block text-xs font-bold tracking-wider text-[#667085] uppercase">
              Batch
            </Span>
            <Span className="mt-1 block text-base font-bold text-[#111827]">
              {batch?.name ?? 'No Active Batch'}
            </Span>
            {batch ? (
              <Span className="mt-1 block text-xs font-semibold text-[#0044D3]">
                {formatDateRange(batch.startDate, batch.endDate)}
              </Span>
            ) : null}
          </div>

          {/* Mentor Box */}
          <div className="min-w-56 rounded-xl border border-[#E1E6EC] bg-[#F6F8FC] p-4">
            <Span className="block text-xs font-bold tracking-wider text-[#667085] uppercase">
              Mentor
            </Span>
            <Span className="mt-1 block text-base font-bold text-[#111827]">
              {mentor?.name ?? 'Not Assigned'}
            </Span>
            {mentor?.email ? (
              <Span className="mt-1 block text-xs text-[#667085]">{mentor.email}</Span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function MenteeProgressOverviewCard({
  isLoading,
  allocations,
}: Readonly<{
  isLoading: boolean;
  allocations: readonly CourseAllocation[];
}>) {
  if (isLoading) {
    return (
      <div className="w-full space-y-4 rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs sm:p-8">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  if (allocations.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-[#E1E6EC] bg-white p-8 text-center shadow-xs">
        <P className="text-base font-semibold text-[#111827]">No Course Allocations Yet</P>
        <P className="mt-1 text-sm text-[#667085]">
          You are not currently enrolled in any curriculum tracks.
        </P>
      </div>
    );
  }

  const active = allocations.filter((a) => a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS');
  const completed = allocations.filter((a) => a.status === 'COMPLETED').length;
  const overdue = allocations.filter((a) => {
    const isClosed = isTerminalAllocationStatus(a.status) && a.status !== 'COMPLETED';
    return Boolean(a.isOverdue) && a.status !== 'COMPLETED' && !isClosed;
  }).length;

  const totalProgress = allocations.reduce((sum, a) => sum + Number(a.progressPercent || 0), 0);
  const averagePace = Math.round((totalProgress / allocations.length) * 10) / 10;

  return (
    <div className="w-full rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Span className="text-xs font-bold tracking-wider text-[#0044D3] uppercase">
            Curriculum Completion
          </Span>
          <div className="mt-2 flex items-baseline gap-3">
            <H3 className="text-4xl font-extrabold text-[#111827]">{averagePace}%</H3>
            <Span className="text-sm font-medium text-[#667085]">Average Progress</Span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <Span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <Span>{completed} Completed</Span>
          </div>
          <Span className="text-[#E1E6EC]">•</Span>
          <div className="flex items-center gap-1.5 text-[#0044D3]">
            <Span className="h-2.5 w-2.5 rounded-full bg-[#0044D3]" />
            <Span>{active.length} In Progress</Span>
          </div>
          {overdue > 0 && (
            <>
              <Span className="text-[#E1E6EC]">•</Span>
              <div className="flex items-center gap-1.5 text-rose-600">
                <Span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <Span>{overdue} Overdue</Span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Full-width Progress Bar */}
      <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-[#F6F8FC]">
        <div
          className="h-full rounded-full bg-[#0044D3] transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, averagePace))}%` }}
        />
      </div>

      {/* Footer Info */}
      <div className="mt-6 flex items-center justify-between border-t border-[#E1E6EC] pt-4">
        <Span className="text-base font-semibold text-[#667085]">
          Total Assigned Courses:{' '}
          <strong className="text-xl font-bold text-[#111827]">{allocations.length}</strong>
        </Span>
      </div>
    </div>
  );
}

export default function MenteePage() {
  const { user, isAuthorized, sessionError } = useRoleRedirect({ allowedRoles: ['MENTEE'] });
  const { data: menteeBatchView, isLoading: isLoadingBatch, error: batchError } = useMenteeBatch();
  const { data: allocationsData, isLoading: isLoadingAllocations } = useAllocationsList({
    menteeId: user?.id,
    limit: 100,
  });
  // Mentee dashboard payload provides overall progress aggregates and upcoming deadlines.
  // Currently, MenteeProgressOverviewCard computes progress from allocations list;
  // remaining dashboard aggregate fields (activeCoursesCount, overallProgressPercent) are reserved for future widget parity.
  const {
    data: menteeDashboard,
    isLoading: isLoadingDashboard,
    isError: isErrorDashboard,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useMenteeDashboard({ enabled: isAuthorized });

  const allocations = useMemo<readonly CourseAllocation[]>(
    () => allocationsData?.items ?? [],
    [allocationsData],
  );

  if (!isAuthorized || !user) {
    return (
      <PortalSessionState
        sessionError={sessionError}
        loadingMessage="Loading student workspace..."
        variant="mentee"
      />
    );
  }

  const batch = menteeBatchView?.batch;
  const mentor = menteeBatchView?.mentor;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header {...MENTEE_PORTAL_NAV} />

      <DashboardContent>
        {/* Minimal Top Section: Welcome, Mentor & Batch */}
        <MenteeHeaderSection
          userName={user.name}
          userEmail={user.email}
          isLoading={isLoadingBatch}
          batch={batch}
          mentor={mentor}
        />

        {/* Global Error Banner */}
        {batchError ? (
          <div className="mb-6">
            <Alert
              variant="error"
              title="Error Loading Cohort Enrollment"
              message={
                batchError.message ||
                'An error occurred while fetching your active cohort assignment.'
              }
            />
          </div>
        ) : null}

        {/* Full-Width Learning Progress Section */}
        <div className="mb-8">
          <div className="mb-4">
            <H2 className="text-xl font-bold text-[#111827]">Learning Progress</H2>
          </div>

          <MenteeProgressOverviewCard isLoading={isLoadingAllocations} allocations={allocations} />
        </div>

        {/* Learning Tracks / Modules */}
        <div className="mb-6">
          <H2 className="text-base font-bold text-slate-900">Your Learning Tracks</H2>
          <P variant="muted" className="text-xs text-slate-500">
            Enrolled courses, submissions, and milestone tracking
          </P>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* Card 1: Course Progress */}
          <Link
            href="/mentee/courses"
            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <Span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase">
                  Curriculum
                </Span>
                <Span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                  Active Tracks
                </Span>
              </div>
              <H3 className="mt-2 text-base font-bold text-slate-900 transition-colors group-hover:text-blue-600">
                My Courses & Topics
              </H3>
              <P className="mt-1 text-xs leading-relaxed text-slate-600">
                Access your allocated curriculum tracks, topic checklists, deadlines, and hands-on
                coding modules.
              </P>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <Span className="text-[11px] font-semibold text-blue-600 group-hover:underline">
                View Enrolled Courses →
              </Span>
              <Span className="text-xs text-slate-400">M7 Allocation</Span>
            </div>
          </Link>

          {/* Card 2: Assignments & Deadlines */}
          <Link
            href="/mentee/assignments"
            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <Span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Tasks
                </Span>
                <Span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  Module 4
                </Span>
              </div>
              <H3 className="mt-2 text-base font-bold text-slate-900 transition-colors group-hover:text-blue-600">
                Assignments & Due Dates
              </H3>
              <P className="mt-1 text-xs leading-relaxed text-slate-600">
                Submit assignment deliverables, review mentor feedback, and track your submission
                history.
              </P>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <Span className="text-[11px] font-semibold text-blue-600 group-hover:underline">
                Go to Assignments →
              </Span>
              <Span className="text-xs text-slate-400">Submissions</Span>
            </div>
          </Link>

          {/* Card 3: Performance & Grades */}
          <Link
            href="/mentee/performance"
            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <Span className="text-[10px] font-bold tracking-wider text-emerald-600 uppercase">
                  Analytics
                </Span>
                <Span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  FR-11.4
                </Span>
              </div>
              <H3 className="mt-2 text-base font-bold text-slate-900 transition-colors group-hover:text-blue-600">
                My Grades & Performance
              </H3>
              <P className="mt-1 text-xs leading-relaxed text-slate-600">
                Review your course milestone percentages, marks breakdown, graded assignments, and
                mentor feedback.
              </P>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <Span className="text-[11px] font-semibold text-blue-600 group-hover:underline">
                View Performance & Grades →
              </Span>
              <Span className="text-xs text-slate-400">Learning History</Span>
            </div>
          </Link>
        </div>

        {/* Upcoming Deadlines Widget */}
        {isLoadingDashboard ? (
          <div className="mt-8 rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-1 h-3 w-72" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </div>
        ) : isErrorDashboard ? (
          <div className="mt-8">
            <Alert
              variant="error"
              title="Error Loading Deadlines"
              message={
                dashboardError?.message ||
                'Failed to load upcoming milestones and deadlines. Please retry.'
              }
            >
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void refetchDashboard()}
                  className="h-8 rounded-lg text-xs"
                >
                  Retry
                </Button>
              </div>
            </Alert>
          </div>
        ) : menteeDashboard?.upcomingDeadlines && menteeDashboard.upcomingDeadlines.length > 0 ? (
          <div className="mt-8 rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <H2 className="text-base font-bold text-[#111827]">
                  Upcoming Milestones & Deadlines
                </H2>
                <P className="text-xs text-[#667085]">
                  Scheduled completion dates for your active curriculum allocations
                </P>
              </div>
              <Link
                href="/mentee/courses"
                className="text-xs font-semibold text-[#0044D3] hover:underline"
              >
                View All Courses →
              </Link>
            </div>
            <div className="space-y-3">
              {menteeDashboard.upcomingDeadlines.map((item) => (
                <div
                  key={item.allocationId}
                  className="flex items-center justify-between rounded-xl border border-[#E1E6EC] bg-[#F6F8FC] p-3.5"
                >
                  <div>
                    <P className="text-sm font-bold text-[#111827]">{item.courseName}</P>
                    <Span className="text-xs text-[#667085]">
                      Progress: {item.progressPercent}%
                    </Span>
                  </div>
                  <div className="text-right">
                    <Span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        item.isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {item.isOverdue ? 'Overdue: ' : 'Due: '}
                      {formatDateIST(item.dueDate)}
                    </Span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </DashboardContent>
    </div>
  );
}

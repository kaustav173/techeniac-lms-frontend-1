'use client';

import Link from 'next/link';
import React from 'react';

import { ADMIN_PORTAL_NAV } from '@/components/app/navigation/portal-nav.config';
import { PortalSessionState } from '@/components/app/navigation/PortalSessionState';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { H1, H2, H3, P, Span } from '@/components/ui/Typography';
import { useAdminDashboard } from '@/hooks/useDashboard';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';

export default function AdminPage() {
  const { user, isAuthorized, sessionError } = useRoleRedirect({ allowedRoles: ['SUPER_ADMIN'] });
  const {
    data: dashboard,
    isLoading: isLoadingDashboard,
    isError: isErrorDashboard,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useAdminDashboard({
    enabled: isAuthorized,
  });

  if (!isAuthorized || !user) {
    return (
      <PortalSessionState
        sessionError={sessionError}
        loadingMessage="Loading admin console..."
        variant="admin"
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F8FC] text-[#111827]">
      <Header {...ADMIN_PORTAL_NAV} />

      <DashboardContent>
        {/* Welcome Section */}
        <div className="mb-8 rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <H1 className="text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
                Super Admin Control Center
              </H1>
              <P className="mt-2 text-base text-[#667085]">
                Manage organization identities, batch deployments, curriculum standards, and audit
                logs.
              </P>
            </div>

            <div className="rounded-2xl border border-[#E1E6EC] bg-[#F6F8FC] p-4 text-xs sm:min-w-64">
              <Span className="block text-xs font-bold tracking-wider text-[#667085] uppercase">
                Active Administrator
              </Span>
              <Span className="mt-1 block text-base font-bold text-[#111827]">{user.name}</Span>
              <Span className="mt-0.5 block text-sm text-[#667085]">{user.email}</Span>
            </div>
          </div>
        </div>

        {/* Admin Dashboard Error Alert */}
        {isErrorDashboard ? (
          <div className="mb-6">
            <Alert
              variant="error"
              title="Error Loading System KPIs"
              message={
                dashboardError?.message ||
                'Failed to load admin KPI metrics. Please check your connection and retry.'
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
        ) : null}

        {/* Live System KPIs */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs">
            <Span className="block text-xs font-bold tracking-wider text-[#667085] uppercase">
              Total Users
            </Span>
            {isLoadingDashboard ? (
              <Skeleton className="mt-2 h-9 w-20" />
            ) : (
              <P className="mt-1 font-mono text-3xl font-bold text-[#111827]">
                {dashboard?.users.totalUsers ?? 0}
              </P>
            )}
            {isLoadingDashboard ? (
              <Skeleton className="mt-2 h-4 w-32" />
            ) : (
              <Span className="mt-1 block text-xs text-[#667085]">
                {dashboard?.users.menteesCount ?? 0} Mentees • {dashboard?.users.mentorsCount ?? 0}{' '}
                Mentors
              </Span>
            )}
          </div>

          <div className="rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs">
            <Span className="block text-xs font-bold tracking-wider text-[#667085] uppercase">
              Live Cohorts
            </Span>
            {isLoadingDashboard ? (
              <Skeleton className="mt-2 h-9 w-20" />
            ) : (
              <P className="mt-1 font-mono text-3xl font-bold text-[#0044D3]">
                {dashboard?.batches.liveBatches ?? 0}
              </P>
            )}
            {isLoadingDashboard ? (
              <Skeleton className="mt-2 h-4 w-36" />
            ) : (
              <Span className="mt-1 block text-xs text-[#667085]">
                {dashboard?.batches.totalBatches ?? 0} total batches registered
              </Span>
            )}
          </div>

          <div className="rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs">
            <Span className="block text-xs font-bold tracking-wider text-[#667085] uppercase">
              Curriculum Tracks
            </Span>
            {isLoadingDashboard ? (
              <Skeleton className="mt-2 h-9 w-20" />
            ) : (
              <P className="mt-1 font-mono text-3xl font-bold text-[#111827]">
                {dashboard?.courses.publishedCourses ?? 0}
              </P>
            )}
            {isLoadingDashboard ? (
              <Skeleton className="mt-2 h-4 w-36" />
            ) : (
              <Span className="mt-1 block text-xs text-[#667085]">
                {dashboard?.courses.totalCourses ?? 0} total courses created
              </Span>
            )}
          </div>

          <div className="rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs">
            <Span className="block text-xs font-bold tracking-wider text-[#667085] uppercase">
              Pending Reviews
            </Span>
            {isLoadingDashboard ? (
              <Skeleton className="mt-2 h-9 w-20" />
            ) : (
              <P className="mt-1 font-mono text-3xl font-bold text-amber-600">
                {dashboard?.submissions.pendingReviewCount ?? 0}
              </P>
            )}
            {isLoadingDashboard ? (
              <Skeleton className="mt-2 h-4 w-36" />
            ) : (
              <Span className="mt-1 block text-xs text-[#667085]">
                {dashboard?.submissions.gradedCount ?? 0} submissions graded
              </Span>
            )}
          </div>
        </div>

        {/* Administration Pillars */}
        <div className="mb-6">
          <H2 className="text-xl font-bold text-[#111827]">System Governance</H2>
          <P className="mt-1 text-sm text-[#667085]">Core administrative domains across the LMS</P>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: User Management */}
          <Link
            href="/admin/users"
            className="group flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs transition-all duration-200 hover:border-[#0044D3] hover:bg-white hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0044D3] transition-colors group-hover:bg-[#0044D3] group-hover:text-white">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <svg
                  className="h-5 w-5 text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#0044D3]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <H3 className="mt-4 text-lg font-bold text-[#111827] transition-colors group-hover:text-[#0044D3]">
                User Management
              </H3>
              <P className="mt-2 text-sm leading-relaxed text-[#667085]">
                Super Admin, Mentor, and Mentee accounts. Password resets, role history, and token
                versions.
              </P>
            </div>
          </Link>

          {/* Card 2: Batches & Cohorts */}
          <Link
            href="/admin/batches"
            className="group flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs transition-all duration-200 hover:border-[#0044D3] hover:bg-white hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0044D3] transition-colors group-hover:bg-[#0044D3] group-hover:text-white">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <svg
                  className="h-5 w-5 text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#0044D3]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <H3 className="mt-4 text-lg font-bold text-[#111827] transition-colors group-hover:text-[#0044D3]">
                Batches & Cohorts
              </H3>
              <P className="mt-2 text-sm leading-relaxed text-[#667085]">
                Batch creation (Draft, Live, Completed), mentor-mentee mapping, and batch transfers.
              </P>
            </div>
          </Link>

          {/* Card 3: Curriculum & Courses */}
          <Link
            href="/admin/courses"
            className="group flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs transition-all duration-200 hover:border-[#0044D3] hover:bg-white hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0044D3] transition-colors group-hover:bg-[#0044D3] group-hover:text-white">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <svg
                  className="h-5 w-5 text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#0044D3]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <H3 className="mt-4 text-lg font-bold text-[#111827] transition-colors group-hover:text-[#0044D3]">
                Course Library & Builder
              </H3>
              <P className="mt-2 text-sm leading-relaxed text-[#667085]">
                Course authoring, outline trees, subtopic lessons, embedded assignments, and live
                saves.
              </P>
            </div>
          </Link>

          {/* Card 4: Course Allocations */}
          <Link
            href="/admin/allocations"
            className="group flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs transition-all duration-200 hover:border-[#0044D3] hover:bg-white hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0044D3] transition-colors group-hover:bg-[#0044D3] group-hover:text-white">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <svg
                  className="h-5 w-5 text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#0044D3]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <H3 className="mt-4 text-lg font-bold text-[#111827] transition-colors group-hover:text-[#0044D3]">
                Course Allocations
              </H3>
              <P className="mt-2 text-sm leading-relaxed text-[#667085]">
                Assign curriculum tracks to cohorts and mentees, configure due dates, and monitor
                progress.
              </P>
            </div>
          </Link>

          {/* Card 5: Audit Log */}
          <Link
            href="/admin/audit-logs"
            className="group flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs transition-all duration-200 hover:border-[#0044D3] hover:bg-white hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700 transition-colors group-hover:bg-[#0044D3] group-hover:text-white">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                </div>
                <svg
                  className="h-5 w-5 text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#0044D3]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <H3 className="mt-4 text-lg font-bold text-[#111827] transition-colors group-hover:text-[#0044D3]">
                Audit Log Trail
              </H3>
              <P className="mt-2 text-sm leading-relaxed text-[#667085]">
                Filterable, immutable event records: authentication, user role changes, live course
                edits, and batch status transitions.
              </P>
            </div>
          </Link>
        </div>
      </DashboardContent>
    </div>
  );
}

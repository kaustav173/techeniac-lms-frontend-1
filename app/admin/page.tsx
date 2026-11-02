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
import { CardTitle, P, PageTitle, SectionTitle, Span, SubText } from '@/components/ui/Typography';
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
        <div className="mb-8 rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <PageTitle>Super Admin Control Center</PageTitle>
              <SubText className="mt-2 text-base text-[#667085]">
                Manage curriculum standards, allocations, progress metrics, and system audit logs.
              </SubText>
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
          <SectionTitle>System Governance</SectionTitle>
          <SubText className="mt-1">
            Core governance, tracking, and compliance domains across the LMS
          </SubText>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Course Allocations */}
          <Link
            href="/admin/allocations"
            className="group flex flex-col justify-between rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs transition-all duration-200 hover:border-[#0044D3] hover:bg-white hover:shadow-md"
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
              <CardTitle className="mt-4 transition-colors group-hover:text-[#0044D3]">
                Course Allocations
              </CardTitle>
              <SubText className="mt-2 leading-relaxed">
                Assign curriculum tracks to cohorts and mentees, configure due dates, and monitor
                progress.
              </SubText>
            </div>
          </Link>

          {/* Card 2: Progress Tracker */}
          <Link
            href="/admin/progress"
            className="group flex flex-col justify-between rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs transition-all duration-200 hover:border-[#0044D3] hover:bg-white hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-[#0044D3] group-hover:text-white">
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
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
              <CardTitle className="mt-4 transition-colors group-hover:text-[#0044D3]">
                Progress Matrix
              </CardTitle>
              <SubText className="mt-2 leading-relaxed">
                Inspect cross-cohort milestone clearance, cadence telemetry, and identify overdue
                learners.
              </SubText>
            </div>
          </Link>

          {/* Card 3: Audit Log Trail */}
          <Link
            href="/admin/audit-logs"
            className="group flex flex-col justify-between rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs transition-all duration-200 hover:border-[#0044D3] hover:bg-white hover:shadow-md"
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
              <CardTitle className="mt-4 transition-colors group-hover:text-[#0044D3]">
                Audit Log Trail
              </CardTitle>
              <SubText className="mt-2 leading-relaxed">
                Filterable, immutable event records: authentication, user role changes, live course
                edits, and batch status transitions.
              </SubText>
            </div>
          </Link>
        </div>
      </DashboardContent>
    </div>
  );
}

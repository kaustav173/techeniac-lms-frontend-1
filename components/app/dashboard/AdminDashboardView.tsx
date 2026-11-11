'use client';

import Link from 'next/link';
import React from 'react';

import { ADMIN_PORTAL_NAV } from '@/components/app/navigation/portal-nav.config';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header, HeaderSkeleton } from '@/components/layout/Header';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { CardTitle, P, Span, SubText } from '@/components/ui/Typography';
import { useAdminDashboard } from '@/hooks/useDashboard';
import type { AuthUser } from '@/services/auth.service';

export function AdminDashboardSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F6F8FC] text-[#111827]">
      <HeaderSkeleton title="Dashboard" />

      <DashboardContent>
        {/* 5 KPI Metric Cards Skeleton */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={`kpi-skel-${idx}`}
              className="rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs"
            >
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="mt-2 h-9 w-16 rounded-md" />
              <Skeleton className="mt-3 h-3 w-28 rounded-md" />
            </div>
          ))}
        </div>

        {/* 7 Core Feature Cards Skeleton */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, idx) => (
            <div
              key={`module-skel-${idx}`}
              className="flex flex-col justify-between rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-12 w-12 rounded-2xl" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-5 w-40 rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <Skeleton className="mt-4 h-4 w-28 rounded-md" />
            </div>
          ))}
        </div>
      </DashboardContent>
    </div>
  );
}

export interface AdminDashboardViewProps {
  readonly initialUser: AuthUser;
}

export function AdminDashboardView({ initialUser }: AdminDashboardViewProps) {
  void initialUser;
  const {
    data: dashboard,
    isError: isErrorDashboard,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useAdminDashboard();

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F8FC] text-[#111827]">
      <Header {...ADMIN_PORTAL_NAV} />

      <DashboardContent>
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

        {/* Live System KPIs - 5 Clickable Metric Cards with Hydrated Data */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {/* Card 1: Users */}
          <Link
            href="/admin/users"
            className="group animate-in fade-in slide-in-from-bottom-2 relative flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs transition-all duration-200 duration-300 hover:-translate-y-0.5 hover:border-[#0044D3] hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <Span className="block text-[11px] font-bold tracking-wider text-[#667085] uppercase">
                  Total Users
                </Span>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-200 group-hover:bg-[#0044D3] group-hover:text-white group-hover:shadow-xs">
                  <svg
                    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </div>
              </div>
              <P className="mt-1 text-3xl font-bold text-[#111827]">
                {dashboard?.users?.totalUsers ?? 0}
              </P>
            </div>
            <div className="mt-3 border-t border-slate-100 pt-2.5">
              <Span className="block text-xs text-[#667085]">
                {dashboard?.users?.menteesCount ?? 0} Mentees •{' '}
                {dashboard?.users?.mentorsCount ?? 0} Mentors
              </Span>
            </div>
          </Link>

          {/* Card 2: Batches */}
          <Link
            href="/admin/batches"
            className="group animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards relative flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs transition-all delay-75 duration-200 duration-300 hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <Span className="block text-[11px] font-bold tracking-wider text-[#667085] uppercase">
                  Live Batches
                </Span>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-200 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-xs">
                  <svg
                    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </div>
              </div>
              <P className="mt-1 text-3xl font-bold text-emerald-600">
                {dashboard?.batches?.liveBatches ?? 0}
              </P>
            </div>
            <div className="mt-3 border-t border-slate-100 pt-2.5">
              <Span className="block text-xs text-[#667085]">
                {dashboard?.batches?.totalBatches ?? 0} total •{' '}
                {dashboard?.batches?.draftBatches ?? 0} draft
              </Span>
            </div>
          </Link>

          {/* Card 3: Courses */}
          <Link
            href="/admin/courses"
            className="group animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards relative flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs transition-all delay-100 duration-200 duration-300 hover:-translate-y-0.5 hover:border-sky-500 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <Span className="block text-[11px] font-bold tracking-wider text-[#667085] uppercase">
                  Courses
                </Span>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-200 group-hover:bg-sky-600 group-hover:text-white group-hover:shadow-xs">
                  <svg
                    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </div>
              </div>
              <P className="mt-1 text-3xl font-bold text-[#0044D3]">
                {dashboard?.courses?.publishedCourses ?? 0}
              </P>
            </div>
            <div className="mt-3 border-t border-slate-100 pt-2.5">
              <Span className="block text-xs text-[#667085]">
                {dashboard?.courses?.totalCourses ?? 0} total courses
              </Span>
            </div>
          </Link>

          {/* Card 4: Allocations */}
          <Link
            href="/admin/allocations"
            className="group animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards relative flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs transition-all delay-150 duration-200 duration-300 hover:-translate-y-0.5 hover:border-amber-500 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <Span className="block text-[11px] font-bold tracking-wider text-[#667085] uppercase">
                  Active Allocations
                </Span>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-200 group-hover:bg-amber-600 group-hover:text-white group-hover:shadow-xs">
                  <svg
                    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </div>
              </div>
              <P className="mt-1 text-3xl font-bold text-amber-600">
                {dashboard?.allocations?.activeAllocations ?? 0}
              </P>
            </div>
            <div className="mt-3 border-t border-slate-100 pt-2.5">
              <Span className="block text-xs text-[#667085]">
                {dashboard?.allocations?.completedAllocations ?? 0} completed
              </Span>
            </div>
          </Link>

          {/* Card 5: Submissions / Reviews */}
          <Link
            href="/admin/progress"
            className="group animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards relative flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs transition-all delay-200 duration-200 duration-300 hover:-translate-y-0.5 hover:border-rose-500 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <Span className="block text-[11px] font-bold tracking-wider text-[#667085] uppercase">
                  Pending Reviews
                </Span>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-200 group-hover:bg-rose-600 group-hover:text-white group-hover:shadow-xs">
                  <svg
                    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </div>
              </div>
              <P className="mt-1 text-3xl font-bold text-rose-600">
                {dashboard?.submissions?.pendingReviewCount ?? 0}
              </P>
            </div>
            <div className="mt-3 border-t border-slate-100 pt-2.5">
              <Span className="block text-xs text-[#667085]">
                {dashboard?.submissions?.gradedCount ?? 0} graded •{' '}
                {dashboard?.submissions?.resubmitRequestedCount ?? 0} resubmits
              </Span>
            </div>
          </Link>
        </div>

        {/* 7 Core Clickable Feature Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Module 1: Users & Directory */}
          <Link
            href="/admin/users"
            className="group flex flex-col justify-between rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[#0044D3] hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0044D3] transition-colors group-hover:bg-[#0044D3] group-hover:text-white">
                  <svg
                    className="h-6 w-6"
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
                <Span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#0044D3]">
                  {dashboard?.users?.totalUsers ?? 0} Users
                </Span>
              </div>
              <CardTitle className="mt-4 transition-colors group-hover:text-[#0044D3]">
                Users & Access Control
              </CardTitle>
              <SubText className="mt-2 text-xs leading-relaxed">
                Manage student mentees, mentor instructors, and role permissions with bulk CSV
                import.
              </SubText>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#0044D3]">
              <Span>Manage Directory</Span>
              <svg
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Module 2: Batches */}
          <Link
            href="/admin/batches"
            className="group flex flex-col justify-between rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-emerald-600 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <Span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  {dashboard?.batches?.liveBatches ?? 0} Live
                </Span>
              </div>
              <CardTitle className="mt-4 transition-colors group-hover:text-emerald-700">
                Batches
              </CardTitle>
              <SubText className="mt-2 text-xs leading-relaxed">
                Organize learners into structured batches, assign mentors, and schedule training
                timelines.
              </SubText>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <Span>View Batches</Span>
              <svg
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Module 3: Courses & Builder */}
          <Link
            href="/admin/courses"
            className="group flex flex-col justify-between rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-sky-600 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 transition-colors group-hover:bg-sky-600 group-hover:text-white">
                  <svg
                    className="h-6 w-6"
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
                <Span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                  {dashboard?.courses?.totalCourses ?? 0} Courses
                </Span>
              </div>
              <CardTitle className="mt-4 transition-colors group-hover:text-sky-700">
                Courses & Builder
              </CardTitle>
              <SubText className="mt-2 text-xs leading-relaxed">
                Design modular courses, structured topics, subtopics, and benchmark assignments.
              </SubText>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-sky-700">
              <Span>Open Builder</Span>
              <svg
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Module 4: Course Allocations */}
          <Link
            href="/admin/allocations"
            className="group flex flex-col justify-between rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-amber-600 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                  <svg
                    className="h-6 w-6"
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
                <Span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  {dashboard?.allocations?.activeAllocations ?? 0} Active
                </Span>
              </div>
              <CardTitle className="mt-4 transition-colors group-hover:text-amber-700">
                Course Allocations
              </CardTitle>
              <SubText className="mt-2 text-xs leading-relaxed">
                Assign courses to batches and mentees, configure due dates, and monitor schedules.
              </SubText>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <Span>Manage Allocations</Span>
              <svg
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Module 5: Progress Tracker */}
          <Link
            href="/admin/progress"
            className="group flex flex-col justify-between rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-purple-600 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white">
                  <svg
                    className="h-6 w-6"
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
                <Span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                  {dashboard?.submissions?.pendingReviewCount ?? 0} Pending
                </Span>
              </div>
              <CardTitle className="mt-4 transition-colors group-hover:text-purple-700">
                Progress Matrix
              </CardTitle>
              <SubText className="mt-2 text-xs leading-relaxed">
                Inspect cross-batch milestone clearance, review pending tasks, and identify overdue
                learners.
              </SubText>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-purple-700">
              <Span>Inspect Matrix</Span>
              <svg
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Module 6: Performance Analytics */}
          <Link
            href="/admin/performance"
            className="group flex flex-col justify-between rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-indigo-600 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <Span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                  Analytics
                </Span>
              </div>
              <CardTitle className="mt-4 transition-colors group-hover:text-indigo-700">
                Performance Telemetry
              </CardTitle>
              <SubText className="mt-2 text-xs leading-relaxed">
                Benchmark batch milestone velocity, track grading turnaround, and analyze overall
                learning cadence.
              </SubText>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
              <Span>View Analytics</Span>
              <svg
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Module 7: Security Audit Logs */}
          <Link
            href="/admin/audit-logs"
            className="group flex flex-col justify-between rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-slate-700 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-slate-700 group-hover:text-white">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <Span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  Immutable
                </Span>
              </div>
              <CardTitle className="mt-4 transition-colors group-hover:text-slate-900">
                Logs
              </CardTitle>
              <SubText className="mt-2 text-xs leading-relaxed">
                Filterable event records: authentication, user role adjustments, course edits, and
                batch state changes.
              </SubText>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Span>Inspect Logs</Span>
              <svg
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>
      </DashboardContent>
    </div>
  );
}

'use client';

import Link from 'next/link';
import React from 'react';

import { MENTOR_PORTAL_NAV } from '@/components/app/navigation/portal-nav.config';
import { PortalSessionState } from '@/components/app/navigation/PortalSessionState';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { H2, H3, P, Span } from '@/components/ui/Typography';
import { useMentorBatches, useMentorMentees } from '@/hooks/useBatches';
import { useCourses } from '@/hooks/useCourses';
import { useMentorDashboard } from '@/hooks/useDashboard';
import { usePerformanceQuery } from '@/hooks/usePerformance';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';

export default function MentorPage() {
  const { user, isAuthorized, sessionError } = useRoleRedirect({ allowedRoles: ['MENTOR'] });

  const {
    data: batches = [],
    isLoading: isLoadingBatches,
    error: batchesError,
  } = useMentorBatches();

  const {
    data: mentees = [],
    isLoading: isLoadingMentees,
    error: menteesError,
  } = useMentorMentees();

  const {
    data: mentorDashboard,
    isLoading: isLoadingDashboard,
    error: dashboardError,
  } = useMentorDashboard({ enabled: isAuthorized });

  const { data: performanceData, isLoading: isLoadingPerformance } = usePerformanceQuery();

  const { total: totalCoursesCount } = useCourses({ limit: 1 });

  if (!isAuthorized || !user) {
    return (
      <PortalSessionState
        sessionError={sessionError}
        loadingMessage="Loading mentor workspace..."
        variant="mentor"
      />
    );
  }

  const isZeroState =
    mentorDashboard?.isZeroState ??
    (batches.filter((b) => !['COMPLETED', 'ARCHIVED'].includes(b.status)).length === 0 &&
      mentees.length === 0);

  const liveBatchesCount = batches.filter((b) => b.status === 'LIVE').length;
  const pendingReviewsCount = mentorDashboard?.pendingReviewCount ?? 0;
  const avgGrade =
    performanceData?.metrics?.averageMarks != null
      ? `${Math.round(performanceData.metrics.averageMarks)}%`
      : '—';
  const onTimeRate =
    performanceData?.metrics?.onTimeRate != null
      ? `${Math.round(performanceData.metrics.onTimeRate)}%`
      : '—';

  const portalCards = [
    {
      id: 'reviews',
      href: '/mentor/reviews',
      title: 'Submission Reviews',
      badge: pendingReviewsCount > 0 ? `${pendingReviewsCount} Pending` : 'Up to Date',
      badgeClass:
        pendingReviewsCount > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800',
      iconBg: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white',
      icon: (
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      action: 'Open Submission Queue',
    },
    {
      id: 'mentees',
      href: '/mentor/my-mentees',
      title: 'My Mentees',
      badge: `${mentees.length} Mapped`,
      badgeClass: 'bg-emerald-100 text-emerald-800',
      iconBg: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
      icon: (
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
      ),
      action: 'Manage Mentees',
    },
    {
      id: 'allocations',
      href: '/mentor/allocations',
      title: 'Course Allocations',
      badge: `${batches.length} Assigned`,
      badgeClass: 'bg-blue-100 text-[#0044D3]',
      iconBg: 'bg-blue-50 text-[#0044D3] group-hover:bg-[#0044D3] group-hover:text-white',
      icon: (
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
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      action: 'Manage Allocations',
    },
    {
      id: 'courses',
      href: '/mentor/courses',
      title: 'Course Library',
      badge: totalCoursesCount > 0 ? `${totalCoursesCount} Courses` : 'Catalog',
      badgeClass: 'bg-indigo-100 text-indigo-800',
      iconBg: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
      icon: (
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
      ),
      action: 'Browse Course Library',
    },
    {
      id: 'progress',
      href: '/mentor/progress',
      title: 'Progress',
      badge: 'Milestones',
      badgeClass: 'bg-cyan-100 text-cyan-800',
      iconBg: 'bg-cyan-50 text-cyan-700 group-hover:bg-cyan-700 group-hover:text-white',
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      action: 'Open Progress',
    },
    {
      id: 'performance',
      href: '/mentor/performance',
      title: 'Mentee Performance',
      badge: 'Analytics',
      badgeClass: 'bg-amber-100 text-amber-800',
      iconBg: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
      icon: (
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
      ),
      action: 'View Performance Analytics',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header {...MENTOR_PORTAL_NAV} />

      <DashboardContent>
        {/* Global Error Banner */}
        {batchesError || menteesError || dashboardError ? (
          <div className="mb-6">
            <Alert
              variant="error"
              title="Error Loading Course Data"
              message={
                batchesError?.message ||
                menteesError?.message ||
                dashboardError?.message ||
                'An error occurred while fetching your assigned course information.'
              }
            />
          </div>
        ) : null}

        {/* Empty-State Guidance for New Mentors (DSH-08) */}
        {isZeroState &&
        !isLoadingBatches &&
        !isLoadingMentees &&
        !isLoadingDashboard &&
        !batchesError &&
        !menteesError &&
        !dashboardError ? (
          <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50/70 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0044D3] text-white">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <H2 className="text-base font-bold text-[#111827]">
                  Welcome to Techeniac LMS, Mentor!
                </H2>
                <P className="mt-1 text-sm leading-relaxed text-[#667085]">
                  Once an administrator assigns you to an active batch or pairs you with learners,
                  you will be able to review assignment submissions, track syllabus progress, and
                  evaluate grades directly from this dashboard.
                </P>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/mentor/courses"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#0044D3] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#0039B3]"
                  >
                    Explore Course Catalog →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Top KPI Ribbon (Clickable Feature Summaries) */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Tile 1: Reviews */}
          <Link
            href="/mentor/reviews"
            className="group relative flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0044D3] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#0044D3] focus-visible:outline-none"
          >
            <div>
              <div className="flex items-center justify-between">
                <Span className="text-xs font-bold tracking-wider text-[#667085] uppercase">
                  Pending Reviews
                </Span>
                <Span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    pendingReviewsCount > 0
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {pendingReviewsCount > 0 ? 'Action Needed' : 'Up to Date'}
                </Span>
              </div>
              {isLoadingDashboard ? (
                <Skeleton className="mt-2 h-9 w-16 rounded-lg" />
              ) : (
                <P className="mt-2 text-3xl font-bold text-[#111827]">{pendingReviewsCount}</P>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[#E1E6EC]/60 pt-3">
              <Span className="text-xs font-medium text-[#667085]">Waiting in review queue</Span>
              <Span className="text-xs font-bold text-[#0044D3] transition-transform group-hover:translate-x-1">
                →
              </Span>
            </div>
          </Link>

          {/* Tile 2: Mentees */}
          <Link
            href="/mentor/my-mentees"
            className="group relative flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0044D3] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#0044D3] focus-visible:outline-none"
          >
            <div>
              <div className="flex items-center justify-between">
                <Span className="text-xs font-bold tracking-wider text-[#667085] uppercase">
                  Total Mapped Mentees
                </Span>
                <Span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-[#0044D3]">
                  Learners
                </Span>
              </div>
              {isLoadingMentees ? (
                <Skeleton className="mt-2 h-9 w-16 rounded-lg" />
              ) : (
                <P className="mt-2 text-3xl font-bold text-[#111827]">{mentees.length}</P>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[#E1E6EC]/60 pt-3">
              <Span className="text-xs font-medium text-[#667085]">
                Paired learners across courses
              </Span>
              <Span className="text-xs font-bold text-[#0044D3] transition-transform group-hover:translate-x-1">
                →
              </Span>
            </div>
          </Link>

          {/* Tile 3: Courses */}
          <Link
            href="/mentor/allocations"
            className="group relative flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0044D3] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#0044D3] focus-visible:outline-none"
          >
            <div>
              <div className="flex items-center justify-between">
                <Span className="text-xs font-bold tracking-wider text-[#667085] uppercase">
                  Assigned Courses
                </Span>
                <Span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  {liveBatchesCount} Live
                </Span>
              </div>
              {isLoadingBatches ? (
                <Skeleton className="mt-2 h-9 w-16 rounded-lg" />
              ) : (
                <P className="mt-2 text-3xl font-bold text-[#0044D3]">{batches.length}</P>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[#E1E6EC]/60 pt-3">
              <Span className="text-xs font-medium text-[#667085]">
                {liveBatchesCount} live course tracks
              </Span>
              <Span className="text-xs font-bold text-[#0044D3] transition-transform group-hover:translate-x-1">
                →
              </Span>
            </div>
          </Link>

          {/* Tile 4: Performance */}
          <Link
            href="/mentor/performance"
            className="group relative flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0044D3] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#0044D3] focus-visible:outline-none"
          >
            <div>
              <div className="flex items-center justify-between">
                <Span className="text-xs font-bold tracking-wider text-[#667085] uppercase">
                  Course Average Score
                </Span>
                <Span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                  {onTimeRate} On-Time
                </Span>
              </div>
              {isLoadingPerformance ? (
                <Skeleton className="mt-2 h-9 w-16 rounded-lg" />
              ) : (
                <P className="mt-2 text-3xl font-bold text-[#111827]">{avgGrade}</P>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[#E1E6EC]/60 pt-3">
              <Span className="text-xs font-medium text-[#667085]">Overall graded coursework</Span>
              <Span className="text-xs font-bold text-[#0044D3] transition-transform group-hover:translate-x-1">
                →
              </Span>
            </div>
          </Link>
        </div>

        {/* Command Center: 6 Dedicated Portal Features */}
        <div className="mb-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {portalCards.map((card) => (
              <Link
                key={card.id}
                href={card.href}
                className="group relative flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[#0044D3] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-[#0044D3] focus-visible:outline-none"
              >
                <div>
                  {/* Top Bar with Icon & Badge */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200 ${card.iconBg}`}
                    >
                      {card.icon}
                    </div>
                    <Span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${card.badgeClass}`}
                    >
                      {card.badge}
                    </Span>
                  </div>

                  {/* Header */}
                  <div className="mt-4">
                    <H3 className="text-lg font-bold text-[#111827] transition-colors group-hover:text-[#0044D3]">
                      {card.title}
                    </H3>
                  </div>
                </div>

                {/* Footer Section */}
                <div className="mt-6 flex items-center justify-between border-t border-[#E1E6EC]/70 pt-4">
                  <Span className="text-xs font-semibold text-[#0044D3] group-hover:underline">
                    {card.action}
                  </Span>
                  <svg
                    className="h-4 w-4 text-[#0044D3] transition-transform duration-200 group-hover:translate-x-1.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </DashboardContent>
    </div>
  );
}

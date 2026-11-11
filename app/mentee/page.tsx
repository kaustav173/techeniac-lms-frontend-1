'use client';

import Link from 'next/link';
import React, { useMemo } from 'react';

import {
  AlertIcon,
  ArrowRightIcon,
  BarChartIcon,
  BookIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  DataScienceIllustration,
  DocumentTextIcon,
  LaptopCodeIllustration,
  LightningIcon,
  ReactAtomIllustration,
  StudentIllustration,
  TrophyIcon,
  UserIcon,
} from '@/components/app/dashboard/MenteeDashboardGraphics';
import { MENTEE_PORTAL_NAV } from '@/components/app/navigation/portal-nav.config';
import { PortalSessionState } from '@/components/app/navigation/PortalSessionState';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  type CourseAllocation,
  isTerminalAllocationStatus,
  useAllocationsList,
} from '@/hooks/useAllocations';
import { useMenteeBatch } from '@/hooks/useBatches';
import { useMenteeDashboard } from '@/hooks/useDashboard';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import { useMyAssignments } from '@/hooks/useSubmissions';
import { formatDateIST, formatDateTime, formatTimeIST, toISTDateInputValue } from '@/lib/date';
import { AssignmentDerivedStatus } from '@/types/submissions';

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
  if (!startDate && !endDate) return 'Nov 1, 2026 – Apr 30, 2027';
  if (startDate && endDate) {
    return `${formatDate(startDate)} – ${formatDate(endDate)}`;
  }
  return formatDate(startDate || endDate);
}

export default function MenteePage() {
  const { user, isAuthorized, sessionError } = useRoleRedirect({ allowedRoles: ['MENTEE'] });
  const { data: menteeBatchView, isLoading: isLoadingBatch } = useMenteeBatch();
  const { data: allocationsData, isLoading: isLoadingAllocations } = useAllocationsList({
    menteeId: user?.id,
    limit: 100,
  });
  const { data: menteeDashboard, isLoading: isLoadingDashboard } = useMenteeDashboard({
    enabled: isAuthorized,
  });
  const { assignments } = useMyAssignments({ limit: 5 });

  const allocations = useMemo<readonly CourseAllocation[]>(
    () => allocationsData?.items ?? [],
    [allocationsData],
  );

  /* Compute overall progress statistics */
  const { completedCount, inProgressCount, overdueCount, overallProgress } = useMemo(() => {
    if (allocations.length > 0) {
      const completed = allocations.filter((a) => a.status === 'COMPLETED').length;
      const inProgress = allocations.filter(
        (a) => a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS',
      ).length;
      const overdue = allocations.filter((a) => {
        const isClosed = isTerminalAllocationStatus(a.status) && a.status !== 'COMPLETED';
        return Boolean(a.isOverdue) && a.status !== 'COMPLETED' && !isClosed;
      }).length;

      const totalProgress = allocations.reduce((sum, a) => sum + Number(a.progressPercent || 0), 0);
      const calculatedPace = Math.round((totalProgress / allocations.length) * 10) / 10;
      const progressVal = menteeDashboard?.overallProgressPercent ?? calculatedPace;

      return {
        completedCount: menteeDashboard?.completedCoursesCount ?? completed,
        inProgressCount: menteeDashboard?.activeCoursesCount ?? inProgress,
        overdueCount: overdue,
        overallProgress: progressVal,
      };
    }

    if (menteeDashboard) {
      return {
        completedCount: menteeDashboard.completedCoursesCount ?? 0,
        inProgressCount: menteeDashboard.activeCoursesCount ?? 0,
        overdueCount: 0,
        overallProgress: menteeDashboard.overallProgressPercent ?? 0,
      };
    }

    return {
      completedCount: 1,
      inProgressCount: 5,
      overdueCount: 5,
      overallProgress: 16.7,
    };
  }, [allocations, menteeDashboard]);

  /* Next upcoming assignment */
  const upcomingItem = useMemo(() => {
    const pending = assignments.find(
      (a) =>
        a.status === AssignmentDerivedStatus.PENDING ||
        a.status === AssignmentDerivedStatus.OVERDUE,
    );
    if (pending) {
      const d = new Date(pending.dueDate);
      const day = isNaN(d.getTime()) ? '28' : String(d.getDate()).padStart(2, '0');
      const month = isNaN(d.getTime())
        ? 'Oct'
        : new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d);
      const time = isNaN(d.getTime()) ? '10:00 AM' : formatTimeIST(pending.dueDate);
      const isDueToday =
        !isNaN(d.getTime()) && toISTDateInputValue(new Date()) === toISTDateInputValue(d);
      return {
        day,
        month,
        title: `Assignment: ${pending.title}`,
        subtitle: `${time} • ${pending.status === AssignmentDerivedStatus.OVERDUE ? 'Overdue' : isDueToday ? 'Due Today' : `Due ${formatDateIST(pending.dueDate)}`}`,
        link: `/mentee/assignments/${pending.id}`,
      };
    }

    const deadline = menteeDashboard?.upcomingDeadlines?.[0];
    if (deadline) {
      const d = new Date(deadline.dueDate);
      const day = isNaN(d.getTime()) ? '28' : String(d.getDate()).padStart(2, '0');
      const month = isNaN(d.getTime())
        ? 'Oct'
        : new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d);
      const time = isNaN(d.getTime()) ? '10:00 AM' : formatTimeIST(deadline.dueDate);
      return {
        day,
        month,
        title: `Assignment: ${deadline.courseName}`,
        subtitle: `${time} • ${deadline.isOverdue ? 'Overdue' : `Due ${formatDateIST(deadline.dueDate)}`}`,
        link: `/mentee/courses`,
      };
    }

    return {
      day: '28',
      month: 'Oct',
      title: 'Assignment: Data Structures',
      subtitle: '10:00 AM • Due Today',
      link: '/mentee/assignments',
    };
  }, [assignments, menteeDashboard]);

  /* 3 My Courses cards */
  const displayCourses = useMemo(() => {
    if (allocations.length > 0) {
      return allocations.slice(0, 3).map((a, idx) => {
        const graphics: Array<'code' | 'data' | 'react'> = ['code', 'data', 'react'];
        return {
          id: a.id,
          title: a.course?.title ?? `Course ${idx + 1}`,
          subtitle: `${a.progressPercent}% complete`,
          progress: Number(a.progressPercent || 0),
          graphicType: graphics[idx % graphics.length] ?? 'code',
          href: `/mentee/courses/${a.id}`,
        };
      });
    }

    return [
      {
        id: 'course-1',
        title: 'Programming Basics',
        subtitle: '3 / 10 lessons',
        progress: 30,
        graphicType: 'code' as const,
        href: '/mentee/courses',
      },
      {
        id: 'course-2',
        title: 'Data Science Fundamentals',
        subtitle: '2 / 8 lessons',
        progress: 25,
        graphicType: 'data' as const,
        href: '/mentee/courses',
      },
      {
        id: 'course-3',
        title: 'React for Developers',
        subtitle: '5 / 12 lessons',
        progress: 42,
        graphicType: 'react' as const,
        href: '/mentee/courses',
      },
    ];
  }, [allocations]);

  /* Recent Activity list */
  const displayRecentActivities = useMemo(() => {
    const subs = menteeDashboard?.recentSubmissions ?? [];
    if (subs.length > 0) {
      return subs.slice(0, 3).map((s) => ({
        id: s.id,
        title: s.status === 'GRADED' ? 'Assignment Graded' : 'Assignment Submitted',
        subtitle: `${s.assignmentTitle || s.courseName} • Submitted on ${formatDateTime(s.submittedAt)}`,
        badge: s.status === 'GRADED' ? `Graded (${s.marks ?? 0} pts)` : 'Submitted',
      }));
    }

    return [
      {
        id: 'default-act-1',
        title: 'Assignment Submitted',
        subtitle: 'Data Structures • Submitted on 28 Oct, 2026 at 10:14 AM',
        badge: 'Submitted',
      },
    ];
  }, [menteeDashboard]);

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
  const isLoading = isLoadingBatch || isLoadingDashboard || isLoadingAllocations;

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F8FC] text-[#111827]">
      <Header {...MENTEE_PORTAL_NAV} />

      <DashboardContent className="animate-slide-up space-y-6 pb-12 sm:space-y-8">
        {/* ================================================================ */}
        {/* ROW 1: Welcome Banner (7 cols) + Batch & Mentor Cards (5 cols)    */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Welcome Banner */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#DBEAFE] bg-gradient-to-r from-[#EFF6FF] via-[#EEF2FF] to-[#E0E7FF] p-6 shadow-xs sm:flex-row sm:items-center sm:p-8 lg:col-span-7">
            <div className="relative z-10 max-w-sm">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A] sm:text-3xl">
                Welcome back, {user.name}!
              </h1>
              <p className="mt-2 text-sm font-medium text-[#475569] sm:text-base">
                Keep learning, keep growing 🚀
              </p>
            </div>
            <div className="relative mt-4 flex flex-shrink-0 items-center justify-center sm:mt-0 sm:justify-end">
              <StudentIllustration />
            </div>
          </div>

          {/* Batch & Mentor Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-5">
            {/* Current Batch */}
            <div className="flex flex-col justify-between rounded-3xl border border-[#E1E6EC] bg-white p-5 shadow-xs sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0044D3]">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-semibold text-[#64748B]">Current Batch</span>
                  {isLoading ? (
                    <Skeleton className="mt-1 h-5 w-24" />
                  ) : (
                    <h2 className="mt-0.5 truncate text-sm font-bold text-[#0F172A] sm:text-base">
                      {batch?.name ?? 'Cohort Gamma'}
                    </h2>
                  )}
                </div>
              </div>
              <p className="mt-3 truncate text-xs text-[#94A3B8]">
                {formatDateRange(batch?.startDate, batch?.endDate)}
              </p>
            </div>

            {/* Mentor */}
            <div className="flex flex-col justify-between rounded-3xl border border-[#E1E6EC] bg-white p-5 shadow-xs sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0044D3]">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-semibold text-[#64748B]">Mentor</span>
                  {isLoading ? (
                    <Skeleton className="mt-1 h-5 w-24" />
                  ) : (
                    <h2 className="mt-0.5 truncate text-sm font-bold text-[#0F172A] sm:text-base">
                      {mentor?.name ?? 'Kaustuv Das'}
                    </h2>
                  )}
                </div>
              </div>
              <p
                className="mt-3 truncate text-xs text-[#94A3B8]"
                title={mentor?.email ?? 'kaustuv@techeniac.com'}
              >
                {mentor?.email ?? 'kaustuv@techeniac.com'}
              </p>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* ROW 2: Your Learning Progress (7 cols) + Upcoming (5 cols)        */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Your Learning Progress */}
          <div className="flex flex-col justify-between rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs sm:p-7 lg:col-span-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BarChartIcon className="h-5 w-5 text-[#0044D3]" />
                <h2 className="text-base font-bold text-[#0F172A] sm:text-lg">
                  Your Learning Progress
                </h2>
              </div>
              <Link
                href="/mentee/progress"
                className="group flex items-center gap-1.5 text-xs font-semibold text-[#0044D3] hover:underline sm:text-sm"
              >
                <span>View Details</span>
                <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
              {/* Circular Gauge */}
              <div className="relative flex flex-shrink-0 items-center justify-center">
                <svg className="h-28 w-28 -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#EFF6FF"
                    strokeWidth="9"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#0044D3"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={251.3}
                    strokeDashoffset={251.3 - (overallProgress / 100) * 251.3}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl leading-tight font-black text-[#0F172A] sm:text-2xl">
                    {overallProgress}%
                  </span>
                  <span className="text-[11px] font-semibold text-[#64748B]">Complete</span>
                </div>
              </div>

              {/* Horizontal Bar & Legend */}
              <div className="w-full flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F172A] sm:text-sm">
                    Overall Progress
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EFF6FF]">
                  <div
                    className="h-full rounded-full bg-[#0044D3] transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-semibold text-[#334155] sm:gap-4">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <BookIcon className="h-3.5 w-3.5 text-slate-500" />
                    <span>{completedCount} Completed</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <ClockIcon className="h-3.5 w-3.5 text-slate-500" />
                    <span>{inProgressCount} In Progress</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1.5 text-rose-600">
                    <AlertIcon className="h-3.5 w-3.5 text-rose-500" />
                    <span>{overdueCount} Overdue</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Card */}
          <div className="flex flex-col justify-between rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs sm:p-7 lg:col-span-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="h-5 w-5 text-[#0044D3]" />
                <h2 className="text-base font-bold text-[#0F172A] sm:text-lg">Upcoming</h2>
              </div>
              <Link
                href="/mentee/assignments"
                className="group flex items-center gap-1.5 text-xs font-semibold text-[#0044D3] hover:underline sm:text-sm"
              >
                <span>View All</span>
                <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
                  <span className="text-xl leading-none font-black text-[#0F172A] sm:text-2xl">
                    {upcomingItem.day}
                  </span>
                  <span className="mt-0.5 text-[10px] font-bold tracking-wider text-[#64748B] uppercase">
                    {upcomingItem.month}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3
                    className="truncate text-sm font-bold text-[#0F172A] sm:text-base"
                    title={upcomingItem.title}
                  >
                    {upcomingItem.title}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-[#64748B]">
                    <ClockIcon className="h-3.5 w-3.5 text-[#94A3B8]" />
                    <span>{upcomingItem.subtitle}</span>
                  </p>
                </div>
              </div>

              <Link
                href={upcomingItem.link}
                className="flex-shrink-0 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-[#0044D3] transition-colors hover:bg-blue-100"
              >
                View Assignment
              </Link>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* ROW 3: My Courses (7 cols) + Quick Actions (5 cols)                */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* My Courses */}
          <div className="flex flex-col justify-between rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs sm:p-7 lg:col-span-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookIcon className="h-5 w-5 text-[#0044D3]" />
                <h2 className="text-base font-bold text-[#0F172A] sm:text-lg">My Courses</h2>
              </div>
              <Link
                href="/mentee/courses"
                className="group flex items-center gap-1.5 text-xs font-semibold text-[#0044D3] hover:underline sm:text-sm"
              >
                <span>View All</span>
                <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {displayCourses.map((c) => (
                <Link
                  key={c.id}
                  href={c.href}
                  className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-100 bg-white p-3.5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
                >
                  <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#EFF6FF] to-[#E0E7FF] p-3 transition-transform group-hover:scale-[1.02] sm:h-26">
                    {c.graphicType === 'code' && <LaptopCodeIllustration />}
                    {c.graphicType === 'data' && <DataScienceIllustration />}
                    {c.graphicType === 'react' && <ReactAtomIllustration />}
                  </div>

                  <div className="mt-3">
                    <h3
                      className="truncate text-xs font-bold text-[#0F172A] transition-colors group-hover:text-[#0044D3] sm:text-sm"
                      title={c.title}
                    >
                      {c.title}
                    </h3>
                    <p className="mt-0.5 text-[11px] font-medium text-[#64748B]">{c.subtitle}</p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#EFF6FF]">
                      <div
                        className="h-full rounded-full bg-[#0044D3] transition-all duration-500"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-[#0044D3] via-[#0039B3] to-[#4338CA] p-6 text-white shadow-md sm:p-7 lg:col-span-5">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LightningIcon className="h-5 w-5 text-amber-300" />
                  <h2 className="text-base font-bold text-white sm:text-lg">Quick Actions</h2>
                </div>
                <Link
                  href="/mentee/courses"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white shadow-xs backdrop-blur-xs transition-all hover:scale-105 hover:bg-white/30"
                  aria-label="View Courses"
                >
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-1 text-xs text-blue-100/90">Get things done faster</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link
                href="/mentee/assignments"
                className="group flex items-center gap-2.5 rounded-2xl bg-white p-3 text-[#0F172A] shadow-xs transition-all hover:bg-blue-50/70 hover:shadow-md sm:p-3.5"
              >
                <DocumentTextIcon className="h-4 w-4 flex-shrink-0 text-[#0044D3]" />
                <span className="truncate text-xs font-bold">View Assignments</span>
              </Link>

              <Link
                href="/mentee/progress"
                className="group flex items-center gap-2.5 rounded-2xl bg-white p-3 text-[#0F172A] shadow-xs transition-all hover:bg-blue-50/70 hover:shadow-md sm:p-3.5"
              >
                <BarChartIcon className="h-4 w-4 flex-shrink-0 text-[#0044D3]" />
                <span className="truncate text-xs font-bold">Check Progress</span>
              </Link>

              <Link
                href="/mentee/courses"
                className="group flex items-center gap-2.5 rounded-2xl bg-white p-3 text-[#0F172A] shadow-xs transition-all hover:bg-blue-50/70 hover:shadow-md sm:p-3.5"
              >
                <BookIcon className="h-4 w-4 flex-shrink-0 text-[#0044D3]" />
                <span className="truncate text-xs font-bold">Browse Courses</span>
              </Link>

              <Link
                href="/mentee/performance"
                className="group flex items-center gap-2.5 rounded-2xl bg-white p-3 text-[#0F172A] shadow-xs transition-all hover:bg-blue-50/70 hover:shadow-md sm:p-3.5"
              >
                <TrophyIcon className="h-4 w-4 flex-shrink-0 text-[#0044D3]" />
                <span className="truncate text-xs font-bold">View Performance</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* ROW 4: Recent Activity (12 cols)                                  */}
        {/* ================================================================ */}
        <div className="rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs sm:p-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ClockIcon className="h-5 w-5 text-[#0044D3]" />
              <h2 className="text-base font-bold text-[#0F172A] sm:text-lg">Recent Activity</h2>
            </div>
            <Link
              href="/mentee/performance"
              className="group flex items-center gap-1.5 text-xs font-semibold text-[#0044D3] hover:underline sm:text-sm"
            >
              <span>View All</span>
              <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {displayRecentActivities.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-50 bg-[#F8FAFC] p-3.5 transition-colors hover:bg-slate-50 sm:p-4"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircleIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-[#0F172A]">{act.title}</h3>
                    <p className="mt-0.5 truncate text-xs text-[#64748B]">{act.subtitle}</p>
                  </div>
                </div>

                <span className="flex-shrink-0 rounded-full border border-emerald-200/60 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {act.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </DashboardContent>
    </div>
  );
}

'use client';

import Link from 'next/link';
import React from 'react';

import { LatestSubmissionsWidget } from '@/components/app/dashboard/LatestSubmissionsWidget';
import { MenteeTableRow } from '@/components/app/mentees/MenteeTableRow';
import { MENTOR_PORTAL_NAV } from '@/components/app/navigation/portal-nav.config';
import { PortalSessionState } from '@/components/app/navigation/PortalSessionState';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { H1, H2, H3, P, Span } from '@/components/ui/Typography';
import { useMentorBatches, useMentorMentees } from '@/hooks/useBatches';
import { useMentorDashboard } from '@/hooks/useDashboard';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import type { ApiBatchSummary } from '@/services/batches.service';

function getBatchStatusBadgeClass(status: string): string {
  switch (status) {
    case 'LIVE':
      return 'bg-emerald-100 text-emerald-800';
    case 'DRAFT':
      return 'bg-blue-100 text-blue-800';
    case 'ON_HOLD':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-slate-200 text-slate-700';
  }
}

function MentorBatchesTable({
  isLoading,
  batches,
}: Readonly<{
  isLoading: boolean;
  batches: ApiBatchSummary[];
}>) {
  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 border-b border-[#E1E6EC]/60 py-3.5 last:border-0"
          >
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="p-8 text-center">
        <P className="text-base font-semibold text-[#111827]">No Cohorts Assigned</P>
        <P className="mt-1 text-sm text-[#667085]">
          You are not currently assigned to any cohorts. An administrator will assign you to an
          upcoming batch.
        </P>
      </div>
    );
  }

  return (
    <TableContainer className="rounded-none border-0 shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Batch Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Schedule Window</TableHead>
            <TableHead className="text-right">Mentees</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((batch) => (
            <TableRow key={batch.id}>
              <TableCell>
                <P className="text-base font-bold text-[#111827]">{batch.name}</P>
              </TableCell>
              <TableCell>
                <Span className="inline-block rounded-md border border-[#E1E6EC] bg-[#F6F8FC] px-2.5 py-1 font-mono text-xs font-bold text-[#111827]">
                  {batch.code}
                </Span>
              </TableCell>
              <TableCell>
                <Span
                  className={`inline-block rounded-full px-3 py-1 font-mono text-xs font-bold uppercase ${getBatchStatusBadgeClass(
                    batch.status,
                  )}`}
                >
                  {batch.status}
                </Span>
              </TableCell>
              <TableCell className="font-mono text-sm text-[#667085]">
                {batch.startDate} → {batch.endDate}
              </TableCell>
              <TableCell className="text-right font-mono text-base font-bold text-[#111827]">
                {batch.menteesCount ?? 0}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function MentorMenteesTable({
  isLoading,
  mentees,
}: Readonly<{
  isLoading: boolean;
  mentees: Array<{
    id: string;
    name?: string;
    email?: string;
    batchName?: string;
    batchCode?: string;
    startDate?: string;
  }>;
}>) {
  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 border-b border-[#E1E6EC]/60 py-3.5 last:border-0"
          >
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-6 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (mentees.length === 0) {
    return (
      <div className="p-8 text-center">
        <P className="text-base font-semibold text-[#111827]">No Mentees Mapped</P>
        <P className="mt-1 text-sm text-[#667085]">
          You do not currently have any mentees mapped to you.
        </P>
      </div>
    );
  }

  return (
    <TableContainer className="rounded-none border-0 shadow-none">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mentee</TableHead>
            <TableHead>Cohort</TableHead>
            <TableHead>Cohort Code</TableHead>
            <TableHead className="text-right">Mapped Since</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mentees.map((mentee) => (
            <MenteeTableRow key={mentee.id} mentee={mentee} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

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

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header {...MENTOR_PORTAL_NAV} />

      <DashboardContent>
        {/* Welcome Section */}
        <div className="mb-8 rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <H1 className="text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
                Welcome, {user.name}
              </H1>
              <P className="mt-1 text-sm font-medium text-[#667085]">{user.email}</P>
            </div>

            <div className="rounded-2xl border border-[#E1E6EC] bg-[#F6F8FC] p-4 text-xs sm:min-w-64">
              <Span className="block text-xs font-bold tracking-wider text-[#667085] uppercase">
                Assigned Role
              </Span>
              <Span className="mt-1 block text-base font-bold text-[#111827]">{user.role}</Span>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {batchesError || menteesError || dashboardError ? (
          <div className="mb-6">
            <Alert
              variant="error"
              title="Error Loading Cohort Data"
              message={
                batchesError?.message ||
                menteesError?.message ||
                dashboardError?.message ||
                'An error occurred while fetching your assigned cohort information.'
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
                <H2 className="text-lg font-bold text-[#111827]">
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
                    className="inline-flex items-center rounded-xl bg-[#0044D3] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Explore Course Library →
                  </Link>
                  <Link
                    href="/mentor/my-performance"
                    className="inline-flex items-center rounded-xl border border-[#E1E6EC] bg-white px-4 py-2 text-xs font-semibold text-[#111827] transition-colors hover:bg-[#F6F8FC]"
                  >
                    View My Learning History →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Metric Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs">
            <Span className="block text-xs font-bold tracking-wider text-[#667085] uppercase">
              Assigned Cohorts
            </Span>
            <P className="mt-1 font-mono text-3xl font-bold text-[#111827]">
              {isLoadingBatches ? '—' : batches.length}
            </P>
          </div>
          <div className="rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs">
            <Span className="block text-xs font-bold tracking-wider text-[#667085] uppercase">
              Mapped Mentees
            </Span>
            <P className="mt-1 font-mono text-3xl font-bold text-[#111827]">
              {isLoadingMentees ? '—' : mentees.length}
            </P>
          </div>
          <div className="col-span-2 rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs lg:col-span-1">
            <Span className="block text-xs font-bold tracking-wider text-[#667085] uppercase">
              Live Cohorts
            </Span>
            <P className="mt-1 font-mono text-3xl font-bold text-[#0044D3]">
              {isLoadingBatches ? '—' : liveBatchesCount}
            </P>
          </div>
        </div>

        {/* Section 1: Assigned Batches */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-[#E1E6EC] bg-white shadow-xs">
          <div className="border-b border-[#E1E6EC] p-5">
            <H2 className="text-xl font-bold text-[#111827]">Assigned Cohorts</H2>
          </div>

          <MentorBatchesTable isLoading={isLoadingBatches} batches={batches} />
        </div>

        {/* Section 2: Mapped Mentees */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-[#E1E6EC] bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E1E6EC] p-5">
            <H2 className="text-xl font-bold text-[#111827]">Your Mapped Mentees</H2>
            <Link
              href="/mentor/mentees"
              className="font-mono text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              View All Mentees →
            </Link>
          </div>

          <MentorMenteesTable isLoading={isLoadingMentees} mentees={mentees} />
        </div>

        {/* Section 3: Latest Submissions Widget (FR-10.1, REV-01) */}
        <div className="mb-8">
          <LatestSubmissionsWidget />
        </div>

        {/* Action Areas */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Card 1: Submission Reviews */}
          <Link
            href="/mentor/submissions"
            className="group flex flex-col justify-between rounded-xl border border-blue-200 bg-blue-50/50 p-5 shadow-xs transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between">
                <Span className="text-[10px] font-bold tracking-wider text-blue-700 uppercase">
                  Grading Queue
                </Span>
                <Span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                  Active
                </Span>
              </div>
              <H3 className="mt-2 text-base font-bold text-slate-900 transition-colors group-hover:text-blue-700">
                Submission Queue & Reviews
              </H3>
              <P className="mt-1 text-xs leading-relaxed text-slate-600">
                Filter and review student submissions, give marks and feedback, or request
                resubmissions.
              </P>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-blue-100 pt-3">
              <Span className="text-[11px] font-semibold text-blue-700 group-hover:underline">
                Open Submission Queue &rarr;
              </Span>
            </div>
          </Link>

          {/* Card 2: Course Allocations */}
          <Link
            href="/mentor/allocations"
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
              <H3 className="mt-4 text-base font-bold text-[#111827] transition-colors group-hover:text-[#0044D3]">
                Course Allocations
              </H3>
              <P className="mt-1 text-xs text-[#667085]">
                Manage mentee track assignments, pacing, and completion schedules.
              </P>
            </div>
          </Link>

          {/* Card 3: Progress Tracker */}
          <Link
            href="/mentor/progress"
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
              <H3 className="mt-4 text-base font-bold text-[#111827] transition-colors group-hover:text-[#0044D3]">
                Learning Progress
              </H3>
              <P className="mt-1 text-xs text-[#667085]">
                Monitor real-time cohort milestone velocity and individual mentee pace.
              </P>
            </div>
          </Link>

          {/* Card 4: My Performance (FR-11.5, DSH-02) */}
          <Link
            href="/mentor/my-performance"
            className="group flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs transition-all duration-200 hover:border-[#0044D3] hover:bg-white hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-[#0044D3] group-hover:text-white">
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
                      d="M12 14l9-5-9-5-9 5 9 5z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
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
              <H3 className="mt-4 text-base font-bold text-[#111827] transition-colors group-hover:text-[#0044D3]">
                My Performance
              </H3>
              <P className="mt-1 text-xs text-[#667085]">
                View your personal learning history, completed tracks, and grades from when you were
                a mentee.
              </P>
            </div>
          </Link>
        </div>
      </DashboardContent>
    </div>
  );
}

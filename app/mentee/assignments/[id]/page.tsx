'use client';

import Link from 'next/link';
import React, { Suspense, use } from 'react';

import { MENTEE_ASSIGNMENTS_NAV } from '@/components/app/navigation/portal-nav.config';
import { PortalSessionState } from '@/components/app/navigation/PortalSessionState';
import { AssignmentSubmissionForm } from '@/components/app/submissions/AssignmentSubmissionForm';
import { SubmissionVersionHistory } from '@/components/app/submissions/SubmissionVersionHistory';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { H1, H2, H3, P, Span } from '@/components/ui/Typography';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import { useAssignmentSubmissionDetails } from '@/hooks/useSubmissions';
import { formatDateTimeIST } from '@/lib/date';
import { AssignmentScope } from '@/types/courses';

interface PageProps {
  params: Promise<{ id: string }>;
}

function MenteeAssignmentDetailContent({ params }: Readonly<PageProps>) {
  const { id } = use(params);
  const { user, isAuthorized, sessionError } = useRoleRedirect({ allowedRoles: ['MENTEE'] });

  const { assignment, allocation, versions, isLoading, error, refetch } =
    useAssignmentSubmissionDetails(id);

  if (!isAuthorized || !user) {
    return (
      <PortalSessionState
        sessionError={sessionError}
        loadingMessage="Loading assignment workspace..."
        variant="mentee"
      />
    );
  }

  const latestVersion =
    versions.length > 0 ? ([...versions].sort((a, b) => b.version - a.version)[0] ?? null) : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F8FC] text-[#111827]">
      <Header {...MENTEE_ASSIGNMENTS_NAV} />

      <DashboardContent className="space-y-6">
        {/* Back Link Navigation */}
        <div>
          <Link
            href="/mentee/assignments"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#111827] transition-colors hover:text-[#0044D3]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Assignments
          </Link>
        </div>

        {error ? (
          <ErrorMessage
            error={error}
            title="Failed to load assignment"
            onRetry={() => {
              void refetch();
            }}
          />
        ) : null}

        {isLoading || !assignment || !allocation ? (
          <div className="rounded-3xl border border-[#E1E6EC] bg-white p-12 text-center shadow-xs">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0044D3] border-r-transparent" />
            <P className="mt-3 text-xs text-[#667085]">
              Loading assignment details and submission history...
            </P>
          </div>
        ) : (
          <div className="animate-slide-up space-y-6">
            {/* 1. Assignment Overview Card (Image 2 style) */}
            <div className="flex flex-col justify-between gap-6 rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs lg:flex-row lg:items-center">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0044D3]">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="space-y-1.5">
                  <Span className="inline-block rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-[#0044D3]">
                    {assignment.scope === AssignmentScope.COURSE ? 'Course Scope' : 'Topic Scope'}
                  </Span>
                  <H1 className="text-2xl font-bold tracking-tight text-[#111827]">
                    {assignment.title}
                  </H1>
                  <div className="flex items-center gap-2 text-xs font-medium text-[#667085]">
                    <svg
                      className="h-4 w-4 text-[#667085]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                    <Span>
                      {assignment.course?.title || assignment.courseId}
                      {assignment.topic?.title || assignment.topicId
                        ? ` • ${assignment.topic?.title || assignment.topicId}`
                        : ''}
                    </Span>
                  </div>
                </div>
              </div>

              {/* Due Date & Estimated Time & Status Badge */}
              <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-[#E1E6EC] bg-[#F8FAFC] px-6 py-4 text-xs">
                <div className="flex items-center gap-3">
                  <svg
                    className="h-5 w-5 text-[#667085]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <Span className="block text-[11px] text-[#667085]">Due Date</Span>
                    <Span className="font-semibold text-[#111827]">
                      {formatDateTimeIST(allocation.dueDate)}
                    </Span>
                  </div>
                </div>

                <div className="hidden h-8 w-px bg-[#E1E6EC] sm:block" />

                <div className="flex items-center gap-3">
                  <svg
                    className="h-5 w-5 text-[#667085]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <Span className="block text-[11px] text-[#667085]">Estimated Time</Span>
                    <Span className="font-semibold text-[#111827]">
                      {assignment.estimatedMinutes} mins
                    </Span>
                  </div>
                </div>

                <div className="hidden h-8 w-px bg-[#E1E6EC] sm:block" />

                <div>
                  {assignment.allowLate ? (
                    <Span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <Span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Open
                    </Span>
                  ) : (
                    <Span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                      <svg
                        className="h-3.5 w-3.5 text-rose-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        />
                      </svg>
                      Blocked
                    </Span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Instructions Card */}
            <div className="rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-[#111827]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <H2 className="text-base font-bold text-[#111827]">Instructions</H2>
              </div>
              {assignment.instructions ? (
                <div className="mt-3 text-xs leading-relaxed text-[#111827]">
                  <P className="whitespace-pre-wrap">{assignment.instructions}</P>
                </div>
              ) : (
                <P className="mt-3 text-xs text-[#667085]">
                  No specific instructions provided for this assignment.
                </P>
              )}

              {/* Reference Materials if any */}
              {Array.isArray(assignment.resources) && assignment.resources.length > 0 ? (
                <div className="mt-4 border-t border-[#E1E6EC]/60 pt-4">
                  <H3 className="text-xs font-bold tracking-wider text-[#667085] uppercase">
                    Reference Materials
                  </H3>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {assignment.resources.map((res) => (
                      <a
                        key={res.url}
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-xl border border-[#E1E6EC] p-2.5 text-xs text-[#0044D3] transition-colors hover:border-[#0044D3]/40 hover:bg-blue-50/50"
                      >
                        <Span className="truncate font-medium text-[#111827]">{res.title}</Span>
                        <Span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-[#667085] uppercase">
                          {res.type} ↗
                        </Span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* 3. Submissions Closed Alert (Image 2 style) */}
            {(!allocation.isBatchActive || allocation.batchStatus === 'ON_HOLD') && (
              <div className="flex items-center gap-3.5 rounded-2xl border border-amber-200 bg-[#FEF9EE] p-5 shadow-xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <H3 className="text-sm font-bold text-[#111827]">Submissions Closed</H3>
                  <P className="text-xs text-[#667085]">
                    This assignment is part of a batch with status &quot;{allocation.batchStatus}
                    &quot;. Submissions are closed.
                  </P>
                </div>
              </div>
            )}

            {/* Submission Form Component */}
            <AssignmentSubmissionForm
              assignment={assignment}
              dueDate={allocation.dueDate}
              isBatchActive={allocation.isBatchActive}
              batchStatus={allocation.batchStatus}
              latestVersion={latestVersion}
              onSuccess={() => {
                void refetch();
              }}
            />

            {/* Submission Version History */}
            <SubmissionVersionHistory versions={versions} maxMarks={assignment.maxMarks} />
          </div>
        )}
      </DashboardContent>
    </div>
  );
}

export default function MenteeAssignmentDetailPage({ params }: Readonly<PageProps>) {
  return (
    <Suspense
      fallback={
        <PortalSessionState
          sessionError={null}
          loadingMessage="Loading assignment workspace..."
          variant="mentee"
        />
      }
    >
      <MenteeAssignmentDetailContent params={params} />
    </Suspense>
  );
}

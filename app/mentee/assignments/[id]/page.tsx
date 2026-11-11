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
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header {...MENTEE_ASSIGNMENTS_NAV} />

      <DashboardContent className="space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/mentee/assignments" className="font-medium hover:text-blue-600">
            ← Back to All Assignments
          </Link>
          <Span>/</Span>
          <Span className="truncate font-semibold text-slate-800">
            {assignment?.title ?? 'Assignment Workspace'}
          </Span>
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
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
            <P className="mt-3 text-xs text-slate-500">
              Loading assignment details and submission history...
            </P>
          </div>
        ) : (
          <div className="animate-slide-up space-y-8">
            {/* Assignment Overview Card */}
            <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-start">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                      {assignment.scope === AssignmentScope.COURSE ? 'Course Scope' : 'Topic Scope'}
                    </Span>
                    <Span className="text-xs text-slate-400">
                      {assignment.scope === AssignmentScope.COURSE
                        ? 'Final Capstone'
                        : 'Topic Assignment'}
                    </Span>
                  </div>
                  <H1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {assignment.title}
                  </H1>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#667085]">
                    <Span className="font-semibold text-[#111827]">
                      {assignment.course?.title || 'Curriculum Course'}
                    </Span>
                    {assignment.topic?.title ? (
                      <>
                        <Span>•</Span>
                        <Span>{assignment.topic.title}</Span>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Deadlines and Marks Panel */}
                <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs md:min-w-[240px]">
                  <div>
                    <Span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                      Due Date (IST Standard)
                    </Span>
                    <Span className="mt-0.5 block font-bold text-slate-900">
                      {formatDateTimeIST(allocation.dueDate)}
                    </Span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-2 text-[11px]">
                    <div>
                      <Span className="text-slate-400">Estimated Time:</Span>
                      <Span className="block font-semibold text-slate-800">
                        {assignment.estimatedMinutes} mins
                      </Span>
                    </div>
                    <div>
                      <Span className="text-slate-400">Max Marks:</Span>
                      <Span className="block font-semibold text-slate-800">
                        {assignment.maxMarks}
                      </Span>
                    </div>
                  </div>
                  <div className="border-t border-slate-200/60 pt-2 text-[11px]">
                    <Span className="text-slate-400">Late Submissions:</Span>{' '}
                    <Span
                      className={
                        assignment.allowLate
                          ? 'font-semibold text-emerald-600'
                          : 'font-semibold text-rose-600'
                      }
                    >
                      {assignment.allowLate ? 'Allowed (Flagged)' : 'Blocked'}
                    </Span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <H2 className="text-sm font-bold tracking-wider text-slate-700 uppercase">
                  Instructions
                </H2>
                {assignment.instructions ? (
                  <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs leading-relaxed text-slate-700">
                    <P className="whitespace-pre-wrap">{assignment.instructions}</P>
                  </div>
                ) : (
                  <P className="mt-2 text-xs text-slate-400 italic">
                    No specific instructions provided for this assignment.
                  </P>
                )}
              </div>

              {/* Learning Resources */}
              {Array.isArray(assignment.resources) && assignment.resources.length > 0 ? (
                <div>
                  <H3 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                    Reference Materials
                  </H3>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {assignment.resources.map((res) => (
                      <a
                        key={res.url}
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-lg border border-slate-200 p-2.5 text-xs text-blue-600 hover:bg-blue-50/50"
                      >
                        <Span className="truncate font-medium text-slate-800">{res.title}</Span>
                        <Span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                          {res.type} ↗
                        </Span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

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

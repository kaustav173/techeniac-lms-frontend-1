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

      <DashboardContent className="space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-[#667085]">
          <Link href="/mentee/assignments" className="font-medium hover:text-[#0044D3]">
            ← Back to All Assignments
          </Link>
          <Span>/</Span>
          <Span className="truncate font-semibold text-[#111827]">
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
          <div className="rounded-3xl border border-[#E1E6EC] bg-white p-12 text-center shadow-xs">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0044D3] border-r-transparent" />
            <P className="mt-3 text-xs text-[#667085]">
              Loading assignment details and submission history...
            </P>
          </div>
        ) : (
          <div className="animate-slide-up space-y-8">
            {/* Assignment Overview Card */}
            <div className="space-y-6 rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs sm:p-8">
              <div className="flex flex-col justify-between gap-4 border-b border-[#E1E6EC] pb-6 md:flex-row md:items-start">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#0044D3]">
                      {assignment.scope === AssignmentScope.COURSE ? 'Course Scope' : 'Topic Scope'}
                    </Span>
                    <Span className="text-xs text-[#667085]">
                      {assignment.scope === AssignmentScope.COURSE
                        ? 'Final Capstone'
                        : 'Topic Assignment'}
                    </Span>
                  </div>
                  <H1 className="text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">
                    {assignment.title}
                  </H1>
                  <P className="text-xs text-[#667085]">
                    Course:{' '}
                    <Span className="text-[#111827]">
                      {assignment.course?.title || assignment.courseId}
                    </Span>
                    {assignment.topic?.title || assignment.topicId ? (
                      <>
                        {' '}
                        • Topic:{' '}
                        <Span className="text-[#111827]">
                          {assignment.topic?.title || assignment.topicId}
                        </Span>
                      </>
                    ) : null}
                  </P>
                </div>

                {/* Deadlines and Marks Panel */}
                <div className="flex flex-col gap-2 rounded-2xl border border-[#E1E6EC] bg-[#F6F8FC] p-4 text-xs md:min-w-[240px]">
                  <div>
                    <Span className="block text-[10px] font-semibold tracking-wider text-[#667085] uppercase">
                      Due Date (IST Standard)
                    </Span>
                    <Span className="mt-0.5 block font-bold text-[#111827]">
                      {formatDateTimeIST(allocation.dueDate)}
                    </Span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t border-[#E1E6EC] pt-2 text-[11px]">
                    <div>
                      <Span className="text-[#667085]">Estimated Time:</Span>
                      <Span className="block font-semibold text-[#111827]">
                        {assignment.estimatedMinutes} mins
                      </Span>
                    </div>
                    <div>
                      <Span className="text-[#667085]">Max Marks:</Span>
                      <Span className="block font-semibold text-[#111827]">
                        {assignment.maxMarks}
                      </Span>
                    </div>
                  </div>
                  <div className="border-t border-[#E1E6EC] pt-2 text-[11px]">
                    <Span className="text-[#667085]">Late Submissions:</Span>{' '}
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
                <H2 className="text-sm font-bold tracking-wider text-[#111827] uppercase">
                  Instructions
                </H2>
                {assignment.instructions ? (
                  <div className="mt-2 rounded-2xl border border-[#E1E6EC] bg-[#F6F8FC] p-4 text-xs leading-relaxed text-[#111827]">
                    <P className="whitespace-pre-wrap">{assignment.instructions}</P>
                  </div>
                ) : (
                  <P className="mt-2 text-xs text-[#667085] italic">
                    No specific instructions provided for this assignment.
                  </P>
                )}
              </div>

              {/* Learning Resources */}
              {Array.isArray(assignment.resources) && assignment.resources.length > 0 ? (
                <div>
                  <H3 className="text-xs font-bold tracking-wider text-[#111827] uppercase">
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

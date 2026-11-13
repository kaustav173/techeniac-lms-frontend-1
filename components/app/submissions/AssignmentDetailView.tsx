'use client';

import React from 'react';

import { AssignmentSubmissionForm } from '@/components/app/submissions/AssignmentSubmissionForm';
import { SubmissionVersionHistory } from '@/components/app/submissions/SubmissionVersionHistory';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { H1, H2, H3, P, Span } from '@/components/ui/Typography';
import { formatDateTimeIST } from '@/lib/date';
import { AssignmentScope } from '@/types/courses';
import {
  type AssignmentSubmissionDetails,
  isAllocationBatchReadOnly,
  type SubmissionVersion,
} from '@/types/submissions';

export interface AssignmentDetailViewProps {
  readonly assignment: AssignmentSubmissionDetails['assignment'] | null;
  readonly allocation: AssignmentSubmissionDetails['allocation'] | null;
  readonly versions: SubmissionVersion[];
  readonly isLoading: boolean;
  readonly error?: string | null | undefined;
  readonly onRetry?: (() => void) | undefined;
  readonly onSuccess?: (() => void) | undefined;
}

export function AssignmentDetailView({
  assignment,
  allocation,
  versions,
  isLoading,
  error,
  onRetry,
  onSuccess,
}: AssignmentDetailViewProps) {
  if (error) {
    return <ErrorMessage error={error} title="Failed to load assignment" onRetry={onRetry} />;
  }

  if (isLoading || !assignment || !allocation) {
    return (
      <div className="rounded-3xl border border-[#E1E6EC] bg-white p-12 text-center shadow-xs">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0044D3] border-r-transparent" />
        <P className="mt-3 text-xs text-[#667085]">
          Loading assignment details and submission history...
        </P>
      </div>
    );
  }

  const latestVersion =
    versions.length > 0 ? ([...versions].sort((a, b) => b.version - a.version)[0] ?? null) : null;

  const isBatchReadOnly = isAllocationBatchReadOnly(
    allocation.isBatchActive,
    allocation.batchStatus,
  );

  return (
    <div className="animate-slide-up space-y-6">
      {/* 1. Assignment Overview Card */}
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
            <H1 className="text-2xl font-bold tracking-tight text-[#111827]">{assignment.title}</H1>
            <div className="flex items-center gap-2 text-xs font-medium text-[#667085]">
              <svg
                className="h-4 w-4 text-[#667085]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <Span>Due: {formatDateTimeIST(allocation.dueDate)}</Span>
            </div>
          </div>
        </div>

        {/* Quick Assignment Metrics */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-[#E1E6EC] bg-[#F6F8FC] px-4 py-3 text-center">
            <P className="text-[11px] font-semibold text-[#667085] uppercase">Passing Marks</P>
            <P className="mt-0.5 text-base font-bold text-[#111827]">
              {assignment.passMarks ?? 'None'}
            </P>
          </div>
          <div className="rounded-2xl border border-[#E1E6EC] bg-[#F6F8FC] px-4 py-3 text-center">
            <P className="text-[11px] font-semibold text-[#667085] uppercase">Total Marks</P>
            <P className="mt-0.5 text-base font-bold text-[#111827]">{assignment.maxMarks}</P>
          </div>
          <div className="rounded-2xl border border-[#E1E6EC] bg-[#F6F8FC] px-4 py-3 text-center">
            <P className="text-[11px] font-semibold text-[#667085] uppercase">Late Submission</P>
            <P
              className={`mt-0.5 text-base font-bold ${
                assignment.allowLate ? 'text-amber-600' : 'text-[#667085]'
              }`}
            >
              {assignment.allowLate ? 'Allowed' : 'Blocked'}
            </P>
          </div>
        </div>
      </div>

      {/* 2. Instructions & Resources Section */}
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

      {/* 3. Submissions Closed Alert */}
      {isBatchReadOnly && (
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
        onSuccess={onSuccess}
      />

      {/* Submission Version History */}
      <SubmissionVersionHistory versions={versions} maxMarks={assignment.maxMarks} />
    </div>
  );
}

'use client';

import React, { useState } from 'react';

import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Select } from '@/components/ui/Select';
import { H2, H3, P, Span } from '@/components/ui/Typography';
import { formatDateIST } from '@/lib/date';
import type { LearningHistoryResult } from '@/services/performance.service';

interface LearningHistoryViewProps {
  readonly history: LearningHistoryResult | undefined;
  readonly isLoading?: boolean;
  readonly isMentorPastView?: boolean;
  readonly isError?: boolean;
  readonly error?: unknown;
  readonly onRetry?: () => void;
}

export function LearningHistoryView({
  history,
  isLoading = false,
  isMentorPastView = false,
  isError = false,
  error,
  onRetry,
}: LearningHistoryViewProps) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL');

  if (isError) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
        <ErrorMessage error={error} onRetry={onRetry} />
      </div>
    );
  }

  if (isLoading || !history) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-28 animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-xs" />
        <div className="h-64 animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-xs" />
      </div>
    );
  }

  const { batches, summary, user } = history;

  // Empty state handling (PER-06, PER-08)
  if (batches.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <H3 className="mt-4 text-base font-bold text-slate-800">
          {isMentorPastView
            ? 'No Past Mentee History Found'
            : 'No Course Allocations or Grades Yet'}
        </H3>
        <P className="mx-auto mt-2 max-w-md text-xs text-slate-500">
          {isMentorPastView
            ? 'You do not have any past course allocations or submission records from when you were enrolled as a mentee.'
            : 'Your assigned curriculum, progress tracker, and assignment grades will appear here once allocated.'}
        </P>
      </div>
    );
  }

  // Filter by selected batch (PER-09)
  const displayedBatches =
    selectedBatchId === 'ALL' ? batches : batches.filter((b) => b.batchId === selectedBatchId);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header Overview Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Allocations */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <Span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Courses Assigned
          </Span>
          <H3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {summary.totalAllocations}
          </H3>
          <P className="mt-1 text-xs text-slate-500">
            {summary.completedAllocations} of {summary.totalAllocations} completed
          </P>
        </div>

        {/* Overall Progress */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <Span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Overall Curriculum Progress
          </Span>
          <H3 className="mt-2 text-3xl font-bold tracking-tight text-blue-600">
            {summary.overallProgress}%
          </H3>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${Math.min(100, Math.max(0, summary.overallProgress))}%` }}
            />
          </div>
        </div>

        {/* Average Score */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <Span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Overall Average Grade
          </Span>
          <H3 className="mt-2 text-3xl font-bold tracking-tight text-emerald-600">
            {summary.averageMarks !== null ? summary.averageMarks : '—'}
          </H3>
          <P className="mt-1 text-xs text-slate-500">Cumulative graded assignment score</P>
        </div>

        {/* Profile Context */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <Span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Learner Profile
          </Span>
          <H3 className="mt-2 truncate text-lg font-bold text-slate-900">{user.name}</H3>
          <P className="truncate text-xs text-slate-500">{user.email}</P>
        </div>
      </div>

      {/* 2. Batch Selector Filter (PER-09) */}
      {batches.length > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
          <Span className="text-xs font-medium text-slate-600">
            Filter learning history by batch:
          </Span>
          <div className="w-56">
            <Select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="h-8 text-xs font-semibold"
            >
              <option value="ALL">All Enrolled Batches</option>
              {batches.map((b) => (
                <option key={b.batchId} value={b.batchId}>
                  {b.batchName} ({b.status})
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {/* 3. Batch Sections & Course Allocations */}
      {displayedBatches.map((batch) => (
        <section
          key={batch.batchId}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs"
        >
          {/* Batch Header Bar */}
          <div className="flex flex-col gap-1 border-b border-slate-200 bg-slate-50/75 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <H2 className="text-base font-bold text-slate-900">{batch.batchName}</H2>
              <P className="text-xs text-slate-500">
                Started {formatDateIST(batch.startDate)}
                {batch.endDate && ` • Completed ${formatDateIST(batch.endDate)}`}
              </P>
            </div>
            <Span className="inline-flex w-fit items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
              Batch Status: {batch.status}
            </Span>
          </div>

          {/* Allocations under this Batch */}
          <div className="divide-y divide-slate-100 p-6">
            {batch.courseAllocations.map((alloc) => (
              <div key={alloc.allocationId} className="py-6 first:pt-0 last:pb-0">
                {/* Course Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <H3 className="text-sm font-bold text-slate-900">{alloc.courseTitle}</H3>
                    <P className="text-xs text-slate-500">
                      Assigned: {formatDateIST(alloc.startDate)} • Due:{' '}
                      {formatDateIST(alloc.dueDate)}
                      {alloc.completedAt && ` • Completed: ${formatDateIST(alloc.completedAt)}`}
                    </P>
                  </div>
                  <div className="flex items-center gap-3">
                    <Span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        alloc.status === 'COMPLETED'
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border border-blue-200 bg-blue-50 text-blue-700'
                      }`}
                    >
                      {alloc.status}
                    </Span>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{
                            width: `${Math.min(100, Math.max(0, alloc.progressPercent))}%`,
                          }}
                        />
                      </div>
                      <Span>{alloc.progressPercent}%</Span>
                    </div>
                  </div>
                </div>

                {/* Submissions Table for this Allocation */}
                {alloc.assignments.length > 0 ? (
                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/40">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="border-b border-slate-200 bg-slate-100/60 text-[10.5px] font-bold tracking-wider text-slate-500 uppercase">
                        <tr>
                          <th className="px-4 py-2.5">Assignment</th>
                          <th className="px-4 py-2.5">Submitted</th>
                          <th className="px-4 py-2.5 text-center">Version</th>
                          <th className="px-4 py-2.5 text-center">Score</th>
                          <th className="px-4 py-2.5 text-center">Grade</th>
                          <th className="px-4 py-2.5">Mentor Feedback</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {alloc.assignments.map((assign) => (
                          <tr key={assign.assignmentId} className="bg-white">
                            <td className="px-4 py-3">
                              <Span className="font-semibold text-slate-900">
                                {assign.assignmentTitle}
                              </Span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                              <div className="flex flex-col">
                                <Span>{formatDateIST(assign.submittedAt)}</Span>
                                {assign.isLate && (
                                  <Span className="text-[10px] font-semibold text-rose-600">
                                    (Late Submission)
                                  </Span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-xs font-medium">
                              v{assign.version}
                            </td>
                            <td className="px-4 py-3 text-center text-xs font-bold text-slate-800">
                              {assign.marks !== null ? (
                                <Span>
                                  {assign.marks} / {assign.maxMarks}
                                </Span>
                              ) : (
                                <Span className="text-slate-400">Pending Review</Span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {assign.gradeLabel ? (
                                <Span className="inline-block w-8 rounded border border-emerald-200 bg-emerald-50 py-0.5 text-center text-xs font-bold text-emerald-700">
                                  {assign.gradeLabel}
                                </Span>
                              ) : (
                                <Span className="text-slate-400">—</Span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {assign.feedback ? (
                                <P className="text-xs whitespace-pre-wrap text-slate-700 italic">
                                  &ldquo;{assign.feedback}&rdquo;
                                </P>
                              ) : (
                                <Span className="text-xs text-slate-400">No feedback provided</Span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                    <P className="text-xs text-slate-400">
                      No assignments submitted for this course allocation yet.
                    </P>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

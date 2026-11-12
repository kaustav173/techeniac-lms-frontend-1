'use client';

import React, { useMemo, useState } from 'react';

import { getBatchStatusBadgeClass, isBatchStatus } from '@/components/app/batches/batchStatus';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import {
  SingleSelectDropdown,
  type SingleSelectOption,
} from '@/components/ui/SingleSelectDropdown';
import { Skeleton } from '@/components/ui/Skeleton';
import { H3, P, Span } from '@/components/ui/Typography';
import { formatDateIST } from '@/lib/date';
import type { LearningHistoryResult } from '@/services/performance.service';

interface LearningHistoryViewProps {
  readonly history: LearningHistoryResult | undefined;
  readonly isLoading?: boolean;
  readonly isMentorPastView?: boolean;
  readonly summaryOnly?: boolean;
  readonly hideSummary?: boolean;
  readonly isError?: boolean;
  readonly error?: unknown;
  readonly onRetry?: () => void;
}

function getStatusBadgeClass(status: string): string {
  const upper = status.toUpperCase();
  if (isBatchStatus(upper)) {
    return getBatchStatusBadgeClass(upper);
  }
  return 'border border-[#E1E6EC] bg-white text-[#475467]';
}

function LearningHistorySummaryCards({
  summary,
}: {
  readonly summary: LearningHistoryResult['summary'];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {/* Total Allocations */}
      <div className="flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs transition-shadow hover:shadow-md sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <Span className="block text-xs font-bold tracking-wider text-[#667085] uppercase">
              Courses Assigned
            </Span>
            <H3 className="mt-2 text-3xl font-extrabold tracking-tight text-[#111827]">
              {summary.totalAllocations}
            </H3>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0044D3]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <Span className="inline-flex w-fit items-center rounded-lg border border-[#E1E6EC] bg-[#F8FAFC] px-2.5 py-1 text-xs font-semibold text-[#475467]">
            {summary.completedAllocations} / {summary.totalAllocations} Completed
          </Span>
          <P className="text-xs text-[#667085]">
            {summary.totalAllocations > 0 &&
            summary.completedAllocations === summary.totalAllocations
              ? 'All courses fully completed'
              : 'Assigned curriculum courses'}
          </P>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs transition-shadow hover:shadow-md sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <Span className="block text-xs font-bold tracking-wider text-[#667085] uppercase">
              All Course Progress
            </Span>
            <H3 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0044D3]">
              {summary.overallProgress}%
            </H3>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0044D3]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E1E6EC]">
            <div
              className="h-full rounded-full bg-[#0044D3] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, summary.overallProgress))}%` }}
            />
          </div>
          <P className="text-xs text-[#667085]">
            {summary.overallProgress === 100
              ? 'All assigned curriculum completed'
              : `${100 - summary.overallProgress}% remaining to complete`}
          </P>
        </div>
      </div>

      {/* Average Score */}
      <div className="flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs transition-shadow hover:shadow-md sm:col-span-2 sm:p-6 xl:col-span-1">
        <div className="flex items-start justify-between">
          <div>
            <Span className="block text-xs font-bold tracking-wider text-[#667085] uppercase">
              Average Score
            </Span>
            <H3 className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-600">
              {summary.averageMarks !== null ? summary.averageMarks : '—'}
            </H3>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <Span className="inline-flex w-fit items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Cumulative Score
          </Span>
          <P className="text-xs text-[#667085]">Across graded assignments</P>
        </div>
      </div>
    </div>
  );
}

export function LearningHistoryView({
  history,
  isLoading = false,
  isMentorPastView = false,
  summaryOnly = false,
  hideSummary = false,
  isError = false,
  error,
  onRetry,
}: LearningHistoryViewProps) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL');
  const [collapsedBatches, setCollapsedBatches] = useState<Record<string, boolean>>({});
  const [collapsedCourses, setCollapsedCourses] = useState<Record<string, boolean>>({});

  const toggleBatch = (batchId: string) => {
    setCollapsedBatches((prev) => ({
      ...prev,
      [batchId]: !prev[batchId],
    }));
  };

  const toggleCourse = (allocationId: string) => {
    setCollapsedCourses((prev) => ({
      ...prev,
      [allocationId]: !prev[allocationId],
    }));
  };

  const rawBatches = history?.batches;
  const batches = useMemo(() => rawBatches ?? [], [rawBatches]);
  const summary = history?.summary;
  const user = history?.user;

  // Dropdown options for batch selector
  const batchOptions = useMemo<SingleSelectOption[]>(
    () => [
      { value: 'ALL', label: 'All' },
      ...batches.map((b) => ({
        value: b.batchId,
        label: `${b.batchName} (${b.status})`,
      })),
    ],
    [batches],
  );

  if (isError) {
    return (
      <div className="rounded-2xl border border-[#E1E6EC] bg-white p-8 shadow-xs">
        <ErrorMessage error={error} onRetry={onRetry} />
      </div>
    );
  }

  if (isLoading || !history || !summary || !user) {
    if (summaryOnly) {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs sm:p-6"
            >
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="mt-3 h-8 w-16 rounded-md" />
              <Skeleton className="mt-2 h-3.5 w-36 rounded-md" />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        {!hideSummary && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs sm:p-6"
              >
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="mt-3 h-8 w-16 rounded-md" />
                <Skeleton className="mt-2 h-3.5 w-36 rounded-md" />
              </div>
            ))}
          </div>
        )}
        <div className="h-64 rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="mt-4 h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Summary only mode (for dashboards)
  if (summaryOnly) {
    return <LearningHistorySummaryCards summary={summary} />;
  }

  // Empty state handling
  if (batches.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E1E6EC] bg-white p-12 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0044D3]">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <H3 className="mt-4 text-base font-bold text-[#111827]">
          {isMentorPastView ? 'No History' : 'No Course Allocations or Grades Yet'}
        </H3>
        {!isMentorPastView && (
          <P className="mx-auto mt-2 max-w-md text-xs text-[#667085]">
            Your assigned curriculum, progress tracker, and assignment grades will appear here once
            allocated.
          </P>
        )}
      </div>
    );
  }

  // Filter by selected batch
  const displayedBatches =
    selectedBatchId === 'ALL' ? batches : batches.filter((b) => b.batchId === selectedBatchId);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header Overview Summary Cards (Responsive 3-Card Grid) */}
      {!hideSummary && <LearningHistorySummaryCards summary={summary} />}

      {/* 2. Batch Selector Filter Toolbar */}
      {batches.length > 1 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold tracking-tight text-[#111827]">
              Enrolled Batches
            </span>
            <span className="inline-flex h-5 items-center rounded-full bg-[#E1E6EC]/70 px-2 text-[11px] font-semibold text-[#475467]">
              {batches.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-semibold text-[#667085] sm:inline">
              Filter by Batch:
            </span>
            <div className="w-full sm:w-64">
              <SingleSelectDropdown
                label="Batch"
                value={selectedBatchId}
                onChange={setSelectedBatchId}
                options={batchOptions}
                placeholder="Batch"
                aria-label="Filter learning history by batch"
                triggerClassName="h-10 rounded-2xl border-[#E1E6EC] bg-white px-3 text-xs font-semibold shadow-2xs hover:border-slate-300"
                menuClassName="w-full sm:min-w-[260px] rounded-2xl border border-[#E1E6EC] bg-white p-1.5 shadow-xl"
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* 3. Batch Sections & Course Allocations */}
      {displayedBatches.map((batch) => {
        const isCollapsed = Boolean(collapsedBatches[batch.batchId]);

        return (
          <section
            key={batch.batchId}
            className="overflow-hidden rounded-2xl border border-[#E1E6EC] bg-white shadow-xs"
          >
            {/* Batch Header Bar */}
            <button
              type="button"
              onClick={() => toggleBatch(batch.batchId)}
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? `Expand ${batch.batchName}` : `Collapse ${batch.batchName}`}
              className={`flex w-full cursor-pointer flex-col gap-3 bg-[#F8FAFC] px-6 py-4 text-left transition-colors hover:bg-[#F1F5F9] sm:flex-row sm:items-center sm:justify-between ${
                !isCollapsed ? 'border-b border-[#E1E6EC]' : ''
              }`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#0044D3]">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <span className="text-base font-bold text-[#111827]">{batch.batchName}</span>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E1E6EC] bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#475467] shadow-2xs">
                    <svg
                      className="h-3.5 w-3.5 text-[#98A2B3]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      Started:{' '}
                      <strong className="font-semibold text-[#111827]">
                        {formatDateIST(batch.startDate)}
                      </strong>
                    </span>
                  </span>

                  {batch.endDate ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 shadow-2xs">
                      <svg
                        className="h-3.5 w-3.5 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>
                        Completed:{' '}
                        <strong className="font-semibold text-emerald-800">
                          {formatDateIST(batch.endDate)}
                        </strong>
                      </span>
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                    batch.status,
                  )}`}
                >
                  {batch.status.replace(/_/g, ' ')}
                </span>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border border-[#E1E6EC] bg-white text-[#667085] shadow-2xs transition-transform duration-200 ${
                    isCollapsed ? '-rotate-90' : 'rotate-0'
                  }`}
                  aria-hidden="true"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </button>

            {/* Allocations under this Batch */}
            {!isCollapsed ? (
              <div className="flex flex-col gap-4 bg-[#F8FAFC]/40 p-6">
                {batch.courseAllocations.map((alloc) => {
                  const isCourseCollapsed = Boolean(collapsedCourses[alloc.allocationId]);

                  return (
                    <div
                      key={alloc.allocationId}
                      className="rounded-xl border border-[#E1E6EC] bg-white p-5 shadow-2xs"
                    >
                      {/* Course Header */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <H3 className="text-sm font-bold text-[#111827]">{alloc.courseTitle}</H3>

                          {/* Metadata Date Badges */}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E1E6EC] bg-[#F8FAFC] px-2.5 py-0.5 text-[11px] font-medium text-[#475467]">
                              <svg
                                className="h-3.5 w-3.5 text-[#98A2B3]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <span>
                                Assigned:{' '}
                                <strong className="font-semibold text-[#111827]">
                                  {formatDateIST(alloc.startDate)}
                                </strong>
                              </span>
                            </span>

                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E1E6EC] bg-[#F8FAFC] px-2.5 py-0.5 text-[11px] font-medium text-[#475467]">
                              <svg
                                className="h-3.5 w-3.5 text-[#98A2B3]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span>
                                Due:{' '}
                                <strong className="font-semibold text-[#111827]">
                                  {formatDateIST(alloc.dueDate)}
                                </strong>
                              </span>
                            </span>

                            {alloc.completedAt ? (
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                                <svg
                                  className="h-3.5 w-3.5 text-emerald-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                <span>
                                  Completed:{' '}
                                  <strong className="font-semibold text-emerald-800">
                                    {formatDateIST(alloc.completedAt)}
                                  </strong>
                                </span>
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Progress Indicator & Collapse Button */}
                        <div className="flex flex-shrink-0 items-center gap-3">
                          <div className="flex items-center gap-3.5 rounded-xl border border-[#E1E6EC] bg-[#F8FAFC] px-4 py-2 shadow-2xs">
                            <span className="text-[11px] font-bold tracking-wider text-[#667085] uppercase">
                              Progress
                            </span>
                            <div className="h-2.5 w-36 overflow-hidden rounded-full bg-[#E1E6EC] sm:w-52 md:w-64 lg:w-72">
                              <div
                                className="h-full rounded-full bg-[#0044D3] transition-all duration-300"
                                style={{
                                  width: `${Math.min(100, Math.max(0, alloc.progressPercent))}%`,
                                }}
                              />
                            </div>
                            <span className="min-w-9 text-right text-xs font-extrabold text-[#111827]">
                              {alloc.progressPercent}%
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleCourse(alloc.allocationId)}
                            aria-expanded={!isCourseCollapsed}
                            aria-label={
                              isCourseCollapsed
                                ? `Expand submissions for ${alloc.courseTitle}`
                                : `Collapse submissions for ${alloc.courseTitle}`
                            }
                            title={
                              isCourseCollapsed ? 'Expand submissions' : 'Collapse submissions'
                            }
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#E1E6EC] bg-[#F8FAFC] text-[#667085] shadow-2xs transition-all hover:border-slate-300 hover:bg-white hover:text-[#111827]"
                          >
                            <svg
                              className={`h-4 w-4 transition-transform duration-200 ${
                                isCourseCollapsed ? '-rotate-90' : 'rotate-0'
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Submissions Table for this Allocation */}
                      {!isCourseCollapsed ? (
                        alloc.assignments.length > 0 ? (
                          <div className="mt-4 overflow-hidden rounded-xl border border-[#E1E6EC] bg-[#F8FAFC]/40">
                            <table className="w-full text-left text-xs text-[#111827]">
                              <thead className="border-b border-[#E1E6EC] bg-[#F8FAFC] text-[11px] font-semibold tracking-wider text-[#667085] uppercase">
                                <tr>
                                  <th className="px-4 py-3">Assignment</th>
                                  <th className="px-4 py-3">Submitted</th>
                                  <th className="px-4 py-3 text-center">Version</th>
                                  <th className="px-4 py-3 text-center">Score</th>
                                  <th className="px-4 py-3">Mentor Feedback</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E1E6EC]/60">
                                {alloc.assignments.map((assign) => (
                                  <tr
                                    key={assign.assignmentId}
                                    className="bg-white transition-colors hover:bg-[#F9FAFB]/90"
                                  >
                                    <td className="px-4 py-3">
                                      <Span className="font-semibold text-[#111827]">
                                        {assign.assignmentTitle}
                                      </Span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-[#667085]">
                                      <div className="flex flex-col">
                                        <Span>{formatDateIST(assign.submittedAt)}</Span>
                                        {assign.isLate ? (
                                          <Span className="text-[10px] font-semibold text-rose-600">
                                            (Late Submission)
                                          </Span>
                                        ) : null}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-center text-xs font-medium text-[#667085]">
                                      v{assign.version}
                                    </td>
                                    <td className="px-4 py-3 text-center text-xs font-bold text-[#111827]">
                                      {assign.marks !== null ? (
                                        <Span>
                                          {assign.marks} / {assign.maxMarks}
                                        </Span>
                                      ) : (
                                        <Span className="inline-block rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                          Pending Review
                                        </Span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      {assign.feedback ? (
                                        <P className="text-xs whitespace-pre-wrap text-[#111827] italic">
                                          &ldquo;{assign.feedback}&rdquo;
                                        </P>
                                      ) : (
                                        <Span className="text-xs text-[#667085]">
                                          No feedback provided
                                        </Span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="mt-3 rounded-xl border border-dashed border-[#E1E6EC] bg-[#F8FAFC] p-4 text-center">
                            <P className="text-xs text-[#667085]">
                              No assignments submitted for this course allocation yet.
                            </P>
                          </div>
                        )
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

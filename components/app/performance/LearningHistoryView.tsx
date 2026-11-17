'use client';

import React, { useMemo, useState } from 'react';

import { getBatchStatusBadgeClass, isBatchStatus } from '@/components/app/batches/batchStatus';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import {
  SingleSelectDropdown,
  type SingleSelectOption,
} from '@/components/ui/SingleSelectDropdown';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
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
  const [search, setSearch] = useState<string>('');
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
      { value: 'ALL', label: 'Batch' },
      ...batches.map((b) => ({
        value: b.batchId,
        label: b.batchName,
      })),
    ],
    [batches],
  );

  // Filter by selected batch and search query
  const displayedBatches = useMemo(() => {
    const list =
      selectedBatchId === 'ALL' ? batches : batches.filter((b) => b.batchId === selectedBatchId);
    const query = search.trim().toLowerCase();
    if (!query) return list;

    return list
      .map((batch) => {
        const batchMatches = batch.batchName.toLowerCase().includes(query);
        const matchingAllocations = batch.courseAllocations.filter((alloc) => {
          const courseMatches = alloc.courseTitle.toLowerCase().includes(query);
          const assignmentMatches = alloc.assignments.some((assign) =>
            assign.assignmentTitle.toLowerCase().includes(query),
          );
          return batchMatches || courseMatches || assignmentMatches;
        });

        if (batchMatches || matchingAllocations.length > 0) {
          return {
            ...batch,
            courseAllocations: batchMatches ? batch.courseAllocations : matchingAllocations,
          };
        }
        return null;
      })
      .filter((b): b is NonNullable<typeof b> => b !== null);
  }, [batches, selectedBatchId, search]);

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
      <div className="flex flex-col gap-4">
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

        {/* Toolbar Skeleton (Search & Batch filter) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-[49px] w-full rounded-2xl sm:w-[436px]" />
          <Skeleton className="h-[49px] w-full rounded-2xl sm:w-[200px]" />
        </div>

        {/* Unified Card Skeleton matching the exact real data layout */}
        <div className="divide-y divide-[#E1E6EC] overflow-hidden rounded-2xl border border-[#E1E6EC] bg-white shadow-xs">
          {/* Batch Skeleton */}
          <div className="bg-white">
            {/* Batch Header Bar */}
            <div className="flex flex-col gap-2 border-b border-[#E1E6EC] bg-white px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-4 w-44 rounded-md" />
                <Skeleton className="h-3.5 w-36 rounded-md" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-7 w-7 rounded-full" />
              </div>
            </div>

            {/* Course Allocations under Batch */}
            <div className="divide-y divide-[#E1E6EC] bg-white">
              {/* Allocation 1 */}
              <div className="px-4 py-3 sm:px-5 sm:py-3.5">
                {/* Course Header */}
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Skeleton className="h-4 w-36 rounded-md" />
                    <Skeleton className="h-3.5 w-40 rounded-md" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3.5 w-14 rounded-md" />
                      <Skeleton className="h-2 w-28 rounded-full sm:w-36" />
                      <Skeleton className="h-3.5 w-8 rounded-md" />
                    </div>
                    <Skeleton className="h-7 w-7 rounded-full" />
                  </div>
                </div>

                {/* Submissions Table Skeleton */}
                <div className="mt-3 overflow-hidden rounded-xl border border-[#E1E6EC] bg-white shadow-2xs">
                  <div className="border-b border-[#E1E6EC] bg-[#F6F8FC] px-4 py-2.5">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3.5 w-24 rounded-md" />
                      <Skeleton className="h-3.5 w-20 rounded-md" />
                      <Skeleton className="h-3.5 w-14 rounded-md" />
                      <Skeleton className="h-3.5 w-14 rounded-md" />
                      <Skeleton className="h-3.5 w-28 rounded-md" />
                    </div>
                  </div>
                  <div className="divide-y divide-[#F2F4F7]">
                    {[1, 2].map((rowIdx) => (
                      <div key={rowIdx} className="flex items-center justify-between px-4 py-3">
                        <Skeleton className="h-3.5 w-36 rounded-md" />
                        <Skeleton className="h-3.5 w-24 rounded-md" />
                        <Skeleton className="h-3.5 w-8 rounded-md" />
                        <Skeleton className="h-5 w-14 rounded-lg" />
                        <Skeleton className="h-3.5 w-48 rounded-md" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Allocation 2 */}
              <div className="px-4 py-3 sm:px-5 sm:py-3.5">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Skeleton className="h-4 w-40 rounded-md" />
                    <Skeleton className="h-3.5 w-40 rounded-md" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3.5 w-14 rounded-md" />
                      <Skeleton className="h-2 w-28 rounded-full sm:w-36" />
                      <Skeleton className="h-3.5 w-8 rounded-md" />
                    </div>
                    <Skeleton className="h-7 w-7 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
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

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Header Overview Summary Cards (Responsive 3-Card Grid) */}
      {!hideSummary && <LearningHistorySummaryCards summary={summary} />}

      {/* 2. Search & Batch Filter Toolbar */}
      {batches.length > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Input (436px wide on desktop per design feedback) */}
          <div className="relative w-full sm:w-[436px]">
            <svg
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#667085]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by course, assignment, or batch..."
              aria-label="Search learning history"
              className="h-[49px] rounded-2xl border-[#E1E6EC] pr-4 pl-10 text-xs font-medium shadow-2xs hover:border-slate-300 focus:border-[#0044D3] sm:text-sm"
            />
          </div>

          {/* Batch Selector Dropdown (200px wide next to Search) */}
          <div className="w-full sm:w-[200px]">
            <SingleSelectDropdown
              label="Batch"
              value={selectedBatchId}
              onChange={setSelectedBatchId}
              options={batchOptions}
              placeholder="Batch"
              aria-label="Filter learning history by batch"
              triggerClassName="h-[49px] rounded-2xl border-[#E1E6EC] bg-white px-3.5 text-xs sm:text-sm font-semibold shadow-2xs hover:border-slate-300"
              menuClassName="w-full sm:min-w-[200px] rounded-xl border border-[#E1E6EC] bg-white p-1.5 shadow-xl"
            />
          </div>

          {(selectedBatchId !== 'ALL' || search.trim() !== '') && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedBatchId('ALL');
                setSearch('');
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rose-300 bg-rose-50 p-0 text-rose-700 shadow-2xs transition-colors hover:border-rose-400 hover:bg-rose-100 hover:text-rose-800 focus-visible:ring-2 focus-visible:ring-rose-500/30"
              title="Clear filters"
              aria-label="Clear filters"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          )}
        </div>
      ) : null}

      {/* 3. Batch Sections & Course Allocations - Unified in Single Card */}
      {displayedBatches.length > 0 ? (
        <div className="divide-y divide-[#E1E6EC] overflow-hidden rounded-2xl border border-[#E1E6EC] bg-white shadow-xs">
          {displayedBatches.map((batch) => {
            const isCollapsed = Boolean(collapsedBatches[batch.batchId]);

            return (
              <div key={batch.batchId} className="bg-white">
                {/* Batch Header Bar */}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => toggleBatch(batch.batchId)}
                  aria-expanded={!isCollapsed}
                  aria-label={
                    isCollapsed ? `Expand ${batch.batchName}` : `Collapse ${batch.batchName}`
                  }
                  className={`flex h-auto w-full cursor-pointer flex-col gap-2 rounded-none bg-white px-4 py-2.5 text-left transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3 ${
                    !isCollapsed ? 'border-b border-[#E1E6EC]' : ''
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0044D3]">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                    <Span className="text-sm font-bold text-[#111827]">{batch.batchName}</Span>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#475467]">
                      <Span>
                        Started:{' '}
                        <Span className="font-medium text-[#111827]">
                          {formatDateIST(batch.startDate)}
                        </Span>
                      </Span>

                      {batch.endDate ? (
                        <Span>
                          Completed:{' '}
                          <Span className="font-medium text-emerald-700">
                            {formatDateIST(batch.endDate)}
                          </Span>
                        </Span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {batch.status && batch.status.toUpperCase() !== 'INDIVIDUAL' && (
                      <Span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${getStatusBadgeClass(
                          batch.status,
                        )}`}
                      >
                        {batch.status.replace(/_/g, ' ')}
                      </Span>
                    )}
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full border border-[#E1E6EC] bg-white text-[#667085] shadow-2xs transition-transform duration-200 ${
                        isCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                      aria-hidden="true"
                    >
                      <svg
                        className="h-3.5 w-3.5"
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
                    </div>
                  </div>
                </Button>

                {/* Allocations under this Batch */}
                {!isCollapsed ? (
                  <div className="divide-y divide-[#E1E6EC] bg-white">
                    {batch.courseAllocations.map((alloc) => {
                      const isCourseCollapsed = Boolean(collapsedCourses[alloc.allocationId]);

                      return (
                        <div
                          key={alloc.allocationId}
                          className="px-4 py-3 transition-colors sm:px-5 sm:py-3.5"
                        >
                          {/* Course Header */}
                          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <H3 className="text-xs font-semibold text-[#111827] sm:text-sm">
                                {alloc.courseTitle}
                              </H3>

                              {/* Dates: clean inline text, no background box */}
                              <div className="flex flex-wrap items-center gap-2 text-xs text-[#475467]">
                                <Span>
                                  Assigned:{' '}
                                  <Span className="font-medium text-[#111827]">
                                    {formatDateIST(alloc.startDate)}
                                  </Span>
                                </Span>

                                <Span>
                                  Due:{' '}
                                  <Span className="font-medium text-[#111827]">
                                    {formatDateIST(alloc.dueDate)}
                                  </Span>
                                </Span>

                                {alloc.completedAt ? (
                                  <Span>
                                    Completed:{' '}
                                    <Span className="font-medium text-emerald-700">
                                      {formatDateIST(alloc.completedAt)}
                                    </Span>
                                  </Span>
                                ) : null}
                              </div>
                            </div>

                            {/* Progress Indicator & Rounded Collapse Button */}
                            <div className="flex flex-shrink-0 items-center gap-3">
                              {/* Clean inline progress, no card background box */}
                              <div className="flex items-center gap-2">
                                <Span className="text-[11px] font-semibold text-[#667085]">
                                  Progress:
                                </Span>
                                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#E1E6EC] sm:w-32">
                                  <div
                                    className="h-full rounded-full bg-[#0044D3] transition-all duration-300"
                                    style={{
                                      width: `${Math.min(100, Math.max(0, alloc.progressPercent))}%`,
                                    }}
                                  />
                                </div>
                                <Span className="min-w-7 text-right text-xs font-bold text-[#111827]">
                                  {alloc.progressPercent}%
                                </Span>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
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
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E1E6EC] bg-white p-0 text-[#667085] shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-[#111827]"
                              >
                                <svg
                                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
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
                              </Button>
                            </div>
                          </div>

                          {/* Submissions Table for this Allocation */}
                          {!isCourseCollapsed ? (
                            alloc.assignments.length > 0 ? (
                              <div className="mt-3 overflow-hidden rounded-xl border border-[#E1E6EC] bg-white shadow-2xs">
                                <div className="overflow-x-auto">
                                  <Table className="w-full min-w-[640px] border-collapse text-left">
                                    <TableHeader className="border-b border-[#E1E6EC] bg-[#F6F8FC]">
                                      <TableRow>
                                        <TableHead className="px-4 py-2.5 font-semibold text-slate-700 sm:px-5 sm:py-3">
                                          Assignment
                                        </TableHead>
                                        <TableHead className="px-4 py-2.5 font-semibold text-slate-700 sm:px-5 sm:py-3">
                                          Submitted
                                        </TableHead>
                                        <TableHead className="px-4 py-2.5 text-center font-semibold text-slate-700 sm:px-5 sm:py-3">
                                          Version
                                        </TableHead>
                                        <TableHead className="px-4 py-2.5 text-center font-semibold text-slate-700 sm:px-5 sm:py-3">
                                          Score
                                        </TableHead>
                                        <TableHead className="px-4 py-2.5 font-semibold text-slate-700 sm:px-5 sm:py-3">
                                          Mentor Feedback
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-[#F2F4F7]">
                                      {alloc.assignments.map((assign, assignIdx) => (
                                        <TableRow
                                          key={`${assign.assignmentId}-v${assign.version}-${assignIdx}`}
                                          className="bg-white transition-colors hover:bg-[#F9FAFB]/90"
                                        >
                                          <TableCell className="px-4 py-3 align-middle">
                                            <P className="text-base font-semibold text-slate-900">
                                              {assign.assignmentTitle}
                                            </P>
                                          </TableCell>
                                          <TableCell className="px-4 py-3 align-middle text-xs text-[#475467]">
                                            <div className="flex flex-col">
                                              <Span className="font-medium">
                                                {formatDateIST(assign.submittedAt)}
                                              </Span>
                                              {assign.isLate ? (
                                                <Span className="text-[11px] font-semibold text-rose-600">
                                                  (Late Submission)
                                                </Span>
                                              ) : null}
                                            </div>
                                          </TableCell>
                                          <TableCell className="px-4 py-3 text-center align-middle text-xs font-medium text-[#667085]">
                                            v{assign.version}
                                          </TableCell>
                                          <TableCell className="px-4 py-3 text-center align-middle text-xs font-bold text-[#111827]">
                                            {assign.marks !== null ? (
                                              <Span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#0044D3]">
                                                {assign.marks} / {assign.maxMarks}
                                              </Span>
                                            ) : (
                                              <Span className="inline-block rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-xs font-semibold text-amber-700">
                                                Pending Review
                                              </Span>
                                            )}
                                          </TableCell>
                                          <TableCell className="px-4 py-3 align-middle">
                                            {assign.feedback ? (
                                              <P className="text-xs leading-relaxed whitespace-pre-wrap text-[#475467] italic">
                                                &ldquo;{assign.feedback}&rdquo;
                                              </P>
                                            ) : (
                                              <Span className="text-xs text-[#667085]">
                                                No feedback provided
                                              </Span>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2 py-3 text-center text-xs text-[#667085]">
                                No assignments submitted for this course allocation yet.
                              </div>
                            )
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#E1E6EC] bg-white p-8 text-center shadow-xs">
          <P className="text-xs text-[#667085]">
            No learning history records match your search or filter.
          </P>
        </div>
      )}
    </div>
  );
}

'use client';

import { useSearchParams } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import { AllocationStatusBadge } from '@/components/app/allocations/AllocationStatusBadge';
import {
  ADMIN_PROGRESS_NAV,
  MENTOR_PROGRESS_NAV,
} from '@/components/app/navigation/portal-nav.config';
import { TopicDeadlineModal } from '@/components/app/progress/TopicDeadlineModal';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { PaginationControls } from '@/components/patterns/PaginationControls';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { TableCell, TableRow } from '@/components/ui/Table';
import { H3, H4, Muted, P, PageTitle, Span, SubText } from '@/components/ui/Typography';
import { useBatchesList } from '@/hooks/useBatches';
import { useCourses } from '@/hooks/useCourses';
import {
  type ProgressTrackerItem,
  type TopicProgressItem,
  useAllocationProgress,
  useProgressTrackers,
} from '@/hooks/useProgress';
import { formatDateIST } from '@/lib/date';

interface ProgressTrackerViewProps {
  readonly portalType?: 'mentor' | 'admin';
}

export function ProgressTrackerView({ portalType = 'mentor' }: ProgressTrackerViewProps) {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';

  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [search, setSearch] = useState<string>(urlSearch);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [selectedAllocationId, setSelectedAllocationId] = useState<string | null>(null);

  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    setSearch(urlSearch);
    setPage(1);
  }

  // Modal state for deadline adjustment
  const [deadlineModalTopic, setDeadlineModalTopic] = useState<TopicProgressItem | null>(null);

  const navConfig = portalType === 'admin' ? ADMIN_PROGRESS_NAV : MENTOR_PROGRESS_NAV;

  // 1. Fetch Trackers Telemetry (M8 Backend Endpoint with Pagination)
  const {
    data: trackersResponse,
    isLoading: isTrackersLoading,
    isError: isTrackersError,
    error: trackersError,
    refetch: refetchTrackers,
  } = useProgressTrackers({
    batchId: selectedBatchId || undefined,
    courseId: selectedCourseId || undefined,
    search: search.trim() || undefined,
    page,
    limit,
  });

  const trackers = useMemo<ProgressTrackerItem[]>(
    () => trackersResponse?.trackers ?? [],
    [trackersResponse],
  );
  const pagination = useMemo(
    () =>
      trackersResponse?.pagination ?? {
        page,
        limit,
        total: trackers.length,
        totalPages: Math.ceil(trackers.length / limit) || 1,
      },
    [trackersResponse, page, limit, trackers.length],
  );

  // 2. Fetch Batches for Filter Dropdown
  const { data: batchesData } = useBatchesList({ limit: 100 });
  const batches = useMemo(() => batchesData?.items ?? [], [batchesData]);
  const batchesTotal = batchesData?.pagination?.total ?? batches.length;

  // 3. Fetch Courses for Filter Dropdown
  const { courses, total: coursesTotal } = useCourses({ limit: 100 });

  // Filtered trackers from paginated query
  const filteredTrackers = trackers;

  // Derive selected item directly from live query data
  const selectedItem = useMemo(() => {
    if (!selectedAllocationId) return null;
    return filteredTrackers.find((t) => t.allocationId === selectedAllocationId) ?? null;
  }, [filteredTrackers, selectedAllocationId]);

  // Aggregated Telemetry Metrics
  const meanCompletion = useMemo(() => {
    if (!trackers.length) return 0;
    const total = trackers.reduce((acc, curr) => acc + Number(curr.progressPercent), 0);
    return Math.round((total / trackers.length) * 10) / 10;
  }, [trackers]);

  const onTrackCount = useMemo(() => {
    return trackers.filter((t) => !t.isOverdue && t.overdueTopicsCount === 0).length;
  }, [trackers]);

  const overdueCount = useMemo(() => {
    return trackers.filter((t) => t.isOverdue || t.overdueTopicsCount > 0).length;
  }, [trackers]);

  // Detail query for active drawer allocation
  const {
    data: drawerProgressData,
    isLoading: isDrawerLoading,
    isError: isDrawerError,
    error: drawerError,
    refetch: refetchDrawerProgress,
  } = useAllocationProgress(selectedItem?.allocationId);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
      <Header {...navConfig} />

      <DashboardContent>
        {/* Top Header Strip (Stitch Screen d74ac15e1839485d9881c6dd9616fef6) */}
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-xs font-bold text-blue-600">
                📈
              </Span>
              <Span className="text-xs font-bold tracking-wider text-blue-600 uppercase">
                Learner Telemetry
              </Span>
              <Span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-xs font-bold text-slate-700">
                {portalType === 'admin' ? 'Super Admin Matrix' : 'Mentor Scope'}
              </Span>
            </div>
            <PageTitle className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Progress Tracker
            </PageTitle>
            <SubText className="mt-1">
              Live curriculum telemetry, cadence diagnostics, and per-topic deadline clearance
              (FR-8.7).
            </SubText>
          </div>

          <div className="flex items-center gap-3">
            <Span className="text-xs font-semibold text-slate-500">
              {filteredTrackers.length} Mentees in Scope
            </Span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetchTrackers()}
              className="text-xs font-semibold"
            >
              🔄 Refresh Telemetry
            </Button>
          </div>
        </div>

        {/* Quick Stats Metric Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Card 1: Mean Completion */}
          <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-col">
              <Span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                Mean Completion
              </Span>
              <H3 className="mt-1 text-2xl font-extrabold text-slate-900">{meanCompletion}%</H3>
              <Muted className="mt-0.5 text-xs">Average across mapped cohort</Muted>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-600">
              🎯
            </div>
          </div>

          {/* Card 2: On-Track Ratio */}
          <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-col">
              <Span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                On-Track Ratio
              </Span>
              <H3 className="mt-1 text-2xl font-extrabold text-slate-900">
                {onTrackCount}{' '}
                <Span className="text-sm font-normal text-slate-400">/ {trackers.length}</Span>
              </H3>
              <Span className="mt-0.5 text-xs font-semibold text-emerald-600">
                {trackers.length > 0
                  ? `${Math.round((onTrackCount / trackers.length) * 100)}% On Cadence`
                  : '0%'}
              </Span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-lg font-bold text-emerald-600">
              ✓
            </div>
          </div>

          {/* Card 3: Overdue Action Items */}
          <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-col">
              <Span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                Overdue Cadets
              </Span>
              <H3 className="mt-1 text-2xl font-extrabold text-rose-600">{overdueCount}</H3>
              <Muted className="mt-0.5 text-xs">Exceeded topic or course deadlines</Muted>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-lg font-bold text-rose-600">
              ⚠️
            </div>
          </div>
        </div>

        {/* Filter Strip */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Batch Selector */}
            <div className="flex min-w-[180px] flex-col gap-1">
              <Select
                value={selectedBatchId}
                onChange={(e) => {
                  setSelectedBatchId(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-full bg-slate-50 text-xs"
              >
                <option value="">All Cohorts / Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
                {batchesTotal > batches.length && (
                  <option disabled value="">
                    Showing first {batches.length} of {batchesTotal} cohorts
                  </option>
                )}
              </Select>
              {batchesTotal > batches.length && (
                <Span className="text-[10px] text-slate-400">
                  Showing first {batches.length} of {batchesTotal} cohorts
                </Span>
              )}
            </div>

            {/* Course Selector */}
            <div className="flex min-w-[200px] flex-col gap-1">
              <Select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-full bg-slate-50 text-xs"
              >
                <option value="">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
                {coursesTotal > courses.length && (
                  <option disabled value="">
                    Showing first {courses.length} of {coursesTotal} courses
                  </option>
                )}
              </Select>
              {coursesTotal > courses.length && (
                <Span className="text-[10px] text-slate-400">
                  Showing first {courses.length} of {coursesTotal} courses
                </Span>
              )}
            </div>

            {/* Search Input */}
            <div className="min-w-[220px] flex-1">
              <Input
                type="search"
                placeholder="Search cadet or course title..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-full bg-slate-50 text-xs"
              />
            </div>
          </div>

          {(selectedBatchId || selectedCourseId || search) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedBatchId('');
                setSelectedCourseId('');
                setSearch('');
                setPage(1);
              }}
              className="text-xs"
            >
              Reset Filters
            </Button>
          )}
        </div>

        {/* Main Telemetry Matrix Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
          {isTrackersLoading ? (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    <th className="px-4 py-3.5 sm:px-6">Cadet</th>
                    <th className="px-4 py-3.5 sm:px-6">Course & Batch</th>
                    <th className="px-4 py-3.5 sm:px-6">Progress</th>
                    <th className="px-4 py-3.5 sm:px-6">Clearance</th>
                    <th className="px-4 py-3.5 sm:px-6">Status</th>
                    <th className="px-4 py-3.5 text-right sm:px-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <TableRow key={`tracker-skel-${idx}`} className="h-16">
                      <TableCell className="px-4 py-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-4 w-28 rounded-md" />
                            <Skeleton className="h-3 w-20 rounded-md" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 sm:px-6">
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-36 rounded-md" />
                          <Skeleton className="h-3 w-24 rounded-md" />
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 sm:px-6">
                        <div className="flex items-center gap-2.5">
                          <Skeleton className="h-2 w-24 rounded-full" />
                          <Skeleton className="h-3 w-8 rounded-md" />
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 sm:px-6">
                        <Skeleton className="h-4 w-16 rounded-md" />
                      </TableCell>
                      <TableCell className="px-4 py-4 sm:px-6">
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right sm:px-6">
                        <Skeleton className="ml-auto h-7 w-20 rounded-lg" />
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </table>
            </div>
          ) : isTrackersError ? (
            <div className="p-8">
              <ErrorMessage error={trackersError} onRetry={() => void refetchTrackers()} />
            </div>
          ) : filteredTrackers.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center p-8 text-center">
              <Span className="text-3xl">📊</Span>
              <H3 className="mt-3 text-base font-bold text-slate-900">No Mentees in Scope</H3>
              <P className="mt-1 text-xs text-slate-500">
                No active mentee progress records match your current filter parameters.
              </P>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    <th className="px-4 py-3.5 sm:px-6">Cadet</th>
                    <th className="px-4 py-3.5 sm:px-6">Course & Batch</th>
                    <th className="px-4 py-3.5 sm:px-6">Progress</th>
                    <th className="px-4 py-3.5 sm:px-6">Clearance</th>
                    <th className="px-4 py-3.5 sm:px-6">Status</th>
                    <th className="px-4 py-3.5 text-right sm:px-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTrackers.map((item) => {
                    const isSelected = selectedAllocationId === item.allocationId;
                    const isCompleted = item.status === 'COMPLETED';
                    const isOverdue = item.isOverdue || item.overdueTopicsCount > 0;

                    return (
                      <tr
                        key={item.allocationId}
                        onClick={() => setSelectedAllocationId(item.allocationId)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Cadet */}
                        <td className="px-4 py-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">
                              {item.menteeName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <Span className="font-semibold text-slate-900 hover:text-blue-600">
                                {item.menteeName}
                              </Span>
                              <Span className="text-xs text-slate-400">
                                ID: {item.menteeId.slice(0, 8)}...
                              </Span>
                            </div>
                          </div>
                        </td>

                        {/* Course & Batch */}
                        <td className="px-4 py-4 sm:px-6">
                          <div className="flex flex-col">
                            <Span className="font-semibold text-slate-800">{item.courseTitle}</Span>
                            <Span className="text-xs font-semibold text-blue-600">
                              {item.batchName || 'Individual Track'}
                            </Span>
                          </div>
                        </td>

                        {/* Progress Bar & % */}
                        <td className="px-4 py-4 sm:px-6">
                          <div className="flex items-center gap-2.5">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className={`h-full rounded-full ${
                                  isCompleted
                                    ? 'bg-emerald-500'
                                    : isOverdue
                                      ? 'bg-rose-500'
                                      : 'bg-blue-600'
                                }`}
                                style={{
                                  width: `${Math.min(100, Math.max(0, item.progressPercent))}%`,
                                }}
                              />
                            </div>
                            <Span className="text-xs font-bold text-slate-900">
                              {item.progressPercent}%
                            </Span>
                          </div>
                        </td>

                        {/* Clearance count */}
                        <td className="px-4 py-4 text-xs font-medium text-slate-600 sm:px-6">
                          {item.completedTopicsCount} / {item.totalActiveTopics} Topics
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 sm:px-6">
                          <AllocationStatusBadge status={item.status} isOverdue={isOverdue} />
                        </td>

                        {/* Action Chevron */}
                        <td className="px-4 py-4 text-right sm:px-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAllocationId(item.allocationId);
                            }}
                            className="h-7 px-2.5 text-xs font-semibold"
                          >
                            Inspect Outline →
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          <PaginationControls
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            itemLabel="cadets"
          />
        </div>
      </DashboardContent>

      {/* Slide-Over Drawer: Cadet Syllabus Breakdown (Stitch Screen d74ac15e1839485d9881c6dd9616fef6) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="animate-in slide-in-from-right flex h-full w-full max-w-lg flex-col bg-white shadow-2xl duration-200">
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-xs">
                  {selectedItem.menteeName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <H3 className="text-base font-bold text-slate-900">{selectedItem.menteeName}</H3>
                  <P className="text-xs text-slate-500">
                    {selectedItem.courseTitle} • {selectedItem.batchName ?? 'Direct'}
                  </P>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setSelectedAllocationId(null)}
                aria-label="Close panel"
                className="h-8 w-8 p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </Button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="border-b border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-xs">
                <Span className="font-bold text-blue-600">
                  {selectedItem.progressPercent}% Completed
                </Span>
                <Span className="text-slate-500">
                  {selectedItem.completedTopicsCount} of {selectedItem.totalActiveTopics} Finished
                </Span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${selectedItem.progressPercent}%` }}
                />
              </div>
            </div>

            {/* Syllabus Topic List */}
            <div className="flex-1 overflow-y-auto p-6">
              <H4 className="mb-4 text-xs font-bold tracking-wider text-slate-400 uppercase">
                Active Topic Milestones & Deadlines
              </H4>

              {isDrawerLoading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={`topic-skel-${idx}`}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-4 w-32 rounded-md" />
                            <Skeleton className="h-3 w-24 rounded-md" />
                          </div>
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : isDrawerError ? (
                <div className="p-4">
                  <ErrorMessage error={drawerError} onRetry={() => void refetchDrawerProgress()} />
                </div>
              ) : !drawerProgressData?.topics.length ? (
                <div className="flex h-40 flex-col items-center justify-center p-6 text-center">
                  <Span className="text-2xl">📚</Span>
                  <H4 className="mt-2 text-xs font-bold text-slate-800">No Active Topics</H4>
                  <P className="mt-1 text-xs text-slate-500">
                    This course currently has no active syllabus topics configured.
                  </P>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {drawerProgressData.topics.map((t, idx) => {
                    const isCompleted = t.status === 'COMPLETED';
                    const isInProgress = t.status === 'IN_PROGRESS';

                    return (
                      <div
                        key={t.topicId}
                        className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <Span
                              className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : isInProgress
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {isCompleted ? '✓' : idx + 1}
                            </Span>
                            <div className="flex flex-col">
                              <H4 className="text-xs font-bold text-slate-900">{t.title}</H4>
                              {t.deadline ? (
                                <Span
                                  className={`mt-0.5 text-xs ${
                                    t.isOverdue ? 'font-bold text-rose-600' : 'text-slate-500'
                                  }`}
                                >
                                  Target: {formatDateIST(t.deadline)}
                                  {t.isOverdue && ' (Overdue)'}
                                </Span>
                              ) : (
                                <Span className="mt-0.5 text-xs text-slate-400">
                                  No topic deadline set
                                </Span>
                              )}
                              {t.note && (
                                <div className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                                  📝 Mentee Note: {t.note}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                            <Span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isCompleted
                                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : isInProgress
                                    ? 'border border-blue-200 bg-blue-50 text-blue-700'
                                    : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {isCompleted ? 'Done' : isInProgress ? 'Active' : 'Unstarted'}
                            </Span>

                            {/* Deadline Editor Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={() => setDeadlineModalTopic(t)}
                              className="h-auto p-0 text-xs font-semibold text-blue-600 hover:underline"
                            >
                              {t.deadline ? 'Edit Target Date' : '+ Set Target'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="flex justify-end border-t border-slate-200 p-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedAllocationId(null)}>
                Close Panel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Topic Deadline Modal */}
      {deadlineModalTopic && selectedItem && drawerProgressData && (
        <TopicDeadlineModal
          isOpen={Boolean(deadlineModalTopic)}
          onClose={() => setDeadlineModalTopic(null)}
          allocationId={selectedItem.allocationId}
          topicId={deadlineModalTopic.topicId}
          topicTitle={deadlineModalTopic.title}
          currentDeadline={deadlineModalTopic.deadline}
          allocationStartDate={drawerProgressData.allocation.startDate}
          allocationDueDate={drawerProgressData.allocation.dueDate}
        />
      )}
    </div>
  );
}

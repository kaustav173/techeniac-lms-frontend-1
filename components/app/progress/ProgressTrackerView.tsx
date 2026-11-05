'use client';

import React, { useMemo, useState } from 'react';

import { AllocationStatusBadge } from '@/components/app/allocations/AllocationStatusBadge';
import {
  ADMIN_PROGRESS_NAV,
  MENTOR_PROGRESS_NAV,
} from '@/components/app/navigation/portal-nav.config';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { DebouncedSearchInput } from '@/components/patterns/DebouncedSearchInput';
import { Modal } from '@/components/patterns/Modal';
import { PaginationControls } from '@/components/patterns/PaginationControls';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { MultiSelectDropdown, type MultiSelectOption } from '@/components/ui/MultiSelectDropdown';
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
import { H2, H4, P, Span } from '@/components/ui/Typography';
import { useBatchesList } from '@/hooks/useBatches';
import { useCourses } from '@/hooks/useCourses';
import {
  type ProgressTrackerItem,
  type TopicProgressItem,
  useAllocationProgress,
  useProgressTrackers,
  useUpdateTopicDeadlineMutation,
} from '@/hooks/useProgress';
import { formatDateDDMMYY, toISTDateInputValue } from '@/lib/date';

interface ProgressTrackerViewProps {
  readonly portalType?: 'mentor' | 'admin';
}

export function ProgressTrackerView({ portalType = 'mentor' }: ProgressTrackerViewProps) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [selectedAllocationId, setSelectedAllocationId] = useState<string | null>(null);

  // Direct inline deadline editor state inside the popup
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [inlineDeadline, setInlineDeadline] = useState<string>('');
  const [inlineError, setInlineError] = useState<string | null>(null);

  const updateDeadlineMutation = useUpdateTopicDeadlineMutation();

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
  const batchOptions: readonly MultiSelectOption[] = useMemo(
    () =>
      batches.map((b) => ({
        value: b.id,
        label: `${b.name} (${b.code})`,
      })),
    [batches],
  );

  // 3. Fetch Courses for Filter Dropdown
  const { courses } = useCourses({ limit: 100 });
  const courseOptions: readonly MultiSelectOption[] = useMemo(
    () =>
      courses.map((c) => ({
        value: c.id,
        label: c.title,
      })),
    [courses],
  );

  // Filtered trackers from paginated query
  const filteredTrackers = trackers;

  // Derive selected item directly from live query data
  const selectedItem = useMemo(() => {
    if (!selectedAllocationId) return null;
    return filteredTrackers.find((t) => t.allocationId === selectedAllocationId) ?? null;
  }, [filteredTrackers, selectedAllocationId]);

  // Detail query for active drawer allocation
  const {
    data: drawerProgressData,
    isLoading: isDrawerLoading,
    isError: isDrawerError,
    error: drawerError,
    refetch: refetchDrawerProgress,
  } = useAllocationProgress(selectedItem?.allocationId);

  const allocationStartDate = drawerProgressData?.allocation.startDate;
  const allocationDueDate = drawerProgressData?.allocation.dueDate;
  const minDate = allocationStartDate ? toISTDateInputValue(allocationStartDate) : '';
  const maxDate = allocationDueDate ? toISTDateInputValue(allocationDueDate) : '';

  const handleStartEditDeadline = (topic: TopicProgressItem) => {
    setEditingTopicId(topic.topicId);
    setInlineError(null);
    if (topic.deadline) {
      setInlineDeadline(toISTDateInputValue(topic.deadline));
    } else if (maxDate) {
      setInlineDeadline(maxDate);
    } else {
      setInlineDeadline('');
    }
  };

  const handleCancelEditDeadline = () => {
    setEditingTopicId(null);
    setInlineDeadline('');
    setInlineError(null);
  };

  const handleSaveInlineDeadline = async (topicId: string) => {
    if (!selectedItem || !drawerProgressData) return;
    setInlineError(null);

    if (!inlineDeadline) {
      setInlineError('Please select a target deadline.');
      return;
    }

    if (minDate && inlineDeadline < minDate) {
      setInlineError(`Deadline cannot be before allocation start (${formatDateDDMMYY(minDate)}).`);
      return;
    }

    if (maxDate && inlineDeadline > maxDate) {
      setInlineError(
        `Deadline cannot be after allocation due date (${formatDateDDMMYY(maxDate)}).`,
      );
      return;
    }

    try {
      const targetTime = new Date(`${inlineDeadline}T23:59:59+05:30`).getTime();
      const dueTime = new Date(drawerProgressData.allocation.dueDate).getTime();
      const startTime = new Date(drawerProgressData.allocation.startDate).getTime();

      const isoDeadline =
        targetTime > dueTime
          ? drawerProgressData.allocation.dueDate
          : targetTime < startTime
            ? drawerProgressData.allocation.startDate
            : new Date(targetTime).toISOString();

      await updateDeadlineMutation.mutateAsync({
        allocationId: selectedItem.allocationId,
        topicId,
        payload: { deadline: isoDeadline },
      });

      setEditingTopicId(null);
      setInlineDeadline('');
      setInlineError(null);
      void refetchDrawerProgress();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update topic deadline';
      setInlineError(msg);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleBatchChange = (vals: string[]) => {
    setSelectedBatchId(vals[0] ?? '');
    setPage(1);
  };

  const handleCourseChange = (vals: string[]) => {
    setSelectedCourseId(vals[0] ?? '');
    setPage(1);
  };

  const handleResetFilters = () => {
    setSelectedBatchId('');
    setSelectedCourseId('');
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(selectedBatchId || selectedCourseId || search.trim());

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
      <Header {...navConfig} />

      <DashboardContent>
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
              {/* 1. Search cadet or course title */}
              <div className="sm:col-span-2 lg:col-span-1">
                <DebouncedSearchInput
                  value={search}
                  onSearchChange={handleSearchChange}
                  placeholder="Search by cadet name or course title..."
                />
              </div>

              {/* 2. Batch Filter (Single-select dropdown styled like Audit Logs) */}
              <div className="lg:col-span-1">
                <MultiSelectDropdown
                  label="Batch"
                  options={batchOptions}
                  selectedValues={selectedBatchId ? [selectedBatchId] : []}
                  onChange={handleBatchChange}
                  singleSelect={true}
                  align="left"
                  className="w-full"
                />
              </div>

              {/* 3. Course Filter (Single-select dropdown styled like Audit Logs) */}
              <div className="lg:col-span-1">
                <MultiSelectDropdown
                  label="Course"
                  options={courseOptions}
                  selectedValues={selectedCourseId ? [selectedCourseId] : []}
                  onChange={handleCourseChange}
                  singleSelect={true}
                  align="left"
                  className="w-full"
                />
              </div>
            </div>

            {/* Clear Filters (Cross Icon Button - appears only when any filter is active) */}
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                title="Clear all filters"
                aria-label="Clear all filters"
                className="h-11 w-11 shrink-0 rounded-full border border-red-200/60 bg-[#FEE2E2] p-0 text-[#DC2626] transition-all hover:bg-[#FCD2D2] hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            )}
          </div>

          {/* Error Banner */}
          {isTrackersError && (
            <div className="p-4">
              <ErrorMessage error={trackersError} onRetry={() => void refetchTrackers()} />
            </div>
          )}

          {/* Main Telemetry Matrix Table using UI Primitives */}
          <TableContainer>
            <Table className="w-full table-fixed text-left">
              <TableHeader className="border-b border-[#E1E6EC] bg-[#F6F8FC] font-semibold text-[#667085]">
                <TableRow>
                  <TableHead className="w-[24%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]">
                    Cadet
                  </TableHead>
                  <TableHead className="w-[26%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]">
                    Course & Batch
                  </TableHead>
                  <TableHead className="w-[18%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]">
                    Progress
                  </TableHead>
                  <TableHead className="w-[12%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]">
                    Clearance
                  </TableHead>
                  <TableHead className="w-[10%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]">
                    Status
                  </TableHead>
                  <TableHead className="w-[10%] px-4 py-3.5 text-center text-xs font-semibold text-[#667085]">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-[#F2F4F7] font-normal">
                {isTrackersLoading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <TableRow key={`tracker-skel-${idx}`} className="animate-pulse">
                      <TableCell className="w-[24%] px-4 py-3.5">
                        <Skeleton className="h-4 w-28 rounded-md" />
                      </TableCell>
                      <TableCell className="w-[26%] px-4 py-3.5">
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-36 rounded-md" />
                          <Skeleton className="h-3 w-24 rounded-md" />
                        </div>
                      </TableCell>
                      <TableCell className="w-[18%] px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Skeleton className="h-2 w-24 rounded-full" />
                          <Skeleton className="h-3 w-8 rounded-md" />
                        </div>
                      </TableCell>
                      <TableCell className="w-[12%] px-4 py-3.5">
                        <Skeleton className="h-4 w-16 rounded-md" />
                      </TableCell>
                      <TableCell className="w-[10%] px-4 py-3.5">
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </TableCell>
                      <TableCell className="w-[10%] px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center">
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredTrackers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-5 py-14 text-center">
                      <div className="mx-auto max-w-sm space-y-2.5">
                        <H2 className="text-base font-bold text-slate-900">No mentees in scope</H2>
                        <P className="text-xs text-slate-500">
                          No active mentee progress records match your current filter parameters.
                        </P>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrackers.map((item) => {
                    const isSelected = selectedAllocationId === item.allocationId;
                    const isCompleted = item.status === 'COMPLETED';
                    const isOverdue = item.isOverdue || item.overdueTopicsCount > 0;

                    return (
                      <TableRow
                        key={item.allocationId}
                        onClick={() => setSelectedAllocationId(item.allocationId)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedAllocationId(item.allocationId);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/60' : 'hover:bg-[#F9FAFB]/80'
                        } focus:bg-slate-50 focus:outline-hidden`}
                      >
                        {/* Cadet */}
                        <TableCell className="w-[24%] px-4 py-3.5 whitespace-nowrap">
                          <Span className="truncate font-semibold text-slate-900 hover:text-blue-600">
                            {item.menteeName}
                          </Span>
                        </TableCell>

                        {/* Course & Batch */}
                        <TableCell className="w-[26%] px-4 py-3.5 whitespace-nowrap">
                          <div className="flex min-w-0 flex-col">
                            <Span
                              className="truncate font-semibold text-slate-800"
                              title={item.courseTitle}
                            >
                              {item.courseTitle}
                            </Span>
                            <Span className="truncate text-xs font-semibold text-blue-600">
                              {item.batchName || 'Individual Track'}
                            </Span>
                          </div>
                        </TableCell>

                        {/* Progress Bar & % */}
                        <TableCell className="w-[18%] px-4 py-3.5 whitespace-nowrap">
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
                        </TableCell>

                        {/* Clearance count */}
                        <TableCell className="w-[12%] px-4 py-3.5 text-xs font-medium whitespace-nowrap text-slate-600">
                          {item.completedTopicsCount} / {item.totalActiveTopics} Topics
                        </TableCell>

                        {/* Status */}
                        <TableCell className="w-[10%] px-4 py-3.5 whitespace-nowrap">
                          <AllocationStatusBadge status={item.status} isOverdue={isOverdue} />
                        </TableCell>

                        {/* Action Inspect Button */}
                        <TableCell className="w-[10%] px-4 py-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAllocationId(item.allocationId);
                              }}
                              title="Inspect syllabus outline"
                              aria-label={`Inspect syllabus outline for ${item.menteeName}`}
                              className="h-8 w-8 rounded-full p-0 text-slate-500 hover:bg-blue-50 hover:text-[#0044D3]"
                            >
                              <svg
                                className="h-4.5 w-4.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.75}
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

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
              itemLabel="Cadets"
            />
          </TableContainer>
        </div>
      </DashboardContent>

      {/* Cadet Syllabus & Topic Progress Modal (Audit Log Modal Style) */}
      <Modal
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedAllocationId(null)}
        size="xl"
        className="max-w-3xl"
        title="Cadet Curriculum & Milestones"
        titleClassName="text-xl font-bold text-slate-900 sm:text-2xl"
      >
        {selectedItem && (
          <div className="space-y-6">
            {/* Header Hero Card */}
            <div className="rounded-2xl border border-[#E1E6EC] bg-gradient-to-r from-blue-50/50 via-slate-50/60 to-white p-4.5 shadow-xs">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Span className="text-base font-bold text-slate-900 sm:text-lg">
                    {selectedItem.menteeName}
                  </Span>
                  <P className="text-xs text-slate-500">
                    {selectedItem.courseTitle} • {selectedItem.batchName ?? 'Individual Track'}
                  </P>
                </div>
                <div className="flex items-center gap-2">
                  <Span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#0044D3]">
                    {selectedItem.progressPercent}% Completed
                  </Span>
                  <Span className="text-xs font-medium text-slate-500">
                    {selectedItem.completedTopicsCount} of {selectedItem.totalActiveTopics} Finished
                  </Span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#0044D3]"
                  style={{ width: `${selectedItem.progressPercent}%` }}
                />
              </div>
            </div>

            {/* Syllabus Topic Milestones List */}
            <div className="space-y-3">
              <H4 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                Active Topic Milestones & Deadlines
              </H4>

              {isDrawerLoading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={`topic-skel-${idx}`}
                      className="rounded-2xl border border-[#E1E6EC] bg-white p-4 shadow-2xs"
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
                    const isEditingThisTopic = editingTopicId === t.topicId;

                    return (
                      <div
                        key={t.topicId}
                        className="rounded-2xl border border-[#E1E6EC] bg-white p-4 shadow-2xs transition-colors hover:border-slate-300"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <Span
                              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : isInProgress
                                    ? 'bg-blue-100 text-[#0044D3]'
                                    : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {isCompleted ? '✓' : idx + 1}
                            </Span>
                            <div className="flex flex-col">
                              <H4 className="text-sm font-bold text-slate-900">{t.title}</H4>
                              {t.deadline ? (
                                <Span
                                  className={`mt-0.5 text-xs ${
                                    t.isOverdue ? 'font-bold text-rose-600' : 'text-slate-500'
                                  }`}
                                >
                                  Target: {formatDateDDMMYY(t.deadline)}
                                  {t.isOverdue && ' (Overdue)'}
                                </Span>
                              ) : (
                                <Span className="mt-0.5 text-xs text-slate-400">
                                  No topic deadline set
                                </Span>
                              )}
                              {t.note && (
                                <div className="mt-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600">
                                  📝 Mentee Note: {t.note}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <Span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                isCompleted
                                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : isInProgress
                                    ? 'border border-blue-200 bg-blue-50 text-[#0044D3]'
                                    : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {isCompleted ? 'Done' : isInProgress ? 'Active' : 'Unstarted'}
                            </Span>

                            {!isEditingThisTopic && (
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                onClick={() => handleStartEditDeadline(t)}
                                className="h-auto p-0 text-xs font-semibold text-[#0044D3] hover:underline"
                              >
                                {t.deadline ? 'Edit Target Date' : '+ Set Target'}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Direct / Inline Target Date Setup inside first popup */}
                        {isEditingThisTopic && (
                          <div className="mt-3.5 border-t border-slate-100 pt-3.5">
                            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex flex-col">
                                <Span className="text-xs font-bold text-slate-800">
                                  Target Deadline Date (DD/MM/YY):
                                </Span>
                                {minDate && maxDate && (
                                  <Span className="mt-0.5 text-[11px] text-slate-400">
                                    Window: {formatDateDDMMYY(minDate)} →{' '}
                                    {formatDateDDMMYY(maxDate)}
                                  </Span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="w-48">
                                  <DatePicker
                                    id={`deadline-${t.topicId}`}
                                    value={inlineDeadline || undefined}
                                    onChange={(val) => {
                                      setInlineDeadline(val);
                                      setInlineError(null);
                                    }}
                                    minDate={minDate || undefined}
                                    maxDate={maxDate || undefined}
                                    placeholder="Select target date"
                                    className="h-9 text-xs"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  isLoading={updateDeadlineMutation.isPending}
                                  disabled={updateDeadlineMutation.isPending}
                                  onClick={() => void handleSaveInlineDeadline(t.topicId)}
                                  className="h-9 px-4 text-xs font-bold"
                                >
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={updateDeadlineMutation.isPending}
                                  onClick={handleCancelEditDeadline}
                                  className="h-9 px-3 text-xs font-medium"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                            {inlineError && (
                              <Span className="mt-1.5 block text-xs font-medium text-rose-600">
                                {inlineError}
                              </Span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

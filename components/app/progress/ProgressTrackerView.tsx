'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

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
import { SortableColumnHeader } from '@/components/patterns/SortableColumnHeader';
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
import { AllocationDisplayStatus, CourseAllocationStatus } from '@/hooks/useAllocations';
import { useInfiniteBatches } from '@/hooks/useBatches';
import { useInfiniteCourses } from '@/hooks/useCourses';
import {
  type ProgressTrackerItem,
  type TopicProgressItem,
  useAllocationProgress,
  usePrefetchAllocationProgress,
  useProgressTrackers,
  useUpdateTopicDeadlineMutation,
} from '@/hooks/useProgress';
import { cn } from '@/lib/cn';
import { formatDateDDMMYY, toISTDateInputValue } from '@/lib/date';

interface ProgressTrackerViewProps {
  readonly portalType?: 'mentor' | 'admin';
}

const STATUS_FILTER_OPTIONS: readonly MultiSelectOption[] = [
  { value: CourseAllocationStatus.ASSIGNED, label: AllocationDisplayStatus.ASSIGNED },
  { value: CourseAllocationStatus.IN_PROGRESS, label: AllocationDisplayStatus.IN_PROGRESS },
  { value: 'OVERDUE', label: AllocationDisplayStatus.OVERDUE },
  { value: CourseAllocationStatus.COMPLETED, label: AllocationDisplayStatus.COMPLETED },
  { value: CourseAllocationStatus.CLOSED_ROLE_CHANGE, label: AllocationDisplayStatus.ROLE_CHANGED },
  {
    value: CourseAllocationStatus.CLOSED_BATCH_CHANGE,
    label: AllocationDisplayStatus.BATCH_TRANSFERRED,
  },
  { value: CourseAllocationStatus.REVOKED, label: AllocationDisplayStatus.REVOKED },
];

function resolveSelectedOptions<T extends string>(
  vals: readonly T[],
  options: readonly MultiSelectOption<T>[],
): MultiSelectOption<T>[] {
  return vals.map((val) => options.find((o) => o.value === val) ?? { value: val, label: val });
}

export function ProgressTrackerView({ portalType = 'mentor' }: ProgressTrackerViewProps) {
  const [selectedBatchOptions, setSelectedBatchOptions] = useState<MultiSelectOption[]>([]);
  const [selectedCourseOptions, setSelectedCourseOptions] = useState<MultiSelectOption[]>([]);
  const [selectedStatusOptions, setSelectedStatusOptions] = useState<MultiSelectOption[]>([]);
  const [batchSearch, setBatchSearch] = useState<string>('');
  const [courseSearch, setCourseSearch] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [sortField, setSortField] = useState<'menteeName' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAllocationId, setSelectedAllocationId] = useState<string | null>(null);

  const selectedBatchIds = useMemo(
    () => selectedBatchOptions.map((o) => o.value),
    [selectedBatchOptions],
  );
  const selectedCourseIds = useMemo(
    () => selectedCourseOptions.map((o) => o.value),
    [selectedCourseOptions],
  );
  const selectedStatusValues = useMemo(
    () => selectedStatusOptions.map((o) => o.value),
    [selectedStatusOptions],
  );

  // Direct inline deadline editor state inside the popup
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [inlineDeadline, setInlineDeadline] = useState<string>('');
  const [inlineError, setInlineError] = useState<string | null>(null);

  // 3-dots action menu state
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openActionMenuId) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setOpenActionMenuId(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenActionMenuId(null);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openActionMenuId]);

  const updateDeadlineMutation = useUpdateTopicDeadlineMutation();
  const prefetchProgress = usePrefetchAllocationProgress();

  const navConfig = portalType === 'admin' ? ADMIN_PROGRESS_NAV : MENTOR_PROGRESS_NAV;

  // 1. Fetch Trackers Telemetry (M8 Backend Endpoint with Pagination)
  const {
    data: trackersResponse,
    isLoading: isTrackersLoading,
    isFetching: isTrackersFetching,
    isError: isTrackersError,
    error: trackersError,
    refetch: refetchTrackers,
  } = useProgressTrackers({
    batchIds: selectedBatchIds.length > 0 ? selectedBatchIds : undefined,
    courseIds: selectedCourseIds.length > 0 ? selectedCourseIds : undefined,
    statuses: selectedStatusValues.length > 0 ? selectedStatusValues : undefined,
    sortField: sortField === 'createdAt' && sortOrder === 'desc' ? undefined : sortField,
    sortOrder,
    search: search.trim() || undefined,
    page,
    limit,
  });

  const isTableLoading = isTrackersLoading || isTrackersFetching;

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

  // 2. Fetch Batches for Filter Dropdown with Infinite Scroll & Server Search (15 items per page)
  const {
    data: batchesInfiniteData,
    fetchNextPage: fetchNextBatches,
    hasNextPage: hasNextBatches,
    isFetching: isFetchingBatches,
    isFetchingNextPage: isFetchingNextBatches,
  } = useInfiniteBatches(15, batchSearch, portalType);

  const batches = useMemo(
    () => batchesInfiniteData?.pages.flatMap((p) => p.items) ?? [],
    [batchesInfiniteData],
  );

  const batchOptions: readonly MultiSelectOption[] = useMemo(() => {
    const optionsMap = new Map<string, MultiSelectOption>();
    for (const b of batches) {
      optionsMap.set(b.id, {
        value: b.id,
        label: `${b.name} (${b.code})`,
      });
    }
    for (const opt of selectedBatchOptions) {
      if (!optionsMap.has(opt.value)) {
        optionsMap.set(opt.value, opt);
      }
    }
    return Array.from(optionsMap.values());
  }, [batches, selectedBatchOptions]);

  // 3. Fetch Courses for Filter Dropdown with Infinite Scroll & Server Search (15 items per page)
  const {
    data: coursesInfiniteData,
    fetchNextPage: fetchNextCourses,
    hasNextPage: hasNextCourses,
    isFetching: isFetchingCourses,
    isFetchingNextPage: isFetchingNextCourses,
  } = useInfiniteCourses(15, courseSearch);

  const courses = useMemo(
    () => coursesInfiniteData?.pages.flatMap((p) => p.courses) ?? [],
    [coursesInfiniteData],
  );

  const courseOptions: readonly MultiSelectOption[] = useMemo(() => {
    const optionsMap = new Map<string, MultiSelectOption>();
    for (const c of courses) {
      optionsMap.set(c.id, {
        value: c.id,
        label: c.title,
      });
    }
    for (const opt of selectedCourseOptions) {
      if (!optionsMap.has(opt.value)) {
        optionsMap.set(opt.value, opt);
      }
    }
    return Array.from(optionsMap.values());
  }, [courses, selectedCourseOptions]);

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

  const isAnyTopicEditing = Boolean(
    editingTopicId && drawerProgressData?.topics.some((t) => t.topicId === editingTopicId),
  );

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

  const handleOpenModal = (allocationId: string) => {
    setEditingTopicId(null);
    setInlineDeadline('');
    setInlineError(null);
    setSelectedAllocationId(allocationId);
  };

  const handleCloseModal = () => {
    setSelectedAllocationId(null);
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
    setSelectedBatchOptions(resolveSelectedOptions(vals, batchOptions));
    setPage(1);
  };

  const handleCourseChange = (vals: string[]) => {
    setSelectedCourseOptions(resolveSelectedOptions(vals, courseOptions));
    setPage(1);
  };

  const handleStatusChange = (vals: string[]) => {
    setSelectedStatusOptions(resolveSelectedOptions(vals, STATUS_FILTER_OPTIONS));
    setPage(1);
  };

  const handleSortName = (field: 'menteeName') => {
    setPage(1);
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleBatchScrollEnd = () => {
    if (hasNextBatches && !isFetchingNextBatches) {
      void fetchNextBatches();
    }
  };

  const handleCourseScrollEnd = () => {
    if (hasNextCourses && !isFetchingNextCourses) {
      void fetchNextCourses();
    }
  };

  const handleResetFilters = () => {
    setSelectedBatchOptions([]);
    setSelectedCourseOptions([]);
    setSelectedStatusOptions([]);
    setBatchSearch('');
    setCourseSearch('');
    setSearch('');
    setSortField('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    selectedBatchOptions.length > 0 ||
    selectedCourseOptions.length > 0 ||
    selectedStatusOptions.length > 0 ||
    sortField !== 'createdAt' ||
    sortOrder !== 'desc' ||
    batchSearch.trim() ||
    courseSearch.trim() ||
    search.trim(),
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
      <Header {...navConfig} />

      <DashboardContent>
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              {/* 1. Search mentee, course, batch */}
              <div className="min-w-[240px] flex-1">
                <DebouncedSearchInput
                  value={search}
                  onSearchChange={handleSearchChange}
                  placeholder="Search by mentee, course, or batch..."
                />
              </div>

              {/* 2. Batch Filter (Multi-select dropdown with infinite scroll & server search) */}
              <div className="w-full sm:w-[169px]">
                <MultiSelectDropdown
                  label="Batch"
                  options={batchOptions}
                  selectedValues={selectedBatchIds}
                  onChange={handleBatchChange}
                  singleSelect={false}
                  align="left"
                  className="w-full"
                  onScrollEnd={handleBatchScrollEnd}
                  onSearch={setBatchSearch}
                  isSearching={
                    isFetchingBatches && !isFetchingNextBatches && Boolean(batchSearch.trim())
                  }
                />
              </div>

              {/* 3. Course Filter (Multi-select dropdown with infinite scroll & server search) */}
              <div className="w-full sm:w-[158px]">
                <MultiSelectDropdown
                  label="Course"
                  options={courseOptions}
                  selectedValues={selectedCourseIds}
                  onChange={handleCourseChange}
                  singleSelect={false}
                  align="left"
                  className="w-full"
                  onScrollEnd={handleCourseScrollEnd}
                  onSearch={setCourseSearch}
                  isSearching={
                    isFetchingCourses && !isFetchingNextCourses && Boolean(courseSearch.trim())
                  }
                />
              </div>

              {/* 4. Course Status Filter (Multi-select dropdown) */}
              <div className="w-full sm:w-[165px]">
                <MultiSelectDropdown
                  label="Status"
                  options={STATUS_FILTER_OPTIONS}
                  selectedValues={selectedStatusValues}
                  onChange={handleStatusChange}
                  singleSelect={false}
                  align="right"
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
                  <SortableColumnHeader<'menteeName'>
                    field="menteeName"
                    label="Mentee"
                    sortField={sortField === 'menteeName' ? 'menteeName' : null}
                    sortOrder={sortOrder}
                    onSort={handleSortName}
                    tooltip="Sort by Mentee Name"
                    className="w-[24%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]"
                  />
                  <TableHead className="w-[26%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]">
                    Course & Batch
                  </TableHead>
                  <TableHead className="w-[18%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]">
                    Progress
                  </TableHead>
                  <TableHead className="w-[12%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]">
                    Topics Done
                  </TableHead>
                  <TableHead className="w-[10%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]">
                    Status
                  </TableHead>
                  <TableHead className="w-[10%] px-4 py-3.5 text-center text-xs font-semibold text-[#667085]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-[#F2F4F7] font-normal">
                {isTableLoading ? (
                  Array.from({ length: 10 }).map((_, idx) => (
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
                        onClick={() => handleOpenModal(item.allocationId)}
                        onMouseEnter={() => prefetchProgress(item.allocationId)}
                        onFocus={() => prefetchProgress(item.allocationId)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleOpenModal(item.allocationId);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/60' : 'hover:bg-[#F9FAFB]/80'
                        } focus:bg-slate-50 focus:outline-hidden`}
                      >
                        {/* Mentee */}
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

                        {/* Action Menu (3-dots) */}
                        <TableCell
                          className={cn(
                            'w-[10%] px-4 py-3.5 text-center whitespace-nowrap',
                            openActionMenuId === item.allocationId && 'relative z-30',
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            className={cn(
                              'relative inline-block text-left',
                              openActionMenuId === item.allocationId && 'z-40',
                            )}
                            ref={openActionMenuId === item.allocationId ? actionMenuRef : undefined}
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenuId(
                                  openActionMenuId === item.allocationId ? null : item.allocationId,
                                );
                              }}
                              onMouseEnter={() => prefetchProgress(item.allocationId)}
                              title="Progress actions"
                              aria-label={`Actions for ${item.menteeName}`}
                              className="h-8 w-8 rounded-full p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            >
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </Button>

                            {openActionMenuId === item.allocationId && (
                              <div className="animate-in fade-in zoom-in-95 absolute top-9 right-0 z-50 w-44 rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-xl">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenActionMenuId(null);
                                    handleOpenModal(item.allocationId);
                                  }}
                                  className="flex w-full items-center justify-start gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                                >
                                  <svg
                                    className="h-3.5 w-3.5 text-[#0044D3]"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                  <Span>Inspect Progress</Span>
                                </Button>
                              </div>
                            )}
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
              itemLabel="Mentees"
              isLoading={isTableLoading}
            />
          </TableContainer>
        </div>
      </DashboardContent>

      {/* Mentee Syllabus & Topic Progress Modal (Audit Log Modal Style) */}
      <Modal
        isOpen={Boolean(selectedItem)}
        onClose={handleCloseModal}
        isSubmitting={updateDeadlineMutation.isPending}
        size="xl"
        className="max-w-4xl"
        title="Mentee Progress Details"
        titleClassName="text-xl font-bold text-slate-900 sm:text-2xl"
      >
        {selectedItem && (
          <div className="space-y-6">
            {/* Event Header Hero Strip */}
            <div
              className={`flex items-center rounded-2xl border border-[#E1E6EC] bg-gradient-to-r from-blue-50/50 via-slate-50/60 to-white px-4.5 py-3 shadow-xs transition-all duration-200 ${
                isAnyTopicEditing ? 'pointer-events-none opacity-40 blur-[1px]' : ''
              }`}
            >
              <Span className="cursor-default truncate text-base font-bold text-slate-900">
                {selectedItem.menteeName}
              </Span>
            </div>

            {/* Structured Metadata Grid (2x2): matches AuditDetailModal */}
            <div
              className={`grid grid-cols-1 gap-4 transition-all duration-200 sm:grid-cols-2 ${
                isAnyTopicEditing ? 'pointer-events-none opacity-40 blur-[1px]' : ''
              }`}
            >
              {/* Card 1: Overall Completion */}
              <div className="rounded-2xl border border-[#E1E6EC] bg-white p-4.5 shadow-xs transition-colors hover:border-slate-300">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0044D3]">
                    <svg
                      className="h-4.5 w-4.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
                      Overall Completion
                    </Span>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Span className="truncate text-sm font-bold text-slate-900">
                        {selectedItem.progressPercent}% Completed
                      </Span>
                      <Span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-bold text-[#0044D3]">
                        {selectedItem.completedTopicsCount} / {selectedItem.totalActiveTopics}{' '}
                        Finished
                      </Span>
                    </div>
                    {/* Sleek Progress bar */}
                    <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[#0044D3] transition-all duration-300"
                        style={{ width: `${selectedItem.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Timeline Status */}
              <div className="rounded-2xl border border-[#E1E6EC] bg-white p-4.5 shadow-xs transition-colors hover:border-slate-300">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      selectedItem.isOverdue || selectedItem.overdueTopicsCount > 0
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    <svg
                      className="h-4.5 w-4.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
                      Timeline Status
                    </Span>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Span
                        className={`rounded-md border px-2 py-0.5 text-xs font-bold ${
                          selectedItem.isOverdue || selectedItem.overdueTopicsCount > 0
                            ? 'border-rose-200 bg-rose-50 text-rose-700'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {selectedItem.isOverdue || selectedItem.overdueTopicsCount > 0
                          ? 'Overdue'
                          : 'On Track'}
                      </Span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Allocation Window */}
              <div className="rounded-2xl border border-[#E1E6EC] bg-white p-4.5 shadow-xs transition-colors hover:border-slate-300">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <svg
                      className="h-4.5 w-4.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
                      Allocation Window
                    </Span>
                    {isDrawerLoading ? (
                      <Skeleton className="mt-1 h-5 w-36 rounded-md" />
                    ) : minDate || maxDate ? (
                      <Span className="mt-0.5 block truncate text-sm font-bold text-slate-900">
                        {minDate ? formatDateDDMMYY(minDate) : '—'} →{' '}
                        {maxDate ? formatDateDDMMYY(maxDate) : '—'}
                      </Span>
                    ) : (
                      <Span className="mt-0.5 block truncate text-xs text-slate-400">
                        Flexible timeline (no window set)
                      </Span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 4: Assigned Course & Batch */}
              <div className="rounded-2xl border border-[#E1E6EC] bg-white p-4.5 shadow-xs transition-colors hover:border-slate-300">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <svg
                      className="h-4.5 w-4.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
                      Course Track
                    </Span>
                    <div className="group/track relative mt-0.5">
                      <Span className="block cursor-default truncate text-sm font-bold text-slate-900">
                        {selectedItem.courseTitle}
                      </Span>
                      <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-1.5 hidden w-max max-w-sm rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium break-all whitespace-normal text-white shadow-2xl group-hover/track:block">
                        {selectedItem.courseTitle}
                      </div>
                    </div>
                    <Span className="mt-0.5 block truncate text-xs text-slate-500">
                      {selectedItem.batchName
                        ? `Batch: ${selectedItem.batchName}`
                        : 'Individual Track'}
                    </Span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Topic Milestones Container (matches AuditDetailModal payload cards) */}
            <div className="overflow-hidden rounded-2xl border border-[#E1E6EC] bg-white shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4 py-3">
                <Span className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold tracking-wider text-[#0044D3] uppercase">
                  Active Topic Milestones & Deadlines
                </Span>
                <Span className="text-xs font-semibold text-slate-500">
                  {selectedItem.completedTopicsCount} of {selectedItem.totalActiveTopics} Finished
                </Span>
              </div>

              {isDrawerLoading ? (
                <div className="divide-y divide-slate-100 p-4">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={`topic-skel-${idx}`}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-36 rounded-md" />
                          <Skeleton className="h-3 w-24 rounded-md" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : isDrawerError ? (
                <div className="p-4">
                  <ErrorMessage error={drawerError} onRetry={() => void refetchDrawerProgress()} />
                </div>
              ) : !drawerProgressData?.topics.length ? (
                <div className="flex h-36 flex-col items-center justify-center p-6 text-center">
                  <Span className="text-2xl">📚</Span>
                  <H4 className="mt-2 text-xs font-bold text-slate-800">No Active Topics</H4>
                  <P className="mt-1 text-xs text-slate-500">
                    This course currently has no active syllabus topics configured.
                  </P>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {drawerProgressData.topics.map((t, idx) => {
                    const isCompleted = t.status === 'COMPLETED';
                    const isInProgress = t.status === 'IN_PROGRESS';
                    const isEditingThisTopic = isAnyTopicEditing && editingTopicId === t.topicId;

                    return (
                      <div
                        key={t.topicId}
                        className={`p-4 transition-all duration-200 ${
                          isEditingThisTopic
                            ? 'relative z-10 rounded-xl bg-white shadow-xs ring-2 ring-[#0044D3]/20'
                            : isAnyTopicEditing
                              ? 'pointer-events-none opacity-35 blur-[1px] select-none'
                              : 'hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-1 items-start gap-3">
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
                            <div className="min-w-0 flex-1">
                              <H4 className="cursor-default text-sm font-bold break-words text-slate-900">
                                {t.title}
                              </H4>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                {t.deadline ? (
                                  <Span
                                    className={`text-xs ${
                                      t.isOverdue && !isCompleted
                                        ? 'font-bold text-rose-600'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    Target: {formatDateDDMMYY(t.deadline)}
                                    {t.isOverdue && !isCompleted && ' (Overdue)'}
                                  </Span>
                                ) : !isCompleted ? (
                                  <Span className="text-xs text-slate-400">
                                    No topic deadline set
                                  </Span>
                                ) : null}
                              </div>
                              {t.note && (
                                <div className="mt-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600">
                                  📝 Mentee Note: {t.note}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
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

                            {!isEditingThisTopic && !isCompleted && (
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                onClick={() => handleStartEditDeadline(t)}
                                className="h-8 px-2 text-xs font-semibold text-[#0044D3] hover:underline"
                              >
                                {t.deadline ? 'Edit Target' : '+ Set Target'}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Direct Inline Target Date Setup */}
                        {isEditingThisTopic && (
                          <div className="mt-3.5 rounded-xl border border-blue-100 bg-blue-50/40 p-3.5">
                            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex flex-col">
                                <Span className="text-xs font-bold text-slate-800">
                                  Target Deadline Date (DD/MM/YY):
                                </Span>
                                {minDate && maxDate && (
                                  <Span className="mt-0.5 text-[11px] text-slate-500">
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

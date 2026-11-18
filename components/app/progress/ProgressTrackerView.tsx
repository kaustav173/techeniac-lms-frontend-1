'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AllocationStatusBadge } from '@/components/app/allocations/AllocationStatusBadge';
import {
  ADMIN_PROGRESS_NAV,
  MENTOR_PROGRESS_NAV,
} from '@/components/app/navigation/portal-nav.config';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { DebouncedSearchInput } from '@/components/patterns/DebouncedSearchInput';
import { PaginationControls } from '@/components/patterns/PaginationControls';
import { SortableColumnHeader } from '@/components/patterns/SortableColumnHeader';
import { Button } from '@/components/ui/Button';
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
import { Tooltip } from '@/components/ui/Tooltip';
import { H2, P, Span } from '@/components/ui/Typography';
import { AllocationDisplayStatus, CourseAllocationStatus } from '@/hooks/useAllocations';
import { useInfiniteBatches } from '@/hooks/useBatches';
import { useInfiniteCourses } from '@/hooks/useCourses';
import {
  type ProgressTrackerItem,
  usePrefetchAllocationProgress,
  useProgressTrackers,
} from '@/hooks/useProgress';
import { cn } from '@/lib/cn';

export interface ProgressTrackerViewProps {
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

function MenteeSearchUrlSync({ onSync }: { readonly onSync: (name: string) => void }) {
  const searchParams = useSearchParams();
  const menteeName = searchParams.get('menteeName');

  useEffect(() => {
    if (menteeName) {
      onSync(menteeName);
    }
  }, [menteeName, onSync]);

  return null;
}

export function ProgressTrackerView({ portalType = 'mentor' }: ProgressTrackerViewProps) {
  const [selectedBatchOptions, setSelectedBatchOptions] = useState<MultiSelectOption[]>([]);
  const [selectedCourseOptions, setSelectedCourseOptions] = useState<MultiSelectOption[]>([]);
  const [selectedStatusOptions, setSelectedStatusOptions] = useState<MultiSelectOption[]>([]);
  const [batchSearch, setBatchSearch] = useState<string>('');
  const [courseSearch, setCourseSearch] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const handleSyncMenteeSearch = useCallback((menteeName: string) => {
    setSearch((prev) => (prev !== menteeName ? menteeName : prev));
    setPage(1);
  }, []);

  const [limit, setLimit] = useState<number>(10);
  const [sortField, setSortField] = useState<'menteeName' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const router = useRouter();

  const handleNavigateToDetail = (allocationId: string) => {
    const basePath = portalType === 'mentor' ? '/mentor/progress' : '/admin/progress';
    router.push(`${basePath}/${allocationId}`);
  };

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
    batchSearch.trim() ||
    courseSearch.trim() ||
    search.trim(),
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
      <Suspense fallback={null}>
        <MenteeSearchUrlSync onSync={handleSyncMenteeSearch} />
      </Suspense>
      <Header {...navConfig} />

      <DashboardContent>
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              {/* 1. Search mentee, course, batch, or status */}
              <div className="w-full sm:w-[375px]">
                <DebouncedSearchInput
                  value={search}
                  onSearchChange={handleSearchChange}
                  placeholder="Search by mentee, course, batch, or status..."
                />
              </div>

              {/* 2. Batch Filter (Multi-select dropdown with infinite scroll & server search) */}
              <div className="w-full sm:w-auto">
                <MultiSelectDropdown
                  label="Batch"
                  options={batchOptions}
                  selectedValues={selectedBatchIds}
                  onChange={handleBatchChange}
                  singleSelect={false}
                  align="left"
                  className="w-full sm:w-auto"
                  buttonClassName="w-full sm:w-auto px-4"
                  menuClassName="min-w-[200px]"
                  onScrollEnd={handleBatchScrollEnd}
                  onSearch={setBatchSearch}
                  isSearching={
                    isFetchingBatches && !isFetchingNextBatches && Boolean(batchSearch.trim())
                  }
                />
              </div>

              {/* 3. Course Filter (Multi-select dropdown with infinite scroll & server search) */}
              <div className="w-full sm:w-auto">
                <MultiSelectDropdown
                  label="Course"
                  options={courseOptions}
                  selectedValues={selectedCourseIds}
                  onChange={handleCourseChange}
                  singleSelect={false}
                  align="left"
                  className="w-full sm:w-auto"
                  buttonClassName="w-full sm:w-auto px-4"
                  menuClassName="min-w-[200px]"
                  onScrollEnd={handleCourseScrollEnd}
                  onSearch={setCourseSearch}
                  isSearching={
                    isFetchingCourses && !isFetchingNextCourses && Boolean(courseSearch.trim())
                  }
                />
              </div>

              {/* 4. Course Status Filter */}
              <div className="w-full sm:w-auto">
                <MultiSelectDropdown
                  label="Status"
                  options={STATUS_FILTER_OPTIONS}
                  selectedValues={selectedStatusValues}
                  onChange={handleStatusChange}
                  singleSelect={false}
                  align="right"
                  className="w-full sm:w-auto"
                  buttonClassName="w-full sm:w-auto px-4"
                  menuClassName="min-w-[180px]"
                />
              </div>

              {/* Clear Filters (Cross Icon Button - appears immediately adjacent to filters) */}
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
              <TableHeader className="border-b border-[#E1E6EC] bg-[#F6F8FC] font-semibold text-slate-700">
                <TableRow>
                  <SortableColumnHeader<'menteeName'>
                    field="menteeName"
                    label="Mentee"
                    sortField={sortField === 'menteeName' ? 'menteeName' : null}
                    sortOrder={sortOrder}
                    onSort={handleSortName}
                    tooltip="Sort by Mentee Name"
                    className="w-[24%] px-4 py-2.5 text-left font-semibold text-slate-700 sm:px-5 sm:py-3"
                  />
                  <TableHead className="w-[26%] px-4 py-2.5 text-left font-semibold text-slate-700 sm:px-5 sm:py-3">
                    Course & Batch
                  </TableHead>
                  <TableHead className="w-[18%] px-4 py-2.5 text-left font-semibold text-slate-700 sm:px-5 sm:py-3">
                    Progress
                  </TableHead>
                  <TableHead className="w-[12%] px-4 py-2.5 text-left font-semibold text-slate-700 sm:px-5 sm:py-3">
                    Topics Done
                  </TableHead>
                  <TableHead className="w-[10%] px-4 py-2.5 text-left font-semibold text-slate-700 sm:px-5 sm:py-3">
                    Status
                  </TableHead>
                  <TableHead className="w-[10%] px-4 py-2.5 text-center font-semibold text-slate-700 sm:px-5 sm:py-3">
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
                    const isCompleted = item.status === 'COMPLETED';
                    const isOverdue = item.isOverdue || item.overdueTopicsCount > 0;

                    return (
                      <TableRow
                        key={item.allocationId}
                        onClick={() => handleNavigateToDetail(item.allocationId)}
                        onMouseEnter={() => prefetchProgress(item.allocationId)}
                        onFocus={() => prefetchProgress(item.allocationId)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleNavigateToDetail(item.allocationId);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        className="cursor-pointer transition-colors hover:bg-[#F9FAFB]/80 focus:bg-slate-50 focus:outline-hidden"
                      >
                        {/* Mentee */}
                        <TableCell className="w-[24%] px-4 py-3.5 whitespace-nowrap">
                          <Tooltip
                            content={item.menteeName}
                            containerClassName="inline-flex max-w-full"
                          >
                            <Span className="truncate text-base font-semibold text-slate-900 hover:text-blue-600">
                              {item.menteeName}
                            </Span>
                          </Tooltip>
                        </TableCell>

                        {/* Course & Batch */}
                        <TableCell className="w-[26%] px-4 py-3.5 whitespace-nowrap">
                          <div className="flex min-w-0 flex-col">
                            <Tooltip
                              content={item.courseTitle}
                              containerClassName="inline-flex max-w-full"
                            >
                              <Span className="truncate text-base font-semibold text-slate-900">
                                {item.courseTitle}
                              </Span>
                            </Tooltip>
                            {item.batchName ? (
                              <Tooltip
                                content={item.batchName}
                                containerClassName="inline-flex max-w-full"
                              >
                                <Span className="truncate text-xs font-semibold text-blue-600">
                                  {item.batchName}
                                </Span>
                              </Tooltip>
                            ) : (
                              <Span className="truncate text-xs font-semibold text-blue-600">
                                Individual Track
                              </Span>
                            )}
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
                        <TableCell className="w-[12%] px-4 py-3.5 whitespace-nowrap">
                          <Span className="text-base font-semibold text-slate-900">
                            {item.completedTopicsCount} / {item.totalActiveTopics}
                          </Span>{' '}
                          <Span className="text-sm text-slate-500">Topics</Span>
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
                                    handleNavigateToDetail(item.allocationId);
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
    </div>
  );
}

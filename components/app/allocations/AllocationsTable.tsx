'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { AllocationStatusBadge } from '@/components/app/allocations/AllocationStatusBadge';
import { AssignCourseModal } from '@/components/app/allocations/AssignCourseModal';
import { AssignmentOverridesModal } from '@/components/app/allocations/AssignmentOverridesModal';
import { EditAllocationModal } from '@/components/app/allocations/EditAllocationModal';
import { RevokeAllocationModal } from '@/components/app/allocations/RevokeAllocationModal';
import { formatDurationMinutes } from '@/components/app/courses/types';
import { PaginationControls } from '@/components/patterns/PaginationControls';
import { SortableColumnHeader } from '@/components/patterns/SortableColumnHeader';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
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
import { P, Span } from '@/components/ui/Typography';
import {
  type AllocationFilters,
  type CourseAllocation,
  type CourseAllocationStatus,
  isTerminalAllocationStatus,
  useAllocationsList,
} from '@/hooks/useAllocations';
import { useInfiniteBatches } from '@/hooks/useBatches';
import { useInfiniteCourses } from '@/hooks/useCourses';
import { cn } from '@/lib/cn';
import { formatDateIST } from '@/lib/date';

const EM_DASH = '—';

function mergeSelectedOptionLabels<T>(
  selectedMap: Record<string, string>,
  loadedItems: readonly T[],
  getId: (item: T) => string,
  getLabel: (item: T) => string,
): readonly MultiSelectOption<string>[] {
  const optionsMap = new Map<string, string>();
  Object.entries(selectedMap).forEach(([val, label]) => {
    optionsMap.set(val, label);
  });
  loadedItems.forEach((item) => {
    optionsMap.set(getId(item), getLabel(item));
  });
  return Array.from(optionsMap.entries()).map(([value, label]) => ({ value, label }));
}

type SortField = 'course' | 'mentee' | 'batch' | 'started' | 'due' | 'duration';
type SortOrder = 'asc' | 'desc';

const ALLOCATION_STATUS_OPTIONS: readonly MultiSelectOption<string>[] = [
  { value: 'ASSIGNED', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'REVOKED', label: 'Revoked' },
];

export interface AllocationsTableProps {
  readonly userRole: 'SUPER_ADMIN' | 'MENTOR';
}

export function AllocationsTable({ userRole }: AllocationsTableProps) {
  const [filters, setFilters] = useState<AllocationFilters>({ page: 1, limit: 10 });
  const [searchInput, setSearchInput] = useState<string>('');
  const [batchSearch, setBatchSearch] = useState<string>('');
  const [courseSearch, setCourseSearch] = useState<string>('');
  const [selectedBatchOptions, setSelectedBatchOptions] = useState<Record<string, string>>({});
  const [selectedCourseOptions, setSelectedCourseOptions] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);

  // Modals & Action Menu state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<CourseAllocation | null>(null);
  const [revokingAllocation, setRevokingAllocation] = useState<CourseAllocation | null>(null);
  const [overridingAllocation, setOverridingAllocation] = useState<CourseAllocation | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openActionMenuId) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setOpenActionMenuId(null);
        setMenuPosition(null);
      }
    };
    const handleScrollOrResize = () => {
      setOpenActionMenuId(null);
      setMenuPosition(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenActionMenuId(null);
        setMenuPosition(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [openActionMenuId]);

  const toggleActionMenu = (e: React.MouseEvent<HTMLButtonElement>, allocId: string) => {
    e.stopPropagation();
    if (openActionMenuId === allocId) {
      setOpenActionMenuId(null);
      setMenuPosition(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = userRole === 'SUPER_ADMIN' ? 140 : 50;
    const openUpward = spaceBelow < menuHeight + 20;

    setMenuPosition({
      top: openUpward ? Math.max(10, rect.top - menuHeight) : rect.bottom + 6,
      right: Math.max(10, window.innerWidth - rect.right),
    });
    setOpenActionMenuId(allocId);
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useAllocationsList(filters);

  const isMentor = userRole === 'MENTOR';
  const portalType = isMentor ? 'mentor' : 'admin';

  const {
    data: batchesData,
    fetchNextPage: fetchNextBatches,
    hasNextPage: hasNextBatches,
    isFetchingNextPage: isFetchingNextBatches,
  } = useInfiniteBatches(10, batchSearch, portalType);

  const {
    data: coursesData,
    fetchNextPage: fetchNextCourses,
    hasNextPage: hasNextCourses,
    isFetchingNextPage: isFetchingNextCourses,
  } = useInfiniteCourses(10, courseSearch);

  const loadedBatches = useMemo(() => {
    return batchesData?.pages.flatMap((page) => page.items) ?? [];
  }, [batchesData]);

  const loadedCourses = useMemo(() => {
    return coursesData?.pages.flatMap((page) => page.courses) ?? [];
  }, [coursesData]);

  const courseOptions: readonly MultiSelectOption<string>[] = useMemo(
    () =>
      mergeSelectedOptionLabels(
        selectedCourseOptions,
        loadedCourses,
        (c) => c.id,
        (c) => c.title,
      ),
    [loadedCourses, selectedCourseOptions],
  );

  const batchOptions: readonly MultiSelectOption<string>[] = useMemo(
    () =>
      mergeSelectedOptionLabels(
        selectedBatchOptions,
        loadedBatches,
        (b) => b.id,
        (b) => b.name,
      ),
    [loadedBatches, selectedBatchOptions],
  );

  const rawAllocations = data?.items;
  const allocations = useMemo(() => rawAllocations ?? [], [rawAllocations]);
  const pagination = data?.pagination;

  const handleSort = (field: SortField) => {
    let nextField: SortField | null = field;
    let nextOrder: SortOrder | null = 'asc';

    if (sortField === field) {
      if (sortOrder === 'asc') {
        nextOrder = 'desc';
      } else {
        nextField = null;
        nextOrder = null;
      }
    }

    setSortField(nextField);
    setSortOrder(nextOrder);
    setFilters((prev) => ({
      ...prev,
      sortBy: nextField ?? undefined,
      sortOrder: nextOrder ?? undefined,
      page: 1,
    }));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => {
        const nextSearch = searchInput.trim() || undefined;
        if (prev.search === nextSearch) return prev;
        return { ...prev, search: nextSearch, page: 1 };
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleStatusFilter = (selectedStatuses: string[]) => {
    setFilters((prev) => ({
      ...prev,
      statuses:
        selectedStatuses.length > 0
          ? (selectedStatuses as (CourseAllocationStatus | 'OVERDUE')[])
          : undefined,
      status: undefined,
      isOverdue: selectedStatuses.includes('OVERDUE') ? true : undefined,
      page: 1,
    }));
  };

  const handleBatchFilter = (selectedBatchIds: string[]) => {
    setSelectedBatchOptions((prev) => {
      const updated = { ...prev };
      selectedBatchIds.forEach((id) => {
        const match = loadedBatches.find((b) => b.id === id);
        if (match) updated[id] = match.name;
      });
      Object.keys(updated).forEach((id) => {
        if (!selectedBatchIds.includes(id)) {
          delete updated[id];
        }
      });
      return updated;
    });
    setFilters((prev) => ({
      ...prev,
      batchIds: selectedBatchIds.length > 0 ? selectedBatchIds : undefined,
      batchId: undefined,
      page: 1,
    }));
  };

  const handleCourseFilter = (selectedCourseIds: string[]) => {
    setSelectedCourseOptions((prev) => {
      const updated = { ...prev };
      selectedCourseIds.forEach((id) => {
        const match = loadedCourses.find((c) => c.id === id);
        if (match) updated[id] = match.title;
      });
      Object.keys(updated).forEach((id) => {
        if (!selectedCourseIds.includes(id)) {
          delete updated[id];
        }
      });
      return updated;
    });
    setFilters((prev) => ({
      ...prev,
      courseIds: selectedCourseIds.length > 0 ? selectedCourseIds : undefined,
      courseId: undefined,
      page: 1,
    }));
  };

  const hasActiveFilters = Boolean(
    searchInput.trim() ||
    (filters.courseIds && filters.courseIds.length > 0) ||
    filters.courseId ||
    (filters.batchIds && filters.batchIds.length > 0) ||
    filters.batchId ||
    (filters.statuses && filters.statuses.length > 0) ||
    filters.status ||
    sortField !== null,
  );

  const handleClearFilters = () => {
    setSearchInput('');
    setBatchSearch('');
    setCourseSearch('');
    setSelectedBatchOptions({});
    setSelectedCourseOptions({});
    setSortField(null);
    setSortOrder(null);
    setFilters({ page: 1, limit: 10 });
  };

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative w-full sm:w-[424px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <svg
              className="h-4 w-4"
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
          </div>
          <Input
            type="search"
            placeholder="Search allocations by batch, course, or mentee..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search allocations by batch, course, or mentee"
            className="h-[49px] rounded-2xl border-[#E1E6EC] pr-4 pl-10 text-sm font-medium shadow-2xs hover:border-slate-300 focus:border-[#0044D3]"
          />
        </div>

        {/* Dropdown Filters & Clear */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Course Filter Dropdown */}
          <MultiSelectDropdown
            label="Course"
            options={courseOptions}
            selectedValues={filters.courseIds ?? []}
            onChange={handleCourseFilter}
            onSearch={setCourseSearch}
            onScrollEnd={() => {
              if (hasNextCourses && !isFetchingNextCourses) {
                void fetchNextCourses();
              }
            }}
            isLoadingMore={isFetchingNextCourses}
            className="w-full shrink-0 sm:w-44"
            buttonClassName="h-[48px] rounded-2xl border-[#E1E6EC] shadow-2xs"
          />

          {/* Batch Filter Dropdown */}
          <MultiSelectDropdown
            label="Batch"
            options={batchOptions}
            selectedValues={filters.batchIds ?? []}
            onChange={handleBatchFilter}
            onSearch={setBatchSearch}
            onScrollEnd={() => {
              if (hasNextBatches && !isFetchingNextBatches) {
                void fetchNextBatches();
              }
            }}
            isLoadingMore={isFetchingNextBatches}
            className="w-full shrink-0 sm:w-44"
            buttonClassName="h-[48px] rounded-2xl border-[#E1E6EC] shadow-2xs"
          />

          {/* Status Filter Dropdown */}
          <MultiSelectDropdown
            label="Status"
            options={ALLOCATION_STATUS_OPTIONS}
            selectedValues={filters.statuses?.map((s) => String(s)) ?? []}
            onChange={handleStatusFilter}
            className="w-full shrink-0 sm:w-[167px]"
            buttonClassName="h-[48px] rounded-2xl border-[#E1E6EC] shadow-2xs"
          />

          {/* Circular Red Cross Clear Button */}
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rose-300 bg-rose-50 p-0 text-rose-700 shadow-2xs transition-colors hover:border-rose-400 hover:bg-rose-100 hover:text-rose-800 focus-visible:ring-2 focus-visible:ring-rose-500/30"
              title="Clear all filters"
              aria-label="Clear all filters"
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
          ) : null}
        </div>

        {userRole === 'SUPER_ADMIN' ? (
          <div className="flex items-center gap-3 sm:ml-auto">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsAssignModalOpen(true)}
              className="h-[47px] gap-2 rounded-full bg-[#0044D3] px-5 text-sm font-semibold text-white shadow-xs hover:bg-[#0039B3]"
            >
              <Span className="text-base font-bold">+</Span>
              <Span>Assign Course</Span>
            </Button>
          </div>
        ) : null}
      </div>

      {/* Data Table */}
      <TableContainer>
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <SortableColumnHeader<SortField>
                field="course"
                label="Course"
                sortField={sortField}
                sortOrder={sortOrder ?? 'desc'}
                onSort={handleSort}
                tooltip="Sort by course"
                className="py-3.5 pr-4 pl-6 text-sm font-semibold text-[#667085]"
              />
              <SortableColumnHeader<SortField>
                field="mentee"
                label="Mentee"
                sortField={sortField}
                sortOrder={sortOrder ?? 'desc'}
                onSort={handleSort}
                tooltip="Sort by mentee"
                className="px-4 py-3.5 text-sm font-semibold text-[#667085]"
              />
              <SortableColumnHeader<SortField>
                field="batch"
                label="Batch"
                sortField={sortField}
                sortOrder={sortOrder ?? 'desc'}
                onSort={handleSort}
                tooltip="Sort by batch"
                className="px-4 py-3.5 text-sm font-semibold text-[#667085]"
              />
              <SortableColumnHeader<SortField>
                field="started"
                label="Started"
                sortField={sortField}
                sortOrder={sortOrder ?? 'desc'}
                onSort={handleSort}
                tooltip="Sort by start date"
                className="px-4 py-3.5 text-sm font-semibold text-[#667085]"
              />
              <SortableColumnHeader<SortField>
                field="due"
                label="Due"
                sortField={sortField}
                sortOrder={sortOrder ?? 'desc'}
                onSort={handleSort}
                tooltip="Sort by due date"
                className="px-4 py-3.5 text-sm font-semibold text-[#667085]"
              />
              <SortableColumnHeader<SortField>
                field="duration"
                label="Duration"
                sortField={sortField}
                sortOrder={sortOrder ?? 'desc'}
                onSort={handleSort}
                tooltip="Sort by duration"
                className="px-4 py-3.5 text-sm font-semibold text-[#667085]"
              />
              <TableHead className="px-4 py-3.5 text-sm font-semibold whitespace-nowrap text-[#667085]">
                Status
              </TableHead>
              <TableHead className="py-3.5 pr-6 pl-4 text-right text-sm font-semibold text-[#667085]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isFetching ? (
              Array.from({ length: 10 }).map((_, idx) => (
                <TableRow key={`alloc-skel-${idx}`} className="h-16">
                  <TableCell className="py-3.5 pr-4 pl-6">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-36 rounded-md" />
                      <Skeleton className="h-3 w-48 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <Skeleton className="h-3 w-20 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-24 rounded-md" />
                      <Skeleton className="h-3 w-16 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <Skeleton className="h-4 w-20 rounded-md" />
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <Skeleton className="h-4 w-20 rounded-md" />
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <Skeleton className="h-4 w-16 rounded-md" />
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="py-3.5 pr-6 pl-4 text-right">
                    <Skeleton className="ml-auto h-8 w-8 rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={8} className="px-6 py-8 text-center">
                  <ErrorMessage
                    error={error}
                    title="Failed to load allocations"
                    onRetry={() => void refetch()}
                  />
                </TableCell>
              </TableRow>
            ) : allocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="px-6 py-12 text-center">
                  <P className="text-sm font-medium text-slate-600">No course allocations found.</P>
                </TableCell>
              </TableRow>
            ) : (
              allocations.map((alloc) => {
                const isActionMenuOpen = openActionMenuId === alloc.id;
                return (
                  <TableRow
                    key={alloc.id}
                    className={cn(
                      'transition-colors hover:bg-[#F9FAFB]/90',
                      isActionMenuOpen && 'relative z-30',
                    )}
                  >
                    <TableCell className="py-3.5 pr-4 pl-6 align-middle">
                      <P
                        className="max-w-[200px] truncate font-semibold text-[#111827] transition-all hover:overflow-visible hover:whitespace-normal"
                        title={alloc.course?.title ?? 'Untitled Course'}
                      >
                        {alloc.course?.title ?? 'Untitled Course'}
                      </P>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 align-middle">
                      <P className="font-semibold text-[#111827]">
                        {alloc.user?.name ?? 'Individual Mentee'}
                      </P>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 align-middle">
                      {alloc.batch ? (
                        <P className="font-medium text-[#111827]">{alloc.batch.name}</P>
                      ) : (
                        <Span className="text-[#667085]">{EM_DASH}</Span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 align-middle font-medium text-[#475467]">
                      {formatDateIST(alloc.startDate)}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 align-middle font-medium text-[#475467]">
                      {formatDateIST(alloc.dueDate)}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 align-middle font-medium text-[#475467]">
                      {formatDurationMinutes(
                        alloc.estimatedMinutes ?? alloc.course?.estimatedMinutes,
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 align-middle whitespace-nowrap">
                      <AllocationStatusBadge status={alloc.status} isOverdue={alloc.isOverdue} />
                    </TableCell>
                    <TableCell
                      className="py-3.5 pr-6 pl-4 text-right align-middle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => toggleActionMenu(e, alloc.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full p-0 text-[#667085] hover:bg-slate-100 hover:text-[#111827] focus-visible:ring-2 focus-visible:ring-[#0044D3]"
                          title="Allocation actions"
                          aria-label="Allocation actions"
                          aria-haspopup="menu"
                          aria-expanded={isActionMenuOpen}
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </Button>

                        {isActionMenuOpen && menuPosition && (
                          <div
                            ref={actionMenuRef}
                            role="menu"
                            aria-label="Allocation actions"
                            style={{
                              top: `${menuPosition.top}px`,
                              right: `${menuPosition.right}px`,
                            }}
                            className="animate-in fade-in zoom-in-95 fixed z-50 w-44 rounded-2xl border border-[#E1E6EC] bg-white p-1.5 text-left shadow-xl"
                          >
                            {userRole === 'SUPER_ADMIN' ? (
                              <>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  role="menuitem"
                                  disabled={isTerminalAllocationStatus(alloc.status)}
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setMenuPosition(null);
                                    setEditingAllocation(alloc);
                                  }}
                                  className="flex w-full items-center justify-start gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <svg
                                    className="h-3.5 w-3.5 text-slate-600"
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
                                  <Span>Edit Dates</Span>
                                </Button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  role="menuitem"
                                  disabled={isTerminalAllocationStatus(alloc.status)}
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setMenuPosition(null);
                                    setOverridingAllocation(alloc);
                                  }}
                                  className="flex w-full items-center justify-start gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <svg
                                    className="h-3.5 w-3.5 text-slate-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <Span>Overrides</Span>
                                </Button>

                                <div className="my-1 border-t border-[#E1E6EC]" />

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  role="menuitem"
                                  disabled={isTerminalAllocationStatus(alloc.status)}
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setMenuPosition(null);
                                    setRevokingAllocation(alloc);
                                  }}
                                  className="flex w-full items-center justify-start gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <svg
                                    className="h-3.5 w-3.5 text-red-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                  <Span>Revoke</Span>
                                </Button>
                              </>
                            ) : (
                              <>
                                <Link
                                  href={
                                    alloc.user?.name
                                      ? `/mentor/progress?search=${encodeURIComponent(alloc.user.name)}`
                                      : '/mentor/progress'
                                  }
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setMenuPosition(null);
                                  }}
                                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#111827] transition-colors hover:bg-blue-50/80 hover:text-[#0044D3]"
                                >
                                  <svg
                                    className="h-4 w-4 text-[#0044D3]"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                    />
                                  </svg>
                                  <Span>Progress</Span>
                                </Link>
                                <Link
                                  href={
                                    alloc.user?.id
                                      ? `/mentor/reviews?menteeId=${alloc.user.id}${alloc.user?.name ? `&search=${encodeURIComponent(alloc.user.name)}` : ''}`
                                      : alloc.user?.name
                                        ? `/mentor/reviews?search=${encodeURIComponent(alloc.user.name)}`
                                        : '/mentor/reviews'
                                  }
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setMenuPosition(null);
                                  }}
                                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#111827] transition-colors hover:bg-purple-50/80 hover:text-purple-700"
                                >
                                  <svg
                                    className="h-4 w-4 text-purple-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                  <Span>Submissions</Span>
                                </Link>
                              </>
                            )}
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
      </TableContainer>

      {/* Attached Pagination Controls */}
      {pagination && pagination.total > 0 && (
        <PaginationControls
          page={pagination.page}
          limit={pagination.limit}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          onLimitChange={(limit) => setFilters((prev) => ({ ...prev, limit, page: 1 }))}
          isLoading={isLoading || isFetching}
          itemLabel="allocations"
          pageSizeOptions={[10, 20, 50]}
        />
      )}

      {/* Modals */}
      <AssignCourseModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        userRole={userRole}
      />

      <EditAllocationModal
        key={editingAllocation?.id}
        allocation={editingAllocation}
        isOpen={Boolean(editingAllocation)}
        onClose={() => setEditingAllocation(null)}
      />

      <AssignmentOverridesModal
        key={overridingAllocation?.id}
        allocation={overridingAllocation}
        isOpen={Boolean(overridingAllocation)}
        onClose={() => setOverridingAllocation(null)}
      />

      <RevokeAllocationModal
        key={revokingAllocation?.id}
        allocation={revokingAllocation}
        isOpen={Boolean(revokingAllocation)}
        onClose={() => setRevokingAllocation(null)}
      />
    </div>
  );
}

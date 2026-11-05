'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { AllocationStatusBadge } from '@/components/app/allocations/AllocationStatusBadge';
import { AssignCourseModal } from '@/components/app/allocations/AssignCourseModal';
import { AssignmentOverridesModal } from '@/components/app/allocations/AssignmentOverridesModal';
import { EditAllocationModal } from '@/components/app/allocations/EditAllocationModal';
import { RevokeAllocationModal } from '@/components/app/allocations/RevokeAllocationModal';
import { PaginationControls } from '@/components/patterns/PaginationControls';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import {
  SingleSelectDropdown,
  type SingleSelectOption,
} from '@/components/ui/SingleSelectDropdown';
import { Skeleton } from '@/components/ui/Skeleton';
import { P, Span } from '@/components/ui/Typography';
import {
  type AllocationFilters,
  type CourseAllocation,
  isTerminalAllocationStatus,
  useAllocationsList,
} from '@/hooks/useAllocations';
import { useBatchesList, useMentorBatches } from '@/hooks/useBatches';
import { useCourses } from '@/hooks/useCourses';
import { cn } from '@/lib/cn';
import { formatDateIST } from '@/lib/date';

const EM_DASH = '—';

type SortField = 'course' | 'mentee' | 'batch' | 'started' | 'due' | 'progress';
type SortOrder = 'asc' | 'desc';

type AllocationStatusFilter =
  'ALL' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'REVOKED';

const ALLOCATION_STATUS_OPTIONS: readonly SingleSelectOption<string>[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'REVOKED', label: 'Revoked' },
];

export interface AllocationsTableProps {
  readonly userRole: 'SUPER_ADMIN' | 'MENTOR';
}

export function AllocationsTable({ userRole }: AllocationsTableProps) {
  const [filters, setFilters] = useState<AllocationFilters>({ page: 1, limit: 15 });
  const [statusTab, setStatusTab] = useState<AllocationStatusFilter>('ALL');
  const [searchInput, setSearchInput] = useState<string>('');
  const [expandedAllocId, setExpandedAllocId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);

  // Modals & Action Menu state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<CourseAllocation | null>(null);
  const [revokingAllocation, setRevokingAllocation] = useState<CourseAllocation | null>(null);
  const [overridingAllocation, setOverridingAllocation] = useState<CourseAllocation | null>(null);
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

  const { data, isLoading, isFetching, isError, error, refetch } = useAllocationsList(filters);

  const isMentor = userRole === 'MENTOR';
  const { data: adminBatchesData } = useBatchesList({ limit: 100 }, { enabled: !isMentor });
  const { data: mentorBatchesData } = useMentorBatches({ limit: 100 }, { enabled: isMentor });

  const batchesList = useMemo(() => {
    if (isMentor) {
      return mentorBatchesData ?? [];
    }
    return adminBatchesData?.items ?? [];
  }, [isMentor, mentorBatchesData, adminBatchesData]);

  const { courses } = useCourses();

  const courseOptions: readonly SingleSelectOption<string>[] = useMemo(() => {
    return [{ value: '', label: 'All' }, ...courses.map((c) => ({ value: c.id, label: c.title }))];
  }, [courses]);

  const batchOptions: readonly SingleSelectOption<string>[] = useMemo(() => {
    return [
      { value: '', label: 'All' },
      ...batchesList.map((b) => ({ value: b.id, label: b.name })),
    ];
  }, [batchesList]);

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

  const renderSortIcon = (isActive: boolean, order?: 'asc' | 'desc' | null) => {
    if (!isActive || !order) {
      return (
        <svg
          className="h-3.5 w-3.5 text-slate-400 opacity-60 transition-opacity group-hover:opacity-100"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
          />
        </svg>
      );
    }
    return (
      <svg
        className="h-3.5 w-3.5 text-[#0044D3]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        {order === 'asc' ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75"
          />
        )}
      </svg>
    );
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

  const handleStatusTabChange = (tab: AllocationStatusFilter) => {
    setStatusTab(tab);
    setFilters((prev) => ({
      ...prev,
      status: tab === 'ALL' ? undefined : tab,
      isOverdue: tab === 'OVERDUE' ? true : undefined,
      page: 1,
    }));
  };

  const handleBatchFilter = (batchId: string) => {
    setFilters((prev) => ({
      ...prev,
      batchId: batchId || undefined,
      page: 1,
    }));
  };

  const handleCourseFilter = (courseId: string) => {
    setFilters((prev) => ({
      ...prev,
      courseId: courseId || undefined,
      page: 1,
    }));
  };

  const hasActiveFilters = Boolean(
    searchInput.trim() ||
    filters.courseId ||
    filters.batchId ||
    statusTab !== 'ALL' ||
    sortField !== null,
  );

  const handleClearFilters = () => {
    setSearchInput('');
    setStatusTab('ALL');
    setFilters({ page: 1, limit: 15 });
    setSortField(null);
    setSortOrder(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedAllocId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E1E6EC] bg-white p-4 shadow-xs sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative w-full sm:w-72 lg:w-80">
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
            placeholder="Search allocations..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search allocations"
            className="h-[47px] rounded-2xl border-[#E1E6EC] pr-4 pl-10 text-sm font-medium shadow-2xs hover:border-slate-300 focus:border-[#0044D3]"
          />
        </div>

        {/* Dropdown Filters & Clear */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Course Filter Dropdown */}
          <SingleSelectDropdown
            label="Course"
            value={filters.courseId ?? ''}
            onChange={(val) => handleCourseFilter(val)}
            options={courseOptions}
            placeholder="Course"
            aria-label="Filter by Course"
            className="w-full shrink-0 sm:w-44"
            triggerClassName={cn(
              'h-[47px] rounded-2xl border-[#E1E6EC] bg-white px-4 text-sm font-semibold shadow-2xs transition-all hover:border-slate-300 hover:bg-[#F9FAFB]',
              filters.courseId && 'border-blue-300 bg-blue-50/50 text-[#0044D3]',
            )}
            menuClassName="w-full sm:min-w-[220px] rounded-2xl border border-[#E1E6EC] bg-white p-1.5 shadow-xl"
          />

          {/* Batch Filter Dropdown */}
          <SingleSelectDropdown
            label="Batch"
            value={filters.batchId ?? ''}
            onChange={(val) => handleBatchFilter(val)}
            options={batchOptions}
            placeholder="Batch"
            aria-label="Filter by Batch"
            className="w-full shrink-0 sm:w-44"
            triggerClassName={cn(
              'h-[47px] rounded-2xl border-[#E1E6EC] bg-white px-4 text-sm font-semibold shadow-2xs transition-all hover:border-slate-300 hover:bg-[#F9FAFB]',
              filters.batchId && 'border-blue-300 bg-blue-50/50 text-[#0044D3]',
            )}
            menuClassName="w-full sm:min-w-[220px] rounded-2xl border border-[#E1E6EC] bg-white p-1.5 shadow-xl"
          />

          {/* Status Filter Dropdown */}
          <SingleSelectDropdown
            label="Status"
            value={statusTab}
            onChange={(val) => handleStatusTabChange(val as AllocationStatusFilter)}
            options={ALLOCATION_STATUS_OPTIONS}
            placeholder="Status"
            aria-label="Filter by Status"
            className="w-full shrink-0 sm:w-44"
            triggerClassName={cn(
              'h-[47px] rounded-2xl border-[#E1E6EC] bg-white px-4 text-sm font-semibold shadow-2xs transition-all hover:border-slate-300 hover:bg-[#F9FAFB]',
              statusTab !== 'ALL' && 'border-blue-300 bg-blue-50/50 text-[#0044D3]',
            )}
            menuClassName="w-full sm:min-w-[220px] rounded-2xl border border-[#E1E6EC] bg-white p-1.5 shadow-xl"
          />

          {/* Circular Red Cross Clear Button */}
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-rose-300 bg-rose-50 text-rose-700 shadow-2xs transition-colors hover:border-rose-400 hover:bg-rose-100 hover:text-rose-800 focus-visible:ring-2 focus-visible:ring-rose-500/30 focus-visible:outline-none"
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
            </button>
          ) : null}
        </div>

        {userRole === 'SUPER_ADMIN' ? (
          <div className="flex items-center gap-3 sm:ml-auto">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsAssignModalOpen(true)}
              className="h-[47px] gap-2 rounded-2xl bg-[#0044D3] px-5 text-sm font-semibold text-white shadow-xs hover:bg-[#0039B3]"
            >
              <Span className="text-base font-bold">+</Span>
              <Span>Assign Course</Span>
            </Button>
          </div>
        ) : null}
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-2xl border border-[#E1E6EC] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-700">
            <thead className="border-b border-[#E1E6EC] bg-[#F8FAFC]">
              <tr>
                <th scope="col" className="w-10 py-3.5 pr-2 pl-6" />
                <th
                  scope="col"
                  className="px-4 py-3.5 text-sm font-semibold text-[#667085]"
                  aria-sort={
                    sortField === 'course'
                      ? sortOrder === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <button
                    type="button"
                    onClick={() => handleSort('course')}
                    className="group inline-flex cursor-pointer items-center gap-1.5 p-0 text-sm font-semibold text-[#667085] transition-colors hover:bg-transparent hover:text-[#111827] focus-visible:outline-none"
                    title={
                      sortField === 'course' && sortOrder
                        ? `Sorted by course (${sortOrder === 'asc' ? 'A to Z' : 'Z to A'})`
                        : 'Sort by course'
                    }
                  >
                    <Span className="text-sm font-semibold text-[#667085] transition-colors group-hover:text-[#111827]">
                      Course
                    </Span>
                    {renderSortIcon(sortField === 'course', sortOrder)}
                  </button>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3.5 text-sm font-semibold text-[#667085]"
                  aria-sort={
                    sortField === 'mentee'
                      ? sortOrder === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <button
                    type="button"
                    onClick={() => handleSort('mentee')}
                    className="group inline-flex cursor-pointer items-center gap-1.5 p-0 text-sm font-semibold text-[#667085] transition-colors hover:bg-transparent hover:text-[#111827] focus-visible:outline-none"
                    title={
                      sortField === 'mentee' && sortOrder
                        ? `Sorted by mentee (${sortOrder === 'asc' ? 'A to Z' : 'Z to A'})`
                        : 'Sort by mentee'
                    }
                  >
                    <Span className="text-sm font-semibold text-[#667085] transition-colors group-hover:text-[#111827]">
                      Mentee
                    </Span>
                    {renderSortIcon(sortField === 'mentee', sortOrder)}
                  </button>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3.5 text-sm font-semibold text-[#667085]"
                  aria-sort={
                    sortField === 'batch'
                      ? sortOrder === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <button
                    type="button"
                    onClick={() => handleSort('batch')}
                    className="group inline-flex cursor-pointer items-center gap-1.5 p-0 text-sm font-semibold text-[#667085] transition-colors hover:bg-transparent hover:text-[#111827] focus-visible:outline-none"
                    title={
                      sortField === 'batch' && sortOrder
                        ? `Sorted by batch (${sortOrder === 'asc' ? 'A to Z' : 'Z to A'})`
                        : 'Sort by batch'
                    }
                  >
                    <Span className="text-sm font-semibold text-[#667085] transition-colors group-hover:text-[#111827]">
                      Batch
                    </Span>
                    {renderSortIcon(sortField === 'batch', sortOrder)}
                  </button>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3.5 text-sm font-semibold text-[#667085]"
                  aria-sort={
                    sortField === 'started'
                      ? sortOrder === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <button
                    type="button"
                    onClick={() => handleSort('started')}
                    className="group inline-flex cursor-pointer items-center gap-1.5 p-0 text-sm font-semibold text-[#667085] transition-colors hover:bg-transparent hover:text-[#111827] focus-visible:outline-none"
                    title={
                      sortField === 'started' && sortOrder
                        ? `Sorted by start date (${sortOrder === 'asc' ? 'oldest first' : 'newest first'})`
                        : 'Sort by start date'
                    }
                  >
                    <Span className="text-sm font-semibold text-[#667085] transition-colors group-hover:text-[#111827]">
                      Started
                    </Span>
                    {renderSortIcon(sortField === 'started', sortOrder)}
                  </button>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3.5 text-sm font-semibold text-[#667085]"
                  aria-sort={
                    sortField === 'due'
                      ? sortOrder === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <button
                    type="button"
                    onClick={() => handleSort('due')}
                    className="group inline-flex cursor-pointer items-center gap-1.5 p-0 text-sm font-semibold text-[#667085] transition-colors hover:bg-transparent hover:text-[#111827] focus-visible:outline-none"
                    title={
                      sortField === 'due' && sortOrder
                        ? `Sorted by due date (${sortOrder === 'asc' ? 'earliest first' : 'latest first'})`
                        : 'Sort by due date'
                    }
                  >
                    <Span className="text-sm font-semibold text-[#667085] transition-colors group-hover:text-[#111827]">
                      Due
                    </Span>
                    {renderSortIcon(sortField === 'due', sortOrder)}
                  </button>
                </th>
                <th
                  scope="col"
                  className="w-44 px-4 py-3.5 text-sm font-semibold text-[#667085]"
                  aria-sort={
                    sortField === 'progress'
                      ? sortOrder === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <button
                    type="button"
                    onClick={() => handleSort('progress')}
                    className="group inline-flex cursor-pointer items-center gap-1.5 p-0 text-sm font-semibold text-[#667085] transition-colors hover:bg-transparent hover:text-[#111827] focus-visible:outline-none"
                    title={
                      sortField === 'progress' && sortOrder
                        ? `Sorted by progress (${sortOrder === 'asc' ? 'lowest first' : 'highest first'})`
                        : 'Sort by progress'
                    }
                  >
                    <Span className="text-sm font-semibold text-[#667085] transition-colors group-hover:text-[#111827]">
                      Progress
                    </Span>
                    {renderSortIcon(sortField === 'progress', sortOrder)}
                  </button>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3.5 text-sm font-semibold whitespace-nowrap text-[#667085]"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="py-3.5 pr-6 pl-4 text-right text-sm font-semibold text-[#667085]"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E6EC]/60">
              {isLoading || isFetching ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`alloc-skel-${idx}`} className="h-16">
                    <td className="py-3.5 pr-2 pl-6">
                      <Skeleton className="h-5 w-5 rounded-md" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-36 rounded-md" />
                        <Skeleton className="h-3 w-48 rounded-md" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28 rounded-md" />
                        <Skeleton className="h-3 w-20 rounded-md" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-24 rounded-md" />
                        <Skeleton className="h-3 w-16 rounded-md" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-4 w-20 rounded-md" />
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-4 w-20 rounded-md" />
                    </td>
                    <td className="w-44 px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-2 flex-1 rounded-full" />
                        <Skeleton className="h-3 w-8 rounded-md" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </td>
                    <td className="py-3.5 pr-6 pl-4 text-right">
                      <Skeleton className="ml-auto h-8 w-8 rounded-full" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center">
                    <ErrorMessage
                      error={error}
                      title="Failed to load allocations"
                      onRetry={() => void refetch()}
                    />
                  </td>
                </tr>
              ) : allocations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <P className="text-sm font-medium text-slate-600">
                      No course allocations found.
                    </P>
                  </td>
                </tr>
              ) : (
                allocations.map((alloc) => {
                  const isExpanded = expandedAllocId === alloc.id;
                  return (
                    <React.Fragment key={alloc.id}>
                      <tr
                        onClick={() => toggleExpand(alloc.id)}
                        className={cn(
                          'cursor-pointer transition-colors hover:bg-[#F9FAFB]/90',
                          isExpanded && 'bg-slate-50/70',
                        )}
                      >
                        <td className="py-3.5 pr-2 pl-6 align-middle">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(alloc.id);
                            }}
                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md p-0 text-[#667085] transition-colors hover:bg-slate-100 hover:text-slate-900"
                            title={isExpanded ? 'Collapse breakdown' : 'Expand mentee breakdown'}
                            aria-label={
                              isExpanded ? 'Collapse breakdown' : 'Expand mentee breakdown'
                            }
                          >
                            <svg
                              className={cn(
                                'h-4 w-4 transition-transform duration-150',
                                isExpanded && 'rotate-90',
                              )}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <P
                            className="max-w-[200px] truncate font-semibold text-[#111827] transition-all hover:overflow-visible hover:whitespace-normal"
                            title={alloc.course?.title ?? 'Untitled Course'}
                          >
                            {alloc.course?.title ?? 'Untitled Course'}
                          </P>
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <P className="font-semibold text-[#111827]">
                            {alloc.user?.name ?? 'Individual Mentee'}
                          </P>
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          {alloc.batch ? (
                            <P className="font-medium text-[#111827]">{alloc.batch.name}</P>
                          ) : (
                            <Span className="text-[#667085]">{EM_DASH}</Span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 align-middle font-medium text-[#475467]">
                          {formatDateIST(alloc.startDate)}
                        </td>
                        <td className="px-4 py-3.5 align-middle font-medium text-[#475467]">
                          {formatDateIST(alloc.dueDate)}
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-[#0044D3] transition-all"
                                style={{
                                  width: `${Math.min(100, Math.max(0, alloc.progressPercent))}%`,
                                }}
                              />
                            </div>
                            <Span className="w-9 text-right text-xs font-bold text-[#475467]">
                              {alloc.progressPercent}%
                            </Span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                          <AllocationStatusBadge
                            status={alloc.status}
                            isOverdue={alloc.isOverdue}
                          />
                        </td>
                        <td
                          className="py-3.5 pr-6 pl-4 text-right align-middle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {userRole === 'SUPER_ADMIN' ? (
                            <div
                              ref={openActionMenuId === alloc.id ? actionMenuRef : undefined}
                              className="relative flex items-center justify-end"
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionMenuId((prev) =>
                                    prev === alloc.id ? null : alloc.id,
                                  );
                                }}
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full p-0 text-[#667085] hover:bg-transparent hover:text-[#111827] focus-visible:ring-2 focus-visible:ring-[#0044D3] focus-visible:outline-none"
                                title="Allocation actions"
                                aria-label="Allocation actions"
                                aria-haspopup="menu"
                                aria-expanded={openActionMenuId === alloc.id}
                              >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>

                              {openActionMenuId === alloc.id && (
                                <div
                                  role="menu"
                                  aria-label="Allocation actions"
                                  className="animate-in fade-in zoom-in-95 absolute top-9 right-0 z-30 w-44 rounded-2xl border border-[#E1E6EC] bg-white p-1.5 shadow-xl"
                                >
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    role="menuitem"
                                    disabled={isTerminalAllocationStatus(alloc.status)}
                                    onClick={() => {
                                      setOpenActionMenuId(null);
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
                                </div>
                              )}
                            </div>
                          ) : (
                            <div
                              ref={openActionMenuId === alloc.id ? actionMenuRef : undefined}
                              className="relative flex items-center justify-end"
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionMenuId((prev) =>
                                    prev === alloc.id ? null : alloc.id,
                                  );
                                }}
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full p-0 text-[#667085] hover:bg-transparent hover:text-[#111827] focus-visible:ring-2 focus-visible:ring-[#0044D3] focus-visible:outline-none"
                                title="Allocation actions"
                                aria-label="Allocation actions"
                                aria-haspopup="menu"
                                aria-expanded={openActionMenuId === alloc.id}
                              >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>

                              {openActionMenuId === alloc.id && (
                                <div
                                  role="menu"
                                  aria-label="Allocation actions"
                                  className="animate-in fade-in zoom-in-95 absolute top-9 right-0 z-30 w-44 rounded-2xl border border-[#E1E6EC] bg-white p-1.5 text-left shadow-xl"
                                >
                                  <Link
                                    href={
                                      alloc.user?.name
                                        ? `/mentor/progress?search=${encodeURIComponent(alloc.user.name)}`
                                        : '/mentor/progress'
                                    }
                                    role="menuitem"
                                    onClick={() => setOpenActionMenuId(null)}
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
                                      alloc.user?.name
                                        ? `/mentor/reviews?search=${encodeURIComponent(alloc.user.name)}`
                                        : '/mentor/reviews'
                                    }
                                    role="menuitem"
                                    onClick={() => setOpenActionMenuId(null)}
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
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Breakdown Drawer */}
                      {isExpanded ? (
                        <tr className="bg-[#F8FAFC]/90">
                          <td colSpan={9} className="border-b border-[#E1E6EC] px-6 py-3 sm:px-8">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              {/* Metadata stats */}
                              <div className="flex flex-wrap items-center gap-6 text-xs">
                                <div className="flex items-center gap-2">
                                  <svg
                                    className="h-4 w-4 text-[#667085]"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    aria-hidden="true"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <Span className="text-[#475467]">
                                    Duration:{' '}
                                    <Span className="font-semibold text-[#111827]">
                                      {alloc.estimatedMinutes
                                        ? `${Math.floor(alloc.estimatedMinutes / 60)}h ${alloc.estimatedMinutes % 60}m`
                                        : 'Standard'}
                                    </Span>
                                  </Span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <svg
                                    className="h-4 w-4 text-[#667085]"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    aria-hidden="true"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M6.75 3v2.25M17.25 3v2.253M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                                    />
                                  </svg>
                                  <Span className="text-[#475467]">
                                    Schedule:{' '}
                                    <Span className="font-semibold text-[#111827]">
                                      {alloc.completedAt
                                        ? `Completed ${formatDateIST(alloc.completedAt)}`
                                        : alloc.isOverdue
                                          ? 'Overdue Target Date'
                                          : 'On Target'}
                                    </Span>
                                    {alloc.assignmentOverrides &&
                                    alloc.assignmentOverrides.length > 0 ? (
                                      <Span className="ml-1 text-[11px] text-[#667085]">
                                        ({alloc.assignmentOverrides.length} override
                                        {alloc.assignmentOverrides.length > 1 ? 's' : ''})
                                      </Span>
                                    ) : null}
                                  </Span>
                                </div>
                              </div>

                              {/* Quick Actions Button Group */}
                              <div className="flex shrink-0 items-center gap-2">
                                {userRole === 'SUPER_ADMIN' ? (
                                  <>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingAllocation(alloc)}
                                      disabled={isTerminalAllocationStatus(alloc.status)}
                                      className="h-8 rounded-full border-[#D0D5DD] bg-white px-3 text-xs font-semibold text-[#344054] shadow-2xs hover:bg-[#F9FAFB] hover:text-[#111827]"
                                    >
                                      Edit Dates
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setOverridingAllocation(alloc)}
                                      disabled={isTerminalAllocationStatus(alloc.status)}
                                      className="h-8 rounded-full border-[#D0D5DD] bg-white px-3 text-xs font-semibold text-[#344054] shadow-2xs hover:bg-[#F9FAFB] hover:text-[#111827]"
                                    >
                                      Manage Overrides
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Link
                                      href={
                                        alloc.user?.name
                                          ? `/mentor/reviews?search=${encodeURIComponent(alloc.user.name)}`
                                          : '/mentor/reviews'
                                      }
                                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#D0D5DD] bg-white px-3 text-xs font-semibold text-[#344054] shadow-2xs transition-colors hover:bg-slate-50 hover:text-[#111827]"
                                    >
                                      <svg
                                        className="h-3.5 w-3.5 text-[#667085]"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                        aria-hidden="true"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                      </svg>
                                      <Span>Submissions</Span>
                                    </Link>
                                    <Link
                                      href={
                                        alloc.user?.name
                                          ? `/mentor/progress?search=${encodeURIComponent(alloc.user.name)}`
                                          : '/mentor/progress'
                                      }
                                      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#0044D3] px-3.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#0039B3]"
                                    >
                                      <Span>Progress Tracker</Span>
                                      <svg
                                        className="h-3 w-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2.5}
                                        aria-hidden="true"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                        />
                                      </svg>
                                    </Link>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

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
            pageSizeOptions={[10, 15, 25, 50]}
          />
        )}
      </div>

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

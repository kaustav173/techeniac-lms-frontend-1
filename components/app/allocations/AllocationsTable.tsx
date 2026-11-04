'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { AllocationStatusBadge } from '@/components/app/allocations/AllocationStatusBadge';
import { AssignCourseModal } from '@/components/app/allocations/AssignCourseModal';
import { AssignmentOverridesModal } from '@/components/app/allocations/AssignmentOverridesModal';
import { EditAllocationModal } from '@/components/app/allocations/EditAllocationModal';
import { RevokeAllocationModal } from '@/components/app/allocations/RevokeAllocationModal';
import { DebouncedSearchInput } from '@/components/patterns/DebouncedSearchInput';
import { PaginationControls } from '@/components/patterns/PaginationControls';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import {
  SingleSelectDropdown,
  type SingleSelectOption,
} from '@/components/ui/SingleSelectDropdown';
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
  isTerminalAllocationStatus,
  useAllocationsList,
} from '@/hooks/useAllocations';
import { useBatchesList, useMentorBatches } from '@/hooks/useBatches';
import { useCourses } from '@/hooks/useCourses';
import { cn } from '@/lib/cn';
import { formatDateIST } from '@/lib/date';

const EM_DASH = '—';

const ALLOCATION_STATUS_OPTIONS: readonly SingleSelectOption<string>[] = [
  { value: 'ALL', label: 'Status: All' },
  { value: 'IN_PROGRESS', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'OVERDUE', label: 'Overdue' },
];

export interface AllocationsTableProps {
  readonly userRole: 'SUPER_ADMIN' | 'MENTOR';
}

export function AllocationsTable({ userRole }: AllocationsTableProps) {
  const [filters, setFilters] = useState<AllocationFilters>({ page: 1, limit: 15 });
  const [statusTab, setStatusTab] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'>(
    'ALL',
  );
  const [searchInput, setSearchInput] = useState<string>('');
  const [expandedAllocId, setExpandedAllocId] = useState<string | null>(null);

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
    return [
      { value: '', label: 'Course: All' },
      ...courses.map((c) => ({ value: c.id, label: c.title })),
    ];
  }, [courses]);

  const batchOptions: readonly SingleSelectOption<string>[] = useMemo(() => {
    return [
      { value: '', label: 'Batch: All' },
      ...batchesList.map((b) => ({ value: b.id, label: b.name })),
    ];
  }, [batchesList]);

  const rawAllocations = data?.items;
  const allocations = useMemo(() => rawAllocations ?? [], [rawAllocations]);
  const pagination = data?.pagination;

  // Telemetry KPIs
  const kpis = useMemo(() => {
    const active = allocations.filter(
      (a) => a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS',
    ).length;
    const completed = allocations.filter((a) => a.status === 'COMPLETED').length;
    const overdue = allocations.filter((a) => a.isOverdue).length;
    const avgProgress =
      allocations.length > 0
        ? Math.round(
            allocations.reduce((acc, a) => acc + (a.progressPercent ?? 0), 0) / allocations.length,
          )
        : 0;
    const uniqueCadets = new Set(allocations.map((a) => a.userId)).size;

    return { active, completed, overdue, avgProgress, uniqueCadets };
  }, [allocations]);

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

  const handleStatusTabChange = (tab: 'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE') => {
    setStatusTab(tab);
    setFilters((prev) => ({
      ...prev,
      status: tab === 'IN_PROGRESS' || tab === 'COMPLETED' ? tab : undefined,
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
    searchInput.trim() || filters.courseId || filters.batchId || statusTab !== 'ALL',
  );

  const handleClearFilters = () => {
    setSearchInput('');
    setStatusTab('ALL');
    setFilters({ page: 1, limit: 15 });
  };

  const toggleExpand = (id: string) => {
    setExpandedAllocId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Stitch KPI Telemetry Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Total Allocations
          </div>
          <div className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
            {pagination?.total ?? allocations.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">{kpis.active} active on current page</div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Mentees (This Page)
          </div>
          <div className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
            {kpis.uniqueCadets}
          </div>
          <div className="mt-1 text-xs text-slate-500">Unique learners on current page</div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Avg Velocity (This Page)
          </div>
          <div className="mt-2 text-2xl font-extrabold tracking-tight text-emerald-600">
            {kpis.avgProgress}%
          </div>
          <div className="mt-1 text-xs font-medium text-emerald-600">
            {kpis.completed} completed tracks on page
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Action Required (This Page)
          </div>
          <div
            className={`mt-2 text-2xl font-extrabold tracking-tight ${kpis.overdue > 0 ? 'text-rose-600' : 'text-slate-800'}`}
          >
            {kpis.overdue < 10 ? `0${kpis.overdue}` : kpis.overdue}
          </div>
          <div
            className={cn(
              'mt-1 text-xs font-medium',
              kpis.overdue > 0 ? 'text-rose-500' : 'text-slate-500',
            )}
          >
            {kpis.overdue > 0
              ? 'Overdue milestone allocations on page'
              : 'All page records on schedule'}
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col gap-3 py-1 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Search Input with proper width */}
          <div className="w-full sm:w-72 lg:w-80">
            <DebouncedSearchInput
              value={searchInput}
              onSearchChange={(val) => {
                setSearchInput(val);
                setFilters((prev) => ({ ...prev, search: val.trim() || undefined, page: 1 }));
              }}
              placeholder="Filter allocations..."
            />
          </div>

          {/* Course Filter Dropdown */}
          <div className="w-full sm:w-44">
            <SingleSelectDropdown
              value={filters.courseId ?? ''}
              onChange={(val) => handleCourseFilter(val)}
              options={courseOptions}
              size="sm"
              aria-label="Filter by Course"
            />
          </div>

          {/* Batch Filter Dropdown */}
          <div className="w-full sm:w-44">
            <SingleSelectDropdown
              value={filters.batchId ?? ''}
              onChange={(val) => handleBatchFilter(val)}
              options={batchOptions}
              size="sm"
              aria-label="Filter by Batch"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="w-full sm:w-40">
            <SingleSelectDropdown
              value={statusTab}
              onChange={(val) =>
                handleStatusTabChange(val as 'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE')
              }
              options={ALLOCATION_STATUS_OPTIONS}
              size="sm"
              aria-label="Filter by Status"
            />
          </div>

          {/* Circular Red Cross Clear Button */}
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              title="Clear all filters"
              aria-label="Clear all filters"
              className="h-8.5 w-8.5 rounded-full border border-red-200 bg-red-50 p-0 text-red-600 shadow-2xs transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-500"
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

          {/* Status Filter Dropdown */}
          <div className="w-full sm:w-40">
            <SingleSelectDropdown
              value={statusTab}
              onChange={(val) =>
                handleStatusTabChange(val as 'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE')
              }
              options={ALLOCATION_STATUS_OPTIONS}
              size="sm"
              aria-label="Filter by Status"
            />
          </div>

          {/* Circular Red Cross Clear Button */}
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              title="Clear all filters"
              aria-label="Clear all filters"
              className="h-8.5 w-8.5 rounded-full border border-red-200 bg-red-50 p-0 text-red-600 shadow-2xs transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-500"
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

        <div className="flex flex-wrap items-center gap-3">
          {userRole === 'SUPER_ADMIN' ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsAssignModalOpen(true)}
              className="h-9 gap-2 rounded-full bg-[#0044D3] px-4 text-xs font-semibold text-white shadow-xs hover:bg-[#0039B3] sm:h-10 sm:text-sm"
            >
              <Span className="text-base font-bold">+</Span>
              <Span>Assign Course</Span>
            </Button>
          ) : null}
        </div>
      </div>

      {/* Data Table */}
      <TableContainer className="rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        <Table className="w-full border-collapse text-left text-sm text-slate-700">
          <TableHeader className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold tracking-wider text-slate-500 uppercase">
            <TableRow>
              <TableHead scope="col" className="w-10 py-3.5 pr-2 pl-6" />
              <TableHead scope="col" className="px-4 py-3.5">
                Course
              </TableHead>
              <TableHead scope="col" className="px-4 py-3.5">
                Mentee
              </TableHead>
              <TableHead scope="col" className="px-4 py-3.5">
                Batch
              </TableHead>
              <TableHead scope="col" className="px-4 py-3.5">
                Started
              </TableHead>
              <TableHead scope="col" className="px-4 py-3.5">
                Due
              </TableHead>
              <TableHead scope="col" className="w-44 px-4 py-3.5">
                Progress
              </TableHead>
              <TableHead scope="col" className="px-4 py-3.5">
                Status
              </TableHead>
              <TableHead scope="col" className="py-3.5 pr-6 pl-4 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {isLoading || isFetching ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <TableRow key={`alloc-skel-${idx}`} className="h-16">
                  <TableCell className="py-4 pr-2 pl-6">
                    <Skeleton className="h-6 w-6 rounded-lg" />
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-36 rounded-md" />
                      <Skeleton className="h-3 w-48 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <Skeleton className="h-3 w-20 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-24 rounded-md" />
                      <Skeleton className="h-3 w-16 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Skeleton className="h-4 w-20 rounded-md" />
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Skeleton className="h-4 w-20 rounded-md" />
                  </TableCell>
                  <TableCell className="w-44 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-2 flex-1 rounded-full" />
                      <Skeleton className="h-3 w-8 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="py-4 pr-6 pl-4 text-right">
                    <Skeleton className="ml-auto h-8 w-8 rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={9} className="px-6 py-8 text-center">
                  <ErrorMessage
                    error={error}
                    title="Failed to load allocations"
                    onRetry={() => void refetch()}
                  />
                </TableCell>
              </TableRow>
            ) : allocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="px-6 py-12 text-center">
                  <P className="text-sm font-medium text-slate-600">No course allocations found.</P>
                  <Span className="mt-1 block text-xs text-slate-400">
                    {userRole === 'SUPER_ADMIN'
                      ? 'Use the "Assign Course" button above to allocate an active course to a batch or mentee.'
                      : 'No course allocations match your current filters.'}
                  </Span>
                </TableCell>
              </TableRow>
            ) : (
              allocations.map((alloc) => {
                const isExpanded = expandedAllocId === alloc.id;
                return (
                  <React.Fragment key={alloc.id}>
                    <TableRow
                      className={cn(
                        'transition-colors',
                        isExpanded ? 'bg-slate-50/70' : 'hover:bg-slate-50/60',
                      )}
                    >
                      <TableCell className="py-4 pr-2 pl-6 align-middle">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(alloc.id)}
                          className="flex h-6 w-6 items-center justify-center p-0 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700"
                          title={isExpanded ? 'Collapse breakdown' : 'Expand mentee breakdown'}
                        >
                          <Span className="text-sm font-bold">{isExpanded ? '▼' : '▶'}</Span>
                        </Button>
                      </TableCell>
                      <TableCell className="px-4 py-4 align-middle">
                        <P
                          className="max-w-[200px] truncate font-semibold text-slate-900 transition-all hover:overflow-visible hover:whitespace-normal"
                          title={alloc.course?.title ?? 'Untitled Course'}
                        >
                          {alloc.course?.title ?? 'Untitled Course'}
                        </P>
                        <P className="mt-0.5 text-xs text-slate-400">
                          {alloc.estimatedMinutes
                            ? `${Math.floor(alloc.estimatedMinutes / 60)}h ${alloc.estimatedMinutes % 60}m duration`
                            : 'Standard Duration'}
                        </P>
                      </TableCell>
                      <TableCell className="px-4 py-4 align-middle">
                        <P className="font-semibold text-slate-900">
                          {alloc.user?.name ?? 'Individual Mentee'}
                        </P>
                        <P className="text-xs text-slate-400">{alloc.user?.email}</P>
                      </TableCell>
                      <TableCell className="px-4 py-4 align-middle">
                        {alloc.batch ? (
                          <div>
                            <P className="font-medium text-slate-800">{alloc.batch.name}</P>
                            <P className="text-xs text-slate-400">{alloc.batch.code}</P>
                          </div>
                        ) : (
                          <Span className="text-slate-400">{EM_DASH}</Span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 align-middle font-medium text-slate-800">
                        {formatDateIST(alloc.startDate)}
                      </TableCell>
                      <TableCell className="px-4 py-4 align-middle font-medium text-slate-800">
                        {formatDateIST(alloc.dueDate)}
                      </TableCell>
                      <TableCell className="px-4 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-600 transition-all"
                              style={{
                                width: `${Math.min(100, Math.max(0, alloc.progressPercent))}%`,
                              }}
                            />
                          </div>
                          <Span className="w-9 text-right text-xs font-bold text-slate-700">
                            {alloc.progressPercent}%
                          </Span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 align-middle">
                        <AllocationStatusBadge status={alloc.status} isOverdue={alloc.isOverdue} />
                      </TableCell>
                      <TableCell className="py-4 pr-6 pl-4 text-right align-middle">
                        {userRole === 'SUPER_ADMIN' ? (
                          <div
                            ref={openActionMenuId === alloc.id ? actionMenuRef : undefined}
                            className="relative flex items-center justify-end"
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenuId((prev) =>
                                  prev === alloc.id ? null : alloc.id,
                                );
                              }}
                              className="h-8 w-8 rounded-full p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                              title="Allocation actions"
                              aria-label="Allocation actions"
                              aria-haspopup="menu"
                              aria-expanded={openActionMenuId === alloc.id}
                            >
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </Button>

                            {openActionMenuId === alloc.id && (
                              <div
                                role="menu"
                                aria-label="Allocation actions"
                                className="animate-in fade-in zoom-in-95 absolute top-9 right-0 z-30 w-44 rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-xl"
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

                                <div className="my-1 border-t border-slate-100" />

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
                          <Span className="text-xs text-slate-400">View only</Span>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expandable Cadet Breakdown Drawer */}
                    {isExpanded ? (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-slate-50/80 p-0">
                          <div className="border-t border-b border-slate-200/80 px-10 py-4">
                            <div className="mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Span className="text-xs font-bold text-slate-700 uppercase">
                                  Enrolled Mentee Milestone Telemetry
                                </Span>
                                <Span className="text-xs text-slate-400">
                                  • Active subscriber details
                                </Span>
                              </div>
                              <Span className="text-xs text-slate-500">
                                Allocation ID: {alloc.id.slice(0, 8)}...
                              </Span>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                                    {alloc.user?.name
                                      ? alloc.user.name.slice(0, 2).toUpperCase()
                                      : 'ME'}
                                  </div>
                                  <div>
                                    <P className="text-sm font-semibold text-slate-900">
                                      {alloc.user?.name ?? 'Assigned Mentee'}
                                    </P>
                                    <P className="text-xs text-slate-400">{alloc.user?.email}</P>
                                  </div>
                                </div>

                                <div className="max-w-sm flex-1">
                                  <P className="text-xs font-medium text-slate-700">
                                    Course Allocation Pace
                                  </P>
                                  <P className="mt-0.5 text-[11px] text-slate-400">
                                    {alloc.progressPercent >= 100
                                      ? 'All active course topics verified & completed'
                                      : `${alloc.progressPercent}% active curriculum completed`}
                                  </P>
                                </div>

                                <div className="flex w-44 items-center gap-3">
                                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className="h-full rounded-full bg-emerald-500"
                                      style={{ width: `${alloc.progressPercent}%` }}
                                    />
                                  </div>
                                  <Span className="w-9 text-right text-xs font-bold text-slate-600">
                                    {alloc.progressPercent}%
                                  </Span>
                                </div>

                                <div className="w-28 text-center">
                                  <AllocationStatusBadge
                                    status={alloc.status}
                                    isOverdue={alloc.isOverdue}
                                  />
                                </div>

                                {userRole === 'SUPER_ADMIN' ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setOverridingAllocation(alloc)}
                                    className="text-xs"
                                  >
                                    Overrides
                                  </Button>
                                ) : (
                                  <Span className="text-xs text-slate-400">View only</Span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>

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
      </TableContainer>

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

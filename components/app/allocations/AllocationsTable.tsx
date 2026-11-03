'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { AllocationStatusBadge } from '@/components/app/allocations/AllocationStatusBadge';
import { AssignCourseModal } from '@/components/app/allocations/AssignCourseModal';
import { AssignmentOverridesModal } from '@/components/app/allocations/AssignmentOverridesModal';
import { EditAllocationModal } from '@/components/app/allocations/EditAllocationModal';
import { RevokeAllocationModal } from '@/components/app/allocations/RevokeAllocationModal';
import { DebouncedSearchInput } from '@/components/patterns/DebouncedSearchInput';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { TableCell, TableRow } from '@/components/ui/Table';
import { H1, P, Span } from '@/components/ui/Typography';
import {
  type AllocationFilters,
  type CourseAllocation,
  isTerminalAllocationStatus,
  useAllocationsList,
} from '@/hooks/useAllocations';
import { useBatchesList } from '@/hooks/useBatches';
import { useCourses } from '@/hooks/useCourses';
import { cn } from '@/lib/cn';

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

  // Modals state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<CourseAllocation | null>(null);
  const [revokingAllocation, setRevokingAllocation] = useState<CourseAllocation | null>(null);
  const [overridingAllocation, setOverridingAllocation] = useState<CourseAllocation | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useAllocationsList(filters);
  const { data: batchesData } = useBatchesList({ limit: 100 });
  const { courses } = useCourses();

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

  const toggleExpand = (id: string) => {
    setExpandedAllocId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Scope Notice & Header Section */}
      <div className="flex flex-col gap-3">
        {userRole === 'MENTOR' ? (
          <div className="flex w-fit items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-1.5 text-xs text-blue-900">
            <Span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
            <Span className="font-semibold">Scoped to assigned cohorts & mapped mentees</Span>
            <Span className="text-blue-300">|</Span>
            <Span className="text-xs font-semibold text-blue-700">Mentor Governance Active</Span>
          </div>
        ) : (
          <div className="flex w-fit items-center gap-2 rounded-lg border border-purple-100 bg-purple-50/70 px-3 py-1.5 text-xs text-purple-900">
            <Span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-600" />
            <Span className="font-semibold">Super Admin Fleet Command</Span>
            <Span className="text-purple-300">|</Span>
            <Span className="text-xs font-semibold text-purple-700">Enterprise Global Access</Span>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <H1 className="text-2xl font-bold tracking-tight text-slate-900">Course Allocations</H1>
            <P className="mt-0.5 text-sm text-slate-500">
              Manage course deployments, mentee timelines, deadlines, and assignment overrides (M7).
            </P>
          </div>
          {userRole === 'SUPER_ADMIN' ? (
            <div className="flex items-center gap-2.5">
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
            </div>
          ) : null}
        </div>
      </div>

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
            className={`mt-1 text-xs font-medium ${kpis.overdue > 0 ? 'text-rose-500' : 'text-slate-500'}`}
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

          {/* Course Filter Dropdown with proper width */}
          <div className="w-full sm:w-48">
            <Select
              value={filters.courseId ?? ''}
              onChange={(e) => handleCourseFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs focus:border-[#0044D3]"
            >
              <option value="">Course: All</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </div>

          {/* Batch Filter Dropdown with proper width */}
          <div className="w-full sm:w-48">
            <Select
              value={filters.batchId ?? ''}
              onChange={(e) => handleBatchFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs focus:border-[#0044D3]"
            >
              <option value="">Batch: All</option>
              {(batchesData?.items ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Status Tabs as Pill Filter */}
        <div className="flex shrink-0 [scrollbar-width:none] items-center gap-1 overflow-x-auto rounded-full border border-slate-200/80 bg-slate-100/90 p-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {[
            { key: 'ALL' as const, label: `All (${pagination?.total ?? allocations.length})` },
            { key: 'IN_PROGRESS' as const, label: 'Active' },
            { key: 'COMPLETED' as const, label: 'Completed' },
            { key: 'OVERDUE' as const, label: 'Overdue' },
          ].map((tab) => {
            const isActive = statusTab === tab.key;
            return (
              <Button
                key={tab.key}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleStatusTabChange(tab.key)}
                className={cn(
                  'h-8 rounded-full px-3 text-xs font-semibold transition-all sm:h-9 sm:px-3.5 sm:text-sm',
                  isActive
                    ? tab.key === 'OVERDUE'
                      ? 'bg-rose-600 text-white shadow-xs hover:bg-rose-700 hover:text-white'
                      : 'bg-[#0044D3] text-white shadow-xs hover:bg-[#0039B3] hover:text-white'
                    : tab.key === 'OVERDUE'
                      ? 'text-rose-600 hover:bg-white hover:text-rose-700'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900',
                )}
              >
                <Span>{tab.label}</Span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              <tr>
                <th scope="col" className="w-10 py-3.5 pr-2 pl-6"></th>
                <th scope="col" className="px-4 py-3.5">
                  Course
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Assigned To
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Timeline
                </th>
                <th scope="col" className="w-48 px-4 py-3.5">
                  Progress
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Status
                </th>
                <th scope="col" className="py-3.5 pr-6 pl-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              className={`divide-y divide-slate-100 ${
                isFetching && !isLoading ? 'opacity-60 transition-opacity' : ''
              }`}
            >
              {isLoading ? (
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
                      <Skeleton className="h-4 w-28 rounded-md" />
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="space-y-1">
                        <Skeleton className="h-2 w-36 rounded-full" />
                        <Skeleton className="h-3 w-16 rounded-md" />
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="py-4 pr-6 pl-4 text-right">
                      <Skeleton className="ml-auto h-8 w-20 rounded-xl" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <ErrorMessage
                      error={error}
                      title="Failed to load allocations"
                      onRetry={() => void refetch()}
                    />
                  </td>
                </tr>
              ) : allocations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <P className="text-sm font-medium text-slate-600">
                      No course allocations found.
                    </P>
                    <Span className="mt-1 text-xs text-slate-400">
                      {userRole === 'SUPER_ADMIN'
                        ? 'Use the "Assign Course" button above to allocate an active course to a batch or mentee.'
                        : 'No course allocations match your current filters.'}
                    </Span>
                  </td>
                </tr>
              ) : (
                allocations.map((alloc) => {
                  const isExpanded = expandedAllocId === alloc.id;
                  return (
                    <React.Fragment key={alloc.id}>
                      <tr
                        className={`transition-colors ${isExpanded ? 'bg-slate-50/70' : 'hover:bg-slate-50/60'}`}
                      >
                        <td className="py-4 pr-2 pl-6 align-middle">
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
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <div className="font-semibold text-slate-900">
                            {alloc.course?.title ?? 'Untitled Course'}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-400">
                            {alloc.estimatedMinutes
                              ? `${Math.floor(alloc.estimatedMinutes / 60)}h ${alloc.estimatedMinutes % 60}m duration`
                              : 'Standard Duration'}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          {alloc.batch ? (
                            <div>
                              <div className="font-medium text-slate-800">{alloc.batch.name}</div>
                              <div className="text-xs text-slate-400">
                                {alloc.batch.code} • Mentee: {alloc.user?.name}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium text-slate-800">
                                {alloc.user?.name ?? 'Individual Mentee'}
                              </div>
                              <div className="text-xs text-slate-400">{alloc.user?.email}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <div className="font-medium text-slate-800">
                            {new Date(alloc.startDate).toLocaleDateString()} →{' '}
                            {new Date(alloc.dueDate).toLocaleDateString()}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-400">
                            Due: {new Date(alloc.dueDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-middle">
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
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <AllocationStatusBadge
                            status={alloc.status}
                            isOverdue={alloc.isOverdue}
                          />
                        </td>
                        <td className="py-4 pr-6 pl-4 text-right align-middle">
                          {userRole === 'SUPER_ADMIN' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingAllocation(alloc)}
                                disabled={isTerminalAllocationStatus(alloc.status)}
                                className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900"
                                title="Edit dates & duration"
                              >
                                Dates
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setOverridingAllocation(alloc)}
                                disabled={isTerminalAllocationStatus(alloc.status)}
                                className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900"
                                title="Assignment due-date overrides"
                              >
                                Overrides
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setRevokingAllocation(alloc)}
                                disabled={isTerminalAllocationStatus(alloc.status)}
                                className="h-8 px-2.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                title="Soft revoke allocation"
                              >
                                Revoke
                              </Button>
                            </div>
                          ) : (
                            <Span className="text-xs text-slate-400">View only</Span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Cadet Breakdown Drawer */}
                      {isExpanded ? (
                        <tr>
                          <td colSpan={7} className="bg-slate-50/80 p-0">
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
                                      <div className="text-sm font-semibold text-slate-900">
                                        {alloc.user?.name ?? 'Assigned Mentee'}
                                      </div>
                                      <div className="text-xs text-slate-400">
                                        {alloc.user?.email}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="max-w-sm flex-1">
                                    <div className="text-xs font-medium text-slate-700">
                                      Course Allocation Pace
                                    </div>
                                    <div className="mt-0.5 text-[11px] text-slate-400">
                                      {alloc.progressPercent >= 100
                                        ? 'All active course topics verified & completed'
                                        : `${alloc.progressPercent}% active curriculum completed`}
                                    </div>
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

        {/* Pagination Bar */}
        {pagination && pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-xs text-slate-500">
            <div>
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
              allocations
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))}
                className="h-7 px-2.5 text-xs"
              >
                Previous
              </Button>
              <Span className="px-2 font-medium text-slate-700">
                Page {pagination.page} of {pagination.totalPages}
              </Span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
                className="h-7 px-2.5 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
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

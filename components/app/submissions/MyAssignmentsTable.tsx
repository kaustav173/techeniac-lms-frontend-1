'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
import { P, Span } from '@/components/ui/Typography';
import { useHoverPrefetch } from '@/hooks/useHoverPrefetch';
import { usePrefetchAssignmentDetails } from '@/hooks/useSubmissions';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/date';
import { useClickOutside } from '@/lib/useClickOutside';
import { AssignmentDerivedStatus, type AssignmentWithSubmissionStatus } from '@/types/submissions';

import { SubmissionStatusBadge } from './SubmissionStatusBadge';

export interface MyAssignmentsPaginationConfig {
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
}

export interface MyAssignmentsTableProps {
  assignments: AssignmentWithSubmissionStatus[];
  isLoading: boolean;
  isFetching?: boolean;
  error: string | null;
  onRetry?: (() => void) | undefined;
  selectedStatuses?: AssignmentDerivedStatus[] | undefined;
  onStatusesChange?: ((statuses: AssignmentDerivedStatus[]) => void) | undefined;
  searchQuery?: string | undefined;
  onSearchQueryChange?: ((search: string) => void) | undefined;
  pagination?: MyAssignmentsPaginationConfig | undefined;
}

const STATUS_OPTIONS: MultiSelectOption<AssignmentDerivedStatus>[] = [
  { value: AssignmentDerivedStatus.PENDING, label: 'Pending' },
  { value: AssignmentDerivedStatus.SUBMITTED, label: 'Submitted' },
  { value: AssignmentDerivedStatus.RESUBMIT_REQUESTED, label: 'Resubmit Requested' },
  { value: AssignmentDerivedStatus.GRADED, label: 'Graded' },
  { value: AssignmentDerivedStatus.OVERDUE, label: 'Overdue' },
  { value: AssignmentDerivedStatus.CLOSED, label: 'Closed' },
];

type SortField = 'title' | 'courseTitle' | 'dueDate' | 'estimatedMinutes' | 'maxMarks';

interface ActiveMenuState {
  id: string;
  title: string;
  status: AssignmentDerivedStatus;
  courseId?: string | undefined;
  coords: {
    top: number;
    right: number;
    placement: 'top' | 'bottom';
  };
}

export function MyAssignmentsTable({
  assignments,
  isLoading,
  isFetching = false,
  error,
  onRetry,
  selectedStatuses,
  onStatusesChange,
  searchQuery: externalSearchQuery,
  onSearchQueryChange,
  pagination,
}: Readonly<MyAssignmentsTableProps>) {
  const router = useRouter();
  const prefetchAssignment = usePrefetchAssignmentDetails();
  const { getHoverHandlers } = useHoverPrefetch();
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const isServerPaginated = pagination?.total !== undefined;
  const [sortField, setSortField] = useState<SortField | null>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeMenuState, setActiveMenuState] = useState<ActiveMenuState | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  const activeStatuses = useMemo<AssignmentDerivedStatus[]>(() => {
    return selectedStatuses ?? [];
  }, [selectedStatuses]);

  useClickOutside(
    actionMenuRef,
    () => {
      setActiveMenuState(null);
    },
    activeMenuState !== null,
  );

  useEffect(() => {
    if (!activeMenuState) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenuState(null);
      }
    };
    const handleScrollOrResize = () => {
      setActiveMenuState(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [activeMenuState]);

  const toggleActionMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    assignment: AssignmentWithSubmissionStatus,
  ) => {
    e.stopPropagation();
    if (activeMenuState?.id === assignment.id) {
      setActiveMenuState(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = assignment.courseId ? 88 : 48;
    const placement = spaceBelow < menuHeight + 20 ? 'top' : 'bottom';
    const top = placement === 'bottom' ? rect.bottom + 6 : rect.top - 6;
    const right = Math.max(10, window.innerWidth - rect.right);

    setActiveMenuState({
      id: assignment.id,
      title: assignment.title,
      status: assignment.status,
      courseId: assignment.courseId,
      coords: { top, right, placement },
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    pagination?.onPageChange(1);
  };

  const filteredAssignments = useMemo(() => {
    const seen = new Set<string>();
    const unique: AssignmentWithSubmissionStatus[] = [];
    for (const item of assignments) {
      if (item?.id) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          unique.push(item);
        }
      } else {
        unique.push(item);
      }
    }

    if (isServerPaginated) {
      return unique;
    }

    const q = searchQuery.toLowerCase().trim();
    return unique.filter((item) => {
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.courseTitle.toLowerCase().includes(q) ||
        (item.topicTitle && item.topicTitle.toLowerCase().includes(q));
      const matchesStatus = activeStatuses.length === 0 || activeStatuses.includes(item.status);
      return matchesSearch && matchesStatus;
    });
  }, [assignments, searchQuery, activeStatuses, isServerPaginated]);

  const sortedAssignments = useMemo(() => {
    if (isServerPaginated || !sortField) return filteredAssignments;
    return [...filteredAssignments].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'title') {
        cmp = (a.title || '').localeCompare(b.title || '');
      } else if (sortField === 'courseTitle') {
        cmp = (a.courseTitle || '').localeCompare(b.courseTitle || '');
      } else if (sortField === 'dueDate') {
        const timeA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const timeB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        cmp = timeA - timeB;
      } else if (sortField === 'estimatedMinutes') {
        cmp = (a.estimatedMinutes || 0) - (b.estimatedMinutes || 0);
      } else if (sortField === 'maxMarks') {
        cmp = (a.maxMarks || 0) - (b.maxMarks || 0);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filteredAssignments, sortField, sortOrder, isServerPaginated]);

  const hasActiveFilters = Boolean(searchQuery.trim() || activeStatuses.length > 0);

  const effectiveTotal =
    isServerPaginated && pagination.total !== undefined
      ? pagination.total
      : sortedAssignments.length;
  const effectiveTotalPages =
    isServerPaginated && pagination.totalPages !== undefined
      ? pagination.totalPages
      : pagination
        ? Math.max(1, Math.ceil(effectiveTotal / pagination.limit))
        : 1;
  const effectivePage = pagination ? Math.min(pagination.page, effectiveTotalPages) : 1;

  const paginatedAssignments = useMemo(() => {
    if (isServerPaginated) return sortedAssignments;
    if (!pagination) return sortedAssignments;
    const start = (effectivePage - 1) * pagination.limit;
    return sortedAssignments.slice(start, start + pagination.limit);
  }, [sortedAssignments, pagination, effectivePage, isServerPaginated]);

  const handleSearchChange = (value: string) => {
    if (onSearchQueryChange) {
      onSearchQueryChange(value);
    } else {
      setInternalSearchQuery(value);
    }
    pagination?.onPageChange(1);
  };

  const handleClearFilters = () => {
    if (onSearchQueryChange) {
      onSearchQueryChange('');
    } else {
      setInternalSearchQuery('');
    }
    onStatusesChange?.([]);
    pagination?.onPageChange(1);
  };

  return (
    <div className="space-y-4">
      {/* Search & Status Filter Toolbar (Admin Style, Expanded Search) */}
      <div className="flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:w-96 lg:w-[533px]">
            <DebouncedSearchInput
              value={searchQuery}
              onSearchChange={handleSearchChange}
              placeholder="Search assignments by title, course, or topic..."
            />
          </div>

          <MultiSelectDropdown
            label="Status"
            options={STATUS_OPTIONS}
            selectedValues={activeStatuses}
            onChange={(vals) => {
              onStatusesChange?.(vals);
              pagination?.onPageChange(1);
            }}
            singleSelect={false}
            align="left"
          />

          {hasActiveFilters ? (
            <Tooltip content="Clear all filters" side="bottom">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
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
            </Tooltip>
          ) : null}
        </div>

        {isFetching && !isLoading && (
          <div className="flex items-center gap-1.5 text-xs text-[#667085]">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#0044D3] border-r-transparent" />
            <Span>Updating...</Span>
          </div>
        )}
      </div>

      {error ? (
        <ErrorMessage error={error} title="Failed to load assignments" onRetry={onRetry} />
      ) : null}

      {isLoading || isFetching ? (
        <div className="overflow-hidden rounded-2xl border border-[#E1E6EC] bg-white shadow-xs">
          <TableContainer className="w-full rounded-none border-0 shadow-none">
            <Table className="w-full min-w-[960px] table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[23%] px-5 py-2.5 text-base font-semibold text-slate-800 sm:px-5 sm:py-3 sm:text-[17px]">
                    Assignment
                  </TableHead>
                  <TableHead className="w-[15%] px-4 py-2.5 text-base font-semibold text-slate-800 sm:px-5 sm:py-3 sm:text-[17px]">
                    Course
                  </TableHead>
                  <TableHead className="w-[18%] px-4 py-2.5 text-base font-semibold text-slate-800 sm:px-5 sm:py-3 sm:text-[17px]">
                    Due Date
                  </TableHead>
                  <TableHead className="w-[10%] px-4 py-2.5 text-base font-semibold text-slate-800 sm:px-5 sm:py-3 sm:text-[17px]">
                    Est. Time
                  </TableHead>
                  <TableHead className="w-[11%] px-4 py-2.5 text-base font-semibold text-slate-800 sm:px-5 sm:py-3 sm:text-[17px]">
                    Max Marks
                  </TableHead>
                  <TableHead className="w-[16%] px-4 py-2.5 text-base font-semibold text-slate-800 sm:px-5 sm:py-3 sm:text-[17px]">
                    Status
                  </TableHead>
                  <TableHead className="w-[7%] px-3 py-2.5 text-center text-base font-semibold text-slate-800 sm:px-3 sm:py-3 sm:text-[17px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 10 }).map((_, idx) => (
                  <TableRow key={`assign-skel-${idx}`} className="h-16">
                    <TableCell className="w-[23%] px-5 py-4">
                      <Skeleton className="h-4 w-44 rounded-md" />
                    </TableCell>
                    <TableCell className="w-[15%] px-4 py-4">
                      <Skeleton className="h-4 w-36 rounded-md" />
                    </TableCell>
                    <TableCell className="w-[18%] px-4 py-4">
                      <Skeleton className="h-4 w-28 rounded-md" />
                    </TableCell>
                    <TableCell className="w-[10%] px-4 py-4">
                      <Skeleton className="h-4 w-16 rounded-md" />
                    </TableCell>
                    <TableCell className="w-[11%] px-4 py-4">
                      <Skeleton className="h-4 w-16 rounded-md" />
                    </TableCell>
                    <TableCell className="w-[16%] px-4 py-4">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </TableCell>
                    <TableCell className="w-[7%] px-3 py-4 text-center">
                      <Skeleton className="mx-auto h-8 w-8 rounded-full" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <div className="flex items-center justify-between border-t border-[#E1E6EC] bg-white px-6 py-4">
            <Skeleton className="h-4 w-32 rounded-md" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        </div>
      ) : sortedAssignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E1E6EC] bg-white p-12 text-center shadow-xs">
          <P className="text-sm font-semibold text-[#111827]">No assignments found</P>
          <P className="mt-1 text-xs text-[#667085]">
            {activeStatuses.length > 0 || searchQuery
              ? 'Try adjusting your filters or search keywords.'
              : 'You have no assignments allocated in your current courses.'}
          </P>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E1E6EC] bg-white shadow-xs">
          <TableContainer
            className={`w-full rounded-none border-0 shadow-none ${isFetching && !isLoading ? 'opacity-60 transition-opacity' : ''}`}
          >
            <Table className="w-full min-w-[960px] table-fixed">
              <TableHeader>
                <TableRow>
                  {isServerPaginated ? (
                    <>
                      <TableHead className="w-[23%] px-5 py-2.5 text-left text-base font-semibold text-slate-800 sm:px-5 sm:py-3 sm:text-[17px]">
                        Assignment
                      </TableHead>
                      <TableHead className="w-[15%] px-4 py-2.5 text-left text-base font-semibold text-slate-800 sm:px-5 sm:py-3 sm:text-[17px]">
                        Course
                      </TableHead>
                      <TableHead className="w-[18%] px-4 py-2.5 text-left text-base font-semibold text-slate-800 sm:px-5 sm:py-3 sm:text-[17px]">
                        Due Date
                      </TableHead>
                      <TableHead className="w-[10%] px-4 py-2.5 text-left text-base font-semibold text-slate-800 sm:px-5 sm:py-3 sm:text-[17px]">
                        Est. Time
                      </TableHead>
                      <TableHead className="w-[11%] px-4 py-2.5 text-left text-base font-semibold text-slate-800 sm:px-5 sm:py-3 sm:text-[17px]">
                        Max Marks
                      </TableHead>
                    </>
                  ) : (
                    <>
                      <SortableColumnHeader<SortField>
                        field="title"
                        label="Assignment"
                        sortField={sortField}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                        className="w-[23%] px-5 py-2.5 text-base font-semibold text-slate-800 sm:px-5 sm:py-3 sm:text-[17px]"
                      />
                      <SortableColumnHeader<SortField>
                        field="courseTitle"
                        label="Course"
                        sortField={sortField}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                        className="w-[15%] px-4 py-2.5 text-base font-semibold text-slate-800 sm:px-5 sm:py-3 sm:text-[17px]"
                      />
                      <SortableColumnHeader<SortField>
                        field="dueDate"
                        label="Due Date"
                        sortField={sortField}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                        className="w-[18%] px-4 py-2.5 text-base font-semibold text-slate-800 sm:px-5 sm:py-3 sm:text-[17px]"
                      />
                      <SortableColumnHeader<SortField>
                        field="estimatedMinutes"
                        label="Est. Time"
                        sortField={sortField}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                        className="w-[10%] px-4 py-2.5 text-base font-semibold text-slate-800 sm:px-5 sm:py-3 sm:text-[17px]"
                      />
                      <SortableColumnHeader<SortField>
                        field="maxMarks"
                        label="Max Marks"
                        sortField={sortField}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                        className="w-[11%] px-4 py-2.5 text-base font-semibold text-slate-800 sm:px-5 sm:py-3 sm:text-[17px]"
                      />
                    </>
                  )}
                  <TableHead className="w-[16%] px-4 py-2.5 text-base font-semibold text-slate-800 sm:px-5 sm:py-3 sm:text-[17px]">
                    Status
                  </TableHead>
                  <TableHead className="w-[7%] px-3 py-2.5 text-center text-base font-semibold text-slate-800 sm:px-3 sm:py-3 sm:text-[17px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAssignments.map((assignment, idx) => {
                  const isActionMenuOpen = activeMenuState?.id === assignment.id;
                  return (
                    <TableRow
                      key={assignment.id ? `${assignment.id}-${idx}` : `assign-${idx}`}
                      tabIndex={0}
                      role="button"
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                        router.push(`/mentee/assignments/${assignment.id}`);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/mentee/assignments/${assignment.id}`);
                        }
                      }}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-[#F6F8FC]/60 focus-visible:bg-[#F6F8FC] focus-visible:outline-none',
                        isActionMenuOpen && 'relative z-30',
                      )}
                    >
                      {/* Assignment Column (Truncated with full name tooltip on hover) */}
                      <TableCell
                        className="w-[23%] px-5 py-4"
                        onClick={(e) => {
                          if (e.metaKey || e.ctrlKey || e.shiftKey) {
                            e.stopPropagation();
                          }
                        }}
                      >
                        <Tooltip
                          content={assignment.title}
                          containerClassName="inline-flex max-w-full"
                        >
                          <Link
                            href={`/mentee/assignments/${assignment.id}`}
                            {...getHoverHandlers(() => prefetchAssignment(assignment.id))}
                            className="block w-full truncate text-base font-semibold text-slate-900 transition-colors hover:text-[#0044D3]"
                          >
                            {assignment.title}
                          </Link>
                        </Tooltip>
                      </TableCell>

                      {/* Course Column */}
                      <TableCell className="w-[15%] px-4 py-4">
                        <Tooltip
                          content={assignment.courseTitle}
                          containerClassName="inline-flex max-w-full"
                        >
                          <Span className="block w-full truncate text-base font-semibold text-slate-900">
                            {assignment.courseTitle}
                          </Span>
                        </Tooltip>
                      </TableCell>

                      {/* Due Date Column (Without IST) */}
                      <TableCell className="w-[18%] px-4 py-4 whitespace-nowrap">
                        <Span className="text-sm font-medium text-slate-600">
                          {formatDateTime(assignment.dueDate)}
                        </Span>
                      </TableCell>

                      {/* Est. Time Column */}
                      <TableCell className="w-[10%] px-4 py-4 whitespace-nowrap">
                        <Span className="text-base font-semibold text-slate-900">
                          {assignment.estimatedMinutes} mins
                        </Span>
                      </TableCell>

                      {/* Marks Column */}
                      <TableCell className="w-[11%] px-4 py-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <Span className="text-base font-semibold text-slate-900">
                            {assignment.maxMarks} marks
                          </Span>
                          {assignment.passMarks ? (
                            <Span className="block text-[11px] text-[#667085]">
                              (Pass: {assignment.passMarks})
                            </Span>
                          ) : null}
                        </div>
                      </TableCell>

                      {/* Status Column */}
                      <TableCell className="w-[16%] px-4 py-4 text-xs whitespace-nowrap sm:text-xs">
                        <SubmissionStatusBadge
                          status={assignment.status}
                          isLate={assignment.latestSubmission?.isLate}
                        />
                        {assignment.latestSubmission?.marks !== null &&
                        assignment.latestSubmission?.marks !== undefined ? (
                          <div className="mt-1 text-xs font-semibold text-emerald-600">
                            Score: {assignment.latestSubmission.marks} / {assignment.maxMarks}
                          </div>
                        ) : null}
                      </TableCell>

                      {/* 3-Dots Action Menu */}
                      <TableCell
                        className="w-[7%] px-3 py-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center">
                          <Tooltip content="Assignment actions">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => toggleActionMenu(e, assignment)}
                              aria-label={`Actions for ${assignment.title}`}
                              aria-haspopup="menu"
                              aria-expanded={isActionMenuOpen}
                              className={cn(
                                'h-9 w-9 rounded-full p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-[#0044D3]',
                                isActionMenuOpen && 'bg-slate-100 text-slate-900',
                              )}
                            >
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </Button>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {pagination && !error && effectiveTotal > 0 ? (
            <PaginationControls
              page={effectivePage}
              limit={pagination.limit}
              total={effectiveTotal}
              totalPages={effectiveTotalPages}
              onPageChange={pagination.onPageChange}
              onLimitChange={pagination.onLimitChange}
              itemLabel="assignments"
              pageSizeOptions={[10, 20, 50]}
              className="border-t border-[#E1E6EC]"
            />
          ) : null}
        </div>
      )}

      {activeMenuState && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={actionMenuRef}
              role="menu"
              aria-label={`Actions for ${activeMenuState.title}`}
              style={{
                position: 'fixed',
                ...(activeMenuState.coords.placement === 'bottom'
                  ? { top: `${activeMenuState.coords.top}px` }
                  : { bottom: `${window.innerHeight - activeMenuState.coords.top}px` }),
                right: `${activeMenuState.coords.right}px`,
                zIndex: 9999,
              }}
              className="animate-in fade-in zoom-in-95 w-44 rounded-2xl border border-[#E1E6EC] bg-white p-1.5 text-left shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Link
                role="menuitem"
                href={`/mentee/assignments/${activeMenuState.id}`}
                {...getHoverHandlers(() => prefetchAssignment(activeMenuState.id))}
                onClick={() => {
                  setActiveMenuState(null);
                }}
                className="flex w-full items-center justify-start gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              >
                <Span>
                  {activeMenuState.status === AssignmentDerivedStatus.PENDING
                    ? 'Start & Submit'
                    : activeMenuState.status === AssignmentDerivedStatus.RESUBMIT_REQUESTED
                      ? 'Resubmit'
                      : 'View Details'}
                </Span>
              </Link>
              {activeMenuState.courseId ? (
                <Link
                  role="menuitem"
                  href={`/mentee/courses/${activeMenuState.courseId}`}
                  onClick={() => {
                    setActiveMenuState(null);
                  }}
                  className="flex w-full items-center justify-start gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <Span>Go to Course</Span>
                </Link>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

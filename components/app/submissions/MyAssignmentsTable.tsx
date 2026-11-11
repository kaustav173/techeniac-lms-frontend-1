'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';

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
import { P, Span } from '@/components/ui/Typography';
import { useHoverPrefetch } from '@/hooks/useHoverPrefetch';
import { usePrefetchAssignmentDetails } from '@/hooks/useSubmissions';
import { formatDateTimeIST } from '@/lib/date';
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

interface MyAssignmentsTableProps {
  assignments: AssignmentWithSubmissionStatus[];
  isLoading: boolean;
  isFetching?: boolean;
  error: string | null;
  onRetry?: (() => void) | undefined;
  selectedStatus?: AssignmentDerivedStatus | undefined;
  onStatusChange?: ((status?: AssignmentDerivedStatus) => void) | undefined;
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

type SortField = 'title' | 'courseTitle' | 'dueDate' | 'maxMarks' | 'status';

export function MyAssignmentsTable({
  assignments,
  isLoading,
  isFetching = false,
  error,
  onRetry,
  selectedStatus,
  onStatusChange,
  pagination,
}: Readonly<MyAssignmentsTableProps>) {
  const prefetchAssignment = usePrefetchAssignmentDetails();
  const { getHoverHandlers } = useHoverPrefetch();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField | null>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  useClickOutside(actionMenuRef, () => setOpenActionMenuId(null), openActionMenuId !== null);

  useEffect(() => {
    if (!openActionMenuId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openActionMenuId]);

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

    if (!searchQuery.trim()) return unique;
    const q = searchQuery.toLowerCase();
    return unique.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.courseTitle.toLowerCase().includes(q) ||
        (item.topicTitle && item.topicTitle.toLowerCase().includes(q))
      );
    });
  }, [assignments, searchQuery]);

  const sortedAssignments = useMemo(() => {
    if (!sortField) return filteredAssignments;
    return [...filteredAssignments].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'title') {
        cmp = (a.title || '').localeCompare(b.title || '');
      } else if (sortField === 'courseTitle') {
        cmp = (a.courseTitle || '').localeCompare(b.courseTitle || '');
      } else if (sortField === 'dueDate') {
        cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortField === 'maxMarks') {
        cmp = (a.maxMarks || 0) - (b.maxMarks || 0);
      } else if (sortField === 'status') {
        cmp = (a.status || '').localeCompare(b.status || '');
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filteredAssignments, sortField, sortOrder]);

  const hasActiveFilters = Boolean(searchQuery.trim() || selectedStatus);

  const effectiveTotal = sortedAssignments.length;
  const effectiveTotalPages = pagination
    ? Math.max(1, Math.ceil(effectiveTotal / pagination.limit))
    : 1;
  const effectivePage = pagination ? Math.min(pagination.page, effectiveTotalPages) : 1;

  const paginatedAssignments = useMemo(() => {
    if (!pagination) return sortedAssignments;
    const start = (effectivePage - 1) * pagination.limit;
    return sortedAssignments.slice(start, start + pagination.limit);
  }, [sortedAssignments, pagination, effectivePage]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    pagination?.onPageChange(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    onStatusChange?.(undefined);
    pagination?.onPageChange(1);
  };

  return (
    <div className="space-y-4">
      {/* Search & Status Filter Toolbar (Admin Style) */}
      <div className="flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:w-72 lg:w-80">
            <DebouncedSearchInput
              value={searchQuery}
              onSearchChange={handleSearchChange}
              placeholder="Search assignments by title, course, or topic..."
            />
          </div>

          <MultiSelectDropdown
            label="Status"
            options={STATUS_OPTIONS}
            selectedValues={selectedStatus ? [selectedStatus] : []}
            onChange={(vals) => {
              onStatusChange?.(vals[0]);
            }}
            singleSelect={true}
            align="left"
          />

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

      {isLoading ? (
        <TableContainer className="w-full">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%] px-5 py-3.5">Assignment</TableHead>
                <TableHead className="w-[20%] px-4 py-3.5">Course</TableHead>
                <TableHead className="w-[18%] px-4 py-3.5">Due Date (IST)</TableHead>
                <TableHead className="w-[16%] px-4 py-3.5">Est. Time & Marks</TableHead>
                <TableHead className="w-[10%] px-4 py-3.5">Status</TableHead>
                <TableHead className="w-16 px-5 py-3.5 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={`assign-skel-${idx}`} className="h-16">
                  <TableCell className="px-5 py-4">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-44 rounded-md" />
                      <Skeleton className="h-3 w-32 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Skeleton className="h-4 w-36 rounded-md" />
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Skeleton className="h-4 w-28 rounded-md" />
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-20 rounded-md" />
                      <Skeleton className="h-3 w-16 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <Skeleton className="ml-auto h-8 w-8 rounded-full" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : sortedAssignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E1E6EC] bg-white p-12 text-center shadow-xs">
          <P className="text-sm font-semibold text-[#111827]">No assignments found</P>
          <P className="mt-1 text-xs text-[#667085]">
            {selectedStatus || searchQuery
              ? 'Try adjusting your filters or search keywords.'
              : 'You have no assignments allocated in your current courses.'}
          </P>
        </div>
      ) : (
        <TableContainer
          className={`w-full ${isFetching && !isLoading ? 'opacity-60 transition-opacity' : ''}`}
        >
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <SortableColumnHeader<SortField>
                  field="title"
                  label="Assignment"
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  className="w-[30%] px-5 py-3.5"
                />
                <SortableColumnHeader<SortField>
                  field="courseTitle"
                  label="Course"
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  className="w-[20%] px-4 py-3.5"
                />
                <SortableColumnHeader<SortField>
                  field="dueDate"
                  label="Due Date (IST)"
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  className="w-[18%] px-4 py-3.5"
                />
                <SortableColumnHeader<SortField>
                  field="maxMarks"
                  label="Est. Time & Marks"
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  className="w-[16%] px-4 py-3.5"
                />
                <SortableColumnHeader<SortField>
                  field="status"
                  label="Status"
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  className="w-[10%] px-4 py-3.5"
                />
                <TableHead className="w-16 px-5 py-3.5 text-right font-semibold text-[#667085]">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAssignments.map((assignment, idx) => (
                <TableRow
                  key={assignment.id ? `${assignment.id}-${idx}` : `assign-${idx}`}
                  className="transition-colors hover:bg-[#F6F8FC]/60"
                >
                  {/* Assignment Column (Title, Topic, Scope) */}
                  <TableCell className="px-5 py-4">
                    <div className="space-y-1">
                      <Link
                        href={`/mentee/assignments/${assignment.id}`}
                        {...getHoverHandlers(() => prefetchAssignment(assignment.id))}
                        className="line-clamp-1 font-semibold text-[#111827] hover:text-[#0044D3]"
                      >
                        {assignment.title}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-[#667085]">
                        {assignment.topicTitle ? <Span>{assignment.topicTitle}</Span> : null}
                        {assignment.topicTitle ? <Span>•</Span> : null}
                        <Span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-[#667085]">
                          {assignment.scope}
                        </Span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Course Column (Separate Column) */}
                  <TableCell className="px-4 py-4">
                    <div className="space-y-0.5">
                      <Span className="line-clamp-1 font-semibold text-[#111827]">
                        {assignment.courseTitle}
                      </Span>
                      <Span className="block text-xs text-[#667085]">Curriculum Track</Span>
                    </div>
                  </TableCell>

                  {/* Due Date Column */}
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                    <div className="space-y-0.5">
                      <Span className="font-medium text-[#111827]">
                        {formatDateTimeIST(assignment.dueDate)}
                      </Span>
                      {assignment.allowLate ? (
                        <Span className="block text-xs text-[#667085]">
                          Late submissions accepted
                        </Span>
                      ) : (
                        <Span className="block text-xs text-rose-500">Strict deadline</Span>
                      )}
                    </div>
                  </TableCell>

                  {/* Est. Time & Marks Column */}
                  <TableCell className="px-4 py-4 whitespace-nowrap">
                    <div className="space-y-0.5 text-xs text-[#667085]">
                      <div>
                        Est:{' '}
                        <Span className="font-semibold text-[#111827]">
                          {assignment.estimatedMinutes} mins
                        </Span>
                      </div>
                      <div>
                        Max Marks:{' '}
                        <Span className="font-semibold text-[#111827]">{assignment.maxMarks}</Span>
                        {assignment.passMarks ? ` (Pass: ${assignment.passMarks})` : ''}
                      </div>
                    </div>
                  </TableCell>

                  {/* Status Column */}
                  <TableCell className="px-4 py-4 whitespace-nowrap">
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
                    className="px-5 py-4 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      className="relative inline-block text-left"
                      ref={openActionMenuId === assignment.id ? actionMenuRef : undefined}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionMenuId(
                            openActionMenuId === assignment.id ? null : assignment.id,
                          );
                        }}
                        title="Assignment actions"
                        aria-label={`Actions for ${assignment.title}`}
                        aria-haspopup="menu"
                        aria-expanded={openActionMenuId === assignment.id}
                        className="h-11 w-11 rounded-full p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </Button>

                      {openActionMenuId === assignment.id && (
                        <div
                          role="menu"
                          aria-label={`Actions for ${assignment.title}`}
                          className="animate-in fade-in zoom-in-95 absolute top-11 right-0 z-30 w-44 rounded-2xl border border-slate-200/90 bg-white p-1.5 text-left shadow-xl"
                        >
                          <Link
                            role="menuitem"
                            href={`/mentee/assignments/${assignment.id}`}
                            {...getHoverHandlers(() => prefetchAssignment(assignment.id))}
                            onClick={() => setOpenActionMenuId(null)}
                            className="flex w-full items-center justify-start gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                          >
                            <Span>
                              {assignment.status === AssignmentDerivedStatus.PENDING
                                ? 'Start & Submit'
                                : assignment.status === AssignmentDerivedStatus.RESUBMIT_REQUESTED
                                  ? 'Resubmit'
                                  : 'View Details'}
                            </Span>
                          </Link>
                          {assignment.courseId ? (
                            <Link
                              role="menuitem"
                              href={`/mentee/courses/${assignment.courseId}`}
                              onClick={() => setOpenActionMenuId(null)}
                              className="flex w-full items-center justify-start gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                            >
                              <Span>Go to Course</Span>
                            </Link>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

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
        />
      ) : null}
    </div>
  );
}

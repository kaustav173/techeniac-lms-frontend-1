'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { SingleSelectDropdown } from '@/components/ui/SingleSelectDropdown';
import { Skeleton } from '@/components/ui/Skeleton';
import { TableCell, TableRow } from '@/components/ui/Table';
import { H3, Muted, P, Span } from '@/components/ui/Typography';
import { usePrefetchSubmissionReview, useSubmissionQueue } from '@/hooks/useGrading';
import { cn } from '@/lib/cn';
import { formatDateIST } from '@/lib/date';
import { type SubmissionQueueItem, SubmissionStatus } from '@/types/grading';

import { SubmissionReviewModal } from './SubmissionReviewModal';
import { SubmissionStatusBadge } from './SubmissionStatusBadge';

function truncateText(text: string, maxWords = 6, maxChars = 36): string {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  let truncated = text;
  if (words.length > maxWords) {
    truncated = words.slice(0, maxWords).join(' ');
  }
  if (truncated.length > maxChars) {
    truncated = truncated.slice(0, maxChars).trimEnd();
  }
  return truncated !== text ? `${truncated}...` : text;
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: SubmissionStatus.SUBMITTED, label: 'Pending Review' },
  { value: SubmissionStatus.RESUBMIT_REQUESTED, label: 'Resubmit Requested' },
  { value: SubmissionStatus.GRADED, label: 'Graded' },
];

interface SubmissionActionMenuProps {
  readonly submission: SubmissionQueueItem;
  readonly onOpenReview: () => void;
  readonly openUpward?: boolean | undefined;
  readonly onPrefetch?: (() => void) | undefined;
}

function SubmissionActionMenu({
  submission,
  onOpenReview,
  openUpward,
  onPrefetch,
}: Readonly<SubmissionActionMenuProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMeasuredUpward, setIsMeasuredUpward] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const container = menuRef.current.closest('.overflow-x-auto');
      if (container) {
        const containerRect = container.getBoundingClientRect();
        setIsMeasuredUpward(containerRect.bottom - rect.bottom < 120);
      } else {
        setIsMeasuredUpward(window.innerHeight - rect.bottom < 140);
      }
    }
    setIsOpen((prev) => !prev);
  };

  const shouldOpenUp = openUpward ?? isMeasuredUpward;

  return (
    <div className="relative inline-flex items-center justify-end text-left" ref={menuRef}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Actions for submission by ${submission.mentee.name}`}
        onClick={handleToggle}
        onMouseEnter={onPrefetch}
        onFocus={onPrefetch}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E1E6EC] bg-white text-[#667085] shadow-2xs transition-colors hover:border-slate-300 hover:bg-[#F6F8FC] hover:text-[#111827] focus-visible:ring-2 focus-visible:ring-[#0044D3] focus-visible:outline-none"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen ? (
        <div
          role="menu"
          className={cn(
            'animate-in fade-in zoom-in-95 absolute right-0 z-50 w-44 rounded-2xl border border-[#E1E6EC] bg-white p-1.5 shadow-lg duration-100',
            shouldOpenUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          )}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onOpenReview();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#111827] transition-colors hover:bg-blue-50/80 hover:text-[#0044D3]"
          >
            <svg
              className="h-4 w-4 text-[#0044D3]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <Span>
              {submission.status === SubmissionStatus.GRADED ? 'View / Edit' : 'Review & Grade'}
            </Span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function SubmissionQueueTable() {
  const prefetchReview = usePrefetchSubmissionReview();
  const searchInputId = useId();

  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'ALL'>('ALL');
  const [sortDirection, setSortDirection] = useState<'latest' | 'oldest'>('latest');
  const [nameSort, setNameSort] = useState<'asc' | 'desc' | null>(null);
  const [page, setPage] = useState<number>(1);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { submissions, total, totalPages, isLoading, error } = useSubmissionQueue({
    status: statusFilter,
    search: debouncedSearch.trim() || undefined,
    sort: sortDirection,
    page,
    limit: 20,
  });

  const isInitialLoading = isLoading && submissions.length === 0;

  const displayedSubmissions = useMemo(() => {
    let list = submissions;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((sub) => {
        const menteeName = sub.mentee.name.toLowerCase();
        const menteeEmail = sub.mentee.email.toLowerCase();
        const assignment = sub.assignmentTitle.toLowerCase();
        const course = sub.courseTitle.toLowerCase();
        const batch = sub.batchName?.toLowerCase() ?? '';
        return (
          menteeName.includes(q) ||
          menteeEmail.includes(q) ||
          assignment.includes(q) ||
          course.includes(q) ||
          batch.includes(q)
        );
      });
    }
    if (!nameSort) return list;
    return [...list].sort((a, b) => {
      const cmp = a.mentee.name.localeCompare(b.mentee.name);
      return nameSort === 'asc' ? cmp : -cmp;
    });
  }, [submissions, search, nameSort]);

  const rowsWithSpans = useMemo(() => {
    return displayedSubmissions.map((sub, i, arr) => {
      const isFirst = i === 0 || arr[i - 1]?.mentee.id !== sub.mentee.id;
      let span = 1;
      if (isFirst) {
        while (i + span < arr.length && arr[i + span]?.mentee.id === sub.mentee.id) {
          span++;
        }
      }
      const isLast = i === arr.length - 1 || arr[i + 1]?.mentee.id !== sub.mentee.id;
      return { sub, isFirst, isLast, span: isFirst ? span : 0 };
    });
  }, [displayedSubmissions]);

  useEffect(() => {
    if (!isLoading && submissions.length === 0 && page > 1) {
      const timer = setTimeout(() => {
        setPage(1);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isLoading, submissions.length, page]);

  return (
    <div className="flex flex-col gap-6">
      {/* Filters & Actions Bar (FR-10.2, FR-10.3) */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E1E6EC] bg-white p-4 shadow-xs sm:flex-row sm:items-center">
        {/* Search with Icon */}
        <div className="relative w-full sm:w-72">
          <svg
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#667085]"
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
          <Input
            id={searchInputId}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by mentee name or email..."
            aria-label="Search by mentee name or email"
            className="h-[47px] rounded-2xl border-[#E1E6EC] pr-4 pl-10 text-sm font-medium shadow-2xs hover:border-slate-300 focus:border-[#0044D3]"
          />
        </div>

        {/* Status Dropdown */}
        <div className="w-full shrink-0 sm:w-56">
          <SingleSelectDropdown
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val as SubmissionStatus | 'ALL');
              setPage(1);
            }}
            options={STATUS_OPTIONS}
            placeholder="Filter by status"
            aria-label="Filter by status"
            className="w-full"
            triggerClassName={cn(
              'h-[47px] rounded-2xl border-[#E1E6EC] bg-white px-4 text-sm font-semibold shadow-2xs transition-all hover:border-slate-300 hover:bg-[#F9FAFB]',
              statusFilter !== 'ALL' && 'border-blue-300 bg-blue-50/50 text-[#0044D3]',
            )}
            menuClassName="w-full sm:min-w-[220px] rounded-2xl border border-[#E1E6EC] bg-white p-1.5 shadow-xl"
          />
        </div>
      </div>

      {error && (
        <ErrorMessage title="Could not load submission queue" error={error} className="my-2" />
      )}

      {/* Queue Table */}
      <div className="overflow-hidden rounded-3xl border border-[#E1E6EC] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-[#E1E6EC] bg-[#F8FAFC]">
              <tr>
                <th className="px-6 py-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      setNameSort((prev) => {
                        if (prev === null) return 'asc';
                        if (prev === 'asc') return 'desc';
                        return null;
                      });
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] transition-colors hover:text-[#111827] focus-visible:outline-none"
                    title={
                      nameSort === 'asc'
                        ? 'Sorted A to Z (click for Z to A)'
                        : nameSort === 'desc'
                          ? 'Sorted Z to A (click to reset)'
                          : 'Sort by mentee name'
                    }
                  >
                    <span>Mentee</span>
                    <svg
                      className={cn('h-3.5 w-3.5', nameSort ? 'text-[#0044D3]' : 'text-slate-400')}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      {nameSort === 'asc' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      )}
                    </svg>
                  </button>
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold text-[#667085]">
                  <Span>Assignment & Course</Span>
                </th>
                <th className="px-3 py-3.5 text-center text-xs font-semibold text-[#667085]">
                  <Span>Version</Span>
                </th>
                <th className="px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      setNameSort(null);
                      setSortDirection((prev) => (prev === 'latest' ? 'oldest' : 'latest'));
                      setPage(1);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] transition-colors hover:text-[#111827] focus-visible:outline-none"
                    title={
                      sortDirection === 'latest'
                        ? 'Sort by date (currently newest first)'
                        : 'Sort by date (currently oldest first)'
                    }
                  >
                    <span>Submitted</span>
                    <svg
                      className="h-3.5 w-3.5 text-[#0044D3]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      {sortDirection === 'latest' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      )}
                    </svg>
                  </button>
                </th>
                <th className="px-4 py-3.5 text-xs font-semibold text-[#667085]">
                  <Span>Status & Score</Span>
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-[#667085]">
                  <Span>Action</Span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isInitialLoading &&
                Array.from({ length: 6 }).map((_, idx) => (
                  <TableRow key={`queue-skel-${idx}`} className="h-16">
                    <TableCell className="px-6 py-4">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32 rounded-md" />
                        <Skeleton className="h-3 w-40 rounded-md" />
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-36 rounded-md" />
                        <Skeleton className="h-3 w-28 rounded-md" />
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-4 text-center">
                      <Skeleton className="mx-auto h-5 w-8 rounded-md" />
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Skeleton className="h-4 w-28 rounded-md" />
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <Skeleton className="ml-auto h-8 w-20 rounded-xl" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isInitialLoading && displayedSubmissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center">
                    <H3 className="text-sm font-semibold text-slate-700">No submissions found</H3>
                    <P className="mt-1 text-xs text-slate-500">
                      {statusFilter === SubmissionStatus.SUBMITTED
                        ? 'All pending submissions have been reviewed and graded! 🎉'
                        : 'No submissions match your active filter criteria.'}
                    </P>
                  </td>
                </tr>
              )}

              {!isInitialLoading &&
                rowsWithSpans.map(({ sub, isFirst, isLast, span }, index) => (
                  <tr
                    key={sub.id}
                    className={cn(
                      'transition-colors hover:bg-slate-50/60',
                      isLast && 'border-b border-[#E1E6EC]',
                    )}
                  >
                    {/* Mentee Column (Merged across consecutive submissions by same mentee) */}
                    {isFirst ? (
                      <td
                        rowSpan={span}
                        className="border-r border-[#E1E6EC]/80 bg-white px-6 py-4 align-top"
                      >
                        <div className="sticky top-16">
                          <P className="font-semibold text-slate-900">{sub.mentee.name}</P>
                          {sub.batchName && (
                            <Span className="mt-1 inline-block rounded-full border border-[#E1E6EC] bg-[#F6F8FC] px-2.5 py-0.5 text-xs font-semibold text-[#111827]">
                              {sub.batchName}
                            </Span>
                          )}
                        </div>
                      </td>
                    ) : null}

                    {/* Assignment Column */}
                    <td className="px-4 py-4">
                      <P
                        className="max-w-xs truncate font-semibold text-slate-800"
                        title={sub.assignmentTitle}
                      >
                        {truncateText(sub.assignmentTitle, 6, 40)}
                      </P>
                      <P
                        className="max-w-xs truncate text-xs text-slate-500"
                        title={`${sub.courseTitle}${sub.topicTitle ? ` • ${sub.topicTitle}` : ''}`}
                      >
                        {truncateText(
                          `${sub.courseTitle}${sub.topicTitle ? ` • ${sub.topicTitle}` : ''}`,
                          6,
                          36,
                        )}
                      </P>
                    </td>

                    {/* Version Column */}
                    <td className="px-3 py-4 text-center">
                      <Span className="inline-block rounded-full border border-[#E1E6EC] bg-[#F6F8FC] px-2.5 py-0.5 text-xs font-bold text-[#111827]">
                        v{sub.version}
                      </Span>
                    </td>

                    {/* Submitted At Column */}
                    <td className="px-4 py-4">
                      <Span className="text-xs text-slate-700">
                        {formatDateIST(sub.submittedAt)}
                      </Span>
                    </td>

                    {/* Status & Score Column */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <SubmissionStatusBadge status={sub.status} isLate={sub.isLate} />
                        {sub.marks !== null && (
                          <Span className="text-xs font-bold text-slate-800">
                            {sub.marks}/{sub.maxMarks} ({sub.gradeLabel})
                          </Span>
                        )}
                      </div>
                    </td>

                    {/* Action Column */}
                    <td className="px-6 py-4 text-right">
                      <SubmissionActionMenu
                        submission={sub}
                        onOpenReview={() => setSelectedSubmissionId(sub.id)}
                        openUpward={index >= rowsWithSpans.length - 2}
                        onPrefetch={() => prefetchReview(sub.id)}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar (FR-10.7) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3">
            <Muted className="text-xs">
              Showing {displayedSubmissions.length} of {total} submissions
            </Muted>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-full px-4 text-xs font-semibold"
              >
                Previous
              </Button>
              <Span className="text-xs text-slate-600">
                Page {page} of {totalPages}
              </Span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-full px-4 text-xs font-semibold"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Review & Grading Modal */}
      <SubmissionReviewModal
        submissionId={selectedSubmissionId}
        isOpen={Boolean(selectedSubmissionId)}
        onClose={() => setSelectedSubmissionId(null)}
      />
    </div>
  );
}

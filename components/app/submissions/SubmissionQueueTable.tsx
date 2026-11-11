'use client';

import { useRouter, useSearchParams } from 'next/navigation';
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
import {
  type SubmissionQueueItem,
  type SubmissionQueueMentee,
  SubmissionStatus,
} from '@/types/grading';

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
    <div
      className={cn('relative inline-flex items-center justify-end text-left', isOpen && 'z-30')}
      ref={menuRef}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Actions for submission by ${submission.mentee.name}`}
        onClick={handleToggle}
        onMouseEnter={onPrefetch}
        onFocus={onPrefetch}
        className="flex h-8 w-8 cursor-pointer items-center justify-center p-0 text-[#667085] hover:bg-transparent hover:text-[#111827] focus-visible:ring-2 focus-visible:ring-[#0044D3] focus-visible:outline-none"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </Button>

      {isOpen ? (
        <div
          role="menu"
          className={cn(
            'animate-in fade-in zoom-in-95 absolute right-0 z-50 w-44 rounded-2xl border border-[#E1E6EC] bg-white p-1.5 shadow-lg duration-100',
            shouldOpenUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onOpenReview();
            }}
            className="flex w-full items-center justify-start gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#111827] hover:bg-blue-50/80 hover:text-[#0044D3]"
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
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function SubmissionQueueTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefetchReview = usePrefetchSubmissionReview();
  const searchInputId = useId();

  const urlSearch = searchParams.get('search') ?? searchParams.get('mentee') ?? '';
  const urlMenteeId = searchParams.get('menteeId') ?? undefined;

  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch);
  const [prevUrlMenteeId, setPrevUrlMenteeId] = useState(urlMenteeId);
  const [search, setSearch] = useState<string>(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(urlSearch);
  const [menteeIdFilter, setMenteeIdFilter] = useState<string | undefined>(urlMenteeId);
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'ALL'>('ALL');
  const [submittedSort, setSubmittedSort] = useState<'asc' | 'desc' | null>(null);
  const [nameSort, setNameSort] = useState<'asc' | 'desc' | null>(null);
  const [page, setPage] = useState<number>(1);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  if (urlSearch !== prevUrlSearch || urlMenteeId !== prevUrlMenteeId) {
    setPrevUrlSearch(urlSearch);
    setPrevUrlMenteeId(urlMenteeId);
    setSearch(urlSearch);
    setDebouncedSearch(urlSearch);
    setMenteeIdFilter(urlMenteeId);
    setPage(1);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { submissions, total, totalPages, isLoading, error, refetch } = useSubmissionQueue({
    status: statusFilter,
    search: debouncedSearch.trim() || undefined,
    menteeId: menteeIdFilter,
    sortBy: nameSort ? 'mentee' : submittedSort ? 'submittedAt' : undefined,
    sortOrder: nameSort ?? submittedSort ?? undefined,
    page,
    limit: 20,
  });

  const isInitialLoading = isLoading && submissions.length === 0;

  const filterKey = `${page}-${statusFilter}-${debouncedSearch}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  const [expandedMentees, setExpandedMentees] = useState<Record<string, boolean>>({});

  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setExpandedMentees({});
  }

  const toggleMenteeExpand = (menteeId: string) => {
    setExpandedMentees((prev) => ({
      ...prev,
      [menteeId]: !prev[menteeId],
    }));
  };

  const menteeGroups = useMemo(() => {
    const groups: Array<{
      mentee: SubmissionQueueMentee;
      batchName: string | null;
      items: SubmissionQueueItem[];
    }> = [];
    const groupMap = new Map<string, (typeof groups)[number]>();

    for (const sub of submissions) {
      let g = groupMap.get(sub.mentee.id);
      if (!g) {
        g = {
          mentee: sub.mentee,
          batchName: sub.batchName,
          items: [],
        };
        groupMap.set(sub.mentee.id, g);
        groups.push(g);
      }
      g.items.push(sub);
    }

    for (const g of groups) {
      if (!submittedSort) {
        // Prioritize actionable items (SUBMITTED, RESUBMIT_REQUESTED) before GRADED
        g.items.sort((a, b) => {
          const aPending =
            a.status === SubmissionStatus.SUBMITTED ||
            a.status === SubmissionStatus.RESUBMIT_REQUESTED
              ? 0
              : 1;
          const bPending =
            b.status === SubmissionStatus.SUBMITTED ||
            b.status === SubmissionStatus.RESUBMIT_REQUESTED
              ? 0
              : 1;
          if (aPending !== bPending) return aPending - bPending;
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        });
      }
    }

    return groups;
  }, [submissions, submittedSort]);

  useEffect(() => {
    if (!isLoading && submissions.length === 0 && page > 1) {
      const timer = setTimeout(() => {
        setPage(1);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isLoading, submissions.length, page]);

  const handleNameSort = () => {
    setSubmittedSort(null);
    setNameSort((prev) => {
      if (prev === null) return 'asc';
      if (prev === 'asc') return 'desc';
      return null;
    });
    setPage(1);
  };

  const handleSubmittedSort = () => {
    setNameSort(null);
    setSubmittedSort((prev) => {
      if (prev === null) return 'desc';
      if (prev === 'desc') return 'asc';
      return null;
    });
    setPage(1);
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
            d="M7.5 3v18M3 16.5L7.5 21l4.5-4.5M16.5 21V3M12 7.5L16.5 3l4.5 4.5"
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

  const hasActiveFilters = Boolean(
    search.trim() !== '' || statusFilter !== 'ALL' || menteeIdFilter !== undefined,
  );

  const handleClearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setMenteeIdFilter(undefined);
    setStatusFilter('ALL');
    setPage(1);
    if (searchParams.has('search') || searchParams.has('mentee') || searchParams.has('menteeId')) {
      router.replace('/mentor/reviews', { scroll: false });
    }
  };

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
            onChange={(e) => {
              setSearch(e.target.value);
              if (menteeIdFilter) setMenteeIdFilter(undefined);
            }}
            placeholder="Search by mentee name or email..."
            aria-label="Search by mentee name or email"
            className="h-[47px] rounded-2xl border-[#E1E6EC] pr-4 pl-10 text-sm font-medium shadow-2xs hover:border-slate-300 focus:border-[#0044D3]"
          />
        </div>

        {/* Status Dropdown */}
        <div className="w-full shrink-0 sm:w-56">
          <SingleSelectDropdown
            label="Status"
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val as SubmissionStatus | 'ALL');
              setPage(1);
            }}
            options={STATUS_OPTIONS}
            placeholder="Status"
            aria-label="Filter by status"
            className="w-full"
            triggerClassName={cn(
              'h-[47px] rounded-2xl border-[#E1E6EC] bg-white px-4 text-sm font-semibold shadow-2xs transition-all hover:border-slate-300 hover:bg-[#F9FAFB]',
              statusFilter !== 'ALL' && 'border-blue-300 bg-blue-50/50 text-[#0044D3]',
            )}
            menuClassName="w-full sm:min-w-[220px] rounded-2xl border border-[#E1E6EC] bg-white p-1.5 shadow-xl"
          />
        </div>

        {/* Clear Filter icon button */}
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={handleClearFilters}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-rose-300 bg-rose-50 text-rose-700 shadow-2xs transition-colors hover:border-rose-400 hover:bg-rose-100 hover:text-rose-800 focus-visible:ring-2 focus-visible:ring-rose-500/30 focus-visible:outline-none"
            title="Clear filters"
            aria-label="Clear filters"
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

      {error && (
        <ErrorMessage
          title="Could not load submission queue"
          error={error}
          onRetry={() => {
            void refetch();
          }}
          className="my-2"
        />
      )}

      {/* Queue Table */}
      <div className="overflow-hidden rounded-3xl border border-[#E1E6EC] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-[#E1E6EC] bg-[#F8FAFC]">
              <tr>
                <th
                  className="px-6 py-3.5 text-sm font-semibold text-[#667085]"
                  aria-sort={
                    nameSort === 'asc' ? 'ascending' : nameSort === 'desc' ? 'descending' : 'none'
                  }
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleNameSort}
                    className="group inline-flex h-auto cursor-pointer items-center gap-1.5 p-0 text-sm font-semibold text-[#667085] hover:bg-transparent hover:text-[#111827] focus-visible:outline-none"
                    title={
                      nameSort === 'asc'
                        ? 'Sorted A to Z (click for Z to A)'
                        : nameSort === 'desc'
                          ? 'Sorted Z to A (click to reset)'
                          : 'Sort by mentee name'
                    }
                  >
                    <Span className="text-sm font-semibold text-[#667085] transition-colors group-hover:text-[#111827]">
                      Mentee
                    </Span>
                    {renderSortIcon(nameSort !== null, nameSort)}
                  </Button>
                </th>
                <th className="px-4 py-3.5 text-sm font-semibold text-[#667085]">
                  <Span className="text-sm font-semibold text-[#667085]">Assignment & Course</Span>
                </th>
                <th className="px-3 py-3.5 text-center text-sm font-semibold text-[#667085]">
                  <Span className="text-sm font-semibold text-[#667085]">Version</Span>
                </th>
                <th
                  className="px-4 py-3.5 text-sm font-semibold text-[#667085]"
                  aria-sort={
                    submittedSort === 'asc'
                      ? 'ascending'
                      : submittedSort === 'desc'
                        ? 'descending'
                        : 'none'
                  }
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSubmittedSort}
                    className="group inline-flex h-auto cursor-pointer items-center gap-1.5 p-0 text-sm font-semibold text-[#667085] hover:bg-transparent hover:text-[#111827] focus-visible:outline-none"
                    title={
                      submittedSort === 'desc'
                        ? 'Sorted newest first (click for oldest first)'
                        : submittedSort === 'asc'
                          ? 'Sorted oldest first (click to reset)'
                          : 'Sort by submission date'
                    }
                  >
                    <Span className="text-sm font-semibold text-[#667085] transition-colors group-hover:text-[#111827]">
                      Submitted
                    </Span>
                    {renderSortIcon(submittedSort !== null, submittedSort)}
                  </Button>
                </th>
                <th className="px-4 py-3.5 text-sm font-semibold text-[#667085]">
                  <Span className="text-sm font-semibold text-[#667085]">Status & Score</Span>
                </th>
                <th className="px-6 py-3.5 text-right text-sm font-semibold text-[#667085]">
                  <Span className="text-sm font-semibold text-[#667085]">Action</Span>
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

              {!isInitialLoading && !error && submissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center">
                    <H3 className="text-sm font-semibold text-slate-700">No submissions found</H3>
                  </td>
                </tr>
              )}

              {!isInitialLoading &&
                menteeGroups.map((group, groupIndex) => {
                  const isExpanded = Boolean(expandedMentees[group.mentee.id]);
                  const totalItems = group.items.length;
                  const hasMore = totalItems > 3;
                  const displayedItems =
                    isExpanded || !hasMore ? group.items : group.items.slice(0, 3);
                  const rowSpan = displayedItems.length;
                  const isLastGroup = groupIndex === menteeGroups.length - 1;

                  return (
                    <React.Fragment key={group.mentee.id}>
                      {displayedItems.map((sub, itemIndex) => {
                        const isFirstItem = itemIndex === 0;
                        const isLastItem = itemIndex === displayedItems.length - 1;

                        return (
                          <tr
                            key={sub.id}
                            style={
                              itemIndex >= 3
                                ? {
                                    animationDelay: `${Math.min(itemIndex - 3, 8) * 25}ms`,
                                  }
                                : undefined
                            }
                            className={cn(
                              'transition-colors hover:bg-slate-50/60',
                              itemIndex >= 3 && 'animate-row-expand',
                              isLastItem && 'border-b border-[#E1E6EC]',
                            )}
                          >
                            {/* Mentee Column (Rendered only on first item of group, spanning all group rows) */}
                            {isFirstItem ? (
                              <td
                                rowSpan={rowSpan}
                                className="border-r border-b border-[#E1E6EC]/80 bg-white px-6 py-4 align-top"
                              >
                                <div className="sticky top-16">
                                  <P className="font-semibold text-slate-900">
                                    {group.mentee.name}
                                  </P>
                                  {group.batchName && (
                                    <Span className="mt-1 inline-block rounded-full border border-[#E1E6EC] bg-[#F6F8FC] px-2.5 py-0.5 text-xs font-semibold text-[#111827]">
                                      {group.batchName}
                                    </Span>
                                  )}
                                  {totalItems > 1 && (
                                    <div className="mt-2 flex items-center gap-2">
                                      <Span className="text-xs font-medium text-slate-500">
                                        {totalItems} assignments
                                      </Span>
                                      {hasMore && (
                                        <button
                                          type="button"
                                          onClick={() => toggleMenteeExpand(group.mentee.id)}
                                          aria-expanded={isExpanded}
                                          title={
                                            isExpanded
                                              ? 'Collapse to 3 assignments'
                                              : `Show all ${totalItems} assignments`
                                          }
                                          className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-blue-200 bg-blue-50/80 px-2.5 py-0.5 text-[11px] font-semibold text-[#0044D3] transition-all hover:bg-blue-100 hover:text-[#0039B3] focus-visible:ring-2 focus-visible:ring-[#0044D3] focus-visible:outline-none active:scale-95"
                                        >
                                          <span>{isExpanded ? 'Less' : `+${totalItems - 3}`}</span>
                                          <svg
                                            className={cn(
                                              'h-3 w-3 transition-transform duration-200',
                                              isExpanded && 'rotate-180',
                                            )}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2.5}
                                            aria-hidden="true"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                                            />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
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
                                openUpward={isLastGroup && itemIndex >= displayedItems.length - 2}
                                onPrefetch={() => prefetchReview(sub.id)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar (FR-10.7) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3">
            <Muted className="text-xs">
              Showing {submissions.length} of {total} submissions
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

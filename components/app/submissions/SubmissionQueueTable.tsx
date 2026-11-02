'use client';

import React, { useEffect, useId, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { TableCell, TableRow } from '@/components/ui/Table';
import { H3, Muted, P, Span } from '@/components/ui/Typography';
import { usePrefetchSubmissionReview, useSubmissionQueue } from '@/hooks/useGrading';
import { useHoverPrefetch } from '@/hooks/useHoverPrefetch';
import { formatDateIST } from '@/lib/date';
import { SubmissionStatus } from '@/types/grading';

import { SubmissionReviewModal } from './SubmissionReviewModal';
import { SubmissionStatusBadge } from './SubmissionStatusBadge';

export function SubmissionQueueTable() {
  const prefetchReview = usePrefetchSubmissionReview();
  const { getHoverHandlers } = useHoverPrefetch();
  const searchInputId = useId();

  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'ALL'>(
    SubmissionStatus.SUBMITTED,
  );
  const [sortDirection, setSortDirection] = useState<'latest' | 'oldest'>('latest');
  const [page, setPage] = useState<number>(1);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

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
    sort: sortDirection,
    page,
    limit: 20,
  });

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
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
        {/* Search */}
        <div className="w-full sm:w-72">
          <Input
            id={searchInputId}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by mentee name or email..."
            className="h-9 text-xs"
          />
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5">
            <Span className="text-xs font-semibold text-slate-500">Status:</Span>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as SubmissionStatus | 'ALL');
                setPage(1);
              }}
              className="h-9 w-auto text-xs font-semibold text-slate-700"
            >
              <option value={SubmissionStatus.SUBMITTED}>Pending Review (Default)</option>
              <option value="ALL">All Statuses</option>
              <option value={SubmissionStatus.RESUBMIT_REQUESTED}>Resubmit Requested</option>
              <option value={SubmissionStatus.GRADED}>Graded</option>
            </Select>
          </div>

          {/* Newest / Oldest Sort Toggle (REV-02, REV-03) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSortDirection((prev) => (prev === 'latest' ? 'oldest' : 'latest'));
              setPage(1);
            }}
            className="border-slate-200 text-xs font-semibold text-slate-700"
          >
            {sortDirection === 'latest' ? '⬇ Newest First' : '⬆ Oldest First'}
          </Button>

          {/* Refresh Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void refetch()}
            className="text-xs text-slate-500"
          >
            ↻
          </Button>
        </div>
      </div>

      {error && (
        <ErrorMessage title="Could not load submission queue" error={error} className="my-2" />
      )}

      {/* Queue Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-3.5">
                  <Span>Mentee</Span>
                </th>
                <th className="px-4 py-3.5">
                  <Span>Assignment & Course</Span>
                </th>
                <th className="px-3 py-3.5 text-center">
                  <Span>Ver</Span>
                </th>
                <th className="px-4 py-3.5">
                  <Span>Submitted (IST)</Span>
                </th>
                <th className="px-4 py-3.5">
                  <Span>Status & Score</Span>
                </th>
                <th className="px-6 py-3.5 text-right">
                  <Span>Action</Span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading &&
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

              {!isLoading && submissions.length === 0 && (
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

              {!isLoading &&
                submissions.map((sub) => (
                  <tr key={sub.id} className="transition-colors hover:bg-slate-50/60">
                    {/* Mentee Column */}
                    <td className="px-6 py-4">
                      <P className="font-semibold text-slate-900">{sub.mentee.name}</P>
                      <P className="text-xs text-slate-500">{sub.mentee.email}</P>
                      {sub.batchName && (
                        <Span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                          {sub.batchName}
                        </Span>
                      )}
                    </td>

                    {/* Assignment Column */}
                    <td className="px-4 py-4">
                      <P className="font-semibold text-slate-800">{sub.assignmentTitle}</P>
                      <P className="text-xs text-slate-500">
                        {sub.courseTitle}
                        {sub.topicTitle && ` • ${sub.topicTitle}`}
                      </P>
                    </td>

                    {/* Version Column */}
                    <td className="px-3 py-4 text-center">
                      <Span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700">
                        v{sub.version}
                      </Span>
                    </td>

                    {/* Submitted At Column */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-0.5">
                        <Span className="text-xs text-slate-700">
                          {formatDateIST(sub.submittedAt)}
                        </Span>
                        {sub.isLate && (
                          <Span className="text-xs font-bold text-rose-600">⚠ LATE</Span>
                        )}
                      </div>
                    </td>

                    {/* Status & Score Column */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-start gap-1">
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
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        {...getHoverHandlers(() => prefetchReview(sub.id))}
                        onClick={() => setSelectedSubmissionId(sub.id)}
                        className="bg-blue-600 text-xs hover:bg-blue-700"
                      >
                        {sub.status === SubmissionStatus.GRADED ? 'View / Edit' : 'Review & Grade'}
                      </Button>
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
              Showing {submissions.length} of {total} submissions
            </Muted>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-xs"
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
                className="text-xs"
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

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import { CreateBatchModal } from '@/components/app/batches/CreateBatchModal';
import { DebouncedSearchInput } from '@/components/patterns/DebouncedSearchInput';
import { PaginationControls } from '@/components/patterns/PaginationControls';
import { SortableColumnHeader } from '@/components/patterns/SortableColumnHeader';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
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
import { Span } from '@/components/ui/Typography';
import { useBatchesList } from '@/hooks/useBatches';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import { formatDateDMY } from '@/lib/date';
import { type BatchStatus } from '@/lib/validation';
import type { ApiBatchSummary } from '@/services/batches.service';

import { DEFAULT_PAGE_SIZE_OPTIONS, getBatchStatusBadgeClass } from './batchStatus';

const BATCH_STATUS_FILTER_OPTIONS: MultiSelectOption<BatchStatus>[] = [
  { value: 'LIVE', label: 'Live' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
];

function BatchesTableRow({ batch }: Readonly<{ batch: ApiBatchSummary }>) {
  const router = useRouter();
  const totalMembers = (batch.menteesCount ?? 0) + (batch.mentorsCount ?? 0);

  return (
    <TableRow
      tabIndex={0}
      role="link"
      onClick={() => {
        router.push(`/admin/batches/${batch.id}`);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/admin/batches/${batch.id}`);
        }
      }}
      className="h-14 cursor-pointer transition-colors hover:bg-slate-50/70 focus-visible:ring-2 focus-visible:ring-[#0044D3] focus-visible:outline-none"
    >
      <TableCell className="max-w-[240px] font-semibold text-slate-900 sm:max-w-xs md:max-w-sm">
        <Link
          href={`/admin/batches/${batch.id}`}
          onClick={(e) => e.stopPropagation()}
          title={batch.name}
          className="block truncate transition-colors hover:text-[#0044D3]"
        >
          {batch.name}
        </Link>
      </TableCell>
      <TableCell className="text-xs font-semibold text-slate-600">
        <Span>{batch.code}</Span>
      </TableCell>
      <TableCell>
        <Span
          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getBatchStatusBadgeClass(
            batch.status,
          )}`}
        >
          {batch.status}
        </Span>
      </TableCell>
      <TableCell className="text-xs text-slate-500">
        <Span>
          {formatDateDMY(batch.startDate)} → {formatDateDMY(batch.endDate)}
        </Span>
      </TableCell>
      <TableCell className="text-xs font-semibold text-slate-700">
        <Span>
          {totalMembers} {totalMembers === 1 ? 'member' : 'members'}
        </Span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#0044D3]"
              style={{ width: `${batch.progressPercent ?? 0}%` }}
            />
          </div>
          <Span className="text-xs font-semibold text-slate-700">
            {batch.progressPercent ?? 0}%
          </Span>
        </div>
      </TableCell>
    </TableRow>
  );
}

function BatchesTableSkeleton({ count = 10 }: Readonly<{ count?: number }>) {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <TableRow key={`batch-skel-${idx}`} className="h-14">
          <TableCell className="max-w-[240px] sm:max-w-xs md:max-w-sm">
            <Skeleton className="h-4 w-44 rounded-md" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16 rounded-md" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32 rounded-md" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20 rounded-md" />
          </TableCell>
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-2">
              <Skeleton className="h-2 w-24 rounded-full" />
              <Skeleton className="h-3 w-8 rounded-md" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function BatchesPageSkeleton() {
  return (
    <div className="animate-in fade-in space-y-4 duration-150">
      {/* Top Action Skeleton */}
      <div className="flex items-center justify-end pt-2">
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>

      {/* Filter Row Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-1">
        <Skeleton className="h-11 w-full max-w-md rounded-xl" />
        <Skeleton className="h-11 w-48 rounded-xl" />
      </div>

      {/* Table Skeleton */}
      <div className="overflow-hidden rounded-2xl border border-[#E1E6EC] bg-white shadow-xs">
        <div className="h-12 border-b border-slate-100 bg-slate-50/50 px-4 py-3">
          <div className="grid grid-cols-6 gap-4">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-4 w-16 rounded-md" />
            <Skeleton className="h-4 w-16 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="ml-auto h-4 w-24 rounded-md" />
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex h-14 items-center justify-between px-4">
              <Skeleton className="h-4 w-40 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-2 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BatchesTable() {
  const { user, isAuthorized, sessionError } = useRoleRedirect({ allowedRoles: ['SUPER_ADMIN'] });
  const [search, setSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<BatchStatus[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isCreateOpen, setIsCreateOpen] = useState(
    () => typeof window !== 'undefined' && window.location.search.includes('create=true'),
  );

  const filterStatus = selectedStatuses.length > 0 ? selectedStatuses : undefined;

  const {
    data: batchesResponse,
    isLoading,
    error,
  } = useBatchesList({
    status: filterStatus,
    search: search.trim() || undefined,
    page,
    limit,
  });

  const batches = useMemo(() => batchesResponse?.items ?? [], [batchesResponse?.items]);

  // Sorting state for Batch Name column
  const [sortField, setSortField] = useState<'name' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'name') => {
    if (sortField === field) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortField(null);
        setSortOrder('asc');
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedBatches = useMemo(() => {
    if (!sortField) return batches;
    return [...batches].sort((a, b) => {
      const valA = a.name || '';
      const valB = b.name || '';
      return sortOrder === 'asc'
        ? valA.localeCompare(valB, undefined, { sensitivity: 'base' })
        : valB.localeCompare(valA, undefined, { sensitivity: 'base' });
    });
  }, [batches, sortField, sortOrder]);

  const isTableLoading = isLoading;
  const pagination = useMemo(
    () =>
      batchesResponse?.pagination ?? {
        page,
        limit,
        total: 0,
        totalPages: 1,
      },
    [batchesResponse, page, limit],
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isAuthorized || !user) {
    if (sessionError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
          <Alert variant="error" title="Session Verification Issue" message={sessionError} />
        </div>
      );
    }
    return <BatchesPageSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Top Header Action Toolbar without redundant h1 header */}
      <div className="flex items-center justify-end pt-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="h-9 gap-2 rounded-full bg-[#0044D3] px-4 text-xs font-semibold text-white shadow-xs hover:bg-[#0039B3] sm:h-10 sm:text-sm"
        >
          <Span className="text-base font-bold">+</Span>
          <Span>Create Batch</Span>
        </Button>
      </div>

      {/* Filter Row with Search Input and Status MultiSelect Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-1">
        <div className="w-full flex-1 sm:max-w-md lg:max-w-lg">
          <DebouncedSearchInput
            value={search}
            onSearchChange={handleSearchChange}
            placeholder="Search batches by name or code..."
          />
        </div>
        <div className="w-full sm:w-auto">
          <MultiSelectDropdown
            label="Status"
            options={BATCH_STATUS_FILTER_OPTIONS}
            selectedValues={selectedStatuses}
            onChange={(vals) => {
              setSelectedStatuses(vals);
              setPage(1);
            }}
          />
        </div>
      </div>

      {error ? (
        <Alert
          variant="error"
          title="Error Loading Cohorts"
          message={error instanceof Error ? error.message : 'Failed to retrieve batches.'}
        />
      ) : null}

      {/* Batches Table View */}
      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableColumnHeader<'name'>
                field="name"
                label="Batch Name"
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
                tooltip="Sort visible batches by Batch Name"
                className="font-semibold text-slate-700"
              />
              <TableHead className="font-semibold text-slate-700">Code</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              <TableHead className="font-semibold text-slate-700">Timeline</TableHead>
              <TableHead className="font-semibold text-slate-700">Members</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isTableLoading ? (
              <BatchesTableSkeleton count={limit} />
            ) : batches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-slate-500">
                  <Span>No batches match the applied filter.</Span>
                </TableCell>
              </TableRow>
            ) : (
              sortedBatches.map((b) => <BatchesTableRow key={b.id} batch={b} />)
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls with Loading State */}
        <PaginationControls
          page={pagination.page}
          limit={pagination.limit}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          isLoading={isTableLoading}
          itemLabel="cohorts"
          pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
        />
      </TableContainer>

      {/* Create Batch Modal */}
      <CreateBatchModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}

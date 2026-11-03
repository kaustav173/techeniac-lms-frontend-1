'use client';

import React, { useEffect, useState } from 'react';

import { PaginationControls } from '@/components/patterns/PaginationControls';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/Input';
import { SingleSelectDropdown } from '@/components/ui/SingleSelectDropdown';
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
import { H2, P, Span } from '@/components/ui/Typography';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { resolveAuditTargetEntity } from '@/lib/audit';
import type { ApiAuditItem, AuditType } from '@/lib/validation';
import type { AuditQueryFilters } from '@/services/audit.service';

import { AuditDetailModal } from './AuditDetailModal';

function formatAuditDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  const day = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit' }).format(
    date,
  );
  const month = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
  }).format(date);
  const year = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
  }).format(date);
  return `${day} ${month}, ${year}`;
}

function formatAuditTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

const AUDIT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All Types' },
  { value: 'AUTH', label: 'Authentication (AUTH)' },
  { value: 'USER', label: 'User & Roles (USER)' },
  { value: 'COURSE', label: 'Courses (COURSE)' },
  { value: 'BATCH', label: 'Batches (BATCH)' },
  { value: 'MENTOR_MAPPING', label: 'Mentor Mapping (MENTOR_MAPPING)' },
  { value: 'COURSE_ALLOCATION', label: 'Allocations (COURSE_ALLOCATION)' },
  { value: 'SUBMISSION', label: 'Submissions (SUBMISSION)' },
  { value: 'GRADING', label: 'Grading (GRADING)' },
];

function getAuditTypeBadge(type: AuditType): string {
  switch (type) {
    case 'AUTH':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'USER':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'COURSE':
      return 'bg-violet-100 text-violet-800 border-violet-200';
    case 'BATCH':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'MENTOR_MAPPING':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'COURSE_ALLOCATION':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'SUBMISSION':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'GRADING':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
}

export function AuditLogTable() {
  const [filters, setFilters] = useState<AuditQueryFilters>({
    page: 1,
    limit: 10,
    type: undefined,
    action: undefined,
    search: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  const [searchInput, setSearchInput] = useState<string>('');
  const [selectedEntry, setSelectedEntry] = useState<ApiAuditItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debounce search input across Type, Action, Actor, Target Entity
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => {
        const trimmed = searchInput.trim();
        const nextSearch = trimmed ? trimmed : undefined;
        if (prev.search === nextSearch) return prev;
        return {
          ...prev,
          page: 1,
          search: nextSearch,
        };
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { logs, pagination, isLoading, isFetching, error } = useAuditLogs(filters);

  const handleFilterChange = (key: keyof AuditQueryFilters, value: string | number | undefined) => {
    setFilters((prev) => {
      const nextFilters: AuditQueryFilters = {
        ...prev,
        page: 1, // Reset to first page on filter change
        [key]: value === '' || value === 'ALL' ? undefined : value,
      };
      if (
        key === 'startDate' &&
        nextFilters.endDate &&
        value &&
        String(value) > String(nextFilters.endDate)
      ) {
        nextFilters.endDate = undefined;
      }
      return nextFilters;
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      limit: newLimit,
    }));
  };

  const handleOpenModal = (entry: ApiAuditItem) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      limit: 10,
      type: undefined,
      action: undefined,
      search: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  const hasActiveFilters = Boolean(
    filters.type || filters.action || filters.search || filters.startDate || filters.endDate,
  );

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Type Filter */}
          <div>
            <SingleSelectDropdown
              id="audit-type-filter"
              value={filters.type ?? 'ALL'}
              onChange={(val) => handleFilterChange('type', val)}
              options={AUDIT_TYPE_OPTIONS}
              triggerLabel={!filters.type || filters.type === 'ALL' ? 'Type' : undefined}
              size="md"
            />
          </div>

          {/* Search across Type, Action, Actor, Target Entity with Debounce */}
          <div>
            <Input
              id="audit-search-filter"
              type="text"
              placeholder="Filter by Type, Action, Actor, Target Entity"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-11 rounded-xl text-sm"
            />
          </div>

          {/* Date Range Start */}
          <div>
            <DatePicker
              id="audit-start-date"
              value={filters.startDate}
              onChange={(val) => handleFilterChange('startDate', val || undefined)}
              placeholder="From date"
              className="h-11 text-sm"
            />
          </div>

          {/* Date Range End */}
          <div>
            <DatePicker
              id="audit-end-date"
              value={filters.endDate}
              onChange={(val) => handleFilterChange('endDate', val || undefined)}
              placeholder="To date"
              className="h-11 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <Span className="font-bold">Error loading audit records: </Span>
          {error}
        </div>
      )}

      {/* Audit Log Table using UI Primitives */}
      <TableContainer>
        <Table className="w-full table-fixed text-left">
          <TableHeader className="border-b border-[#E1E6EC] bg-[#F6F8FC] font-semibold text-[#667085]">
            <TableRow>
              <TableHead className="w-[15%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]">
                Date & Time
              </TableHead>
              <TableHead className="w-[11%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]">
                Type
              </TableHead>
              <TableHead className="w-[18%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]">
                Action
              </TableHead>
              <TableHead className="w-[18%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]">
                Actor
              </TableHead>
              <TableHead className="w-[26%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]">
                Target Entity
              </TableHead>
              <TableHead className="w-[12%] px-4 py-3.5 text-center text-xs font-semibold text-[#667085]">
                Details
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-[#F2F4F7] font-normal">
            {isLoading || isFetching ? (
              // Skeleton rows
              Array.from({ length: 6 }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`} className="animate-pulse">
                  <TableCell className="w-[15%] px-4 py-3.5">
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-24 rounded-md" />
                      <Skeleton className="h-3 w-16 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell className="w-[11%] px-4 py-3.5">
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </TableCell>
                  <TableCell className="w-[18%] px-4 py-3.5">
                    <Skeleton className="h-4 w-28 rounded-md" />
                  </TableCell>
                  <TableCell className="w-[18%] px-4 py-3.5">
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <Skeleton className="h-3 w-16 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell className="w-[26%] px-4 py-3.5">
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-40 rounded-md" />
                      <Skeleton className="h-3 w-20 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell className="w-[12%] px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center">
                      <Skeleton className="h-8 w-20 rounded-lg" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : error ? null : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-5 py-14 text-center">
                  <div className="mx-auto max-w-sm space-y-2.5">
                    <H2 className="text-base font-bold text-slate-900">No audit events found</H2>
                    <P className="text-xs text-slate-500">
                      {hasActiveFilters
                        ? 'No events match the selected filters. Try widening your date range or clearing filters.'
                        : 'No audit records have been generated yet.'}
                    </P>
                    {hasActiveFilters && (
                      <div className="pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleResetFilters}
                          className="rounded-xl text-xs font-semibold"
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((item) => {
                const formattedDate = formatAuditDate(item.createdAt);
                const formattedTime = formatAuditTime(item.createdAt);
                const actorName = item.actor?.name || 'Anonymous / System';
                const actorRole = item.actor?.role;
                const target = resolveAuditTargetEntity(item);

                return (
                  <TableRow
                    key={item.id}
                    onClick={() => handleOpenModal(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpenModal(item);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    className="cursor-pointer transition-colors hover:bg-[#F9FAFB]/80 focus:bg-slate-50 focus:outline-hidden"
                  >
                    {/* Date & Time */}
                    <TableCell className="w-[15%] px-4 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <Span className="text-sm font-semibold text-slate-900">
                          {formattedDate}
                        </Span>
                        <Span className="text-xs text-slate-500">{formattedTime}</Span>
                      </div>
                    </TableCell>

                    {/* Type */}
                    <TableCell className="w-[11%] px-4 py-3.5 whitespace-nowrap">
                      <Span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${getAuditTypeBadge(
                          item.type,
                        )}`}
                      >
                        {item.type}
                      </Span>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="w-[18%] px-4 py-3.5 text-[11px] font-semibold whitespace-nowrap text-slate-800">
                      {item.action}
                    </TableCell>

                    {/* Actor */}
                    <TableCell className="w-[18%] px-4 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <Span className="text-sm font-semibold text-slate-900">{actorName}</Span>
                        {actorRole ? (
                          <Span className="text-xs text-slate-500">{actorRole}</Span>
                        ) : null}
                      </div>
                    </TableCell>

                    {/* Target Entity */}
                    <TableCell className="w-[26%] px-4 py-3.5 whitespace-nowrap text-slate-700">
                      <div className="flex flex-col">
                        <Span className="text-sm font-semibold text-slate-900">{target.name}</Span>
                        {target.type ? (
                          <Span className="text-xs text-slate-500">{target.type}</Span>
                        ) : null}
                      </div>
                    </TableCell>

                    {/* View Payload Details Button */}
                    <TableCell className="w-[12%] px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(item);
                          }}
                          className="h-8 rounded-lg border-blue-200 px-2.5 text-xs font-semibold text-[#0044D3] hover:bg-blue-50 hover:text-blue-700"
                        >
                          View Diff
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar using shared pattern */}
        <PaginationControls
          page={pagination.page}
          limit={pagination.limit}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          itemLabel="audit events"
        />
      </TableContainer>

      {/* Modal */}
      <AuditDetailModal
        entry={selectedEntry}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEntry(null);
        }}
      />
    </div>
  );
}

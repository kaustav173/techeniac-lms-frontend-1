'use client';

import React, { useState } from 'react';

import { DebouncedSearchInput } from '@/components/patterns/DebouncedSearchInput';
import { PaginationControls } from '@/components/patterns/PaginationControls';
import { SortableColumnHeader } from '@/components/patterns/SortableColumnHeader';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
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
import { H2, Span } from '@/components/ui/Typography';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { formatAuditAction, resolveAuditTargetEntity } from '@/lib/audit';
import { formatRoleLabel } from '@/lib/roles';
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

function formatActorRole(role?: string | null): string | null {
  if (!role) return null;
  const clean = role.trim().toUpperCase();
  if (clean === 'SUPER_ADMIN' || clean === 'SUPERADMIN' || clean === 'ADMIN') return 'Super Admin';
  if (clean === 'MENTOR') return 'Mentor';
  if (clean === 'MENTEE') return 'Mentee';
  return formatRoleLabel(role);
}

const AUDIT_TYPE_OPTIONS: readonly MultiSelectOption<AuditType>[] = [
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
    types: undefined,
    search: undefined,
    startDate: undefined,
    endDate: undefined,
    sortOrder: 'desc',
  });

  const [selectedEntry, setSelectedEntry] = useState<ApiAuditItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { logs, pagination, isLoading, isFetching, error } = useAuditLogs(filters);

  const selectedTypes = filters.types ?? [];

  const handleSearchChange = (val: string) => {
    const trimmed = val.trim();
    setFilters((prev) => ({
      ...prev,
      page: 1,
      search: trimmed ? trimmed : undefined,
    }));
  };

  const handleTypesChange = (newTypes: AuditType[]) => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      types: newTypes.length > 0 ? newTypes : undefined,
    }));
  };

  const handleSort = () => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

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
      if (
        key === 'endDate' &&
        nextFilters.startDate &&
        value &&
        String(value) < String(nextFilters.startDate)
      ) {
        nextFilters.startDate = undefined;
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
    setFilters({
      page: 1,
      limit: 10,
      types: undefined,
      search: undefined,
      startDate: undefined,
      endDate: undefined,
      sortOrder: 'desc',
    });
  };

  const hasActiveFilters = Boolean(
    (filters.types && filters.types.length > 0) ||
    filters.search ||
    filters.startDate ||
    filters.endDate,
  );

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Search across Type, Activity, Actor, Target Entity (with Search Icon) */}
          <div>
            <DebouncedSearchInput
              value={filters.search ?? ''}
              onSearchChange={handleSearchChange}
              placeholder="Search by Type, Activity, Actor, Target Entity"
            />
          </div>

          {/* 2. Type Filter (Multi-select with Checkboxes & Clear Button) */}
          <div>
            <MultiSelectDropdown<AuditType>
              label="Type"
              options={AUDIT_TYPE_OPTIONS}
              selectedValues={selectedTypes}
              onChange={handleTypesChange}
              align="left"
              className="w-full"
            />
          </div>

          {/* 3. Date Range Start */}
          <div>
            <DatePicker
              id="audit-start-date"
              value={filters.startDate}
              onChange={(val) => handleFilterChange('startDate', val || undefined)}
              maxDate={filters.endDate}
              placeholder="From date"
              className="h-11 text-sm"
            />
          </div>

          {/* 4. Date Range End */}
          <div>
            <DatePicker
              id="audit-end-date"
              value={filters.endDate}
              onChange={(val) => handleFilterChange('endDate', val || undefined)}
              minDate={filters.startDate}
              placeholder="To date"
              className="h-11 text-sm"
            />
          </div>
        </div>

        {/* Clear Filters (Cross Icon Button - appears only when any filter is active) */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            title="Clear all filters"
            aria-label="Clear all filters"
            className="h-11 w-11 shrink-0 rounded-full border border-red-200/60 bg-[#FEE2E2] p-0 text-[#DC2626] transition-all hover:bg-[#FCD2D2] hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        )}
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
              <SortableColumnHeader<'createdAt'>
                field="createdAt"
                label="Date & Time"
                sortField="createdAt"
                sortOrder={filters.sortOrder ?? 'desc'}
                onSort={handleSort}
                tooltip="Sort by Date & Time"
                className="w-[16%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]"
              />
              <TableHead className="w-[14%] px-4 py-3.5 pr-6 text-left text-xs font-semibold text-[#667085]">
                Type
              </TableHead>
              <TableHead className="w-[18%] px-4 py-3.5 pl-6 text-left text-xs font-semibold text-[#667085] sm:pl-8">
                Activity
              </TableHead>
              <TableHead className="w-[17%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]">
                Actor
              </TableHead>
              <TableHead className="w-[24%] px-4 py-3.5 text-left text-xs font-semibold text-[#667085]">
                Target Entity
              </TableHead>
              <TableHead className="w-[11%] px-4 py-3.5 text-center text-xs font-semibold text-[#667085]">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-[#F2F4F7] font-normal">
            {isLoading || isFetching ? (
              // Skeleton rows (matches default 10-row page size)
              Array.from({ length: 10 }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`} className="animate-pulse">
                  <TableCell className="w-[16%] px-4 py-3.5">
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-24 rounded-md" />
                      <Skeleton className="h-3 w-16 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell className="w-[14%] px-4 py-3.5 pr-6">
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </TableCell>
                  <TableCell className="w-[18%] px-4 py-3.5 pl-6 sm:pl-8">
                    <Skeleton className="h-4 w-28 rounded-md" />
                  </TableCell>
                  <TableCell className="w-[17%] px-4 py-3.5">
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <Skeleton className="h-3 w-16 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell className="w-[24%] px-4 py-3.5">
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-40 rounded-md" />
                      <Skeleton className="h-3 w-20 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell className="w-[11%] px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center">
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : error ? null : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-5 py-14 text-center">
                  <div className="mx-auto max-w-sm space-y-2.5">
                    <H2 className="text-base font-bold text-slate-900">No audit events found</H2>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((item) => {
                const formattedDate = formatAuditDate(item.createdAt);
                const formattedTime = formatAuditTime(item.createdAt);
                const actorName = item.actor?.name || 'Anonymous / System';
                const actorRole = formatActorRole(item.actor?.role);
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
                    <TableCell className="w-[16%] px-4 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <Span className="text-sm font-semibold text-slate-900">
                          {formattedDate}
                        </Span>
                        <Span className="text-xs text-slate-500">{formattedTime}</Span>
                      </div>
                    </TableCell>

                    {/* Type */}
                    <TableCell className="w-[14%] px-4 py-3.5 pr-6 whitespace-nowrap">
                      <Span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${getAuditTypeBadge(
                          item.type,
                        )}`}
                      >
                        {item.type}
                      </Span>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="w-[18%] px-4 py-3.5 pl-6 text-[11px] font-semibold whitespace-nowrap text-slate-800 sm:pl-8">
                      {formatAuditAction(item.action)}
                    </TableCell>

                    {/* Actor */}
                    <TableCell className="w-[17%] px-4 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <Span className="text-sm font-semibold text-slate-900">{actorName}</Span>
                        {actorRole ? (
                          <Span className="text-xs text-slate-500">{actorRole}</Span>
                        ) : null}
                      </div>
                    </TableCell>

                    {/* Target Entity */}
                    <TableCell className="w-[24%] px-4 py-3.5 whitespace-nowrap text-slate-700">
                      <div className="flex flex-col">
                        <Span className="text-sm font-semibold text-slate-900">{target.name}</Span>
                        {target.type ? (
                          <Span className="text-xs text-slate-500">{target.type}</Span>
                        ) : null}
                      </div>
                    </TableCell>

                    {/* View Payload Details Button */}
                    <TableCell className="w-[11%] px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(item);
                          }}
                          title="View audit event details"
                          aria-label={`View audit details for ${formatAuditAction(item.action)}`}
                          className="h-8 w-8 rounded-full p-0 text-slate-500 hover:bg-blue-50 hover:text-[#0044D3]"
                        >
                          <svg
                            className="h-4.5 w-4.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.75}
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
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

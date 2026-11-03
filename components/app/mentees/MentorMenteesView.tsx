'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { MenteeTableRow } from '@/components/app/mentees/MenteeTableRow';
import { PaginationControls } from '@/components/patterns/PaginationControls';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  SingleSelectDropdown,
  type SingleSelectOption,
} from '@/components/ui/SingleSelectDropdown';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { H2, P, Span } from '@/components/ui/Typography';
import { useMentorBatches, useMentorMentees } from '@/hooks/useBatches';
import { cn } from '@/lib/cn';

interface MenteeActionMenuProps {
  readonly menteeName?: string | undefined;
  readonly openUpward?: boolean | undefined;
}

function MenteeActionMenu({ menteeName, openUpward }: MenteeActionMenuProps) {
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
        aria-label={`Actions for ${menteeName ?? 'mentee'}`}
        onClick={handleToggle}
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
          <Link
            href="/mentor/progress"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#111827] transition-colors hover:bg-blue-50/80 hover:text-[#0044D3]"
          >
            <svg
              className="h-4 w-4 text-[#0044D3]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <Span>Progress</Span>
          </Link>
          <Link
            href="/mentor/reviews"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#111827] transition-colors hover:bg-purple-50/80 hover:text-purple-700"
          >
            <svg
              className="h-4 w-4 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <Span>Reviews</Span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function MentorMenteesView() {
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const {
    data: batches = [],
    isLoading: isLoadingBatches,
    error: batchesError,
    refetch: refetchBatches,
  } = useMentorBatches();

  const {
    data: mentees = [],
    isLoading: isLoadingMentees,
    error: menteesError,
    refetch: refetchMentees,
  } = useMentorMentees();

  // Pre-formatted dropdown options for course filter
  const courseOptions = useMemo<SingleSelectOption[]>(
    () => [
      { value: '', label: 'All Assigned Courses' },
      ...batches.map((b) => ({
        value: b.id,
        label: `${b.name} (${b.code})`,
      })),
    ],
    [batches],
  );

  // Client-side filtering by batch ID, name, email, or batch details
  const filteredMentees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mentees.filter((m) => {
      if (selectedBatchId && m.batchId !== selectedBatchId) return false;
      if (!q) return true;

      const name = m.name?.toLowerCase() ?? '';
      const email = m.email?.toLowerCase() ?? '';
      const batchName = m.batchName?.toLowerCase() ?? '';
      const batchCode = m.batchCode?.toLowerCase() ?? '';
      return (
        name.includes(q) || email.includes(q) || batchName.includes(q) || batchCode.includes(q)
      );
    });
  }, [mentees, searchQuery, selectedBatchId]);

  const totalPages = Math.ceil(filteredMentees.length / pageSize) || 1;

  const paginatedMentees = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMentees.slice(start, start + pageSize);
  }, [filteredMentees, page, pageSize]);

  const hasActiveFilters = Boolean(selectedBatchId || searchQuery.trim());

  const handleClearFilters = () => {
    setSelectedBatchId('');
    setSearchQuery('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Global Error Banner */}
      {batchesError || menteesError ? (
        <Alert
          variant="error"
          title="Error Loading Mentees"
          message={
            menteesError?.message ||
            batchesError?.message ||
            'Failed to retrieve mapped mentees. Please verify your connection and try again.'
          }
        >
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (batchesError) void refetchBatches();
                if (menteesError) void refetchMentees();
              }}
            >
              Retry Loading
            </Button>
          </div>
        </Alert>
      ) : null}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs">
          <Span className="block text-xs font-bold tracking-wider text-[#667085] uppercase">
            Total Mapped Mentees
          </Span>
          {isLoadingMentees ? (
            <Skeleton className="mt-2 h-9 w-16 rounded-lg" />
          ) : (
            <P className="mt-1 text-3xl font-bold text-[#111827]">{mentees.length}</P>
          )}
        </div>

        <div className="rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs">
          <Span className="block text-xs font-bold tracking-wider text-[#667085] uppercase">
            Matching Filter
          </Span>
          {isLoadingMentees ? (
            <Skeleton className="mt-2 h-9 w-16 rounded-lg" />
          ) : (
            <P className="mt-1 text-3xl font-bold text-[#0044D3]">{filteredMentees.length}</P>
          )}
        </div>

        <div className="rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs">
          <Span className="block text-xs font-bold tracking-wider text-[#667085] uppercase">
            Assigned Courses
          </Span>
          {isLoadingBatches ? (
            <Skeleton className="mt-2 h-9 w-16 rounded-lg" />
          ) : (
            <P className="mt-1 text-3xl font-bold text-[#111827]">{batches.length}</P>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E1E6EC] bg-white p-4 shadow-xs sm:flex-row sm:items-center">
        {/* Search Input with Search Icon and Curved Border */}
        <div className="relative w-full sm:max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <svg
              className="h-4 w-4"
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
          </div>
          <Input
            type="search"
            placeholder="Search by name, email, or course..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            aria-label="Search mentees"
            className="h-[47px] rounded-2xl border-[#E1E6EC] pr-4 pl-10 text-sm font-medium shadow-2xs hover:border-slate-300 focus:border-[#0044D3]"
          />
        </div>

        {/* Course / Batch Filter & Clear Filters placed side by side */}
        <div className="flex items-center gap-3">
          <SingleSelectDropdown
            value={selectedBatchId}
            onChange={(val) => {
              setSelectedBatchId(val);
              setPage(1);
            }}
            options={courseOptions}
            placeholder="All Assigned Courses"
            aria-label="Filter by course"
            className="w-full shrink-0 sm:w-[219px]"
            triggerClassName={cn(
              'h-[47px] rounded-2xl border-[#E1E6EC] bg-white px-4 text-sm font-semibold shadow-2xs transition-all hover:border-slate-300 hover:bg-[#F9FAFB]',
              selectedBatchId && 'border-blue-300 bg-blue-50/50 text-[#0044D3]',
            )}
            menuClassName="w-full sm:min-w-[260px] rounded-2xl border border-[#E1E6EC] bg-white p-1.5 shadow-xl"
          />

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-[47px] rounded-2xl px-3 text-xs font-semibold text-[#667085] hover:bg-[#F6F8FC] hover:text-[#111827]"
            >
              Clear Filters
            </Button>
          ) : null}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="overflow-hidden rounded-2xl border border-[#E1E6EC] bg-white shadow-xs">
        {isLoadingMentees ? (
          <div className="space-y-4 p-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 border-b border-[#E1E6EC]/60 py-3.5 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : menteesError ? null : mentees.length === 0 ? (
          /* Empty State: Mentor has no mentees mapped in total */
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#0044D3]">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <H2 className="mt-4 text-base font-bold text-[#111827]">No Mentees Mapped</H2>
            <P className="mx-auto mt-1 max-w-md text-sm text-[#667085]">
              You are not currently paired with any mentees. Once an administrator maps mentees to
              you within an active batch, they will appear here.
            </P>
          </div>
        ) : filteredMentees.length === 0 ? (
          /* Empty State: Filter yielded zero results */
          <div className="p-12 text-center">
            <P className="text-base font-semibold text-[#111827]">
              {searchQuery
                ? `No mentees match \u201C${searchQuery}\u201D`
                : 'No mentees found in the selected course'}
            </P>
            <P className="mt-1 text-sm text-[#667085]">
              Try adjusting your search criteria or resetting filters.
            </P>
            <div className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={handleClearFilters}>
                Reset Filters
              </Button>
            </div>
          </div>
        ) : (
          /* Table of Mapped Mentees */
          <div>
            <TableContainer className="rounded-none border-0 shadow-none">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#E1E6EC] bg-[#F8FAFC]">
                    <TableHead className="py-3.5 text-xs font-semibold text-[#667085]">
                      Mentee
                    </TableHead>
                    <TableHead className="py-3.5 text-xs font-semibold text-[#667085]">
                      Course
                    </TableHead>
                    <TableHead className="py-3.5 text-xs font-semibold text-[#667085]">
                      Course Code
                    </TableHead>
                    <TableHead className="py-3.5 text-xs font-semibold text-[#667085]">
                      Mapped Since
                    </TableHead>
                    <TableHead className="py-3.5 text-right text-xs font-semibold text-[#667085]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMentees.map((mentee, index) => (
                    <MenteeTableRow
                      key={mentee.id}
                      mentee={mentee}
                      actions={
                        <MenteeActionMenu
                          menteeName={mentee.name}
                          openUpward={index >= paginatedMentees.length - 2}
                        />
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredMentees.length > 0 ? (
              <PaginationControls
                page={page}
                limit={pageSize}
                total={filteredMentees.length}
                totalPages={totalPages}
                onPageChange={setPage}
                onLimitChange={(newLimit) => {
                  setPageSize(newLimit);
                  setPage(1);
                }}
                itemLabel="mentees"
                pageSizeOptions={[10, 20, 50]}
                className="px-6 py-2.5"
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

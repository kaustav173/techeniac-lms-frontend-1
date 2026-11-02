'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';

import { MenteeTableRow } from '@/components/app/mentees/MenteeTableRow';
import { Alert } from '@/components/ui/Alert';
import { Button, getButtonClassName } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { H1, H2, P, Span } from '@/components/ui/Typography';
import { useMentorBatches, useMentorMentees } from '@/hooks/useBatches';

export function MentorMenteesView() {
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const hasActiveFilters = Boolean(selectedBatchId || searchQuery.trim());

  const handleClearFilters = () => {
    setSelectedBatchId('');
    setSearchQuery('');
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Context */}
      <div>
        <H1 className="text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">My Mentees</H1>
        <P className="mt-1 text-sm text-[#667085]">
          View and monitor mentees actively mapped to you across your assigned cohorts (FR-4.3).
        </P>
      </div>

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
        <div className="rounded-3xl border border-[#E1E6EC] bg-white p-5 shadow-xs">
          <Span className="block text-xs font-bold tracking-wider text-[#667085] uppercase">
            Total Mapped Mentees
          </Span>
          <P className="mt-1 text-3xl font-bold text-[#111827]">
            {isLoadingMentees ? '—' : mentees.length}
          </P>
        </div>

        <div className="rounded-3xl border border-[#E1E6EC] bg-white p-5 shadow-xs">
          <Span className="block text-xs font-bold tracking-wider text-[#667085] uppercase">
            Matching Filter
          </Span>
          <P className="mt-1 text-3xl font-bold text-[#0044D3]">
            {isLoadingMentees ? '—' : filteredMentees.length}
          </P>
        </div>

        <div className="rounded-3xl border border-[#E1E6EC] bg-white p-5 shadow-xs">
          <Span className="block text-xs font-bold tracking-wider text-[#667085] uppercase">
            Assigned Cohorts
          </Span>
          <P className="mt-1 text-3xl font-bold text-[#111827]">
            {isLoadingBatches ? '—' : batches.length}
          </P>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-4 rounded-3xl border border-[#E1E6EC] bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="w-full sm:max-w-xs">
            <Input
              type="search"
              placeholder="Search by name, email, or cohort..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search mentees"
              className="h-10 text-sm"
            />
          </div>

          {/* Cohort / Batch Filter */}
          <div className="w-full sm:max-w-xs">
            <Select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              aria-label="Filter by cohort"
              className="h-10 text-sm"
            >
              <option value="">All Assigned Cohorts</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </Select>
          </div>
        </div>

        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-xs text-[#667085] hover:text-[#111827]"
          >
            Clear Filters
          </Button>
        ) : null}
      </div>

      {/* Main Content Area */}
      <div className="overflow-hidden rounded-3xl border border-[#E1E6EC] bg-white shadow-xs">
        {isLoadingMentees ? (
          <div className="space-y-4 p-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 border-b border-[#E1E6EC]/60 py-3.5 last:border-0"
              >
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
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
                : 'No mentees found in the selected cohort'}
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
          <TableContainer className="rounded-none border-0 shadow-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mentee</TableHead>
                  <TableHead>Cohort</TableHead>
                  <TableHead>Cohort Code</TableHead>
                  <TableHead>Mapped Since</TableHead>
                  <TableHead className="text-right">Quick Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMentees.map((mentee) => (
                  <MenteeTableRow
                    key={mentee.id}
                    mentee={mentee}
                    actions={
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href="/mentor/progress"
                          className={getButtonClassName('outline', 'sm')}
                          title="View Progress Tracker"
                        >
                          Progress
                        </Link>
                        <Link
                          href="/mentor/submissions"
                          className={getButtonClassName('outline', 'sm')}
                          title="View Submission Queue"
                        >
                          Reviews
                        </Link>
                      </div>
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SingleSelectDropdown } from '@/components/ui/SingleSelectDropdown';
import { Span } from '@/components/ui/Typography';
import { useBatchesList, useMentorBatches } from '@/hooks/useBatches';
import { useCourses } from '@/hooks/useCourses';
import { cn } from '@/lib/cn';
import type { PerformanceFilterParams } from '@/services/performance.service';

const GRADE_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'A+', label: 'A+ (90-100%)' },
  { value: 'A', label: 'A (80-89%)' },
  { value: 'B', label: 'B (70-79%)' },
  { value: 'C', label: 'C (60-69%)' },
  { value: 'D', label: 'D (50-59%)' },
  { value: 'F', label: 'F (< 50%)' },
];

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

interface PerformanceFiltersBarProps {
  readonly filters: PerformanceFilterParams;
  readonly onFilterChange: (filters: Partial<PerformanceFilterParams>) => void;
  readonly onExportCsv: () => void;
  readonly isExporting?: boolean;
  readonly onReset: () => void;
  readonly role?: 'SUPER_ADMIN' | 'MENTOR';
}

export function PerformanceFiltersBar({
  filters,
  onFilterChange,
  onExportCsv,
  isExporting = false,
  onReset,
  role = 'SUPER_ADMIN',
}: PerformanceFiltersBarProps) {
  const isMentor = role === 'MENTOR';
  const {
    data: adminBatchesData,
    isLoading: isLoadingAdminBatches,
    error: adminBatchesError,
  } = useBatchesList({ limit: 100 }, { enabled: !isMentor });
  const {
    data: mentorBatchesData,
    isLoading: isLoadingMentorBatches,
    error: mentorBatchesError,
  } = useMentorBatches({ limit: 100 }, { enabled: isMentor });

  const { courses, isLoading: isLoadingCourses, error: coursesError } = useCourses({ limit: 100 });

  const isLoadingBatches = isMentor ? isLoadingMentorBatches : isLoadingAdminBatches;
  const batchesError = isMentor ? mentorBatchesError : adminBatchesError;

  const batchOptions = useMemo(() => {
    const batchList = isMentor ? (mentorBatchesData ?? []) : (adminBatchesData?.items ?? []);
    return [
      {
        value: '',
        label: isLoadingBatches
          ? 'Loading batches...'
          : batchesError
            ? 'Error loading batches'
            : 'All',
      },
      ...batchList.map((b) => ({ value: b.id, label: b.name })),
    ];
  }, [isMentor, mentorBatchesData, adminBatchesData, isLoadingBatches, batchesError]);

  const courseOptions = useMemo(
    () => [
      {
        value: '',
        label: isLoadingCourses
          ? 'Loading courses...'
          : coursesError
            ? 'Error loading courses'
            : 'All',
      },
      ...courses.map((c) => ({ value: c.id, label: c.title })),
    ],
    [courses, isLoadingCourses, coursesError],
  );

  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  const [prevSearch, setPrevSearch] = useState(filters.search);

  if (prevSearch !== filters.search) {
    setPrevSearch(filters.search);
    setSearchInput(filters.search ?? '');
  }

  const onFilterChangeRef = useRef(onFilterChange);
  useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      const current = filters.search?.trim() ?? '';
      if (trimmed !== current) {
        onFilterChangeRef.current({ search: trimmed || undefined, page: 1 });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search]);

  const hasActiveFilters = Boolean(
    (filters.search && filters.search.trim() !== '') ||
    (filters.batchId && filters.batchId !== '') ||
    (filters.courseId && filters.courseId !== '') ||
    (filters.gradeRange && filters.gradeRange !== 'ALL') ||
    (filters.status && filters.status !== ''),
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left/Main Filter Group in one line */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <svg
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#667085]"
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
              type="search"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-10 pl-9 text-xs"
            />
          </div>

          {/* Batch Filter */}
          <div className="w-full sm:w-40 lg:w-44">
            <SingleSelectDropdown
              label="Batch"
              value={filters.batchId ?? ''}
              onChange={(val) => onFilterChange({ batchId: val || undefined, page: 1 })}
              options={batchOptions}
              disabled={isLoadingBatches}
              placeholder="All"
              aria-label="Filter by batch"
              size="sm"
              triggerClassName={cn(
                'h-10 rounded-2xl border-[#E1E6EC] bg-white px-3.5 text-xs font-semibold shadow-2xs hover:border-slate-300 hover:bg-[#F9FAFB]',
                filters.batchId && 'border-blue-300 bg-blue-50/50 text-[#0044D3]',
              )}
              menuClassName="w-full sm:min-w-[200px] rounded-2xl border border-[#E1E6EC] bg-white p-1.5 shadow-xl"
            />
          </div>

          {/* Course Filter */}
          <div className="w-full sm:w-44 lg:w-48">
            <SingleSelectDropdown
              label="Course"
              value={filters.courseId ?? ''}
              onChange={(val) => onFilterChange({ courseId: val || undefined, page: 1 })}
              options={courseOptions}
              disabled={isLoadingCourses}
              placeholder="All"
              aria-label="Filter by course"
              size="sm"
              triggerClassName={cn(
                'h-10 rounded-2xl border-[#E1E6EC] bg-white px-3.5 text-xs font-semibold shadow-2xs hover:border-slate-300 hover:bg-[#F9FAFB]',
                filters.courseId && 'border-blue-300 bg-blue-50/50 text-[#0044D3]',
              )}
              menuClassName="w-full sm:min-w-[200px] rounded-2xl border border-[#E1E6EC] bg-white p-1.5 shadow-xl"
            />
          </div>

          {/* Grade Range Filter */}
          <div className="w-full sm:w-32 lg:w-36">
            <SingleSelectDropdown
              label="Grade"
              value={filters.gradeRange ?? 'ALL'}
              onChange={(val) =>
                onFilterChange({
                  gradeRange: val === 'ALL' ? undefined : val,
                  page: 1,
                })
              }
              options={GRADE_OPTIONS}
              placeholder="All"
              aria-label="Filter by grade"
              size="sm"
              triggerClassName={cn(
                'h-10 rounded-2xl border-[#E1E6EC] bg-white px-3.5 text-xs font-semibold shadow-2xs hover:border-slate-300 hover:bg-[#F9FAFB]',
                filters.gradeRange &&
                  filters.gradeRange !== 'ALL' &&
                  'border-blue-300 bg-blue-50/50 text-[#0044D3]',
              )}
              menuClassName="w-full sm:min-w-[180px] rounded-2xl border border-[#E1E6EC] bg-white p-1.5 shadow-xl"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-36 lg:w-40">
            <SingleSelectDropdown
              label="Status"
              value={filters.status ?? ''}
              onChange={(val) => onFilterChange({ status: val || undefined, page: 1 })}
              options={STATUS_FILTER_OPTIONS}
              placeholder="All"
              aria-label="Filter by status"
              size="sm"
              triggerClassName={cn(
                'h-10 rounded-2xl border-[#E1E6EC] bg-white px-3.5 text-xs font-semibold shadow-2xs hover:border-slate-300 hover:bg-[#F9FAFB]',
                filters.status && 'border-blue-300 bg-blue-50/50 text-[#0044D3]',
              )}
              menuClassName="w-full sm:min-w-[180px] rounded-2xl border border-[#E1E6EC] bg-white p-1.5 shadow-xl"
            />
          </div>

          {/* Clear Filter icon button - only displayed when any filter is changed from All */}
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onReset}
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

        {/* Right: Export CSV Button */}
        <div className="shrink-0">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onExportCsv}
            disabled={isExporting}
            className="flex h-10 items-center gap-1.5 text-xs font-semibold"
          >
            {isExporting ? (
              <Span>Exporting...</Span>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <Span>Export CSV</Span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

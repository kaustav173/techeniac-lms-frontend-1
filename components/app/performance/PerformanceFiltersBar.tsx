'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MultiSelectDropdown, type MultiSelectOption } from '@/components/ui/MultiSelectDropdown';
import { Span } from '@/components/ui/Typography';
import { useInfiniteBatches } from '@/hooks/useBatches';
import { useInfiniteCourses } from '@/hooks/useCourses';
import type { PerformanceFilterParams } from '@/services/performance.service';

const STATUS_FILTER_OPTIONS: readonly MultiSelectOption[] = [
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

function resolveSelectedOptions(
  vals: readonly string[],
  options: readonly MultiSelectOption[],
): MultiSelectOption[] {
  return vals.map((val) => options.find((o) => o.value === val) ?? { value: val, label: val });
}

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
  const portalType = role === 'MENTOR' ? 'mentor' : 'admin';

  // Search state for batches and courses
  const [batchSearch, setBatchSearch] = useState<string>('');
  const [courseSearch, setCourseSearch] = useState<string>('');
  const [selectedBatchOptions, setSelectedBatchOptions] = useState<MultiSelectOption[]>([]);
  const [selectedCourseOptions, setSelectedCourseOptions] = useState<MultiSelectOption[]>([]);

  // 1. Fetch Batches for Filter Dropdown with Infinite Scroll & Server Search (10 items per page)
  const {
    data: batchesInfiniteData,
    fetchNextPage: fetchNextBatches,
    hasNextPage: hasNextBatches,
    isFetching: isFetchingBatches,
    isFetchingNextPage: isFetchingNextBatches,
  } = useInfiniteBatches(10, batchSearch, portalType);

  const batches = useMemo(
    () => batchesInfiniteData?.pages.flatMap((p) => p.items) ?? [],
    [batchesInfiniteData],
  );

  const selectedBatchValues: string[] = useMemo(() => {
    if (!filters.batchId) return [];
    if (Array.isArray(filters.batchId)) return filters.batchId;
    return filters.batchId.split(',').filter(Boolean);
  }, [filters.batchId]);

  const batchOptions: readonly MultiSelectOption[] = useMemo(() => {
    const optionsMap = new Map<string, MultiSelectOption>();
    for (const b of batches) {
      optionsMap.set(b.id, {
        value: b.id,
        label: b.code ? `${b.name} (${b.code})` : b.name,
      });
    }
    for (const opt of selectedBatchOptions) {
      if (!optionsMap.has(opt.value)) {
        optionsMap.set(opt.value, opt);
      }
    }
    for (const id of selectedBatchValues) {
      if (!optionsMap.has(id)) {
        optionsMap.set(id, { value: id, label: id });
      }
    }
    return Array.from(optionsMap.values());
  }, [batches, selectedBatchOptions, selectedBatchValues]);

  const handleBatchScrollEnd = useCallback(() => {
    if (hasNextBatches && !isFetchingNextBatches) {
      void fetchNextBatches();
    }
  }, [hasNextBatches, isFetchingNextBatches, fetchNextBatches]);

  const handleBatchChange = (vals: readonly string[]) => {
    setSelectedBatchOptions(resolveSelectedOptions(vals, batchOptions));
    onFilterChange({
      batchId: vals.length > 0 ? (vals as string[]) : undefined,
      page: 1,
    });
  };

  // 2. Fetch Courses for Filter Dropdown with Infinite Scroll & Server Search (10 items per page)
  const {
    data: coursesInfiniteData,
    fetchNextPage: fetchNextCourses,
    hasNextPage: hasNextCourses,
    isFetching: isFetchingCourses,
    isFetchingNextPage: isFetchingNextCourses,
  } = useInfiniteCourses(10, courseSearch);

  const courses = useMemo(
    () => coursesInfiniteData?.pages.flatMap((p) => p.courses) ?? [],
    [coursesInfiniteData],
  );

  const selectedCourseValues: string[] = useMemo(() => {
    if (!filters.courseId) return [];
    if (Array.isArray(filters.courseId)) return filters.courseId;
    return filters.courseId.split(',').filter(Boolean);
  }, [filters.courseId]);

  const courseOptions: readonly MultiSelectOption[] = useMemo(() => {
    const optionsMap = new Map<string, MultiSelectOption>();
    for (const c of courses) {
      optionsMap.set(c.id, { value: c.id, label: c.title });
    }
    for (const opt of selectedCourseOptions) {
      if (!optionsMap.has(opt.value)) {
        optionsMap.set(opt.value, opt);
      }
    }
    for (const id of selectedCourseValues) {
      if (!optionsMap.has(id)) {
        optionsMap.set(id, { value: id, label: id });
      }
    }
    return Array.from(optionsMap.values());
  }, [courses, selectedCourseOptions, selectedCourseValues]);

  const handleCourseScrollEnd = useCallback(() => {
    if (hasNextCourses && !isFetchingNextCourses) {
      void fetchNextCourses();
    }
  }, [hasNextCourses, isFetchingNextCourses, fetchNextCourses]);

  const handleCourseChange = (vals: readonly string[]) => {
    setSelectedCourseOptions(resolveSelectedOptions(vals, courseOptions));
    onFilterChange({
      courseId: vals.length > 0 ? (vals as string[]) : undefined,
      page: 1,
    });
  };

  // 3. Status filter
  const selectedStatusValues: string[] = useMemo(() => {
    if (!filters.status) return [];
    if (Array.isArray(filters.status)) return filters.status;
    return filters.status.split(',').filter(Boolean);
  }, [filters.status]);

  const handleStatusChange = (vals: readonly string[]) => {
    onFilterChange({
      status: vals.length > 0 ? (vals as string[]) : undefined,
      page: 1,
    });
  };

  // 4. Text Search input
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
    selectedBatchValues.length > 0 ||
    selectedCourseValues.length > 0 ||
    selectedStatusValues.length > 0 ||
    batchSearch.trim() ||
    courseSearch.trim(),
  );

  const handleResetAll = () => {
    setSearchInput('');
    setBatchSearch('');
    setCourseSearch('');
    setSelectedBatchOptions([]);
    setSelectedCourseOptions([]);
    onReset();
  };

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Filters Toolbar */}
      <div className="flex flex-1 flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
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
            type="search"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-[49px] rounded-2xl border-[#E1E6EC] pr-4 pl-10 text-sm font-medium shadow-2xs hover:border-slate-300 focus:border-[#0044D3]"
          />
        </div>

        {/* Batch Filter (Multi-select, 10 items infinite scroll, server search) */}
        <div className="w-full sm:w-[169px]">
          <MultiSelectDropdown
            label="Batch"
            options={batchOptions}
            selectedValues={selectedBatchValues}
            onChange={handleBatchChange}
            singleSelect={false}
            align="left"
            className="w-full"
            onScrollEnd={handleBatchScrollEnd}
            onSearch={setBatchSearch}
            isSearching={isFetchingBatches && !isFetchingNextBatches && Boolean(batchSearch.trim())}
            isLoadingMore={isFetchingNextBatches}
            buttonClassName="h-[48px] rounded-2xl border-[#E1E6EC] shadow-2xs"
          />
        </div>

        {/* Course Filter (Multi-select, 10 items infinite scroll, server search) */}
        <div className="w-full sm:w-[158px]">
          <MultiSelectDropdown
            label="Course"
            options={courseOptions}
            selectedValues={selectedCourseValues}
            onChange={handleCourseChange}
            singleSelect={false}
            align="left"
            className="w-full"
            onScrollEnd={handleCourseScrollEnd}
            onSearch={setCourseSearch}
            isSearching={
              isFetchingCourses && !isFetchingNextCourses && Boolean(courseSearch.trim())
            }
            isLoadingMore={isFetchingNextCourses}
            buttonClassName="h-[48px] rounded-2xl border-[#E1E6EC] shadow-2xs"
          />
        </div>

        {/* Status Filter (Multi-select) */}
        <div className="w-full sm:w-[168px]">
          <MultiSelectDropdown
            label="Status"
            options={STATUS_FILTER_OPTIONS}
            selectedValues={selectedStatusValues}
            onChange={handleStatusChange}
            singleSelect={false}
            align="right"
            className="w-full"
            buttonClassName="h-[48px] rounded-2xl border-[#E1E6EC] shadow-2xs"
          />
        </div>

        {/* Clear Filter icon button */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetAll}
            title="Clear all filters"
            aria-label="Clear all filters"
            className="h-10 w-10 shrink-0 rounded-full border border-red-200/60 bg-[#FEE2E2] p-0 text-[#DC2626] transition-all hover:bg-[#FCD2D2] hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-400"
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
        )}
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
  );
}

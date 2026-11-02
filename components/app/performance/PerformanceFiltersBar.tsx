import React from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Span } from '@/components/ui/Typography';
import { useBatchesList, useMentorBatches } from '@/hooks/useBatches';
import { useCourses } from '@/hooks/useCourses';
import type { PerformanceFilterParams } from '@/services/performance.service';

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

  const batches = isMentor ? (mentorBatchesData ?? []) : (adminBatchesData?.items ?? []);
  const isLoadingBatches = isMentor ? isLoadingMentorBatches : isLoadingAdminBatches;
  const batchesError = isMentor ? mentorBatchesError : adminBatchesError;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
      {/* Top Row: Search & Export */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 sm:max-w-md">
          <Input
            type="search"
            placeholder="Search mentee by name or email..."
            value={filters.search ?? ''}
            onChange={(e) => onFilterChange({ search: e.target.value || undefined, page: 1 })}
            className="h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onReset} className="text-xs">
            Reset Filters
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onExportCsv}
            disabled={isExporting}
            className="flex items-center gap-1.5 text-xs font-semibold"
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

      {/* Bottom Row: Dropdown Selectors & Sorting */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {/* Batch Filter */}
        <div className="flex flex-col gap-1">
          <Span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Batch
          </Span>
          <Select
            value={filters.batchId ?? ''}
            onChange={(e) => onFilterChange({ batchId: e.target.value || undefined, page: 1 })}
            className="h-9 text-xs"
            disabled={isLoadingBatches}
          >
            <option value="">
              {isLoadingBatches
                ? 'Loading batches...'
                : batchesError
                  ? 'Error loading batches'
                  : 'All Batches'}
            </option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Course Filter */}
        <div className="flex flex-col gap-1">
          <Span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Course
          </Span>
          <Select
            value={filters.courseId ?? ''}
            onChange={(e) => onFilterChange({ courseId: e.target.value || undefined, page: 1 })}
            className="h-9 text-xs"
            disabled={isLoadingCourses}
          >
            <option value="">
              {isLoadingCourses
                ? 'Loading courses...'
                : coursesError
                  ? 'Error loading courses'
                  : 'All Courses'}
            </option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>
        </div>

        {/* Grade Range Filter */}
        <div className="flex flex-col gap-1">
          <Span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Grade
          </Span>
          <Select
            value={filters.gradeRange ?? 'ALL'}
            onChange={(e) =>
              onFilterChange({
                gradeRange: e.target.value === 'ALL' ? undefined : e.target.value,
                page: 1,
              })
            }
            className="h-9 text-xs"
          >
            <option value="ALL">All Grades</option>
            <option value="A+">A+ (90-100%)</option>
            <option value="A">A (80-89%)</option>
            <option value="B">B (70-79%)</option>
            <option value="C">C (60-69%)</option>
            <option value="D">D (50-59%)</option>
            <option value="F">F (&lt; 50%)</option>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1">
          <Span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Status
          </Span>
          <Select
            value={filters.status ?? ''}
            onChange={(e) => onFilterChange({ status: e.target.value || undefined, page: 1 })}
            className="h-9 text-xs"
          >
            <option value="">All Statuses</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </Select>
        </div>

        {/* Sort By Filter */}
        <div className="flex flex-col gap-1">
          <Span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Sort By
          </Span>
          <Select
            value={filters.sortBy ?? 'name'}
            onChange={(e) =>
              onFilterChange({
                sortBy: e.target.value as PerformanceFilterParams['sortBy'],
                page: 1,
              })
            }
            className="h-9 text-xs"
          >
            <option value="name">Mentee Name</option>
            <option value="averageMarks">Average Marks</option>
            <option value="completionPercentage">Completion %</option>
            <option value="onTimeRate">On-Time Rate</option>
            <option value="overdueCount">Overdue Items</option>
          </Select>
        </div>

        {/* Sort Order Toggle */}
        <div className="flex flex-col gap-1">
          <Span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Order
          </Span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onFilterChange({
                sortOrder: filters.sortOrder === 'ASC' ? 'DESC' : 'ASC',
                page: 1,
              })
            }
            className="h-9 text-xs"
          >
            {filters.sortOrder === 'ASC' ? '▲ Ascending' : '▼ Descending'}
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';

import type { PortalNavConfig } from '@/components/app/navigation/portal-nav.config';
import { GradeDistributionChart } from '@/components/app/performance/GradeDistributionChart';
import { PerformanceFiltersBar } from '@/components/app/performance/PerformanceFiltersBar';
import { PerformanceTable } from '@/components/app/performance/PerformanceTable';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { Span } from '@/components/ui/Typography';
import { useExportPerformanceMutation, usePerformanceQuery } from '@/hooks/usePerformance';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { cn } from '@/lib/cn';
import type { PerformanceFilterParams } from '@/services/performance.service';

interface PerformanceDashboardShellProps {
  readonly navConfig: PortalNavConfig;
  readonly role: 'SUPER_ADMIN' | 'MENTOR';
  readonly title: string;
  readonly description?: string | undefined;
}

export function PerformanceDashboardShell({
  navConfig,
  role,
  title,
}: PerformanceDashboardShellProps) {
  useRoleGuard(role);

  const [activeView, setActiveView] = useState<'chart' | 'table'>('table');

  const [filters, setFilters] = useState<PerformanceFilterParams>({
    page: 1,
    limit: 10,
    sortBy: undefined,
    sortOrder: undefined,
  });

  const { data, isLoading, isFetching, isError, error, refetch } = usePerformanceQuery(filters);
  const exportMutation = useExportPerformanceMutation();

  const handleFilterChange = (updated: Partial<PerformanceFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      sortBy: undefined,
      sortOrder: undefined,
    });
  };

  const handleExportCsv = () => {
    exportMutation.mutate(filters);
  };

  const handleRetry = () => {
    void refetch();
  };

  const totalMentees = data?.pagination?.total || (data?.mentees?.length ?? 0);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header title={title} {...navConfig} />
      <DashboardContent className="space-y-6">
        <div className="flex flex-col gap-6">
          {/* View Toggle Tabs */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div
              role="tablist"
              aria-label="Performance views"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-2xs"
            >
              <button
                type="button"
                role="tab"
                id="tab-table"
                aria-controls="panel-table"
                aria-selected={activeView === 'table'}
                tabIndex={activeView === 'table' ? 0 : -1}
                onClick={() => setActiveView('table')}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#0044D3] focus-visible:outline-none sm:text-sm',
                  activeView === 'table'
                    ? 'bg-[#0044D3] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <Span>Mentee Table</Span>
                {totalMentees > 0 && (
                  <Span
                    className={cn(
                      'ml-1 rounded-full px-2 py-0.5 text-xs leading-none font-bold',
                      activeView === 'table'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-700',
                    )}
                  >
                    {totalMentees}
                  </Span>
                )}
              </button>

              <button
                type="button"
                role="tab"
                id="tab-chart"
                aria-controls="panel-chart"
                aria-selected={activeView === 'chart'}
                tabIndex={activeView === 'chart' ? 0 : -1}
                onClick={() => setActiveView('chart')}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#0044D3] focus-visible:outline-none sm:text-sm',
                  activeView === 'chart'
                    ? 'bg-[#0044D3] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                  />
                </svg>
                <Span>Grade Distribution</Span>
              </button>
            </div>
          </div>

          {/* Tab Panel: Grade Scale Distribution Chart */}
          {activeView === 'chart' && (
            <div id="panel-chart" role="tabpanel" aria-labelledby="tab-chart">
              <GradeDistributionChart
                distribution={data?.metrics?.gradeDistribution}
                isLoading={isLoading}
                isError={isError}
                error={error}
                onRetry={handleRetry}
              />
            </div>
          )}

          {/* Tab Panel: Paginated Mentees Table & Filters */}
          {activeView === 'table' && (
            <div
              id="panel-table"
              role="tabpanel"
              aria-labelledby="tab-table"
              className="flex flex-col gap-6"
            >
              {/* Filtering Toolbar */}
              <PerformanceFiltersBar
                filters={filters}
                onFilterChange={handleFilterChange}
                onExportCsv={handleExportCsv}
                isExporting={exportMutation.isPending}
                onReset={handleResetFilters}
                role={role}
              />

              {/* Paginated Mentees Table */}
              <PerformanceTable
                mentees={data?.mentees ?? []}
                total={totalMentees}
                page={data?.pagination?.page ?? filters.page ?? 1}
                limit={data?.pagination?.limit ?? filters.limit ?? 10}
                totalPages={
                  data?.pagination?.totalPages ||
                  Math.ceil(totalMentees / (data?.pagination?.limit ?? filters.limit ?? 10)) ||
                  1
                }
                sortBy={filters.sortBy}
                sortOrder={filters.sortOrder}
                onSortChange={(sortBy, sortOrder) =>
                  handleFilterChange({ sortBy, sortOrder, page: 1 })
                }
                onPageChange={(page) => handleFilterChange({ page })}
                onLimitChange={(limit) => handleFilterChange({ limit, page: 1 })}
                isLoading={isLoading}
                isFetching={isFetching}
                isError={isError}
                error={error}
                onRetry={handleRetry}
              />
            </div>
          )}
        </div>
      </DashboardContent>
    </div>
  );
}

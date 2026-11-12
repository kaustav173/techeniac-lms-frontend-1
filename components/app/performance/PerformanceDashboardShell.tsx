'use client';

import React, { useCallback, useState } from 'react';

import type { PortalNavConfig } from '@/components/app/navigation/portal-nav.config';
import { PerformanceFiltersBar } from '@/components/app/performance/PerformanceFiltersBar';
import { PerformanceTable } from '@/components/app/performance/PerformanceTable';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { useExportPerformanceMutation, usePerformanceQuery } from '@/hooks/usePerformance';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import type { PerformanceFilterParams } from '@/services/performance.service';

interface PerformanceDashboardShellProps {
  readonly navConfig: PortalNavConfig;
  readonly role: 'SUPER_ADMIN' | 'MENTOR';
  readonly title: string;
  readonly description?: string | undefined;
  readonly showMetricsCards?: boolean | undefined;
}

export function PerformanceDashboardShell({
  navConfig,
  role,
  title,
}: PerformanceDashboardShellProps) {
  useRoleGuard(role);

  const [filters, setFilters] = useState<PerformanceFilterParams>({
    page: 1,
    limit: 10,
    sortBy: undefined,
    sortOrder: undefined,
  });

  const { data, isLoading, isFetching, isError, error, refetch } = usePerformanceQuery(filters);
  const exportMutation = useExportPerformanceMutation();

  const handleFilterChange = useCallback((updated: Partial<PerformanceFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  }, []);

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
            onSortChange={(sortBy, sortOrder) => handleFilterChange({ sortBy, sortOrder, page: 1 })}
            onPageChange={(page) => handleFilterChange({ page })}
            onLimitChange={(limit) => handleFilterChange({ limit, page: 1 })}
            isLoading={isLoading}
            isFetching={isFetching}
            isError={isError}
            error={error}
            onRetry={handleRetry}
          />
        </div>
      </DashboardContent>
    </div>
  );
}

'use client';

import React, { useState } from 'react';

import type { PortalNavConfig } from '@/components/app/navigation/portal-nav.config';
import { GradeDistributionChart } from '@/components/app/performance/GradeDistributionChart';
import { PerformanceFiltersBar } from '@/components/app/performance/PerformanceFiltersBar';
import { PerformanceMetricsCards } from '@/components/app/performance/PerformanceMetricsCards';
import { PerformanceTable } from '@/components/app/performance/PerformanceTable';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { PageTitle, Span, SubText } from '@/components/ui/Typography';
import { useExportPerformanceMutation, usePerformanceQuery } from '@/hooks/usePerformance';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import type { PerformanceFilterParams } from '@/services/performance.service';

interface PerformanceDashboardShellProps {
  readonly navConfig: PortalNavConfig;
  readonly role: 'SUPER_ADMIN' | 'MENTOR';
  readonly title: string;
  readonly description: string;
}

export function PerformanceDashboardShell({
  navConfig,
  role,
  title,
  description,
}: PerformanceDashboardShellProps) {
  useRoleGuard(role);

  const [filters, setFilters] = useState<PerformanceFilterParams>({
    page: 1,
    limit: 10,
    sortBy: 'name',
    sortOrder: 'DESC',
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
      sortBy: 'name',
      sortOrder: 'DESC',
    });
  };

  const handleExportCsv = () => {
    exportMutation.mutate(filters);
  };

  const handleRetry = () => {
    void refetch();
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header {...navConfig} />
      <DashboardContent className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <PageTitle>{title}</PageTitle>
            <SubText className="mt-1">{description}</SubText>
          </div>
          {isFetching && !isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
              <Span>Updating...</Span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {/* KPI Metrics Summary Cards */}
          <PerformanceMetricsCards
            metrics={data?.metrics}
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={handleRetry}
          />

          {/* Grade Scale Distribution Chart */}
          <GradeDistributionChart
            distribution={data?.metrics?.gradeDistribution}
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={handleRetry}
          />

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
            total={data?.pagination?.total ?? 0}
            page={data?.pagination?.page ?? 1}
            limit={data?.pagination?.limit ?? 10}
            totalPages={data?.pagination?.totalPages ?? 1}
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

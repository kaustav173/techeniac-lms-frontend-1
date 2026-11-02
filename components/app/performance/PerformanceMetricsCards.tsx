import React from 'react';

import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { H3, P, Span } from '@/components/ui/Typography';
import type { PerformanceOverviewMetrics } from '@/services/performance.service';

interface PerformanceMetricsCardsProps {
  readonly metrics: PerformanceOverviewMetrics | undefined;
  readonly isLoading?: boolean;
  readonly isError?: boolean;
  readonly error?: unknown;
  readonly onRetry?: () => void;
}

export function PerformanceMetricsCards({
  metrics,
  isLoading = false,
  isError = false,
  error,
  onRetry,
}: PerformanceMetricsCardsProps) {
  if (isError) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <ErrorMessage error={error} onRetry={onRetry} />
      </div>
    );
  }

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-3xl border border-slate-200 bg-white p-5 shadow-xs"
          >
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="mt-3 h-8 w-16 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-32 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Average Marks */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
        <Span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
          Average Score
        </Span>
        <div className="mt-2 flex items-baseline gap-2">
          <H3 className="text-3xl font-bold tracking-tight text-slate-900">
            {metrics.averageMarks > 0 ? metrics.averageMarks : '—'}
          </H3>
          <Span className="text-xs text-slate-400">/ 100 max</Span>
        </div>
        <P className="mt-1 text-xs text-slate-500">
          Across {metrics.totalSubmissions} graded submission
          {metrics.totalSubmissions === 1 ? '' : 's'}
        </P>
      </div>

      {/* 2. Completion Percentage */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
        <Span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
          Curriculum Completion
        </Span>
        <div className="mt-2 flex items-baseline gap-2">
          <H3 className="text-3xl font-bold tracking-tight text-blue-600">
            {metrics.completionPercentage}%
          </H3>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, metrics.completionPercentage))}%` }}
          />
        </div>
      </div>

      {/* 3. On-Time Submission Rate */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
        <Span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
          On-Time Submission Rate
        </Span>
        <div className="mt-2 flex items-baseline gap-2">
          <H3 className="text-3xl font-bold tracking-tight text-emerald-600">
            {metrics.onTimeRate}%
          </H3>
        </div>
        <P className="mt-1 text-xs text-slate-500">Submissions delivered before deadline</P>
      </div>

      {/* 4. Overdue Items Count */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
        <Span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
          Overdue Tasks
        </Span>
        <div className="mt-2 flex items-baseline gap-2">
          <H3
            className={`text-3xl font-bold tracking-tight ${
              metrics.overdueCount > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {metrics.overdueCount}
          </H3>
        </div>
        <P className="mt-1 text-xs text-slate-500">
          {metrics.overdueCount === 0
            ? 'All deadlines are on track'
            : 'Allocation or topic deadlines past due'}
        </P>
      </div>
    </div>
  );
}

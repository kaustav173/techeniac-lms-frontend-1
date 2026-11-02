import React from 'react';

import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { H3, P, Span } from '@/components/ui/Typography';
import type { PerformanceOverviewMetrics } from '@/services/performance.service';

interface GradeDistributionChartProps {
  readonly distribution: PerformanceOverviewMetrics['gradeDistribution'] | undefined;
  readonly isLoading?: boolean;
  readonly isError?: boolean;
  readonly error?: unknown;
  readonly onRetry?: () => void;
}

const GRADE_COLORS: Record<'A+' | 'A' | 'B' | 'C' | 'D' | 'F', { bar: string; badge: string }> = {
  'A+': { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  A: { bar: 'bg-teal-500', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
  B: { bar: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  C: { bar: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  D: { bar: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  F: { bar: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export function GradeDistributionChart({
  distribution,
  isLoading = false,
  isError = false,
  error,
  onRetry,
}: GradeDistributionChartProps) {
  if (isError) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
        <ErrorMessage error={error} onRetry={onRetry} />
      </div>
    );
  }

  if (isLoading || !distribution) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="h-5 w-48 rounded bg-slate-200" />
        <div className="mt-4 flex flex-col gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-4 w-full rounded bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  const grades: Array<'A+' | 'A' | 'B' | 'C' | 'D' | 'F'> = ['A+', 'A', 'B', 'C', 'D', 'F'];
  const totalCount = grades.reduce((sum, g) => sum + (distribution[g]?.count ?? 0), 0);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <H3 className="text-sm font-bold text-slate-900">Grade Distribution</H3>
          <P className="text-xs text-slate-500">
            Letter grade scale distribution across submissions
          </P>
        </div>
        <Span className="text-xs text-slate-500">
          {totalCount} Graded Submission{totalCount === 1 ? '' : 's'}
        </Span>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {grades.map((grade) => {
          const item = distribution[grade] ?? { count: 0, percentage: 0 };
          const styling = GRADE_COLORS[grade];

          return (
            <div key={grade} className="flex items-center gap-3">
              <Span
                className={`w-9 rounded border py-0.5 text-center text-xs font-bold ${styling.badge}`}
              >
                {grade}
              </Span>

              <div className="relative h-3.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${styling.bar}`}
                  style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                />
              </div>

              <div className="flex w-24 items-center justify-end gap-2 text-xs">
                <Span className="font-bold text-slate-800">{item.count}</Span>
                <Span className="text-slate-400">({item.percentage}%)</Span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

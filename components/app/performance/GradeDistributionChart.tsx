import React from 'react';

import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { H3, Span } from '@/components/ui/Typography';
import { cn } from '@/lib/cn';
import type { PerformanceOverviewMetrics } from '@/services/performance.service';

interface GradeDistributionChartProps {
  readonly distribution: PerformanceOverviewMetrics['gradeDistribution'] | undefined;
  readonly isLoading?: boolean;
  readonly isError?: boolean;
  readonly error?: unknown;
  readonly onRetry?: () => void;
}

const GRADE_CONFIG: Record<
  'A+' | 'A' | 'B' | 'C' | 'D' | 'F',
  { color: string; hex: string; badge: string; label: string; range: string }
> = {
  'A+': {
    color: 'bg-emerald-500',
    hex: '#10B981',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'Outstanding',
    range: '90-100%',
  },
  A: {
    color: 'bg-teal-500',
    hex: '#14B8A6',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
    label: 'Excellent',
    range: '80-89%',
  },
  B: {
    color: 'bg-blue-500',
    hex: '#3B82F6',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    label: 'Good',
    range: '70-79%',
  },
  C: {
    color: 'bg-amber-500',
    hex: '#F59E0B',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    label: 'Average',
    range: '60-69%',
  },
  D: {
    color: 'bg-orange-500',
    hex: '#F97316',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    label: 'Passing',
    range: '50-59%',
  },
  F: {
    color: 'bg-rose-500',
    hex: '#EF4444',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    label: 'Failing',
    range: '<50%',
  },
};

const RADIUS = 60;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function GradeDistributionChart({
  distribution,
  isLoading = false,
  isError = false,
  error,
  onRetry,
}: GradeDistributionChartProps) {
  if (isError) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <ErrorMessage error={error} onRetry={onRetry} />
      </div>
    );
  }

  if (isLoading || !distribution) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-2">
            <div className="h-5 w-44 animate-pulse rounded-md bg-slate-200" />
            <div className="h-3 w-64 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-7 w-28 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="mt-6 flex flex-col items-center gap-8 md:flex-row">
          <div className="h-44 w-44 shrink-0 animate-pulse rounded-full border-8 border-slate-100" />
          <div className="grid w-full flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl border border-slate-100 bg-slate-50"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const grades: Array<'A+' | 'A' | 'B' | 'C' | 'D' | 'F'> = ['A+', 'A', 'B', 'C', 'D', 'F'];
  const totalCount = grades.reduce((sum, g) => sum + (distribution[g]?.count ?? 0), 0);

  // Compute donut segments
  let cumulativeOffset = 0;
  const segments = grades.map((grade) => {
    const item = distribution[grade] ?? { count: 0, percentage: 0 };
    const config = GRADE_CONFIG[grade];
    const segmentLength = (item.percentage / 100) * CIRCUMFERENCE;
    const strokeDashoffset = -cumulativeOffset;
    if (item.percentage > 0) {
      cumulativeOffset += segmentLength;
    }
    return {
      grade,
      item,
      config,
      segmentLength,
      strokeDashoffset,
    };
  });

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <H3 className="text-base font-bold text-slate-900">Grade Distribution</H3>
        </div>
        <div className="flex items-center gap-2">
          <Span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            <Span className="h-2 w-2 rounded-full bg-blue-600" />
            {totalCount} Graded Submissions
          </Span>
        </div>
      </div>

      {/* Donut Chart & Breakdown Legend Layout */}
      <div className="mt-6 flex flex-col items-center justify-between gap-8 md:flex-row md:items-center">
        {/* Left: Interactive SVG Donut Chart */}
        <div className="relative flex h-48 w-48 shrink-0 items-center justify-center">
          <svg
            className="h-full w-full"
            viewBox="0 0 160 160"
            role="img"
            aria-label={`Donut chart showing grade distribution across ${totalCount} submissions`}
          >
            {/* Background Base Ring */}
            <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="#F1F5F9" strokeWidth="16" />

            {/* Rotated Segment Group (-90deg to start at 12 o'clock) */}
            <g transform="rotate(-90 80 80)">
              {totalCount > 0 &&
                segments.map(({ grade, item, config, segmentLength, strokeDashoffset }) => {
                  if (item.percentage <= 0) return null;
                  return (
                    <circle
                      key={grade}
                      cx="80"
                      cy="80"
                      r={RADIUS}
                      fill="none"
                      stroke={config.hex}
                      strokeWidth="16"
                      strokeDasharray={`${segmentLength} ${CIRCUMFERENCE}`}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-700 ease-out"
                    />
                  );
                })}
            </g>

            {/* Donut Center Counter - Pure SVG, Perfectly Scaled with Zero Overlap */}
            <text
              x="80"
              y="74"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-slate-900"
              style={{ fontSize: '28px', fontWeight: 800 }}
            >
              {totalCount}
            </text>
            <text
              x="80"
              y="94"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-slate-400 font-bold tracking-wider uppercase"
              style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em' }}
            >
              Total Graded
            </text>
          </svg>
        </div>

        {/* Right: Modern Grade Cards Legend */}
        <div className="grid w-full flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
          {grades.map((grade) => {
            const item = distribution[grade] ?? { count: 0, percentage: 0 };
            const config = GRADE_CONFIG[grade];
            const hasData = item.count > 0;

            return (
              <div
                key={grade}
                className={cn(
                  'flex items-center justify-between rounded-2xl border p-3.5 transition-all duration-200',
                  hasData
                    ? 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50 hover:shadow-xs'
                    : 'border-slate-100 bg-slate-50/40 opacity-60',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Span
                    className={cn(
                      'inline-flex h-7 min-w-8 items-center justify-center rounded-lg border px-1.5 text-xs font-bold',
                      config.badge,
                    )}
                  >
                    {grade}
                  </Span>
                  <div className="flex flex-col">
                    <Span className="text-xs font-semibold text-slate-800">{config.label}</Span>
                    <Span className="text-[10px] text-slate-400">{config.range}</Span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <Span className="text-base font-bold text-slate-900">{item.count}</Span>
                  <Span className="text-2xs font-medium text-slate-500">{item.percentage}%</Span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

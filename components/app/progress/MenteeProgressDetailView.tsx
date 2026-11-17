'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';

import {
  ADMIN_PROGRESS_NAV,
  MENTOR_PROGRESS_NAV,
} from '@/components/app/navigation/portal-nav.config';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Skeleton } from '@/components/ui/Skeleton';
import { H1, H4, P, Span } from '@/components/ui/Typography';
import {
  type TopicProgressItem,
  useAllocationProgress,
  useUpdateTopicDeadlineMutation,
} from '@/hooks/useProgress';
import { formatDateDDMMYY, toISTDateInputValue } from '@/lib/date';

interface MenteeProgressDetailViewProps {
  readonly allocationId: string;
  readonly portalType?: 'mentor' | 'admin';
}

export function MenteeProgressDetailSkeleton({
  portalType = 'admin',
}: {
  readonly portalType?: 'mentor' | 'admin';
}) {
  const navConfig = portalType === 'mentor' ? MENTOR_PROGRESS_NAV : ADMIN_PROGRESS_NAV;
  const backHref = portalType === 'mentor' ? '/mentor/progress' : '/admin/progress';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
      <Header {...navConfig} />
      <DashboardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>Back to Progress</span>
            </Link>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </DashboardContent>
    </div>
  );
}

export function MenteeProgressDetailView({
  allocationId,
  portalType = 'admin',
}: MenteeProgressDetailViewProps) {
  const navConfig = portalType === 'mentor' ? MENTOR_PROGRESS_NAV : ADMIN_PROGRESS_NAV;
  const backHref = portalType === 'mentor' ? '/mentor/progress' : '/admin/progress';

  // 1. Fetch detailed allocation progress
  const {
    data: progressData,
    isLoading,
    isError,
    error,
    refetch,
  } = useAllocationProgress(allocationId);

  const allocation = progressData?.allocation;
  const topics = useMemo(() => progressData?.topics ?? [], [progressData]);

  // Derived metrics
  const totalActiveTopics = topics.length;
  const completedTopicsCount = useMemo(
    () => topics.filter((t) => t.status === 'COMPLETED').length,
    [topics],
  );
  // Clean batch name (e.g. remove trailing date/year like "-December-2026")
  const rawBatchName = allocation?.batchName;
  const displayBatchName = rawBatchName
    ? rawBatchName.replace(/\s*[-–—]\s*(?:[A-Za-z]+\s*[-–—\s]*)?\d{4}.*$/i, '').trim() ||
      rawBatchName
    : '';

  const allocationStartDate = allocation?.startDate;
  const allocationDueDate = allocation?.dueDate;
  const minDate = allocationStartDate ? toISTDateInputValue(allocationStartDate) : '';
  const maxDate = allocationDueDate ? toISTDateInputValue(allocationDueDate) : '';

  // Inline topic deadline editor state
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [inlineDeadline, setInlineDeadline] = useState<string>('');
  const [inlineError, setInlineError] = useState<string | null>(null);

  const updateDeadlineMutation = useUpdateTopicDeadlineMutation();

  const handleStartEditDeadline = (topic: TopicProgressItem) => {
    setEditingTopicId(topic.topicId);
    setInlineError(null);
    if (topic.deadline) {
      setInlineDeadline(toISTDateInputValue(topic.deadline));
    } else if (maxDate) {
      setInlineDeadline(maxDate);
    } else {
      setInlineDeadline('');
    }
  };

  const handleCancelEditDeadline = () => {
    setEditingTopicId(null);
    setInlineDeadline('');
    setInlineError(null);
  };

  const handleSaveInlineDeadline = async (topicId: string) => {
    if (!allocationId || !progressData) return;
    setInlineError(null);

    if (!inlineDeadline) {
      setInlineError('Please select a target deadline.');
      return;
    }

    if (minDate && inlineDeadline < minDate) {
      setInlineError(`Deadline cannot be before allocation start (${formatDateDDMMYY(minDate)}).`);
      return;
    }

    if (maxDate && inlineDeadline > maxDate) {
      setInlineError(
        `Deadline cannot be after allocation due date (${formatDateDDMMYY(maxDate)}).`,
      );
      return;
    }

    try {
      // Send as ISO 8601 string clamped to allocation boundaries (IST end-of-day: 23:59:59+05:30)
      const targetTime = new Date(`${inlineDeadline}T23:59:59+05:30`).getTime();
      const dueTime = allocationDueDate ? new Date(allocationDueDate).getTime() : Infinity;
      const startTime = allocationStartDate ? new Date(allocationStartDate).getTime() : -Infinity;

      const isoDeadline =
        targetTime > dueTime && allocationDueDate
          ? allocationDueDate
          : targetTime < startTime && allocationStartDate
            ? allocationStartDate
            : new Date(targetTime).toISOString();

      await updateDeadlineMutation.mutateAsync({
        allocationId,
        topicId,
        payload: {
          deadline: isoDeadline,
        },
      });
      setEditingTopicId(null);
      setInlineDeadline('');
      setInlineError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update topic deadline';
      setInlineError(msg);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
      <Header {...navConfig} />

      <DashboardContent>
        <div className="space-y-6">
          {/* Top Breadcrumb & Action Bar */}
          <div className="flex items-center justify-between">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>Back to Progress</span>
            </Link>
          </div>

          {/* Loading Skeleton State */}
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-14 w-full rounded-2xl" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
              </div>
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-xs">
              <ErrorMessage error={error} onRetry={() => void refetch()} />
            </div>
          ) : !allocation ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
              <H4 className="text-base font-bold text-slate-800">Allocation Not Found</H4>
              <P className="mt-1 text-sm text-slate-500">
                The requested mentee progress record could not be loaded.
              </P>
              <Link href={backHref} className="mt-4">
                <Button size="sm">Return to Progress</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Mentee Header Hero Strip */}
              <div className="flex items-center gap-3 rounded-2xl border border-[#E1E6EC] bg-gradient-to-r from-blue-50/50 via-slate-50/60 to-white px-5 py-4 shadow-xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-[#0044D3]">
                  {allocation.menteeName ? allocation.menteeName.charAt(0).toUpperCase() : 'M'}
                </div>
                <div>
                  <H1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                    {allocation.menteeName || 'Learner Progress'}
                  </H1>
                </div>
              </div>

              {/* Structured Metadata Grid (3 Cards) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Card 1: Overall Completion */}
                <div className="rounded-2xl border border-[#E1E6EC] bg-white p-4.5 shadow-xs transition-colors hover:border-slate-300">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0044D3]">
                      <svg
                        className="h-4.5 w-4.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
                        Overall Completion
                      </Span>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Span className="truncate text-sm font-bold text-slate-900">
                          {allocation.progressPercent}% Completed
                        </Span>
                        <Span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-bold text-[#0044D3]">
                          {completedTopicsCount} / {totalActiveTopics} Finished
                        </Span>
                      </div>
                      {/* Sleek Progress bar */}
                      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-[#0044D3] transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.max(0, allocation.progressPercent))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Allocation Window */}
                <div className="rounded-2xl border border-[#E1E6EC] bg-white p-4.5 shadow-xs transition-colors hover:border-slate-300">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <svg
                        className="h-4.5 w-4.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
                        Allocation Window
                      </Span>
                      {minDate || maxDate ? (
                        <Span className="mt-0.5 block truncate text-sm font-bold text-slate-900">
                          {minDate ? formatDateDDMMYY(minDate) : '—'} →{' '}
                          {maxDate ? formatDateDDMMYY(maxDate) : '—'}
                        </Span>
                      ) : (
                        <Span className="mt-0.5 block truncate text-xs text-slate-400">
                          Flexible timeline (no window set)
                        </Span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card 3: Assigned Course & Batch */}
                <div className="rounded-2xl border border-[#E1E6EC] bg-white p-4.5 shadow-xs transition-colors hover:border-slate-300">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <svg
                        className="h-4.5 w-4.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
                        Course Track
                      </Span>
                      <Span
                        className="mt-0.5 block truncate text-sm font-bold text-slate-900"
                        title={allocation.courseTitle}
                      >
                        {allocation.courseTitle}
                      </Span>
                      <Span className="mt-0.5 block truncate text-xs text-slate-500">
                        {displayBatchName ? `Batch: ${displayBatchName}` : 'Individual Track'}
                      </Span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Topic Milestones Container */}
              <div className="overflow-hidden rounded-2xl border border-[#E1E6EC] bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-5 py-3.5">
                  <Span className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold tracking-wider text-[#0044D3] uppercase">
                    Topic Deadlines
                  </Span>
                  <Span className="text-xs font-semibold text-slate-500">
                    {completedTopicsCount} of {totalActiveTopics} Finished
                  </Span>
                </div>

                {!topics.length ? (
                  <div className="flex h-40 flex-col items-center justify-center p-6 text-center">
                    <Span className="text-2xl">📚</Span>
                    <H4 className="mt-2 text-xs font-bold text-slate-800">No Active Topics</H4>
                    <P className="mt-1 text-xs text-slate-500">
                      This course currently has no active syllabus topics configured.
                    </P>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {topics.map((t, idx) => {
                      const isCompleted = t.status === 'COMPLETED';
                      const isInProgress = t.status === 'IN_PROGRESS';
                      const isEditingThisTopic = editingTopicId === t.topicId;

                      return (
                        <div
                          key={t.topicId}
                          className={`p-4.5 transition-colors ${
                            isEditingThisTopic ? 'bg-slate-50/40' : 'hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 flex-1 items-start gap-3">
                              <Span
                                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                  isCompleted
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : isInProgress
                                      ? 'bg-blue-100 text-[#0044D3]'
                                      : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {isCompleted ? '✓' : idx + 1}
                              </Span>
                              <div className="min-w-0 flex-1">
                                <H4 className="cursor-default text-sm font-bold break-words text-slate-900">
                                  {t.title}
                                </H4>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  {t.deadline ? (
                                    <Span
                                      className={`text-xs ${
                                        t.isOverdue && !isCompleted
                                          ? 'font-bold text-rose-600'
                                          : 'text-slate-500'
                                      }`}
                                    >
                                      Target: {formatDateDDMMYY(t.deadline)}
                                      {t.isOverdue && !isCompleted && ' (Overdue)'}
                                    </Span>
                                  ) : !isCompleted ? (
                                    <Span className="text-xs text-slate-400">
                                      No topic deadline set
                                    </Span>
                                  ) : null}
                                </div>
                                {t.note && (
                                  <div className="mt-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600">
                                    📝 Mentee Note: {t.note}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              <Span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                  isCompleted
                                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : isInProgress
                                      ? 'border border-blue-200 bg-blue-50 text-[#0044D3]'
                                      : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {isCompleted ? 'Done' : isInProgress ? 'Active' : 'Unstarted'}
                              </Span>

                              {!isEditingThisTopic && !isCompleted && !allocation.readOnly && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  type="button"
                                  disabled={Boolean(editingTopicId && editingTopicId !== t.topicId)}
                                  onClick={() => handleStartEditDeadline(t)}
                                  className="h-8 px-2 text-xs font-semibold text-[#0044D3] hover:underline disabled:opacity-40"
                                >
                                  {t.deadline ? 'Edit Target' : '+ Set Target'}
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Direct Inline Target Date Setup */}
                          {isEditingThisTopic && (
                            <div className="mt-3.5 rounded-xl border border-slate-200/90 bg-slate-50/80 p-3.5 shadow-2xs">
                              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-col">
                                  <Span className="text-xs font-bold text-slate-800">
                                    Target Deadline Date (DD/MM/YY):
                                  </Span>
                                  {minDate && maxDate && (
                                    <Span className="mt-0.5 text-[11px] text-slate-500">
                                      Window: {formatDateDDMMYY(minDate)} →{' '}
                                      {formatDateDDMMYY(maxDate)}
                                    </Span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <div className="w-48">
                                    <DatePicker
                                      id={`deadline-${t.topicId}`}
                                      value={inlineDeadline || undefined}
                                      onChange={(val) => {
                                        setInlineDeadline(val);
                                        setInlineError(null);
                                      }}
                                      minDate={minDate || undefined}
                                      maxDate={maxDate || undefined}
                                      placeholder="Select target date"
                                      className="h-9 text-xs"
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    isLoading={updateDeadlineMutation.isPending}
                                    disabled={updateDeadlineMutation.isPending}
                                    onClick={() => void handleSaveInlineDeadline(t.topicId)}
                                    className="h-9 px-4 text-xs font-bold"
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={updateDeadlineMutation.isPending}
                                    onClick={handleCancelEditDeadline}
                                    className="h-9 px-3 text-xs font-medium"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                              {inlineError && (
                                <Span className="mt-1.5 block text-xs font-medium text-rose-600">
                                  {inlineError}
                                </Span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DashboardContent>
    </div>
  );
}

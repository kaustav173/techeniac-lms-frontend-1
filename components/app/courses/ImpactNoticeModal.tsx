'use client';

import React from 'react';

import { Modal } from '@/components/patterns/Modal';
import { Button } from '@/components/ui/Button';
import { P, Span } from '@/components/ui/Typography';
import type { CourseImpact } from '@/types/courses';

interface ImpactNoticeModalProps {
  isOpen: boolean;
  impact?: CourseImpact | null;
  actionTitle: string;
  actionMessage: string;
  isDestructive?: boolean;
  isBlocked?: boolean;
  blockedMessage?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  loadingLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ImpactNoticeModal({
  isOpen,
  impact,
  actionTitle,
  actionMessage,
  isDestructive = false,
  isBlocked = false,
  blockedMessage,
  confirmLabel = 'Confirm Action',
  isLoading = false,
  loadingLabel = 'Processing...',
  onConfirm,
  onCancel,
}: Readonly<ImpactNoticeModalProps>) {
  const affectedCount = impact?.affectedMenteesCount ?? 0;
  const hasAllocations = (impact?.openAllocationsCount ?? 0) > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isDestructive
                ? 'border border-rose-200/80 bg-rose-50 text-rose-600'
                : 'border border-blue-200/80 bg-blue-50 text-blue-600'
            }`}
          >
            {isDestructive ? (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>
          <span className="block text-base leading-snug font-bold text-slate-900">
            {actionTitle}
          </span>
        </div>
      }
      size="sm"
      footer={
        <div className="flex w-full items-center justify-end gap-2.5">
          <Button type="button" variant="outline" disabled={isLoading} onClick={onCancel} size="sm">
            {isBlocked ? 'Close' : 'Cancel'}
          </Button>
          {!isBlocked && (
            <Button
              type="button"
              variant={isDestructive ? 'danger' : 'primary'}
              disabled={isLoading}
              isLoading={isLoading}
              onClick={onConfirm}
              size="sm"
            >
              {isLoading ? loadingLabel : confirmLabel}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-3">
        {/* Soft Deletion Policy Card */}
        {!isBlocked && (
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="leading-relaxed">
                <span className="font-semibold text-slate-800">
                  {isDestructive ? 'Soft Deletion Policy: ' : 'Status Update: '}
                </span>
                {actionMessage ||
                  (isDestructive
                    ? 'This item will be soft-deleted. Historical learner submissions, activity logs, and grading records are permanently retained.'
                    : 'Updating this course status takes effect immediately across all linked catalogs.')}
              </div>
            </div>
          </div>
        )}

        {/* Live Impact Warning Banner */}
        {hasAllocations && (
          <div className="rounded-xl border border-amber-200/90 bg-amber-50/60 p-3.5 text-xs text-amber-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <Span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                Live Course Impact
              </div>
              <Span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-800 uppercase">
                Immediate Sync
              </Span>
            </div>
            <P className="mt-1.5 leading-relaxed text-amber-800/90">
              This course is currently allocated to active mentees. Any changes apply live across
              all enrolled batches immediately.
            </P>
            <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-amber-200/60 pt-2 text-xs">
              <Span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white/80 px-2.5 py-1 font-medium text-amber-900 shadow-2xs">
                <strong className="font-bold text-amber-950">{affectedCount}</strong> active mentees
              </Span>
              <Span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white/80 px-2.5 py-1 font-medium text-amber-900 shadow-2xs">
                <strong className="font-bold text-amber-950">{impact?.openAllocationsCount}</strong>{' '}
                batches/allocations
              </Span>
            </div>
          </div>
        )}

        {/* Blocked Deletion Banner */}
        {isBlocked && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-900">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-200/80 text-rose-800">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <P className="font-bold text-rose-950">Deletion Restricted</P>
                <P className="mt-1 leading-relaxed text-rose-800">
                  {blockedMessage ||
                    'This course cannot be deleted because it has active mentee allocations. Deactivate the course instead.'}
                </P>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

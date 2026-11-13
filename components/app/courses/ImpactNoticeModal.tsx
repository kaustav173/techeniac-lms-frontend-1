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
      title={actionTitle}
      description={actionMessage}
      size="sm"
      footer={
        <>
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
        </>
      }
    >
      {/* Impact Warning Banner */}
      {hasAllocations && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-semibold">
            <Span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            Live Impact Notice
          </div>
          <P className="mt-1 leading-relaxed">
            This course is currently allocated to{' '}
            <Span className="font-bold underline">{affectedCount} active mentees</Span> across{' '}
            <Span className="font-bold">{impact?.openAllocationsCount} batches/allocations</Span>.
            Any modification applies live immediately to all affected cadets.
          </P>
        </div>
      )}

      {isBlocked && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          {blockedMessage ||
            'This course cannot be deleted because it has active mentee allocations. Deactivate the course instead.'}
        </div>
      )}
    </Modal>
  );
}

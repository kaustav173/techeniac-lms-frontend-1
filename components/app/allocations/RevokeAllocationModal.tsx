'use client';

import React, { useState } from 'react';

import { Modal } from '@/components/patterns/Modal';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { P, Span } from '@/components/ui/Typography';
import { type CourseAllocation, useRevokeAllocationMutation } from '@/hooks/useAllocations';
import { useToast } from '@/hooks/useToast';

export interface RevokeAllocationModalProps {
  readonly allocation: CourseAllocation | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: (() => void) | undefined;
}

export function RevokeAllocationModal({
  allocation,
  isOpen,
  onClose,
  onSuccess,
}: RevokeAllocationModalProps) {
  const [errorMsg, setErrorMsg] = useState<unknown>(null);
  const revokeMutation = useRevokeAllocationMutation();
  const { toastSuccess, toastError } = useToast();

  if (!allocation) return null;

  const handleRevoke = async () => {
    setErrorMsg(null);
    try {
      await revokeMutation.mutateAsync(allocation.id);
      toastSuccess(`Allocation for "${allocation.course?.title}" revoked.`, 'Allocation Revoked');
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err);
      const msg = err instanceof Error ? err.message : 'Failed to revoke allocation.';
      toastError(msg, 'Revocation Failed');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Revoke Allocation"
      size="md"
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={revokeMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => void handleRevoke()}
            isLoading={revokeMutation.isPending}
          >
            Revoke Allocation
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {errorMsg ? (
          <ErrorMessage
            error={errorMsg}
            title="Failed to revoke allocation"
            onDismiss={() => setErrorMsg(null)}
          />
        ) : null}

        <div>
          <div
            title="This will mark the allocation status as REVOKED. The course will be hidden from active learning, but all recorded progress will be preserved."
            className="group relative inline-flex cursor-help items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100"
          >
            <svg
              className="h-3.5 w-3.5 shrink-0 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <Span>Warning</Span>
            <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 hidden w-72 rounded-xl border border-amber-200 bg-white p-2.5 text-xs font-normal text-slate-700 shadow-xl group-hover:block">
              <Span>
                This will mark the allocation status as <Span className="font-bold">REVOKED</Span>.
                The course will be hidden from the mentee&apos;s active learning list, but all
                recorded topic progress and history will be preserved.
              </Span>
            </div>
          </div>
        </div>

        <div className="space-y-1 text-xs text-slate-600">
          <P>
            <Span className="font-bold">Mentee:</Span> {allocation.user?.name} (
            {allocation.user?.email})
          </P>
          <P>
            <Span className="font-bold">Course:</Span> {allocation.course?.title}
          </P>
          <P>
            <Span className="font-bold">Current Progress:</Span> {allocation.progressPercent}%
          </P>
        </div>
      </div>
    </Modal>
  );
}

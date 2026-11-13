'use client';

import React, { useState } from 'react';

import { Modal } from '@/components/patterns/Modal';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { P } from '@/components/ui/Typography';
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
      title="Revoke Course Allocation"
      description="Soft revoke this course allocation."
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

        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <P className="text-sm font-semibold text-rose-900">Warning: Revoking Allocation</P>
          <P className="mt-1 text-xs text-rose-700">
            This will mark the allocation status as <strong>REVOKED</strong>. The course will be
            hidden from the mentee&apos;s active learning list, but all recorded topic progress and
            history will be preserved.
          </P>
        </div>

        <div className="space-y-1 text-xs text-slate-600">
          <P>
            <strong>Mentee:</strong> {allocation.user?.name} ({allocation.user?.email})
          </P>
          <P>
            <strong>Course:</strong> {allocation.course?.title}
          </P>
          <P>
            <strong>Current Progress:</strong> {allocation.progressPercent}%
          </P>
        </div>
      </div>
    </Modal>
  );
}

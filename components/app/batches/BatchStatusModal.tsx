'use client';

import React, { useState } from 'react';

import { Modal } from '@/components/patterns/Modal';
import { Button } from '@/components/ui/Button';
import { Form } from '@/components/ui/Form';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { P, Span } from '@/components/ui/Typography';
import { useUpdateBatchStatusMutation } from '@/hooks/useBatches';
import { useToast } from '@/hooks/useToast';
import {
  ALLOWED_STATUS_TRANSITIONS,
  type BatchStatus,
  type ChangeBatchStatusFormData,
  changeBatchStatusSchema,
} from '@/lib/validation';

export interface BatchStatusModalProps {
  batchId: string;
  batchName: string;
  currentStatus: BatchStatus;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (batchId: string, data: ChangeBatchStatusFormData) => void;
}

export function BatchStatusModal({
  batchId,
  batchName,
  currentStatus,
  isOpen,
  onClose,
  onSuccess,
}: Readonly<BatchStatusModalProps>) {
  const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  const [selectedStatus, setSelectedStatus] = useState<BatchStatus | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const newStatus =
    selectedStatus && allowedNextStatuses.includes(selectedStatus)
      ? selectedStatus
      : (allowedNextStatuses[0] ?? currentStatus);

  const { mutateAsync: updateStatus, isPending: isSubmitting } = useUpdateBatchStatusMutation();
  const { toastSuccess, toastError } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (allowedNextStatuses.length === 0) {
      setError('This batch is in a final status and cannot be changed.');
      return;
    }

    const result = changeBatchStatusSchema.safeParse({ newStatus, reason: reason || undefined });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Invalid status transition.');
      return;
    }

    try {
      await updateStatus({
        batchId,
        newStatus: result.data.newStatus,
        reason: result.data.reason,
      });
      toastSuccess(`Batch "${batchName}" is now ${result.data.newStatus}.`, 'Status Updated');
      onSuccess(batchId, result.data);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update batch status.';
      setError(message);
      toastError(message, 'Status Update Failed');
    }
  };

  const getStatusImpactNotice = (target: BatchStatus) => {
    switch (target) {
      case 'LIVE':
        return 'Batch becomes visible to mentees and allocated courses unlock.';
      case 'ON_HOLD':
        return 'Batch is paused in read-only mode for mentees.';
      case 'COMPLETED':
        return 'Batch concludes and active mentee memberships are marked complete.';
      case 'ARCHIVED':
        return 'Batch is archived and hidden from standard active rosters.';
      default:
        return '';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Batch Status"
      description={`Update status for ${batchName}`}
      size="md"
      isSubmitting={isSubmitting}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="status-change-form"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={allowedNextStatuses.length === 0 || isSubmitting}
          >
            Update Status
          </Button>
        </>
      }
    >
      <Form
        id="status-change-form"
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="space-y-4"
      >
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
            {error}
          </div>
        ) : null}

        {/* Current & Next Status Row */}
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div>
            <Span className="block text-xs font-semibold text-slate-500">Current Status</Span>
            <Span className="mt-1 inline-block rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-800">
              {currentStatus}
            </Span>
          </div>
          <div>
            <Span className="block text-xs font-semibold text-slate-500">Target Status</Span>
            <Span className="mt-1 inline-block rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#0044D3]">
              {newStatus}
            </Span>
          </div>
        </div>

        {/* New Status Select */}
        {allowedNextStatuses.length > 0 ? (
          <div className="space-y-1.5">
            <Label htmlFor="target-batch-status" required>
              New Status
            </Label>
            <Select
              id="target-batch-status"
              value={newStatus}
              onChange={(e) => setSelectedStatus(e.target.value as BatchStatus)}
              className="cursor-pointer text-sm font-semibold text-slate-900"
            >
              {allowedNextStatuses.map((st) => (
                <option key={st} value={st} className="font-medium text-slate-900">
                  {st}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-100 p-3.5 text-center text-xs font-medium text-slate-600">
            <P className="text-xs font-medium text-slate-700">
              This batch is archived and cannot be changed.
            </P>
          </div>
        )}

        {/* Impact Notice */}
        {allowedNextStatuses.length > 0 && getStatusImpactNotice(newStatus) ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900">
            <P className="text-xs leading-relaxed font-medium">
              {getStatusImpactNotice(newStatus)}
            </P>
          </div>
        ) : null}

        {/* Reason (Optional) */}
        <div className="space-y-1.5">
          <Label htmlFor="status-reason">
            Reason <Span className="text-xs font-normal text-slate-400">(optional)</Span>
          </Label>
          <Textarea
            id="status-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional reason for audit history..."
          />
        </div>
      </Form>
    </Modal>
  );
}

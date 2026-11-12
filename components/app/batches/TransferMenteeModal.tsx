'use client';

import React, { useState } from 'react';

import { Modal } from '@/components/patterns/Modal';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Form } from '@/components/ui/Form';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { P, Span } from '@/components/ui/Typography';
import { useTransferMenteeMutation } from '@/hooks/useBatches';
import { transferMenteeSchema } from '@/lib/validation';

export interface BatchOption {
  id: string;
  name: string;
  code: string;
  status: string;
}

export interface TransferMenteeModalProps {
  mentee: { id: string; name: string; currentBatchId: string; currentBatchName: string } | null;
  availableBatches: BatchOption[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (menteeId: string, targetBatchId: string, reason?: string) => void;
}

export function TransferMenteeModal({
  mentee,
  availableBatches,
  isOpen,
  onClose,
  onSuccess,
}: Readonly<TransferMenteeModalProps>) {
  const eligibleBatches = availableBatches.filter(
    (b) => b.id !== mentee?.currentBatchId && (b.status === 'LIVE' || b.status === 'DRAFT'),
  );

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const targetBatchId =
    selectedBatchId && eligibleBatches.some((b) => b.id === selectedBatchId)
      ? selectedBatchId
      : eligibleBatches[0]?.id || '';

  const { mutateAsync: transferMentee, isPending: isSubmitting } = useTransferMenteeMutation();

  if (!isOpen || !mentee) return null;

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!targetBatchId) return;

    const result = transferMenteeSchema.safeParse({
      menteeId: mentee.id,
      targetBatchId,
      reason: reason.trim() ? reason.trim() : undefined,
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Invalid transfer details.');
      return;
    }

    try {
      await transferMentee({
        sourceBatchId: mentee.currentBatchId,
        menteeId: result.data.menteeId,
        targetBatchId: result.data.targetBatchId,
        reason: result.data.reason,
      });
      onSuccess(mentee.id, result.data.targetBatchId, result.data.reason);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to transfer mentee.';
      setError(message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isSubmitting={isSubmitting}
      title="Transfer Mentee"
      description={
        <Span>
          Move <strong className="font-semibold text-slate-800">{mentee.name}</strong> to a new
          cohort.
        </Span>
      }
      size="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="transfer-form"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={!targetBatchId || isSubmitting}
          >
            Execute Transfer
          </Button>
        </>
      }
    >
      <Form
        id="transfer-form"
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="space-y-4"
      >
        {error ? <Alert variant="error" title="Transfer Blocked" message={error} /> : null}

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
          <div>
            <Span className="block text-[10px] font-bold text-slate-500 uppercase">
              Current Batch
            </Span>
            <Span className="font-bold text-slate-900">{mentee.currentBatchName}</Span>
          </div>
          <Span className="rounded-full border border-blue-200 bg-blue-100 px-2.5 py-0.5 font-mono text-[10px] font-bold text-blue-800">
            ONE-BATCH RULE
          </Span>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="target-batch" required>
            Select Destination Batch
          </Label>
          <Select
            id="target-batch"
            value={targetBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="cursor-pointer"
          >
            {eligibleBatches.map((b) => (
              <option key={b.id} value={b.id} className="text-slate-900">
                {b.name} ({b.code}) — {b.status}
              </option>
            ))}
          </Select>
        </div>

        {/* Transfer Policy Box (BAT-10) */}
        <div className="space-y-1.5 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs leading-relaxed shadow-xs">
          <P className="font-bold text-amber-900">⚠️ Transfer Impact (PRD Section 5.4 / BAT-10):</P>
          <ul className="list-disc space-y-1 pl-4 text-slate-800">
            <li>
              <Span>Membership in {mentee.currentBatchName} ends (status: BATCH_TRANSFER).</Span>
            </li>
            <li>
              <Span>Active mentor mapping in the old batch ends.</Span>
            </li>
            <li>
              <Span>
                Open allocations in the previous batch close as CLOSED_BATCH_CHANGE (read-only).
              </Span>
            </li>
            <li>
              <Span>New batch open courses are allocated with fresh 0% progress.</Span>
            </li>
          </ul>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="transfer-reason">
              Transfer Reason <Span className="text-xs font-normal text-slate-500">(optional)</Span>
            </Label>
            <Span className="font-mono text-[11px] text-slate-400">{reason.length}/500</Span>
          </div>
          <Textarea
            id="transfer-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            placeholder="e.g. Schedule realignment or course track adjustment..."
          />
        </div>
      </Form>
    </Modal>
  );
}

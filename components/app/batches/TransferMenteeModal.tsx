'use client';

import React, { useMemo, useState } from 'react';

import { Modal } from '@/components/patterns/Modal';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Form } from '@/components/ui/Form';
import { Label } from '@/components/ui/Label';
import { MultiSelectDropdown, type MultiSelectOption } from '@/components/ui/MultiSelectDropdown';
import { Textarea } from '@/components/ui/Textarea';
import { Span } from '@/components/ui/Typography';
import { useTransferMenteeMutation } from '@/hooks/useBatches';
import { useToast } from '@/hooks/useToast';
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

  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { toastSuccess, toastError } = useToast();

  const targetBatchId =
    selectedBatchId && eligibleBatches.some((b) => b.id === selectedBatchId) ? selectedBatchId : '';

  const targetBatch = eligibleBatches.find((b) => b.id === targetBatchId);

  const batchOptions: readonly MultiSelectOption[] = useMemo(() => {
    return eligibleBatches.map((b) => ({
      value: b.id,
      label: `${b.name} (${b.code}) — ${b.status}`,
    }));
  }, [eligibleBatches]);

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
      toastSuccess(
        `Transferred ${mentee.name} to ${targetBatch?.name ?? 'destination batch'}.`,
        'Mentee Transferred',
      );
      onSuccess(mentee.id, result.data.targetBatchId, result.data.reason);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to transfer mentee.';
      setError(message);
      toastError(message, 'Transfer Failed');
    }
  };

  const hasEligibleBatches = eligibleBatches.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isSubmitting={isSubmitting}
      title={`Transfer Mentee (${mentee.name})`}
      size="lg"
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
            disabled={!targetBatchId || !hasEligibleBatches || isSubmitting}
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
        className="space-y-3.5"
      >
        {error ? <Alert variant="error" title="Transfer Blocked" message={error} /> : null}

        {/* Pathway Card: Origin to Destination */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-3.5 shadow-2xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-start">
            {/* Origin Batch */}
            <div className="min-w-0 space-y-1">
              <Span className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Current Batch
              </Span>
              <div className="flex h-10 min-w-0 items-center rounded-xl border border-slate-200/80 bg-white px-3 shadow-2xs">
                <Span
                  className="truncate text-xs font-semibold text-slate-900"
                  title={mentee.currentBatchName}
                >
                  {mentee.currentBatchName}
                </Span>
              </div>
            </div>

            {/* Transfer Direction Arrow */}
            <div
              className="flex items-center justify-center py-1 text-slate-400 sm:mb-3 sm:self-end sm:py-0"
              aria-hidden="true"
            >
              <svg
                className="h-4 w-4 rotate-90 text-blue-600 sm:rotate-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>

            {/* Destination Batch Selector */}
            <div className="min-w-0 space-y-1">
              <Label
                htmlFor="target-batch"
                required
                className="text-[10px] font-bold tracking-wider text-slate-500 uppercase"
              >
                Destination Batch
              </Label>
              {hasEligibleBatches ? (
                <MultiSelectDropdown
                  id="target-batch"
                  label="Destination batch"
                  placeholder="-- Choose destination batch --"
                  options={batchOptions}
                  selectedValues={selectedBatchId ? [selectedBatchId] : []}
                  onChange={(vals) => {
                    setSelectedBatchId(vals[0] ?? '');
                    setError(null);
                  }}
                  singleSelect={true}
                  align="left"
                  className="w-full min-w-0"
                  buttonClassName="h-10 text-xs"
                  usePortal={true}
                />
              ) : (
                <div className="flex h-10 items-center rounded-xl border border-amber-200 bg-amber-50/50 px-3">
                  <Span className="text-xs text-amber-700 italic">
                    No other active batches available
                  </Span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compact Policy & Impact Notice */}
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-[11px] text-amber-900">
          <Span className="shrink-0 font-semibold text-amber-700">Transfer Impact:</Span>
          <Span className="leading-snug text-amber-900/90">
            Closes current batch membership & mentor mappings, marks active allocations as
            read-only, and assigns destination batch courses.
          </Span>
        </div>

        {/* Transfer Reason */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="transfer-reason" className="text-xs font-medium text-slate-700">
              Transfer Reason <Span className="font-normal text-slate-400">(optional)</Span>
            </Label>
            <Span className="font-mono text-[10px] text-slate-400">{reason.length}/500</Span>
          </div>
          <Textarea
            id="transfer-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            placeholder="e.g. Schedule realignment or course track adjustment..."
            className="resize-none text-xs"
          />
        </div>
      </Form>
    </Modal>
  );
}

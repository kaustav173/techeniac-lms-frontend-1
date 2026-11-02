'use client';

import React, { useState } from 'react';

import { Modal } from '@/components/patterns/Modal';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { FieldError } from '@/components/ui/FieldError';
import { Form } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Span } from '@/components/ui/Typography';
import { useUpdateTopicDeadlineMutation } from '@/hooks/useProgress';
import { toISTDateInputValue } from '@/lib/date';

export interface TopicDeadlineModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly allocationId: string;
  readonly topicId: string;
  readonly topicTitle: string;
  readonly currentDeadline?: string | null | undefined;
  readonly allocationStartDate: string;
  readonly allocationDueDate: string;
  readonly onSuccess?: (() => void) | undefined;
}

export function TopicDeadlineModal(props: TopicDeadlineModalProps) {
  if (!props.isOpen) return null;
  return <TopicDeadlineModalDialog {...props} />;
}

function TopicDeadlineModalDialog({
  isOpen,
  onClose,
  allocationId,
  topicId,
  topicTitle,
  currentDeadline,
  allocationStartDate,
  allocationDueDate,
  onSuccess,
}: Readonly<TopicDeadlineModalProps>) {
  const [deadline, setDeadline] = useState<string>(() => {
    if (currentDeadline) {
      return toISTDateInputValue(currentDeadline);
    }
    return toISTDateInputValue(allocationDueDate);
  });
  const [errorMsg, setErrorMsg] = useState<unknown>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const deadlineMutation = useUpdateTopicDeadlineMutation();

  const minDate = toISTDateInputValue(allocationStartDate);
  const maxDate = toISTDateInputValue(allocationDueDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setValidationError(null);

    if (!deadline) {
      setValidationError('Please select a target deadline.');
      return;
    }

    // Range validation: FR-8.6, PRG-18
    if (deadline < minDate || deadline > maxDate) {
      setValidationError(
        `Deadline must be between allocation start (${minDate}) and due date (${maxDate}).`,
      );
      return;
    }

    try {
      // Send as ISO 8601 string clamped to allocation boundaries (IST end-of-day: 23:59:59+05:30)
      const targetTime = new Date(`${deadline}T23:59:59+05:30`).getTime();
      const dueTime = new Date(allocationDueDate).getTime();
      const startTime = new Date(allocationStartDate).getTime();

      const isoDeadline =
        targetTime > dueTime
          ? allocationDueDate
          : targetTime < startTime
            ? allocationStartDate
            : new Date(targetTime).toISOString();

      await deadlineMutation.mutateAsync({
        allocationId,
        topicId,
        payload: { deadline: isoDeadline },
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isSubmitting={deadlineMutation.isPending}
      size="md"
      title="Set Topic Deadline"
      description="Configure a target milestone completion date for this mentee (FR-8.6)."
    >
      <div className="flex flex-col gap-5 p-6">
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-xs text-blue-900">
          <Span className="font-semibold text-slate-900">Topic: </Span>
          <Span className="font-medium text-blue-800">{topicTitle}</Span>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
            <Span>
              Window: {minDate} → {maxDate}
            </Span>
          </div>
        </div>

        {errorMsg ? <ErrorMessage error={errorMsg} /> : null}

        <Form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="flex flex-col gap-4"
        >
          <div>
            <Label htmlFor="topic-deadline-input" className="text-xs font-semibold text-slate-700">
              Target Deadline Date
            </Label>
            <Input
              id="topic-deadline-input"
              type="date"
              min={minDate}
              max={maxDate}
              value={deadline}
              onChange={(e) => {
                setDeadline(e.target.value);
                setValidationError(null);
              }}
              className="mt-1.5 h-10 w-full bg-white text-xs"
            />
            {validationError && <FieldError error={validationError} />}
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={deadlineMutation.isPending}
              className="text-xs font-semibold"
            >
              {deadlineMutation.isPending ? 'Saving...' : 'Save Target Deadline'}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}

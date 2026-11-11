'use client';

import React, { useState } from 'react';
import type { z } from 'zod';

import { ConfirmationModal } from '@/components/patterns/ConfirmationModal';
import { Modal } from '@/components/patterns/Modal';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { FieldError } from '@/components/ui/FieldError';
import { Form } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Span } from '@/components/ui/Typography';
import { useCreateBatchMutation } from '@/hooks/useBatches';
import { ApiError } from '@/lib/errors';
import { type CreateBatchFormData, createBatchSchema } from '@/lib/validation';

export interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: CreateBatchFormData) => void;
}

function extractZodFieldErrors(issues: z.ZodIssue[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path[0]?.toString();
    if (field && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }
  return fieldErrors;
}

function parseApiErrors(err: unknown): Record<string, string> {
  if (err instanceof ApiError && Array.isArray(err.details)) {
    const fieldErrors: Record<string, string> = {};
    for (const item of err.details as Array<{ field?: string; message?: string }>) {
      if (item.field && item.message) {
        fieldErrors[item.field] = item.message;
      }
    }
    return {
      ...fieldErrors,
      general: err.message,
    };
  }
  const message = err instanceof Error ? err.message : 'Failed to create batch.';
  return { general: message };
}

interface FormFieldsProps {
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  description: string;
  errors: Record<string, string>;
  disabled: boolean;
  onNameChange: (val: string) => void;
  onCodeChange: (val: string) => void;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onDescriptionChange: (val: string) => void;
}

function CreateBatchFormFields({
  name,
  code,
  startDate,
  endDate,
  description,
  errors,
  disabled,
  onNameChange,
  onCodeChange,
  onStartDateChange,
  onEndDateChange,
  onDescriptionChange,
}: Readonly<FormFieldsProps>) {
  return (
    <>
      {/* Name */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="batch-name" required>
            Batch Name
          </Label>
          <Span className="text-[11px] font-medium text-slate-400">{name.length}/100</Span>
        </div>
        <Input
          id="batch-name"
          maxLength={100}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Frontend Engineering Cohort 2025"
          hasError={Boolean(errors.name)}
          disabled={disabled}
        />
        {errors.name ? <FieldError error={errors.name} /> : null}
      </div>

      {/* Code */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="batch-code" required>
            Unique Code
          </Label>
          <Span className="text-[11px] font-medium text-slate-400">{code.length}/20</Span>
        </div>
        <Input
          id="batch-code"
          maxLength={20}
          value={code}
          onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
          placeholder="e.g. FE-25Q1"
          hasError={Boolean(errors.code)}
          disabled={disabled}
          className="uppercase"
        />
        {errors.code ? <FieldError error={errors.code} /> : null}
      </div>

      {/* Dates with Calendar Picker (opens upward in upper layer to prevent scrollable clipping) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="batch-start" required>
            Start Date
          </Label>
          <DatePicker
            id="batch-start"
            value={startDate}
            onChange={onStartDateChange}
            rangeStart={startDate}
            rangeEnd={endDate}
            maxDate={endDate || undefined}
            hasError={Boolean(errors.startDate)}
            disabled={disabled}
            placement="auto"
            placeholder="Select start date"
          />
          {errors.startDate ? <FieldError error={errors.startDate} /> : null}
        </div>

        <div className="space-y-1">
          <Label htmlFor="batch-end" required>
            End Date
          </Label>
          <DatePicker
            id="batch-end"
            value={endDate}
            onChange={onEndDateChange}
            rangeStart={startDate}
            rangeEnd={endDate}
            minDate={startDate || undefined}
            hasError={Boolean(errors.endDate)}
            disabled={disabled}
            placement="auto"
            placeholder="Select end date"
          />
          {errors.endDate ? <FieldError error={errors.endDate} /> : null}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="batch-desc">Description</Label>
          <Span className="text-[11px] font-medium text-slate-400">{description.length}/500</Span>
        </div>
        <Textarea
          id="batch-desc"
          maxLength={500}
          rows={2}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Brief objective of this training cohort..."
          disabled={disabled}
        />
        {errors.description ? <FieldError error={errors.description} /> : null}
      </div>
    </>
  );
}

export function CreateBatchModal({ isOpen, onClose, onSuccess }: Readonly<CreateBatchModalProps>) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

  const { mutateAsync: createBatch, isPending: isSubmitting } = useCreateBatchMutation();

  if (!isOpen) return null;

  const isDirty = Boolean(name.trim() || code.trim() || startDate || endDate || description.trim());

  const handleRequestClose = () => {
    if (isDirty) {
      setIsDiscardConfirmOpen(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setIsDiscardConfirmOpen(false);
    setName('');
    setCode('');
    setStartDate('');
    setEndDate('');
    setDescription('');
    setErrors({});
    onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const result = createBatchSchema.safeParse({
      name,
      code,
      startDate,
      endDate,
      description: description || undefined,
    });

    if (!result.success) {
      setErrors(extractZodFieldErrors(result.error.issues));
      return;
    }

    try {
      await createBatch(result.data);
      onSuccess(result.data);
      onClose();
    } catch (err: unknown) {
      setErrors(parseApiErrors(err));
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleRequestClose}
        isSubmitting={isSubmitting}
        title="Create New Batch"
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-batch-form"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Create Batch
            </Button>
          </>
        }
      >
        <Form
          id="create-batch-form"
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="min-h-[380px] space-y-4"
        >
          {errors.general ? (
            <Alert variant="error" title="Batch Creation Failed" message={errors.general} />
          ) : null}

          <CreateBatchFormFields
            name={name}
            code={code}
            startDate={startDate}
            endDate={endDate}
            description={description}
            errors={errors}
            disabled={isSubmitting}
            onNameChange={setName}
            onCodeChange={setCode}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onDescriptionChange={setDescription}
          />
        </Form>
      </Modal>

      {/* Confirmation before discard */}
      <ConfirmationModal
        isOpen={isDiscardConfirmOpen}
        onClose={() => setIsDiscardConfirmOpen(false)}
        onConfirm={handleConfirmDiscard}
        title="Discard Changes?"
        description="If you leave now, your changes to this batch will be lost. Would you like to discard your changes?"
        confirmLabel="Discard Changes"
        cancelLabel="Go Back"
      />
    </>
  );
}

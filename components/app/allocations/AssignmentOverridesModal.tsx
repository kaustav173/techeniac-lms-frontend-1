'use client';

import React, { useState } from 'react';

import { Modal } from '@/components/patterns/Modal';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { FieldError } from '@/components/ui/FieldError';
import { Form } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { P, Span } from '@/components/ui/Typography';
import {
  type CourseAllocation,
  useAssignmentOverrides,
  useSetAssignmentOverrideMutation,
} from '@/hooks/useAllocations';
import { useCourseDetail } from '@/hooks/useCourses';
import { useToast } from '@/hooks/useToast';

export interface AssignmentOverridesModalProps {
  readonly allocation: CourseAllocation | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: (() => void) | undefined;
}

export function AssignmentOverridesModal({
  allocation,
  isOpen,
  onClose,
  onSuccess,
}: AssignmentOverridesModalProps) {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [overrideDueDate, setOverrideDueDate] = useState<string>('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<unknown>(null);

  const { data: overrides, isLoading: isLoadingOverrides } = useAssignmentOverrides(
    allocation?.id ?? '',
  );
  const { data: courseDetail } = useCourseDetail(allocation?.courseId ?? '');

  const setOverrideMutation = useSetAssignmentOverrideMutation();
  const { toastSuccess, toastError } = useToast();

  if (!allocation) return null;

  // Flatten course-level and topic-level assignments
  const allAssignments = [
    ...(courseDetail?.assignments ?? []),
    ...(courseDetail?.topics?.flatMap((t) => t.assignments ?? []) ?? []),
  ];

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setDateError(null);

    if (!selectedAssignmentId) {
      setErrorMsg('Please select an assignment.');
      return;
    }
    if (!overrideDueDate) {
      setDateError('Please specify an override due date.');
      return;
    }
    if (
      allocation.startDate &&
      new Date(overrideDueDate).getTime() < new Date(allocation.startDate).getTime()
    ) {
      setDateError('Override due date cannot be earlier than allocation start date.');
      return;
    }
    if (
      allocation.dueDate &&
      new Date(overrideDueDate).getTime() > new Date(allocation.dueDate).getTime()
    ) {
      setDateError('Override due date cannot exceed overall course allocation due date.');
      return;
    }

    try {
      await setOverrideMutation.mutateAsync({
        id: allocation.id,
        payload: {
          assignmentId: selectedAssignmentId,
          dueDate: new Date(overrideDueDate).toISOString(),
        },
      });
      toastSuccess('Assignment due date override saved.', 'Override Saved');
      setSelectedAssignmentId('');
      setOverrideDueDate('');
      onSuccess?.();
    } catch (err: unknown) {
      setErrorMsg(err);
      toastError(
        err instanceof Error ? err.message : 'Failed to save override.',
        'Override Failed',
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isSubmitting={setOverrideMutation.isPending}
      title="Assignment Due-Date Overrides"
      description={`Set custom deadlines for individual assignments for ${allocation.user?.name ?? 'mentee'}.`}
      size="lg"
      footer={
        <Button type="button" variant="primary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Existing Overrides List */}
        <div>
          <P className="text-xs font-bold tracking-wider text-slate-500 uppercase">
            Active Overrides
          </P>
          <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {isLoadingOverrides ? (
              <P className="p-4 text-center text-xs text-slate-400">Loading overrides...</P>
            ) : !overrides || overrides.length === 0 ? (
              <P className="p-4 text-center text-xs text-slate-400">
                No custom assignment overrides set. All assignments default to allocation due date (
                {new Date(allocation.dueDate).toLocaleDateString()}).
              </P>
            ) : (
              overrides.map((ov) => (
                <div key={ov.id} className="flex items-center justify-between p-3">
                  <div>
                    <P className="text-sm font-medium text-slate-900">
                      {ov.assignment?.title ?? ov.assignmentId}
                    </P>
                    <Span className="text-xs text-slate-400">
                      Due: {new Date(ov.dueDate).toLocaleDateString()}
                    </Span>
                  </div>
                  <Span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    Overridden
                  </Span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Set New Override Form */}
        <Form
          className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
          onSubmit={(e) => void handleSaveOverride(e)}
        >
          <P className="text-xs font-bold tracking-wider text-slate-700 uppercase">
            Add or Update Assignment Override
          </P>
          {errorMsg ? (
            <ErrorMessage
              error={errorMsg}
              title="Override Failed"
              onDismiss={() => setErrorMsg(null)}
            />
          ) : null}

          <div>
            <Label htmlFor="override-assignment-select" required>
              Assignment
            </Label>
            <Select
              id="override-assignment-select"
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              className="w-full bg-white"
            >
              <option value="">-- Choose assignment --</option>
              {allAssignments.map((assign) => (
                <option key={assign.id} value={assign.id}>
                  {assign.title} (Max: {assign.maxMarks} marks)
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="override-due-date" required>
              New Due Date for Assignment
            </Label>
            <Input
              id="override-due-date"
              type="date"
              value={overrideDueDate}
              hasError={Boolean(dateError)}
              errorId="override-due-date-error"
              onChange={(e) => {
                setOverrideDueDate(e.target.value);
                if (dateError) setDateError(null);
              }}
              className="w-full bg-white"
            />
            <FieldError id="override-due-date-error" error={dateError} />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={(e) => void handleSaveOverride(e)}
              isLoading={setOverrideMutation.isPending}
              disabled={setOverrideMutation.isPending}
            >
              Apply Override
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}

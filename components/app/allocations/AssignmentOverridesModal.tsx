'use client';

import React, { useMemo, useState } from 'react';

import { Modal } from '@/components/patterns/Modal';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { FieldError } from '@/components/ui/FieldError';
import { Form } from '@/components/ui/Form';
import { Label } from '@/components/ui/Label';
import { SingleSelectDropdown } from '@/components/ui/SingleSelectDropdown';
import { P, Span } from '@/components/ui/Typography';
import {
  type CourseAllocation,
  useAssignmentOverrides,
  useSetAssignmentOverrideMutation,
} from '@/hooks/useAllocations';
import { useCourseDetail } from '@/hooks/useCourses';

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

  // Flatten course-level and topic-level assignments
  const allAssignments = useMemo(
    () => [
      ...(courseDetail?.assignments ?? []),
      ...(courseDetail?.topics?.flatMap((t) => t.assignments ?? []) ?? []),
    ],
    [courseDetail],
  );

  const assignmentOptions = useMemo(
    () =>
      allAssignments.map((assign) => ({
        value: assign.id,
        label: `${assign.title} (Max: ${assign.maxMarks} marks)`,
      })),
    [allAssignments],
  );

  if (!allocation) return null;

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
      setSelectedAssignmentId('');
      setOverrideDueDate('');
      onSuccess?.();
    } catch (err: unknown) {
      setErrorMsg(err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isSubmitting={setOverrideMutation.isPending}
      title="Due-Date Overrides"
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
              <P className="p-4 text-center text-xs text-slate-400">Not set yet</P>
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
            <SingleSelectDropdown
              id="override-assignment-select"
              value={selectedAssignmentId}
              onChange={setSelectedAssignmentId}
              options={assignmentOptions}
              placeholder="-- Choose assignment --"
              className="w-full"
              triggerClassName="w-full bg-white"
            />
          </div>

          <div>
            <Label htmlFor="override-due-date" required>
              New Date
            </Label>
            <DatePicker
              id="override-due-date"
              value={overrideDueDate}
              onChange={(val) => {
                setOverrideDueDate(val);
                if (dateError) setDateError(null);
              }}
              hasError={Boolean(dateError)}
              placeholder="Select due date"
              className="w-full"
              minDate={allocation.startDate ? allocation.startDate.split('T')[0] : undefined}
              maxDate={allocation.dueDate ? allocation.dueDate.split('T')[0] : undefined}
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
              Apply
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}

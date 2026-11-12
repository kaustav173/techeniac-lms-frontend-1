'use client';

import React, { useState } from 'react';

import { Modal } from '@/components/patterns/Modal';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { FieldError } from '@/components/ui/FieldError';
import { Form } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { H3, P, Span } from '@/components/ui/Typography';
import {
  type CourseAllocation,
  useRevokeAllocationMutation,
  useUpdateAllocationDatesMutation,
} from '@/hooks/useAllocations';

export interface EditAllocationModalProps {
  readonly allocation: CourseAllocation | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: (() => void) | undefined;
}

export function EditAllocationModal(props: EditAllocationModalProps) {
  if (!props.isOpen || !props.allocation) return null;
  return (
    <EditAllocationModalDialog key={props.allocation.id} {...props} allocation={props.allocation} />
  );
}

function EditAllocationModalDialog({
  allocation,
  isOpen,
  onClose,
  onSuccess,
}: Readonly<EditAllocationModalProps & { allocation: CourseAllocation }>) {
  const [startDate, setStartDate] = useState<string>(
    () => allocation.startDate.split('T')[0] ?? '',
  );
  const [dueDate, setDueDate] = useState<string>(() => allocation.dueDate.split('T')[0] ?? '');
  const [errorMsg, setErrorMsg] = useState<unknown>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [isConfirmingRevoke, setIsConfirmingRevoke] = useState(false);

  const updateMutation = useUpdateAllocationDatesMutation();
  const revokeMutation = useRevokeAllocationMutation();

  const durationDays = (() => {
    if (!startDate || !dueDate) return null;
    const diffMs = new Date(dueDate).getTime() - new Date(startDate).getTime();
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return days >= 0 ? `${days} Days` : 'Invalid';
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setDateError(null);

    if (startDate && dueDate && new Date(dueDate).getTime() < new Date(startDate).getTime()) {
      setDateError('Due date cannot be earlier than start date (ALC-12).');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: allocation.id,
        payload: {
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        },
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err);
    }
  };

  const handleRevoke = async () => {
    setErrorMsg(null);
    try {
      await revokeMutation.mutateAsync(allocation.id);
      setIsConfirmingRevoke(false);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Allocation"
      description={`${allocation.course?.title ?? 'Course'} • ${allocation.batch?.name ?? 'Individual Mentee'}`}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={updateMutation.isPending || revokeMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={(e) => void handleSubmit(e)}
            isLoading={updateMutation.isPending || revokeMutation.isPending}
            disabled={updateMutation.isPending || revokeMutation.isPending}
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <Form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
        {errorMsg ? (
          <ErrorMessage
            error={errorMsg}
            title="Failed to update allocation dates"
            onDismiss={() => setErrorMsg(null)}
          />
        ) : null}

        {/* Top Scope / Context Card */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <H3 className="truncate text-sm font-bold text-slate-900">
                {allocation.course?.title}
              </H3>
              <P className="text-xs text-slate-500">
                {allocation.batch
                  ? `${allocation.batch.name} (${allocation.batch.code})`
                  : 'Individual Mentee Deployment'}
              </P>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
            <Span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              {allocation.progressPercent}% Completed
            </Span>
          </div>
        </div>

        {/* SECTION 1: Schedule & Duration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <H3 className="text-sm font-semibold text-slate-900">Schedule & Duration</H3>
              {durationDays && durationDays !== 'Invalid' ? (
                <Span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  Cadence: {durationDays}
                </Span>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-start-date" required>
                Start Date
              </Label>
              <Input
                id="edit-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs"
              />
            </div>

            <div>
              <Label htmlFor="edit-due-date" required>
                Due Date
              </Label>
              <Input
                id="edit-due-date"
                type="date"
                value={dueDate}
                hasError={Boolean(dateError)}
                errorId="edit-due-date-error"
                onChange={(e) => {
                  setDueDate(e.target.value);
                  if (dateError) setDateError(null);
                }}
                className="w-full text-xs font-medium"
              />
              <FieldError id="edit-due-date-error" error={dateError} />
            </div>
          </div>
        </div>

        {/* SECTION 2: Assigned Mentee Chips */}
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between">
            <H3 className="text-xs font-semibold text-slate-700">Enrolled Mentee</H3>
            <Span className="text-[11px] text-slate-400">Single Active Enrollment</Span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs shadow-2xs">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 font-mono text-[10px] font-bold text-white">
                {allocation.user?.name ? allocation.user.name.slice(0, 2).toUpperCase() : 'ME'}
              </div>
              <Span className="font-semibold text-slate-900">
                {allocation.user?.name ?? 'Mentee'}
              </Span>
              <Span className="font-mono text-[11px] text-slate-400">
                ({allocation.user?.email})
              </Span>
            </div>
          </div>
        </div>

        {/* SECTION 3: Destructive Zone (Soft Revoke) */}
        <div className="border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50/50 p-3">
            <div className="flex items-center gap-1.5">
              <svg
                className="h-4 w-4 text-rose-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <Span className="text-xs font-bold text-rose-900">Revoke Allocation</Span>
            </div>

            {isConfirmingRevoke ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsConfirmingRevoke(false)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => void handleRevoke()}
                  isLoading={revokeMutation.isPending}
                  className="h-8 text-xs"
                >
                  Confirm Revoke
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmingRevoke(true)}
                disabled={allocation.status === 'REVOKED' || allocation.status === 'COMPLETED'}
                className="h-8 shrink-0 border-rose-300 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
              >
                {allocation.status === 'REVOKED' ? 'Already Revoked' : 'Revoke Allocation'}
              </Button>
            )}
          </div>
        </div>
      </Form>
    </Modal>
  );
}

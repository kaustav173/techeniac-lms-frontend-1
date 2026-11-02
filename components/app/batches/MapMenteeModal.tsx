'use client';

import React, { useState } from 'react';

import { Modal } from '@/components/patterns/Modal';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Form } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { P, Span } from '@/components/ui/Typography';
import { useMapMenteesMutation, useReassignMenteeMutation } from '@/hooks/useBatches';
import { formatErrorMessage } from '@/lib/errors';
import { type BatchStatus, isBatchLocked } from '@/lib/validation';

export interface MentorOption {
  id: string;
  name: string;
  email: string;
}

export interface MenteeOption {
  id: string;
  name: string;
  email: string;
}

export interface MapMenteeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batchId: string;
  batchName: string;
  batchStatus?: BatchStatus | undefined;
  mentors: MentorOption[];
  targetMentee?:
    { id: string; name: string; currentMentorName?: string | undefined } | null | undefined;
  unmappedMentees?: MenteeOption[] | undefined;
}

function getSubmitButtonLabel(
  isSubmitting: boolean,
  isReassign: boolean,
  targetMentee: { id: string } | null | undefined,
  selectedCount: number,
): string {
  if (isSubmitting) return 'Saving...';
  if (isReassign) return 'Confirm Reassignment';
  const count = targetMentee ? 1 : selectedCount;
  return `Assign Mentor (${count})`;
}

function BulkMenteeSelector({
  unmappedMentees,
  selectedMenteeIds,
  onToggleMentee,
  disabled = false,
}: Readonly<{
  unmappedMentees: MenteeOption[];
  selectedMenteeIds: string[];
  onToggleMentee: (id: string) => void;
  disabled?: boolean | undefined;
}>) {
  return (
    <div className="space-y-1.5">
      <Label>Select Mentees to Map ({selectedMenteeIds.length} selected)</Label>
      <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2">
        {unmappedMentees.length === 0 ? (
          <P className="p-3 text-center text-xs text-slate-500">
            All mentees in this cohort are already mapped to a mentor.
          </P>
        ) : (
          unmappedMentees.map((mentee) => {
            const isChecked = selectedMenteeIds.includes(mentee.id);
            return (
              <Label
                key={mentee.id}
                className={`flex items-center justify-between rounded-lg p-2 text-xs font-normal transition-colors ${
                  disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                } ${
                  isChecked
                    ? 'border border-blue-200 bg-blue-50 text-blue-900'
                    : 'bg-white text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    checked={isChecked}
                    disabled={disabled}
                    onChange={() => onToggleMentee(mentee.id)}
                  />
                  <div>
                    <P className="font-semibold text-slate-900">{mentee.name}</P>
                    <Span className="text-[11px] text-slate-500">{mentee.email}</Span>
                  </div>
                </div>
              </Label>
            );
          })
        )}
      </div>
    </div>
  );
}

export function MapMenteeModal({
  isOpen,
  onClose,
  onSuccess,
  batchId,
  batchName,
  batchStatus,
  mentors,
  targetMentee,
  unmappedMentees = [],
}: Readonly<MapMenteeModalProps>) {
  const isArchived = Boolean(batchStatus && isBatchLocked(batchStatus));
  const isReassign = Boolean(targetMentee?.currentMentorName);
  const [selectedMentorId, setSelectedMentorId] = useState<string>(mentors[0]?.id || '');
  const [selectedMenteeIds, setSelectedMenteeIds] = useState<string[]>(() =>
    targetMentee ? [targetMentee.id] : [],
  );
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: mapMentees, isPending: isMapping } = useMapMenteesMutation();
  const { mutateAsync: reassignMentee, isPending: isReassigning } = useReassignMenteeMutation();
  const isSubmitting = isMapping || isReassigning;

  if (!isOpen) return null;

  const toggleMentee = (id: string) => {
    if (isArchived) return;
    setSelectedMenteeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (isArchived) {
      setError('Cannot modify mentor assignments in an archived batch.');
      return;
    }

    if (!selectedMentorId) {
      setError('Please select an active mentor.');
      return;
    }

    try {
      if (isReassign && targetMentee) {
        if (!reason.trim()) {
          setError('A reason is required when reassigning a mentee to a new mentor.');
          return;
        }
        await reassignMentee({
          batchId,
          menteeId: targetMentee.id,
          newMentorId: selectedMentorId,
          reason: reason.trim(),
        });
      } else {
        const menteeIds = targetMentee ? [targetMentee.id] : selectedMenteeIds;
        if (menteeIds.length === 0) {
          setError('Please select at least one mentee to map.');
          return;
        }
        await mapMentees({
          batchId,
          mentorId: selectedMentorId,
          menteeIds,
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(formatErrorMessage(err, 'Failed to update mentor mapping.'));
    }
  };

  const submitLabel = getSubmitButtonLabel(
    isSubmitting,
    isReassign,
    targetMentee,
    selectedMenteeIds.length,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isSubmitting={isSubmitting}
      title={isReassign ? 'Reassign Mentor' : 'Map Mentee to Mentor'}
      description={`Assign cohort mentees to an active mentor in ${batchName} (FR-4.1 - 4.3)`}
      size="md"
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="map-mentee-form"
            variant="primary"
            disabled={isSubmitting || !selectedMentorId || isArchived}
          >
            {isArchived ? "Can't Map (Archived)" : submitLabel}
          </Button>
        </div>
      }
    >
      <Form
        id="map-mentee-form"
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="space-y-4"
      >
        {isArchived ? (
          <Alert
            variant="warning"
            title="Batch Archived"
            message="This batch is archived. Mentor assignments cannot be modified on an archived batch."
          />
        ) : null}

        {error ? <Alert variant="error" title="Mapping Validation Error" message={error} /> : null}

        {isReassign && targetMentee ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900">
            <Span className="block text-[10px] font-bold text-blue-700 uppercase">
              Current Assignment
            </Span>
            <P className="mt-1 font-semibold text-slate-900">
              Mentee: <Span className="font-bold">{targetMentee.name}</Span>
            </P>
            <P className="text-slate-600">
              Current Mentor:{' '}
              <Span className="font-semibold">{targetMentee.currentMentorName}</Span>
            </P>
          </div>
        ) : null}

        {/* Mentor Selection */}
        <div className="space-y-1.5">
          <Label htmlFor="target-mentor">Select Active Mentor</Label>
          {mentors.length === 0 ? (
            <Alert
              variant="warning"
              message="No active mentors assigned to this batch. Please enroll a mentor first."
            />
          ) : (
            <Select
              id="target-mentor"
              value={selectedMentorId}
              disabled={isSubmitting || isArchived}
              onChange={(e) => setSelectedMentorId(e.target.value)}
            >
              {mentors.map((mentor) => (
                <option key={mentor.id} value={mentor.id}>
                  {mentor.name} ({mentor.email})
                </option>
              ))}
            </Select>
          )}
        </div>

        {/* Reassignment Reason */}
        {isReassign ? (
          <div className="space-y-1.5">
            <Label htmlFor="reassign-reason">
              Reason for Reassignment <Span className="text-red-500">*</Span>
            </Label>
            <Input
              id="reassign-reason"
              placeholder="e.g., Mentor workload redistribution, domain expertise alignment"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting || isArchived}
            />
            <P className="text-[11px] text-slate-500">
              Pending review assignments will transition to the new mentor (FR-4.2).
            </P>
          </div>
        ) : null}

        {/* Bulk unmapped mentees selection */}
        {!isReassign && !targetMentee ? (
          <BulkMenteeSelector
            unmappedMentees={unmappedMentees}
            selectedMenteeIds={selectedMenteeIds}
            onToggleMentee={toggleMentee}
            disabled={isArchived}
          />
        ) : null}
      </Form>
    </Modal>
  );
}

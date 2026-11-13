'use client';

import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';

import { Modal } from '@/components/patterns/Modal';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Form } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { P, Span } from '@/components/ui/Typography';
import { useAddBatchMembersMutation } from '@/hooks/useBatches';
import { useToast } from '@/hooks/useToast';
import { userKeys, useUsers } from '@/hooks/useUsers';
import { type BatchStatus, isBatchLocked } from '@/lib/validation';

export interface AddMemberModalProps {
  batchId: string;
  batchName: string;
  batchStatus?: BatchStatus | undefined;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingMemberUserIds: string[];
}

function AddMemberCandidateList({
  isLoading,
  candidates,
  role,
  selectedUserIds,
  onToggleUser,
  disabled = false,
}: Readonly<{
  isLoading: boolean;
  candidates: Array<{ id: string; name: string; email: string; role: string }>;
  role: 'MENTEE' | 'MENTOR';
  selectedUserIds: string[];
  onToggleUser: (userId: string) => void;
  disabled?: boolean | undefined;
}>) {
  if (isLoading) {
    return (
      <P className="p-4 text-center text-xs font-medium text-slate-500">
        Loading candidate users...
      </P>
    );
  }

  if (candidates.length === 0) {
    return (
      <P className="p-4 text-center text-xs font-medium text-slate-500">
        No eligible active {role.toLowerCase()}s available to add.
      </P>
    );
  }

  return (
    <>
      {candidates.map((user) => {
        const isSelected = selectedUserIds.includes(user.id);
        return (
          <Label
            key={user.id}
            htmlFor={`user-select-${user.id}`}
            className={`flex items-center justify-between rounded-xl border p-2.5 text-xs font-normal transition-all ${
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            } ${
              isSelected
                ? 'border-blue-400 bg-blue-50/90 text-blue-900 shadow-xs ring-1 ring-blue-300'
                : 'border-slate-200 bg-white text-slate-800 shadow-xs hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                id={`user-select-${user.id}`}
                checked={isSelected}
                disabled={disabled}
                onChange={() => onToggleUser(user.id)}
              />
              <div>
                <P className="text-xs font-bold text-slate-900">{user.name}</P>
                <Span className="text-[11px] text-slate-500">{user.email}</Span>
              </div>
            </div>
            <Span
              className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${
                user.role === 'MENTOR'
                  ? 'border-purple-200 bg-purple-100 text-purple-800'
                  : 'border-blue-200 bg-blue-100 text-blue-800'
              }`}
            >
              {user.role}
            </Span>
          </Label>
        );
      })}
    </>
  );
}

export function AddMemberModal({
  batchId,
  batchName,
  batchStatus,
  isOpen,
  onClose,
  onSuccess,
  existingMemberUserIds,
}: Readonly<AddMemberModalProps>) {
  const isArchived = Boolean(batchStatus && isBatchLocked(batchStatus));
  const [role, setRole] = useState<'MENTEE' | 'MENTOR'>('MENTEE');
  const [search, setSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<unknown>(null);
  const queryClient = useQueryClient();

  const {
    users: candidates,
    isLoading: isLoadingCandidates,
    fetchUsers,
  } = useUsers(
    {
      role,
      status: 'active',
      withoutActiveBatch: role === 'MENTEE' ? true : undefined,
      limit: 100,
    },
    { enabled: isOpen },
  );

  const { mutateAsync: addMembers, isPending: isSubmitting } = useAddBatchMembersMutation();
  const { toastSuccess, toastError } = useToast();

  const handleRoleChange = (newRole: 'MENTEE' | 'MENTOR') => {
    if (isArchived) return;
    setRole(newRole);
    setSelectedUserIds([]);
    setSubmitError(null);
    void fetchUsers({
      role: newRole,
      status: 'active',
      withoutActiveBatch: newRole === 'MENTEE' ? true : undefined,
      limit: 100,
    });
  };

  if (!isOpen) return null;

  const filteredCandidates = candidates.filter((user) => {
    if (existingMemberUserIds.includes(user.id)) return false;
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
  });

  const toggleUser = (userId: string) => {
    if (isArchived) return;
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isArchived) {
      setSubmitError('Cannot add members to an archived batch.');
      return;
    }
    if (selectedUserIds.length === 0) {
      setSubmitError('Please select at least one user to add.');
      return;
    }
    setSubmitError(null);

    try {
      await addMembers({
        batchId,
        userIds: selectedUserIds,
        memberRole: role,
      });
      toastSuccess(
        `Enrolled ${selectedUserIds.length} ${role.toLowerCase()}${selectedUserIds.length === 1 ? '' : 's'} into ${batchName}.`,
        'Members Enrolled',
      );
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      setSelectedUserIds([]);
      setSearch('');
      setSubmitError(null);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setSubmitError(err);
      toastError(
        err instanceof Error ? err.message : 'Failed to add members to batch.',
        'Enrollment Failed',
      );
    }
  };

  const handleClose = () => {
    setSelectedUserIds([]);
    setSearch('');
    setSubmitError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isSubmitting={isSubmitting}
      title="Add Batch Members"
      description={
        <Span className="text-xs text-slate-600">
          Enroll mentors or mentees into{' '}
          <Span className="font-bold text-slate-900">{batchName}</Span>
        </Span>
      }
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between">
          <Span className="text-xs font-semibold text-slate-600">
            {selectedUserIds.length} candidate{selectedUserIds.length === 1 ? '' : 's'} selected
          </Span>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-member-form"
              variant="primary"
              size="sm"
              disabled={isSubmitting || selectedUserIds.length === 0 || isArchived}
              isLoading={isSubmitting}
            >
              {isArchived ? "Can't Add (Archived)" : `Add Selected (${selectedUserIds.length})`}
            </Button>
          </div>
        </div>
      }
    >
      <Form
        id="add-member-form"
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="space-y-4"
      >
        {isArchived ? (
          <Alert
            variant="warning"
            title="Batch Archived"
            message="This batch is archived. You cannot add new members to an archived batch."
          />
        ) : null}

        {submitError ? (
          <ErrorMessage
            error={submitError}
            title="Enrollment Failed"
            onDismiss={() => setSubmitError(null)}
          />
        ) : null}

        {/* Role toggle */}
        <div className="space-y-1.5">
          <Label required>Select Role to Enroll</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={role === 'MENTEE' ? 'primary' : 'secondary'}
              size="sm"
              disabled={isArchived}
              onClick={() => handleRoleChange('MENTEE')}
              className={
                role === 'MENTEE'
                  ? 'bg-blue-600 font-bold text-white shadow-xs'
                  : 'font-semibold text-slate-700'
              }
            >
              Mentees
            </Button>
            <Button
              type="button"
              variant={role === 'MENTOR' ? 'primary' : 'secondary'}
              size="sm"
              disabled={isArchived}
              onClick={() => handleRoleChange('MENTOR')}
              className={
                role === 'MENTOR'
                  ? 'bg-blue-600 font-bold text-white shadow-xs'
                  : 'font-semibold text-slate-700'
              }
            >
              Mentors
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="space-y-1.5">
          <Label htmlFor="candidate-search">Search Candidates</Label>
          <Input
            id="candidate-search"
            type="text"
            placeholder={`Search ${role.toLowerCase()}s by name or email...`}
            value={search}
            disabled={isArchived}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Candidate list */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>
              Eligible {role === 'MENTEE' ? 'Mentees' : 'Mentors'} ({filteredCandidates.length})
            </Label>
            {filteredCandidates.length > 0 && !isArchived ? (
              <Span className="text-[11px] text-slate-500">Click to select</Span>
            ) : null}
          </div>
          <div className="max-h-60 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/70 p-2">
            <AddMemberCandidateList
              isLoading={isLoadingCandidates}
              candidates={filteredCandidates}
              role={role}
              selectedUserIds={selectedUserIds}
              onToggleUser={toggleUser}
              disabled={isArchived}
            />
          </div>
        </div>
      </Form>
    </Modal>
  );
}

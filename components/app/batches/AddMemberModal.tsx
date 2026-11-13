'use client';

import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useRef, useState } from 'react';

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
import { useInfiniteUsers, userKeys } from '@/hooks/useUsers';
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
  isFetchingNextPage,
  hasNextPage,
  onFetchNextPage,
  candidates,
  role,
  selectedUserIds,
  onToggleUser,
  search,
  disabled = false,
}: Readonly<{
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onFetchNextPage: () => void;
  candidates: Array<{ id: string; name: string; email: string; role: string }>;
  role: 'MENTEE' | 'MENTOR';
  selectedUserIds: string[];
  onToggleUser: (userId: string) => void;
  search: string;
  disabled?: boolean | undefined;
}>) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 60) {
      if (hasNextPage && !isFetchingNextPage) {
        onFetchNextPage();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0044D3] border-t-transparent" />
        <P className="mt-2 text-xs font-medium text-slate-500">Loading {role.toLowerCase()}s...</P>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <P className="p-8 text-center text-xs font-medium text-slate-500">
        {search.trim()
          ? `No active ${role.toLowerCase()}s found matching "${search}".`
          : `No eligible active ${role.toLowerCase()}s available to add.`}
      </P>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/70 p-2"
    >
      {candidates.map((user) => {
        const isSelected = selectedUserIds.includes(user.id);
        return (
          <Label
            key={user.id}
            htmlFor={`user-select-${user.id}`}
            className={`flex items-center justify-between gap-3 rounded-xl border p-2.5 text-xs font-normal transition-all ${
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            } ${
              isSelected
                ? 'border-blue-400 bg-blue-50/90 text-blue-900 shadow-xs ring-1 ring-blue-300'
                : 'border-slate-200 bg-white text-slate-800 shadow-xs hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <Checkbox
                id={`user-select-${user.id}`}
                checked={isSelected}
                disabled={disabled}
                onChange={() => onToggleUser(user.id)}
              />
              <Span className="truncate text-xs font-semibold text-slate-900">{user.name}</Span>
            </div>
            <Span className="shrink-0 text-xs font-medium text-slate-500">{user.email}</Span>
          </Label>
        );
      })}

      {isFetchingNextPage && (
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0044D3] border-t-transparent" />
          <Span className="text-xs font-medium text-slate-500">Loading more...</Span>
        </div>
      )}
    </div>
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedMenteeIds, setSelectedMenteeIds] = useState<string[]>([]);
  const [selectedMentorIds, setSelectedMentorIds] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<unknown>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteUsers(
    {
      role,
      status: 'active',
      search: debouncedSearch,
      limit: 10,
    },
    { enabled: isOpen },
  );

  const { mutateAsync: addMembers, isPending: isSubmitting } = useAddBatchMembersMutation();
  const { toastSuccess, toastError } = useToast();

  const candidates = useMemo(() => {
    if (!data?.pages) return [];
    const flat = data.pages.flatMap((page) => page.users);
    return flat.filter((user) => !existingMemberUserIds.includes(user.id));
  }, [data, existingMemberUserIds]);

  const totalCandidatesCount = data?.pages[0]?.total ?? candidates.length;

  const totalSelectedCount = selectedMenteeIds.length + selectedMentorIds.length;

  const toggleUser = (userId: string) => {
    if (isArchived) return;
    if (role === 'MENTEE') {
      setSelectedMenteeIds((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
      );
    } else {
      setSelectedMentorIds((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
      );
    }
  };

  const handleRoleChange = (newRole: 'MENTEE' | 'MENTOR') => {
    if (isArchived) return;
    setRole(newRole);
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isArchived) {
      setSubmitError('Cannot add members to an archived batch.');
      return;
    }
    if (totalSelectedCount === 0) {
      setSubmitError('Please select at least one user to add.');
      return;
    }
    setSubmitError(null);

    try {
      if (selectedMenteeIds.length > 0) {
        await addMembers({
          batchId,
          userIds: selectedMenteeIds,
          memberRole: 'MENTEE',
        });
      }
      if (selectedMentorIds.length > 0) {
        await addMembers({
          batchId,
          userIds: selectedMentorIds,
          memberRole: 'MENTOR',
        });
      }
      toastSuccess(
        `Enrolled ${totalSelectedCount} member${totalSelectedCount === 1 ? '' : 's'} into ${batchName}.`,
        'Members Enrolled',
      );
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: ['users', 'infinite'] });
      setSelectedMenteeIds([]);
      setSelectedMentorIds([]);
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
    setSelectedMenteeIds([]);
    setSelectedMentorIds([]);
    setSearch('');
    setSubmitError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isSubmitting={isSubmitting}
      title="Add Batch Members"
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between">
          <Span className="text-xs font-semibold text-slate-600">
            {totalSelectedCount} candidate{totalSelectedCount === 1 ? '' : 's'} selected
            {selectedMenteeIds.length > 0 && selectedMentorIds.length > 0
              ? ` (${selectedMenteeIds.length} mentee${selectedMenteeIds.length === 1 ? '' : 's'}, ${selectedMentorIds.length} mentor${selectedMentorIds.length === 1 ? '' : 's'})`
              : null}
          </Span>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-full px-5 py-2 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-member-form"
              variant="primary"
              size="sm"
              disabled={isSubmitting || totalSelectedCount === 0 || isArchived}
              isLoading={isSubmitting}
              className="rounded-full bg-[#0044D3] px-5 py-2 text-xs font-semibold text-white hover:bg-[#0039B3]"
            >
              {isArchived ? "Can't Add (Archived)" : `Add Selected (${totalSelectedCount})`}
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
                  ? 'rounded-full bg-blue-600 font-bold text-white shadow-xs'
                  : 'rounded-full font-semibold text-slate-700'
              }
            >
              Mentees {selectedMenteeIds.length > 0 ? `(${selectedMenteeIds.length})` : ''}
            </Button>
            <Button
              type="button"
              variant={role === 'MENTOR' ? 'primary' : 'secondary'}
              size="sm"
              disabled={isArchived}
              onClick={() => handleRoleChange('MENTOR')}
              className={
                role === 'MENTOR'
                  ? 'rounded-full bg-blue-600 font-bold text-white shadow-xs'
                  : 'rounded-full font-semibold text-slate-700'
              }
            >
              Mentors {selectedMentorIds.length > 0 ? `(${selectedMentorIds.length})` : ''}
            </Button>
          </div>
        </div>

        {/* Global Search */}
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

        {/* Candidate list with infinite scroll */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>
              Eligible {role === 'MENTEE' ? 'Mentees' : 'Mentors'} ({totalCandidatesCount})
            </Label>
            {candidates.length > 0 && !isArchived ? (
              <Span className="text-[11px] text-slate-500">Click to select</Span>
            ) : null}
          </div>
          <AddMemberCandidateList
            isLoading={isLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={Boolean(hasNextPage)}
            onFetchNextPage={() => void fetchNextPage()}
            candidates={candidates}
            role={role}
            selectedUserIds={role === 'MENTEE' ? selectedMenteeIds : selectedMentorIds}
            onToggleUser={toggleUser}
            search={search}
            disabled={isArchived}
          />
        </div>
      </Form>
    </Modal>
  );
}

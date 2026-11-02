'use client';

import React, { useId, useState } from 'react';

import { Modal } from '@/components/patterns/Modal';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Form } from '@/components/ui/Form';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { P, Span } from '@/components/ui/Typography';
import { useRoleImpact } from '@/hooks/useRoleImpact';
import { type ChangeRoleFormData, changeRoleSchema, type UserRole } from '@/lib/validation';

import { ReassignWizardModal } from './ReassignWizardModal';

export interface UserToChangeRole {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  currentRole?: UserRole;
}

export interface ChangeRoleModalProps {
  user: UserToChangeRole | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userId: string, data: ChangeRoleFormData) => Promise<void>;
}

export const SUPER_ADMIN_ROLE_IMMUTABLE_MESSAGE = 'Super Admin role cannot be changed';

const ALLOWED_ROLE_TRANSITIONS: Record<UserRole, UserRole[]> = {
  MENTEE: ['MENTOR'],
  MENTOR: ['SUPER_ADMIN'],
  SUPER_ADMIN: [],
};

function getDefaultTargetRole(currentRole: UserRole): UserRole {
  const allowed = ALLOWED_ROLE_TRANSITIONS[currentRole];
  if (allowed && allowed.length > 0) {
    return allowed[0] ?? currentRole;
  }
  return currentRole;
}

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'MENTOR':
      return 'Mentor';
    case 'MENTEE':
      return 'Mentee';
  }
}

function ChangeRoleModalContent({
  user,
  onClose,
  onSuccess,
}: {
  user: UserToChangeRole;
  onClose: () => void;
  onSuccess: (userId: string, data: ChangeRoleFormData) => Promise<void>;
}) {
  const currentRole: UserRole = user.currentRole ?? user.role;
  const isSuperAdmin = currentRole === 'SUPER_ADMIN';
  const availableTargetRoles = ALLOWED_ROLE_TRANSITIONS[currentRole] ?? [];
  const hasAvailableTransitions = availableTargetRoles.length > 0;
  const [newRole, setNewRole] = useState<UserRole>(getDefaultTargetRole(currentRole));
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const confirmCheckboxId = useId();

  const { roleImpact, isLoadingImpact } = useRoleImpact({
    userId: user.id,
    newRole,
    enabled: currentRole !== newRole && availableTargetRoles.includes(newRole),
  });

  const isBlocked = isSuperAdmin || (roleImpact?.isBlocked ?? false);
  const blockReason = roleImpact?.blockReason;
  const hasActiveMentees = !isSuperAdmin && isBlocked && blockReason === 'ACTIVE_MENTEES';

  const canSubmit =
    hasAvailableTransitions &&
    !isLoadingImpact &&
    !isBlocked &&
    confirmed &&
    reason.trim().length >= 10 &&
    reason.trim().length <= 500 &&
    !isSubmitting;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (isLoadingImpact) {
      setError('Please wait while system checks live role impact.');
      return;
    }

    if (isBlocked) {
      setError(roleImpact?.impactSummary ?? 'Role change cannot proceed in this state.');
      return;
    }

    if (!confirmed) {
      setError('Please acknowledge and confirm the role change impact.');
      return;
    }

    const result = changeRoleSchema.safeParse({ newRole, reason });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Invalid role change parameters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSuccess(user.id, result.data);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Change Role"
        size="md"
        isSubmitting={isSubmitting}
        footer={
          <div className="flex w-full items-center justify-end gap-3">
            <Button variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
              {hasAvailableTransitions ? 'Cancel' : 'Close'}
            </Button>
            {hasAvailableTransitions && (
              <Button
                type="button"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                disabled={!canSubmit}
                onClick={() => void handleSubmit()}
              >
                Change Role
              </Button>
            )}
          </div>
        }
      >
        <Form
          id="change-role-form"
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="space-y-4"
        >
          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700"
            >
              {error}
            </div>
          ) : null}

          {/* User Identity Ribbon */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <P className="text-sm font-bold text-slate-900">{user.name}</P>
              <P className="text-xs text-slate-500">{user.email}</P>
            </div>
            <Span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-800">
              Current: {getRoleLabel(currentRole)}
            </Span>
          </div>

          {/* Super Admin Immutable Alert */}
          {isSuperAdmin && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-xs text-blue-950">
              <P className="font-bold text-blue-900">Role Modification Restricted</P>
              <P className="mt-1 text-slate-700">{SUPER_ADMIN_ROLE_IMMUTABLE_MESSAGE}.</P>
            </div>
          )}

          {/* Target Role Selector */}
          {hasAvailableTransitions ? (
            <div className="space-y-1.5">
              <Label
                htmlFor="target-role"
                required
                className="text-sm font-semibold text-slate-900"
              >
                New Assigned Role
              </Label>
              <Select
                id="target-role"
                value={newRole}
                onChange={(e) => {
                  setNewRole(e.target.value as UserRole);
                  setConfirmed(false);
                }}
                className="h-11 font-semibold"
              >
                {availableTargetRoles.map((role) => (
                  <option key={role} value={role}>
                    {getRoleLabel(role)}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          {/* Blocked Alert: Active Mentees requiring Wizard */}
          {hasActiveMentees && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950">
              <P className="font-bold text-amber-900">Active Mentees Require Reassignment</P>
              <P className="mt-1 text-slate-700">
                This mentor is assigned to {roleImpact?.activeMenteesCount} mentee(s). Please
                reassign them before changing role.
              </P>
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setIsWizardOpen(true)}
                >
                  Open Reassignment Wizard
                </Button>
              </div>
            </div>
          )}

          {/* Reason Field */}
          {hasAvailableTransitions ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="role-reason"
                  required
                  className="text-sm font-semibold text-slate-900"
                >
                  Reason
                </Label>
                <Span
                  className={`text-xs ${
                    reason.length < 10 ? 'font-semibold text-amber-800' : 'text-slate-400'
                  }`}
                >
                  {reason.length} / 500 (min 10)
                </Span>
              </div>
              <Textarea
                id="role-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for role change (minimum 10 characters)..."
                className="text-sm"
              />
            </div>
          ) : null}

          {/* Confirmation Checkbox */}
          {!isBlocked && (
            <Label
              htmlFor={confirmCheckboxId}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50"
            >
              <Checkbox
                id={confirmCheckboxId}
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <Span className="text-xs font-medium text-slate-700">I confirm this role change</Span>
            </Label>
          )}
        </Form>
      </Modal>

      {/* Reassignment Wizard Modal when active mentees exist */}
      {hasActiveMentees && isWizardOpen && (
        <ReassignWizardModal
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          sourceMentor={{
            id: user.id,
            name: user.name,
            email: user.email,
          }}
          activeMentees={roleImpact?.activeMentees ?? []}
          onComplete={() => {
            setIsWizardOpen(false);
          }}
        />
      )}
    </>
  );
}

export function ChangeRoleModal({ user, isOpen, onClose, onSuccess }: ChangeRoleModalProps) {
  if (!isOpen || !user) return null;
  return (
    <ChangeRoleModalContent key={user.id} user={user} onClose={onClose} onSuccess={onSuccess} />
  );
}

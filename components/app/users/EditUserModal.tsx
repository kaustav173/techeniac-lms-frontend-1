'use client';

import React, { useId, useState } from 'react';

import { Modal } from '@/components/patterns/Modal';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Form } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { P, Span } from '@/components/ui/Typography';
import { useRoleImpact } from '@/hooks/useRoleImpact';
import { formatRoleLabel } from '@/lib/roles';
import {
  type ChangeRoleFormData,
  changeRoleSchema,
  editUserSchema,
  type UserRole,
} from '@/lib/validation';

import { ReassignWizardModal } from './ReassignWizardModal';

export interface UserToEdit {
  id: string;
  name: string;
  email: string;
  role?: string | undefined;
  isLastSuperAdmin?: boolean | undefined;
}

export interface EditUserModalProps {
  user: UserToEdit | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userId: string, data: { name: string; email: string }) => Promise<void>;
  onRoleChangeSuccess?: ((userId: string, data: ChangeRoleFormData) => Promise<void>) | undefined;
  onChangeRoleClick?: ((user: UserToEdit) => void) | undefined;
  canChangeRole?: boolean | undefined;
}

const ALLOWED_ROLE_TRANSITIONS: Record<UserRole, UserRole[]> = {
  MENTEE: ['MENTOR'],
  MENTOR: ['SUPER_ADMIN'],
  SUPER_ADMIN: [],
};

function EditUserModalContent({
  user,
  onClose,
  onSuccess,
  onRoleChangeSuccess,
  canChangeRole = false,
}: {
  user: UserToEdit;
  onClose: () => void;
  onSuccess: (userId: string, data: { name: string; email: string }) => Promise<void>;
  onRoleChangeSuccess?: ((userId: string, data: ChangeRoleFormData) => Promise<void>) | undefined;
  canChangeRole?: boolean | undefined;
}) {
  const currentRole: UserRole = (user.role as UserRole) || 'MENTEE';
  const isSuperAdmin = currentRole === 'SUPER_ADMIN';
  const availableTargetRoles = ALLOWED_ROLE_TRANSITIONS[currentRole] ?? [];

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const confirmCheckboxId = useId();

  const isRoleChanging = canChangeRole && selectedRole !== currentRole;

  const { roleImpact, isLoadingImpact } = useRoleImpact({
    userId: user.id,
    newRole: selectedRole,
    enabled: isRoleChanging,
  });

  const isBlocked = isSuperAdmin || (isRoleChanging && Boolean(roleImpact?.isBlocked));
  const blockReason = roleImpact?.blockReason;
  const hasActiveMentees =
    isRoleChanging && !isSuperAdmin && isBlocked && blockReason === 'ACTIVE_MENTEES';

  const canSubmit = isRoleChanging
    ? !isLoadingImpact &&
      !isBlocked &&
      confirmed &&
      reason.trim().length >= 10 &&
      reason.trim().length <= 500 &&
      !isSubmitting
    : !isSubmitting;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const parsedUser = editUserSchema.pick({ name: true, email: true }).safeParse({
      name,
      email,
    });

    if (!parsedUser.success) {
      setError(parsedUser.error.issues[0]?.message ?? 'Invalid input details.');
      return;
    }

    if (isRoleChanging) {
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
      const roleResult = changeRoleSchema.safeParse({ newRole: selectedRole, reason });
      if (!roleResult.success) {
        setError(roleResult.error.issues[0]?.message ?? 'Invalid role change parameters.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (name.trim() !== user.name.trim() || email.trim() !== user.email.trim()) {
        await onSuccess(user.id, parsedUser.data);
      }
      if (isRoleChanging && onRoleChangeSuccess) {
        await onRoleChangeSuccess(user.id, { newRole: selectedRole, reason: reason.trim() });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Edit User"
        description="Update profile details and role permissions in a single view."
        size="md"
        isSubmitting={isSubmitting}
        footer={
          <div className="flex w-full items-center justify-end gap-3">
            <Button variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-user-form"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              disabled={!canSubmit}
              onClick={() => void handleSubmit()}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700"
          >
            {error}
          </div>
        ) : null}

        <Form
          id="edit-user-form"
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="edit-name" required className="text-xs font-semibold text-slate-700">
              Full Name
            </Label>
            <Input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-email" required className="text-xs font-semibold text-slate-700">
              Email Address
            </Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-sm"
              required
            />
          </div>

          {/* Role Section */}
          <div className="space-y-1.5 pt-1">
            <Label htmlFor="edit-role" className="text-xs font-semibold text-slate-700">
              Assigned Role
            </Label>

            {canChangeRole && availableTargetRoles.length > 0 ? (
              <Select
                id="edit-role"
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value as UserRole);
                  setConfirmed(false);
                }}
                className="h-10 text-sm font-semibold"
              >
                <option value={currentRole}>{formatRoleLabel(currentRole)} (Current)</option>
                {availableTargetRoles.map((role) => (
                  <option key={role} value={role}>
                    {formatRoleLabel(role)} (Promotion)
                  </option>
                ))}
              </Select>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <Span className="text-sm font-bold text-slate-900">
                  {formatRoleLabel(currentRole)}
                </Span>
                <Span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {isSuperAdmin ? 'Role Immutable' : 'Current Role'}
                </Span>
              </div>
            )}
          </div>

          {/* Super Admin Restricted Notice */}
          {isSuperAdmin && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900">
              <P className="font-semibold text-blue-950">Role Modification Restricted</P>
              <P className="mt-0.5 text-slate-600">
                Super Admin accounts cannot be demoted or changed.
              </P>
            </div>
          )}

          {/* Inline Role Transition Card */}
          {isRoleChanging && (
            <div className="space-y-3.5 rounded-2xl border border-blue-200/90 bg-blue-50/50 p-4">
              <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                <Span className="text-xs font-bold text-[#0044D3]">
                  Role Transition: {formatRoleLabel(currentRole)} &rarr;{' '}
                  {formatRoleLabel(selectedRole)}
                </Span>
                {isLoadingImpact && (
                  <Span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                    <Span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    Checking impact...
                  </Span>
                )}
              </div>

              {/* Blocked Alert: Active Mentees */}
              {hasActiveMentees && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
                  <P className="font-bold text-amber-900">Active Mentees Require Reassignment</P>
                  <P className="mt-0.5 text-slate-700">
                    This mentor is assigned to {roleImpact?.activeMenteesCount} mentee(s). Please
                    reassign them before promoting.
                  </P>
                  <div className="mt-2.5 flex justify-end">
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

              {/* Generic Blocked Alert */}
              {!hasActiveMentees && isBlocked && roleImpact?.impactSummary && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  {roleImpact.impactSummary}
                </div>
              )}

              {/* Audit Reason Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="role-reason"
                    required
                    className="text-xs font-semibold text-slate-700"
                  >
                    Audit Reason
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
                  <Span className="text-xs font-medium text-slate-700">
                    I confirm this role transition and understand its permissions
                  </Span>
                </Label>
              )}
            </div>
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

export function EditUserModal({
  user,
  isOpen,
  onClose,
  onSuccess,
  onRoleChangeSuccess,
  canChangeRole,
}: EditUserModalProps) {
  if (!isOpen || !user) return null;
  return (
    <EditUserModalContent
      key={user.id}
      user={user}
      onClose={onClose}
      onSuccess={onSuccess}
      onRoleChangeSuccess={onRoleChangeSuccess}
      canChangeRole={canChangeRole}
    />
  );
}

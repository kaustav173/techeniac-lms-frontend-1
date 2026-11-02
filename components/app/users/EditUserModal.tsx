'use client';

import React, { useState } from 'react';

import { Modal } from '@/components/patterns/Modal';
import { Button } from '@/components/ui/Button';
import { Form } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Span } from '@/components/ui/Typography';
import { formatRoleLabel } from '@/lib/roles';
import { editUserSchema } from '@/lib/validation';

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
  onChangeRoleClick?: ((user: UserToEdit) => void) | undefined;
  canChangeRole?: boolean | undefined;
}

function EditUserModalContent({
  user,
  onClose,
  onSuccess,
  onChangeRoleClick,
  canChangeRole = false,
}: {
  user: UserToEdit;
  onClose: () => void;
  onSuccess: (userId: string, data: { name: string; email: string }) => Promise<void>;
  onChangeRoleClick?: ((user: UserToEdit) => void) | undefined;
  canChangeRole?: boolean | undefined;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const parsed = editUserSchema.pick({ name: true, email: true }).safeParse({
      name,
      email,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input details.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSuccess(user.id, parsed.data);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit User Details"
      description="Update the display name or primary email for this account."
      size="sm"
      isSubmitting={isSubmitting}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-user-form"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            onClick={() => void handleSubmit()}
          >
            Save Changes
          </Button>
        </>
      }
    >
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
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
          <Label htmlFor="edit-name" required>
            Full Name
          </Label>
          <Input
            id="edit-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-email" required>
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

        {/* Current Role Display & Option to Change Role */}
        <div className="flex items-center justify-between rounded-2xl border border-[#E1E6EC] bg-[#F6F8FC] p-3.5">
          <div className="space-y-0.5">
            <Span className="block text-[11px] font-bold tracking-wider text-[#667085] uppercase">
              Current Role
            </Span>
            <Span className="text-sm font-bold text-slate-900">
              {user.role ? formatRoleLabel(user.role) : 'Mentee'}
            </Span>
          </div>
          {canChangeRole && onChangeRoleClick ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onChangeRoleClick(user);
              }}
              className="h-8 rounded-full border-blue-200 bg-white px-3 text-xs font-semibold text-[#0044D3] shadow-2xs hover:bg-blue-50"
            >
              Change Role
            </Button>
          ) : null}
        </div>
      </Form>
    </Modal>
  );
}

export function EditUserModal({
  user,
  isOpen,
  onClose,
  onSuccess,
  onChangeRoleClick,
  canChangeRole,
}: EditUserModalProps) {
  if (!isOpen || !user) return null;
  return (
    <EditUserModalContent
      key={user.id}
      user={user}
      onClose={onClose}
      onSuccess={onSuccess}
      onChangeRoleClick={onChangeRoleClick}
      canChangeRole={canChangeRole}
    />
  );
}

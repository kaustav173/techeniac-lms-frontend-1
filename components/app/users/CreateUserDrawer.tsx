'use client';

import React, { useCallback, useRef, useState } from 'react';

import { Modal } from '@/components/patterns/Modal';
import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { Form } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  SingleSelectDropdown,
  type SingleSelectOption,
} from '@/components/ui/SingleSelectDropdown';
import { Span } from '@/components/ui/Typography';
import { type CreateUserFormData, createUserSchema, type UserRole } from '@/lib/validation';

const ROLE_OPTIONS: readonly SingleSelectOption<UserRole>[] = [
  { value: 'MENTOR', label: 'Mentor' },
  { value: 'MENTEE', label: 'Mentee' },
  { value: 'SUPER_ADMIN', label: 'Admin' },
];

export interface CreateUserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: CreateUserFormData) => Promise<void>;
}

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserDrawerProps) {
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('MENTEE');
  const [errors, setErrors] = useState<{
    name?: string | undefined;
    email?: string | undefined;
    general?: string | undefined;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetAndClose = useCallback(() => {
    if (isSubmitting) return;
    setName('');
    setEmail('');
    setRole('MENTEE');
    setErrors({});
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrors({});

    const result = createUserSchema.safeParse({ name, email, role });
    if (!result.success) {
      const fieldErrors: { name?: string; email?: string } = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (field === 'name' && !fieldErrors.name) {
          fieldErrors.name = issue.message;
        } else if (field === 'email' && !fieldErrors.email) {
          fieldErrors.email = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSuccess(result.data);
      setName('');
      setEmail('');
      setRole('MENTEE');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create user';
      setErrors((prev) => ({ ...prev, general: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title="Create User"
      size="md"
      initialFocusRef={nameInputRef}
      isSubmitting={isSubmitting}
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetAndClose}
            disabled={isSubmitting}
            className="rounded-xl px-4 py-2 text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-user-modal-form"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            className="rounded-xl bg-[#0044D3] px-5 py-2 text-xs font-semibold text-white hover:bg-[#0039B3]"
          >
            Create User
          </Button>
        </div>
      }
    >
      {errors.general ? (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700"
        >
          {errors.general}
        </div>
      ) : null}

      <Form
        id="create-user-modal-form"
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="space-y-4"
      >
        {/* Name Field */}
        <div>
          <Label
            htmlFor="create-user-name"
            className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-800"
          >
            <Span>Name</Span>
            <Span className="text-red-500">*</Span>
          </Label>
          <Input
            ref={nameInputRef}
            id="create-user-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder="John Doe"
            hasError={Boolean(errors.name)}
            disabled={isSubmitting}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium focus:border-[#0044D3]"
          />
          <FieldError error={errors.name} />
        </div>

        {/* Email Field */}
        <div>
          <Label
            htmlFor="create-user-email"
            className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-800"
          >
            <Span>Email</Span>
            <Span className="text-red-500">*</Span>
          </Label>
          <Input
            id="create-user-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="john@example.com"
            hasError={Boolean(errors.email)}
            disabled={isSubmitting}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium focus:border-[#0044D3]"
          />
          <FieldError error={errors.email} />
        </div>

        {/* Role Field */}
        <div>
          <Label
            htmlFor="create-user-role"
            className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-800"
          >
            <Span>Role</Span>
            <Span className="text-red-500">*</Span>
          </Label>
          <SingleSelectDropdown<UserRole>
            id="create-user-role"
            value={role}
            onChange={(val) => setRole(val)}
            options={ROLE_OPTIONS}
            disabled={isSubmitting}
            size="md"
            aria-label="Role"
          />
        </div>
      </Form>
    </Modal>
  );
}

// Retain alias for existing imports
export const CreateUserDrawer = CreateUserModal;

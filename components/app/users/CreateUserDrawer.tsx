'use client';

import React, { useCallback, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { Form } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  SingleSelectDropdown,
  type SingleSelectOption,
} from '@/components/ui/SingleSelectDropdown';
import { H2, Span } from '@/components/ui/Typography';
import { useDialogAccessibility } from '@/hooks/useDialogAccessibility';
import { type CreateUserFormData, createUserSchema, type UserRole } from '@/lib/validation';

const ROLE_OPTIONS: readonly SingleSelectOption<UserRole>[] = [
  { value: 'MENTEE', label: 'Mentee (Learner)' },
  { value: 'MENTOR', label: 'Mentor (Instructor / Reviewer)' },
  { value: 'SUPER_ADMIN', label: 'Super Admin (Administrator)' },
];

export interface CreateUserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: CreateUserFormData) => Promise<void>;
}

export function CreateUserDrawer({ isOpen, onClose, onSuccess }: CreateUserDrawerProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('MENTEE');
  const [errors, setErrors] = useState<{ name?: string; email?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetAndClose = useCallback(() => {
    if (isSubmitting) return;
    setName('');
    setEmail('');
    setRole('MENTEE');
    setErrors({});
    onClose();
  }, [isSubmitting, onClose]);

  useDialogAccessibility({
    isOpen,
    onClose: handleResetAndClose,
    dialogRef,
    initialFocusRef: nameInputRef,
    preventClose: isSubmitting,
  });

  if (!isOpen) return null;

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
    <div
      onClick={handleResetAndClose}
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity"
      aria-label="Create user drawer overlay"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-user-drawer-title"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-lg flex-col justify-between border-l border-[#E1E6EC] bg-white shadow-2xl transition-transform duration-300 ease-in-out"
      >
        {/* Top Header Bar with Save Changes and Circular Close Button */}
        <div className="flex items-center justify-between border-b border-[#E1E6EC] bg-white px-6 py-4">
          <H2 id="create-user-drawer-title" className="text-xl font-bold text-slate-900">
            Create User
          </H2>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetAndClose}
              aria-label="Close drawer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Scrollable Body: Clean Form without Nested Background Card */}
        <div className="flex-1 overflow-y-auto p-6">
          {errors.general ? (
            <div
              role="alert"
              className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700"
            >
              {errors.general}
            </div>
          ) : null}

          <Form
            id="create-user-form"
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
            className="space-y-5"
          >
            {/* Full Name */}
            <div>
              <Label
                htmlFor="create-name"
                className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-slate-900"
              >
                <Span>Full Name</Span>
                <Span className="text-sm font-bold text-red-500">*</Span>
              </Label>
              <Input
                ref={nameInputRef}
                id="create-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Amit Sharma"
                hasError={Boolean(errors.name)}
                disabled={isSubmitting}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium transition-all focus:border-[#0044D3]"
              />
              <FieldError error={errors.name} />
            </div>

            {/* Email Address */}
            <div>
              <Label
                htmlFor="create-email"
                className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-slate-900"
              >
                <Span>Email Address</Span>
                <Span className="text-sm font-bold text-red-500">*</Span>
              </Label>
              <Input
                id="create-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="amit@TechEniac.com"
                hasError={Boolean(errors.email)}
                disabled={isSubmitting}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium transition-all focus:border-[#0044D3]"
              />
              <FieldError error={errors.email} />
            </div>

            {/* Role Assignment */}
            <div>
              <Label
                htmlFor="create-role"
                className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-slate-900"
              >
                <Span>Role Assignment</Span>
                <Span className="text-sm font-bold text-red-500">*</Span>
              </Label>
              <SingleSelectDropdown<UserRole>
                id="create-role"
                value={role}
                onChange={(val) => setRole(val)}
                options={ROLE_OPTIONS}
                disabled={isSubmitting}
                size="md"
                aria-label="Role Assignment"
              />
            </div>

            {/* Bottom Action Button */}
            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="h-11 w-full rounded-xl bg-[#0044D3] text-sm font-bold text-white shadow-xs hover:bg-[#0039B3]"
              >
                Create User & Send Invite
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

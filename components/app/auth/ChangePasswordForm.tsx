'use client';

import Link from 'next/link';
import React, { useState } from 'react';

import { Button, getButtonClassName } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { Form } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { H3, P } from '@/components/ui/Typography';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/errors';
import { changePasswordSchema, extractZodErrors } from '@/lib/validation';

import { PasswordVisibilityToggle } from './PasswordVisibilityToggle';

export function ChangePasswordForm() {
  const { changePassword, refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrors({});

    const result = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!result.success) {
      setErrors(extractZodErrors(result.error.issues));
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      await refreshUser();
      setIsSuccess(true);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to update password. Please try again.';
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <H3 className="mb-1 text-xl font-bold text-slate-900">Password updated successfully</H3>
          <P className="text-sm leading-relaxed text-slate-600">
            Your initial temporary password has been replaced. You can now access your workspace.
          </P>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className={getButtonClassName(
              'primary',
              'lg',
              'h-12 w-full rounded-full bg-[#0044D3] text-sm font-bold shadow-md shadow-[#0044D3]/20 hover:bg-[#0036ab]',
            )}
          >
            Continue to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Form
      className="space-y-4"
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
    >
      {errors.general ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {errors.general}
        </div>
      ) : null}

      {/* Current Password */}
      <div className="space-y-1.5">
        <Label
          htmlFor="currentPassword"
          className="flex items-center gap-2 text-xs font-semibold text-slate-700"
        >
          <svg
            className="h-4 w-4 text-[#0044D3]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Temporary Password
        </Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••••••"
            hasError={Boolean(errors.currentPassword)}
            disabled={isSubmitting}
            className="rounded-2xl border-slate-200/90 bg-slate-50 pr-12 text-sm focus:bg-white"
          />
          <PasswordVisibilityToggle
            visible={showCurrentPassword}
            onToggle={() => setShowCurrentPassword((prev) => !prev)}
            className="text-[#0044D3] hover:bg-blue-50 hover:text-[#0036ab]"
          />
        </div>
        <FieldError id="currentPassword-error" error={errors.currentPassword} />
      </div>

      {/* New Password */}
      <div className="space-y-1.5">
        <Label
          htmlFor="newPassword"
          className="flex items-center gap-2 text-xs font-semibold text-slate-700"
        >
          <svg
            className="h-4 w-4 text-[#0044D3]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          New Password
        </Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••••••"
            hasError={Boolean(errors.newPassword)}
            disabled={isSubmitting}
            className="rounded-2xl border-slate-200/90 bg-slate-50 pr-12 text-sm focus:bg-white"
          />
          <PasswordVisibilityToggle
            visible={showNewPassword}
            onToggle={() => setShowNewPassword((prev) => !prev)}
            className="text-[#0044D3] hover:bg-blue-50 hover:text-[#0036ab]"
          />
        </div>
        <FieldError id="newPassword-error" error={errors.newPassword} />
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <Label
          htmlFor="confirmPassword"
          className="flex items-center gap-2 text-xs font-semibold text-slate-700"
        >
          <svg
            className="h-4 w-4 text-[#0044D3]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Confirm New Password
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••••••"
            hasError={Boolean(errors.confirmPassword)}
            disabled={isSubmitting}
            className="rounded-2xl border-slate-200/90 bg-slate-50 pr-12 text-sm focus:bg-white"
          />
          <PasswordVisibilityToggle
            visible={showConfirmPassword}
            onToggle={() => setShowConfirmPassword((prev) => !prev)}
            className="text-[#0044D3] hover:bg-blue-50 hover:text-[#0036ab]"
          />
        </div>
        <FieldError id="confirmPassword-error" error={errors.confirmPassword} />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          isLoading={isSubmitting}
          className="h-12 w-full rounded-full bg-[#0044D3] text-sm font-bold shadow-md shadow-[#0044D3]/20 hover:bg-[#0036ab]"
        >
          {isSubmitting ? 'Updating...' : 'Reset Password'}
        </Button>
      </div>
    </Form>
  );
}

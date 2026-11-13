'use client';

import React, { useRef, useState } from 'react';

import { PasswordCriteriaChecklist } from '@/components/app/auth/PasswordCriteriaChecklist';
import { PasswordVisibilityToggle } from '@/components/app/auth/PasswordVisibilityToggle';
import { Modal } from '@/components/patterns/Modal';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { Form } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { H2, Span } from '@/components/ui/Typography';
import { useAuth } from '@/hooks/useAuth';
import { usePasswordCriteria } from '@/hooks/usePasswordCriteria';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/lib/errors';
import { formatRoleLabel } from '@/lib/roles';
import { getUserInitials } from '@/lib/user';
import { changePasswordSchema, extractZodErrors, updateProfileSchema } from '@/lib/validation';
import type { AuthUser, UserRole } from '@/services/auth.service';

function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'MENTOR':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'MENTEE':
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
}

interface ProfilePasswordFieldProps {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (val: string) => void;
  readonly placeholder: string;
  readonly error?: string | undefined;
  readonly isVisible: boolean;
  readonly onToggleVisibility: () => void;
  readonly disabled?: boolean | undefined;
  readonly autoComplete?: string | undefined;
  readonly inputRef?: React.Ref<HTMLInputElement> | undefined;
}

function ProfilePasswordField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  error,
  isVisible,
  onToggleVisibility,
  disabled,
  autoComplete,
  inputRef,
}: Readonly<ProfilePasswordFieldProps>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} required>
        {label}
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          name={name}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          hasError={Boolean(error)}
          errorId={`${id}-error`}
          disabled={disabled}
          autoComplete={autoComplete}
          className="rounded-2xl pr-10"
        />
        <PasswordVisibilityToggle isVisible={isVisible} onToggle={onToggleVisibility} />
      </div>
      {error ? <FieldError id={`${id}-error`} error={error} /> : null}
    </div>
  );
}

export interface ProfileViewProps {
  readonly user: AuthUser;
}

export function ProfileView({ user }: Readonly<ProfileViewProps>) {
  const { changePassword, updateProfile, refreshUser } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const [isEditingName, setIsEditingName] = useState(false);

  const [profileName, setProfileName] = useState(user.name);
  const [prevUserName, setPrevUserName] = useState(user.name);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Adjust state during render when prop changes (React recommended pattern for state mirroring)
  // to avoid cascading re-renders or effect delays when the authenticated user's name is updated.
  if (prevUserName !== user.name) {
    setPrevUserName(user.name);
    setProfileName(user.name);
  }

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const currentPasswordInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const criteria = usePasswordCriteria(newPassword);
  const userInitials = getUserInitials(user.name);
  const roleBadgeStyle = getRoleBadgeColor(user.role);

  const handleOpenPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    setIsPasswordModalOpen(true);
  };

  const handleClosePasswordModal = () => {
    if (isSubmitting) return;
    setIsPasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  const handleFieldChange =
    (setter: React.Dispatch<React.SetStateAction<string>>, fieldKey: string) => (val: string) => {
      setter(val);
      if (errors[fieldKey]) {
        setErrors((prev) => ({ ...prev, [fieldKey]: '' }));
      }
    };

  const handleProfileSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isUpdatingProfile) return;

    setProfileErrors({});

    const result = updateProfileSchema.safeParse({
      name: profileName,
    });

    if (!result.success) {
      setProfileErrors(extractZodErrors(result.error.issues));
      return;
    }

    if (result.data.name === user.name.trim()) {
      setIsEditingName(false);
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await updateProfile(result.data.name);
      toastSuccess('Profile name updated successfully.', 'Profile Updated');
      setIsEditingName(false);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to update profile. Please try again.';
      setProfileErrors({ general: message });
      toastError(message, 'Update Failed');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
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
      const msg = await changePassword(currentPassword, newPassword);
      await refreshUser();
      toastSuccess(msg || 'Password updated successfully.', 'Password Changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordModalOpen(false);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Failed to update password. Please verify current password and try again.';
      if (
        err instanceof ApiError &&
        (err.status === 401 || message.toLowerCase().includes('current password'))
      ) {
        setErrors({ currentPassword: 'Current password is incorrect. Please try again.' });
      } else {
        setErrors({ general: message });
      }
      toastError(message, 'Password Update Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Main Single Column Profile Card */}
      <div className="overflow-hidden rounded-3xl border border-[#E1E6EC] bg-white shadow-xs">
        {/* Gradient Banner Accent */}
        <div className="h-28 bg-gradient-to-r from-blue-700 via-[#0044D3] to-blue-600" />

        <div className="relative px-6 pb-8 text-center sm:px-8">
          {/* Overlapping Initials Avatar */}
          <div className="-mt-14 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-white bg-[#0044D3] text-3xl font-black text-white shadow-md shadow-blue-900/15">
              {userInitials}
            </div>
          </div>

          {/* Name with Inline Edit */}
          {isEditingName ? (
            <Form
              onSubmit={(e) => {
                void handleProfileSubmit(e);
              }}
              className="mt-4 flex flex-col items-center gap-2"
            >
              <div className="flex items-center justify-center gap-2">
                <Input
                  id="inline-profile-name"
                  name="name"
                  type="text"
                  value={profileName}
                  onChange={(e) => {
                    setProfileName(e.target.value);
                    if (profileErrors.name || profileErrors.general) {
                      setProfileErrors({});
                    }
                  }}
                  placeholder="Enter your full name"
                  hasError={Boolean(profileErrors.name)}
                  errorId="inline-profile-name-error"
                  disabled={isUpdatingProfile}
                  autoComplete="name"
                  className="h-9 w-60 rounded-xl text-center text-base font-bold"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={
                    isUpdatingProfile ||
                    !profileName.trim() ||
                    profileName.trim() === user.name.trim()
                  }
                  isLoading={isUpdatingProfile}
                  className="h-9 rounded-full bg-[#0044D3] px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-[#0039B3]"
                >
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isUpdatingProfile}
                  onClick={() => {
                    setProfileName(user.name);
                    setProfileErrors({});
                    setIsEditingName(false);
                  }}
                  className="h-9 rounded-full px-3.5 text-xs font-semibold"
                >
                  Cancel
                </Button>
              </div>
              {profileErrors.name ? (
                <FieldError id="inline-profile-name-error" error={profileErrors.name} />
              ) : null}
              {profileErrors.general ? (
                <Span className="text-xs text-rose-600">{profileErrors.general}</Span>
              ) : null}
            </Form>
          ) : (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Span
                className="pointer-events-none h-8 w-8 shrink-0 select-none"
                aria-hidden="true"
              />
              <H2 className="truncate text-xl font-bold tracking-tight text-[#111827] sm:text-2xl">
                {user.name || 'User'}
              </H2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setProfileName(user.name);
                  setProfileErrors({});
                  setIsEditingName(true);
                }}
                title="Edit name"
                aria-label="Edit name"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full p-0 text-slate-400 transition-colors hover:bg-blue-50 hover:text-[#0044D3] focus-visible:ring-2 focus-visible:ring-[#0044D3]"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                  />
                </svg>
              </Button>
            </div>
          )}

          {/* Badges: Role */}
          <div className="mt-3 flex items-center justify-center">
            <Span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${roleBadgeStyle}`}
            >
              {formatRoleLabel(user.role)}
            </Span>
          </div>

          {/* Contact Metadata */}
          <div className="mt-6 rounded-2xl border border-[#E1E6EC] bg-[#F9FAFB] p-4 text-left">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <Span className="flex items-center gap-2 text-[#667085]">
                <svg
                  className="h-4 w-4 shrink-0 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <Span>Email</Span>
              </Span>
              <Span className="truncate font-semibold text-[#111827]">{user.email}</Span>
            </div>
          </div>

          {/* Change Password Trigger Button */}
          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenPasswordModal}
              className="flex items-center gap-2 rounded-full border border-[#D0D5DD] px-4 py-2 text-xs font-semibold text-[#344054] shadow-2xs transition-colors hover:bg-[#F9FAFB] hover:text-[#111827]"
            >
              <svg
                className="h-4 w-4 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
              Change Password
            </Button>
          </div>
        </div>
      </div>

      {/* Change Password Modal Popup */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={handleClosePasswordModal}
        title="Change Password"
        description="Set and confirm your new credentials."
        size="sm"
        initialFocusRef={currentPasswordInputRef}
        isSubmitting={isSubmitting}
        preventClose={isSubmitting}
      >
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            void handlePasswordSubmit(e);
          }}
          className="space-y-4"
        >
          {errors.general ? (
            <Alert variant="error" title="Update Failed" message={errors.general} />
          ) : null}

          <ProfilePasswordField
            id="modal-currentPassword"
            name="currentPassword"
            label="Current"
            value={currentPassword}
            onChange={handleFieldChange(setCurrentPassword, 'currentPassword')}
            placeholder="••••••••"
            error={errors.currentPassword}
            isVisible={showCurrentPassword}
            onToggleVisibility={() => setShowCurrentPassword((prev) => !prev)}
            disabled={isSubmitting}
            autoComplete="current-password"
            inputRef={currentPasswordInputRef}
          />

          {/* New Password Field */}
          <ProfilePasswordField
            id="modal-newPassword"
            name="newPassword"
            label="New"
            value={newPassword}
            onChange={handleFieldChange(setNewPassword, 'newPassword')}
            placeholder="••••••••"
            error={errors.newPassword}
            isVisible={showNewPassword}
            onToggleVisibility={() => setShowNewPassword((prev) => !prev)}
            disabled={isSubmitting}
            autoComplete="new-password"
          />

          {/* Password Requirements Checklist */}
          {newPassword.length > 0 ? <PasswordCriteriaChecklist criteria={criteria} /> : null}

          {/* Confirm Password Field */}
          <ProfilePasswordField
            id="modal-confirmPassword"
            name="confirmPassword"
            label="Confirm"
            value={confirmPassword}
            onChange={handleFieldChange(setConfirmPassword, 'confirmPassword')}
            placeholder="••••••••"
            error={errors.confirmPassword}
            isVisible={showConfirmPassword}
            onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
            disabled={isSubmitting}
            autoComplete="new-password"
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClosePasswordModal}
              disabled={isSubmitting}
              className="rounded-full px-4 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={
                isSubmitting ||
                !currentPassword.trim() ||
                !newPassword.trim() ||
                !confirmPassword.trim() ||
                !criteria.isValid
              }
              isLoading={isSubmitting}
              className="rounded-full bg-[#0044D3] px-6 text-xs font-semibold text-white shadow-xs hover:bg-[#0039B3] disabled:bg-blue-300 disabled:text-white disabled:opacity-100"
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

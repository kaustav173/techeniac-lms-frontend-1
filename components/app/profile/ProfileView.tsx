'use client';

import React, { useState } from 'react';

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
import { formatDateIST } from '@/lib/date';
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
}: Readonly<ProfilePasswordFieldProps>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} required>
        {label}
      </Label>
      <div className="relative">
        <Input
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

  const [isEditNameOpen, setIsEditNameOpen] = useState(false);

  const [profileName, setProfileName] = useState(user.name);
  const [prevUserName, setPrevUserName] = useState(user.name);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileSuccessMessage, setProfileSuccessMessage] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Adjust state during render when prop changes (React recommended pattern for state mirroring)
  // to avoid cascading re-renders or effect delays when the authenticated user's name is updated.
  if (prevUserName !== user.name) {
    setPrevUserName(user.name);
    setProfileName(user.name);
  }

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const criteria = usePasswordCriteria(newPassword);
  const userInitials = getUserInitials(user.name);
  const roleBadgeStyle = getRoleBadgeColor(user.role);

  const handleFieldChange =
    (setter: React.Dispatch<React.SetStateAction<string>>, fieldKey: string) => (val: string) => {
      setter(val);
      if (successMessage) {
        setSuccessMessage(null);
      }
      if (errors[fieldKey]) {
        setErrors((prev) => ({ ...prev, [fieldKey]: '' }));
      }
    };

  const handleProfileSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isUpdatingProfile) return;

    setProfileErrors({});
    setProfileSuccessMessage(null);

    const result = updateProfileSchema.safeParse({
      name: profileName,
    });

    if (!result.success) {
      setProfileErrors(extractZodErrors(result.error.issues));
      return;
    }

    if (result.data.name === user.name.trim()) {
      setIsEditNameOpen(false);
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await updateProfile(result.data.name);
      setProfileSuccessMessage('Profile name updated successfully.');
      setIsEditNameOpen(false);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to update profile. Please try again.';
      setProfileErrors({ general: message });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrors({});
    setSuccessMessage(null);

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
      setSuccessMessage(msg || 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Failed to update password. Please verify current password and try again.';
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Success Notifications */}
      {profileSuccessMessage ? (
        <Alert variant="success" title="Profile Updated" message={profileSuccessMessage} />
      ) : null}
      {successMessage ? (
        <Alert variant="success" title="Password Updated" message={successMessage} />
      ) : null}

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

          {/* Name with Pencil Edit Icon */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <H2 className="truncate text-xl font-bold tracking-tight text-[#111827] sm:text-2xl">
              {user.name || 'User'}
            </H2>
            <button
              type="button"
              onClick={() => {
                setProfileName(user.name);
                setProfileErrors({});
                setIsEditNameOpen(true);
              }}
              title="Edit name"
              aria-label="Edit name"
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-blue-50 hover:text-[#0044D3] focus-visible:ring-2 focus-visible:ring-[#0044D3] focus-visible:outline-none"
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
            </button>
          </div>

          {/* Badges: Role & Status */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <Span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${roleBadgeStyle}`}
            >
              {formatRoleLabel(user.role)}
            </Span>
            {user.isActive !== false ? (
              <Span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <Span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </Span>
            ) : (
              <Span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                <Span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                Inactive
              </Span>
            )}
          </div>

          {/* Contact & Membership Metadata */}
          <div className="mt-6 space-y-3 rounded-2xl border border-[#E1E6EC] bg-[#F9FAFB] p-4 text-left">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="flex items-center gap-2 text-[#667085]">
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
                Email Address
              </span>
              <span className="truncate font-semibold text-[#111827]">{user.email}</span>
            </div>

            {user.createdAt ? (
              <div className="flex items-center justify-between border-t border-[#E1E6EC]/60 pt-3 text-xs sm:text-sm">
                <span className="flex items-center gap-2 text-[#667085]">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Member Since
                </span>
                <span className="font-semibold text-[#111827]">
                  {formatDateIST(user.createdAt)}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs sm:p-8">
        <div className="border-b border-[#E1E6EC] pb-4">
          <H2 className="text-base font-bold text-[#111827]">Change Password</H2>
          <Span className="text-xs text-[#667085]">
            Ensure your account is using a strong and secure password.
          </Span>
        </div>

        <Form
          onSubmit={(e) => {
            void handlePasswordSubmit(e);
          }}
          className="mt-6 space-y-4"
        >
          {errors.general ? (
            <Alert variant="error" title="Update Failed" message={errors.general} />
          ) : null}

          {/* Current Password Field */}
          <ProfilePasswordField
            id="profile-currentPassword"
            name="currentPassword"
            label="Current Password"
            value={currentPassword}
            onChange={handleFieldChange(setCurrentPassword, 'currentPassword')}
            placeholder="Enter current password"
            error={errors.currentPassword}
            isVisible={showCurrentPassword}
            onToggleVisibility={() => setShowCurrentPassword((prev) => !prev)}
            disabled={isSubmitting}
            autoComplete="current-password"
          />

          {/* New Password Field */}
          <ProfilePasswordField
            id="profile-newPassword"
            name="newPassword"
            label="New Password"
            value={newPassword}
            onChange={handleFieldChange(setNewPassword, 'newPassword')}
            placeholder="Enter new strong password"
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
            id="profile-confirmPassword"
            name="confirmPassword"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={handleFieldChange(setConfirmPassword, 'confirmPassword')}
            placeholder="Re-enter new password"
            error={errors.confirmPassword}
            isVisible={showConfirmPassword}
            onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
            disabled={isSubmitting}
            autoComplete="new-password"
          />

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="rounded-full bg-[#0044D3] px-6 text-xs font-semibold text-white shadow-xs hover:bg-[#0039B3]"
            >
              {isSubmitting ? 'Updating Password...' : 'Update Password'}
            </Button>
          </div>
        </Form>
      </div>

      {/* Edit Name Modal Popup */}
      <Modal
        isOpen={isEditNameOpen}
        onClose={() => setIsEditNameOpen(false)}
        title="Edit Full Name"
        size="sm"
        isSubmitting={isUpdatingProfile}
      >
        <Form
          onSubmit={(e) => {
            void handleProfileSubmit(e);
          }}
          className="space-y-4"
        >
          {profileErrors.general ? (
            <Alert variant="error" title="Update Failed" message={profileErrors.general} />
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="modal-profile-name" required>
              Full Name
            </Label>
            <Input
              id="modal-profile-name"
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
              errorId="modal-profile-name-error"
              disabled={isUpdatingProfile}
              autoComplete="name"
              className="rounded-2xl"
            />
            {profileErrors.name ? (
              <FieldError id="modal-profile-name-error" error={profileErrors.name} />
            ) : null}
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUpdatingProfile}
              onClick={() => setIsEditNameOpen(false)}
              className="rounded-full px-5 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={
                isUpdatingProfile || !profileName.trim() || profileName.trim() === user.name.trim()
              }
              isLoading={isUpdatingProfile}
              className="rounded-full bg-[#0044D3] px-6 text-xs font-semibold text-white shadow-xs hover:bg-[#0039B3]"
            >
              {isUpdatingProfile ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

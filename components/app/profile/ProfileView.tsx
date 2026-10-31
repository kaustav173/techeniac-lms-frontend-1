'use client';

import React, { useState } from 'react';

import { PasswordCriteriaChecklist } from '@/components/app/auth/PasswordCriteriaChecklist';
import { PasswordVisibilityToggle } from '@/components/app/auth/PasswordVisibilityToggle';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { Form } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { H1, H2, H3, P, Span } from '@/components/ui/Typography';
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

  const [profileName, setProfileName] = useState(user.name);
  const [prevUserName, setPrevUserName] = useState(user.name);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileSuccessMessage, setProfileSuccessMessage] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

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

    setIsUpdatingProfile(true);
    try {
      const msg = await updateProfile(result.data.name);
      try {
        await refreshUser();
      } catch {
        // Non-blocking: profile update succeeded on server; session refresh can retry later
      }
      setProfileSuccessMessage(msg || 'Profile name updated successfully.');
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
    <div className="space-y-8">
      {/* Page Title & Breadcrumb Header */}
      <div className="rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs sm:p-8">
        <H1 className="text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">
          Account Profile
        </H1>
        <P className="mt-1 text-sm text-[#667085] sm:text-base">
          View your authenticated account credentials and manage your portal access security.
        </P>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Card: User Details & Identity */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0044D3] text-2xl font-black text-white shadow-md shadow-[#0044D3]/20">
                {userInitials}
              </div>
              <H2 className="mt-4 max-w-full truncate text-xl font-bold text-[#111827]">
                {user.name || 'User'}
              </H2>
              <P className="max-w-full truncate text-sm text-[#667085]">{user.email}</P>
              <div className="mt-3 flex items-center gap-2">
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
            </div>

            <div className="mt-8 border-t border-[#E1E6EC] pt-6">
              <H3 className="text-sm font-bold tracking-wide text-[#111827] uppercase">
                Account Information
              </H3>
              <dl className="mt-4 space-y-4 text-sm">
                <div className="flex min-w-0 items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <dt className="shrink-0 text-[#667085]">Full Name</dt>
                  <dd className="truncate font-semibold text-[#111827]">{user.name || 'User'}</dd>
                </div>
                <div className="flex min-w-0 items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <dt className="shrink-0 text-[#667085]">Email Address</dt>
                  <dd className="truncate font-semibold text-[#111827]">{user.email}</dd>
                </div>
                <div className="flex min-w-0 items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <dt className="shrink-0 text-[#667085]">Role</dt>
                  <dd className="truncate font-semibold text-[#111827]">
                    {formatRoleLabel(user.role)}
                  </dd>
                </div>
                <div className="flex min-w-0 items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <dt className="shrink-0 text-[#667085]">Member Since</dt>
                  <dd className="truncate font-semibold text-[#111827]">
                    {user.createdAt ? formatDateIST(user.createdAt) : '—'}
                  </dd>
                </div>
                <div className="flex min-w-0 items-center justify-between gap-4">
                  <dt className="shrink-0 text-[#667085]">Account Status</dt>
                  <dd
                    className={`truncate font-semibold ${user.isActive !== false ? 'text-emerald-600' : 'text-slate-500'}`}
                  >
                    {user.isActive !== false ? 'Active & Verified' : 'Inactive'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Right Column: Profile Edit & Change Password Forms */}
        <div className="space-y-6 lg:col-span-7">
          {/* Personal Information Form Card */}
          <div className="rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs sm:p-8">
            <div>
              <H2 className="text-lg font-bold text-[#111827] sm:text-xl">Personal Information</H2>
              <P className="mt-1 text-sm text-[#667085]">
                Update your display name. Email address is managed by administrators and cannot be
                changed.
              </P>
            </div>

            {profileSuccessMessage ? (
              <div className="mt-6">
                <Alert variant="success" title="Profile Updated" message={profileSuccessMessage} />
              </div>
            ) : null}

            {profileErrors.general ? (
              <div className="mt-6">
                <Alert variant="error" title="Update Failed" message={profileErrors.general} />
              </div>
            ) : null}

            <Form
              onSubmit={(e) => {
                void handleProfileSubmit(e);
              }}
              className="mt-6 space-y-5"
            >
              {/* Full Name Field (Editable) */}
              <div className="space-y-1.5">
                <Label htmlFor="profile-name" required>
                  Full Name
                </Label>
                <Input
                  id="profile-name"
                  name="name"
                  type="text"
                  value={profileName}
                  onChange={(e) => {
                    setProfileName(e.target.value);
                    if (profileSuccessMessage) setProfileSuccessMessage(null);
                    if (profileErrors.name || profileErrors.general) {
                      setProfileErrors({});
                    }
                  }}
                  placeholder="Enter your full name"
                  hasError={Boolean(profileErrors.name)}
                  errorId="profile-name-error"
                  disabled={isUpdatingProfile}
                  autoComplete="name"
                />
                {profileErrors.name ? (
                  <FieldError id="profile-name-error" error={profileErrors.name} />
                ) : null}
              </div>

              {/* Email Address Field (Read-only) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="profile-email">Email Address</Label>
                  <Span className="text-xs font-medium text-[#667085]">Read-only</Span>
                </div>
                <Input
                  id="profile-email"
                  name="email"
                  type="email"
                  value={user.email}
                  readOnly
                  disabled
                  aria-readonly="true"
                  aria-describedby="profile-email-desc"
                  className="cursor-not-allowed bg-slate-50 text-slate-500"
                />
                <P id="profile-email-desc" className="text-xs text-[#667085]">
                  Email address is linked to your authentication credentials and cannot be edited.
                </P>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={
                    isUpdatingProfile ||
                    !profileName.trim() ||
                    profileName.trim() === user.name.trim()
                  }
                  isLoading={isUpdatingProfile}
                  className="rounded-full bg-[#0044D3] px-6 text-sm font-semibold shadow-sm hover:bg-[#0036ab]"
                >
                  {isUpdatingProfile ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </div>
            </Form>
          </div>

          {/* Change Password Form Card */}
          <div className="rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs sm:p-8">
            <div>
              <H2 className="text-lg font-bold text-[#111827] sm:text-xl">Change Password</H2>
              <P className="mt-1 text-sm text-[#667085]">
                Ensure your account is using a long, random password to stay secure.
              </P>
            </div>

            {successMessage ? (
              <div className="mt-6">
                <Alert variant="success" title="Password Updated" message={successMessage} />
              </div>
            ) : null}

            {errors.general ? (
              <div className="mt-6">
                <Alert variant="error" title="Update Failed" message={errors.general} />
              </div>
            ) : null}

            <Form
              onSubmit={(e) => {
                void handlePasswordSubmit(e);
              }}
              className="mt-6 space-y-5"
            >
              {/* Current Password Field */}
              <ProfilePasswordField
                id="currentPassword"
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
                id="newPassword"
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
                id="confirmPassword"
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
                  className="rounded-full bg-[#0044D3] px-6 text-sm font-semibold shadow-sm hover:bg-[#0036ab]"
                >
                  {isSubmitting ? 'Updating Password...' : 'Update Password'}
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}

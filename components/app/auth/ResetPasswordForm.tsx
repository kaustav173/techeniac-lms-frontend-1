'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useState } from 'react';

import { Button, getButtonClassName } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { Form } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { H3, P, Span } from '@/components/ui/Typography';
import { useAuth } from '@/hooks/useAuth';
import { useResetTokenVerification } from '@/hooks/useResetTokenVerification';
import { ApiError } from '@/lib/errors';
import { extractZodErrors, resetPasswordSchema } from '@/lib/validation';

import { PasswordVisibilityToggle } from './PasswordVisibilityToggle';

type ResetState = 'verifying' | 'valid' | 'invalid' | 'done';

export const INVALID_OR_EXPIRED_MESSAGE =
  'This password reset link is invalid or has expired. Please request a new link to reset your password.';

function resolveResetState(
  submissionState: 'done' | 'invalid' | null,
  isVerifying: boolean,
  status: string | null,
): ResetState {
  if (submissionState) {
    return submissionState;
  }
  if (isVerifying) {
    return 'verifying';
  }
  if (status === 'invalid') {
    return 'invalid';
  }
  return 'valid';
}

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword } = useAuth();
  const { status, isVerifying } = useResetTokenVerification(token);

  const [submissionState, setSubmissionState] = useState<'done' | 'invalid' | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fail-open: when verification is unable to determine validity (e.g. network/500/404/429),
  // fall back to 'valid' so the user is never blocked from submitting at the real authorization gate.
  const state: ResetState = resolveResetState(submissionState, isVerifying, status);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrors({});

    const result = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      setErrors(extractZodErrors(result.error.issues));
      return;
    }

    const tokenVal = token?.trim();
    if (!tokenVal || state !== 'valid') {
      setSubmissionState('invalid');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(tokenVal, password);
      setSubmissionState('done');
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to reset password. Please try again.';
      setErrors({ general: message });
      if (err instanceof ApiError && err.status === 401) {
        setSubmissionState('invalid');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (state === 'verifying') {
    return (
      <div className="space-y-4 py-8 text-center" role="status" aria-live="polite">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#0044D3] border-t-transparent" />
        <P className="text-sm font-medium text-slate-500">Verifying link...</P>
      </div>
    );
  }

  if (state === 'done') {
    return (
      <div className="space-y-6 text-center" role="status" aria-live="polite">
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
          <H3 className="mb-1 text-xl font-bold text-slate-900">Password updated</H3>
          <P className="text-sm leading-relaxed text-slate-600">
            Your password has been reset. You can now sign in.
          </P>
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className={getButtonClassName(
              'primary',
              'lg',
              'h-12 w-full rounded-full bg-[#0044D3] text-sm font-bold shadow-md shadow-[#0044D3]/20 hover:bg-[#0036ab]',
            )}
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (state === 'invalid') {
    return (
      <div className="space-y-6 text-center" role="alert">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <div>
          <H3 className="mb-1 text-xl font-bold text-slate-900">Invalid or expired link</H3>
          <P className="text-sm leading-relaxed text-slate-600">
            This reset link is invalid or has expired.
          </P>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            href="/forgot-password"
            className={getButtonClassName(
              'primary',
              'lg',
              'h-12 w-full rounded-full bg-[#0044D3] text-sm font-bold shadow-md shadow-[#0044D3]/20 hover:bg-[#0036ab]',
            )}
          >
            Request new link
          </Link>

          <Link
            href="/login"
            className="group inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#0044D3] transition-colors hover:text-[#0036ab] hover:underline"
          >
            <svg
              className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <Span className="leading-none">Back to sign in</Span>
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

      {/* Password */}
      <div className="space-y-1.5">
        <Label
          htmlFor="newPassword"
          className="flex items-center gap-2 text-sm font-semibold text-[#111827]"
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
          Password
        </Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              const val = e.target.value;
              setPassword(val);
              if (errors.password) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.password;
                  return next;
                });
              }
              if (errors.general) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.general;
                  return next;
                });
              }
            }}
            placeholder="••••••••••••"
            autoComplete="new-password"
            hasError={Boolean(errors.password)}
            disabled={isSubmitting}
            className="rounded-2xl border-slate-200/90 bg-slate-50 pr-12 text-base focus:bg-white"
          />
          <PasswordVisibilityToggle
            visible={showPassword}
            onToggle={() => setShowPassword((prev) => !prev)}
            className="text-[#0044D3] hover:bg-blue-50 hover:text-[#0036ab]"
          />
        </div>
        <FieldError id="newPassword-error" error={errors.password} />
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <Label
          htmlFor="confirmPassword"
          className="flex items-center gap-2 text-sm font-semibold text-[#111827]"
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
          Confirm Password
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => {
              const val = e.target.value;
              setConfirmPassword(val);
              if (errors.confirmPassword) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.confirmPassword;
                  return next;
                });
              }
              if (errors.general) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.general;
                  return next;
                });
              }
            }}
            placeholder="••••••••••••"
            autoComplete="new-password"
            hasError={Boolean(errors.confirmPassword)}
            disabled={isSubmitting}
            className="rounded-2xl border-slate-200/90 bg-slate-50 pr-12 text-base focus:bg-white"
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
          className="h-12 w-full rounded-full bg-[#0044D3] text-base font-semibold shadow-md shadow-[#0044D3]/20 hover:bg-[#0036AB]"
        >
          {isSubmitting ? 'Resetting...' : 'Reset'}
        </Button>
      </div>

      <div className="pt-2 text-center">
        <Link
          href="/login"
          className="group inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-[#0044D3] transition-colors hover:text-[#0036ab] hover:underline"
        >
          <svg
            className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <Span className="leading-none">Back to sign in</Span>
        </Link>
      </div>
    </Form>
  );
}

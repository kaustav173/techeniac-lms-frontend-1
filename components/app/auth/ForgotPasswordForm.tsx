'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { Form } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { H3, P, Span } from '@/components/ui/Typography';
import { useAuth } from '@/hooks/useAuth';
import { extractZodErrors, forgotPasswordSchema } from '@/lib/validation';

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDispatched, setIsDispatched] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrors({});
    setResendStatus(null);

    const trimmedEmail = email.trim();
    const result = forgotPasswordSchema.safeParse({ email: trimmedEmail });
    if (!result.success) {
      setErrors(extractZodErrors(result.error.issues));
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword(trimmedEmail);
    } catch {
      // Suppress server errors to prevent user account enumeration
    } finally {
      setIsSubmitting(false);
      setIsDispatched(true);
    }
  };

  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    setResendStatus(null);
    try {
      await forgotPassword(email.trim());
    } catch {
      // Suppress server errors to prevent user account enumeration
    } finally {
      setIsResending(false);
      setResendStatus('A new reset link has been sent if this email is registered.');
    }
  };

  if (isDispatched) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-[#0044D3]">
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
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <div>
          <H3 className="mb-1 text-xl font-bold text-slate-900">Check your email</H3>
          <P className="text-sm leading-relaxed text-slate-600">
            We sent a password reset link to{' '}
            <Span className="font-semibold text-slate-800">{email}</Span>.
          </P>
        </div>

        {resendStatus ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-800">
            {resendStatus}
          </div>
        ) : null}

        <div className="space-y-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => {
              void handleResend();
            }}
            disabled={isResending}
            isLoading={isResending}
            className="h-11 w-full rounded-full text-sm font-semibold"
          >
            {isResending ? 'Resending link...' : 'Resend link'}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => {
              setIsDispatched(false);
              setResendStatus(null);
            }}
            className="h-11 w-full rounded-full text-sm font-semibold"
          >
            Use a different email
          </Button>

          <div className="pt-2">
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <Span className="leading-none">Return to sign in</Span>
            </Link>
          </div>
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
      <div className="space-y-1.5">
        <Label
          htmlFor="email"
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
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            const val = e.target.value;
            setEmail(val);
            if (errors.email) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next.email;
                return next;
              });
            }
          }}
          placeholder="name@company.com"
          autoComplete="email"
          hasError={Boolean(errors.email)}
          disabled={isSubmitting}
          className="rounded-2xl bg-slate-50 text-base focus:bg-white"
        />
        <FieldError id="email-error" error={errors.email} />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          isLoading={isSubmitting}
          className="h-12 w-full rounded-full bg-[#0044D3] text-base font-medium shadow-md shadow-[#0044D3]/20 hover:bg-[#0036AB]"
        >
          {isSubmitting ? 'Sending link...' : 'Send Reset Link'}
        </Button>
      </div>

      <div className="pt-3 text-center">
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
          <Span className="leading-none">Return to sign in</Span>
        </Link>
      </div>
    </Form>
  );
}

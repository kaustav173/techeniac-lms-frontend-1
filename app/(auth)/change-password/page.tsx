'use client';

import React from 'react';

import { AuthShell } from '@/components/app/auth/AuthShell';
import { ChangePasswordForm } from '@/components/app/auth/ChangePasswordForm';
import { Span } from '@/components/ui/Typography';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';

export default function ChangePasswordPage() {
  useRoleRedirect({ allowMustChangePassword: true });

  const changePasswordFooter = (
    <div className="flex items-center justify-center gap-2 text-center text-xs text-slate-500">
      <svg
        className="h-4 w-4 shrink-0 text-[#0044D3]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <Span>
        You&apos;re using a temporary password. Please create a new password to secure your
        TechEniac LMS account.
      </Span>
    </div>
  );

  return (
    <AuthShell title="Create A New Password" footerContent={changePasswordFooter}>
      <ChangePasswordForm />
    </AuthShell>
  );
}

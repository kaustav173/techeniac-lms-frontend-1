import type { Metadata } from 'next';
import React, { Suspense } from 'react';

import { AuthShell } from '@/components/app/auth/AuthShell';
import { ForgotPasswordForm } from '@/components/app/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot Password | TechEniac LMS',
  description: 'Request a password reset link for your account.',
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Forgot Password">
      <Suspense
        fallback={<div className="py-6 text-center text-sm text-slate-500">Loading...</div>}
      >
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  );
}

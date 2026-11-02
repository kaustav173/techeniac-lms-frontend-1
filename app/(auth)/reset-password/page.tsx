import type { Metadata } from 'next';
import React, { Suspense } from 'react';

import { AuthShell } from '@/components/app/auth/AuthShell';
import { ResetPasswordForm } from '@/components/app/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset Password | TechEniac LMS',
  description: 'Create a new secure password for your account.',
};

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Reset Password">
      <Suspense
        fallback={<div className="py-6 text-center text-sm text-slate-500">Loading...</div>}
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}

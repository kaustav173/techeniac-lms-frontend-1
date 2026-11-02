import type { Metadata } from 'next';
import React from 'react';

import { AuthShell } from '@/components/app/auth/AuthShell';
import { LoginForm } from '@/components/app/auth/LoginForm';
import { Span } from '@/components/ui/Typography';

export const metadata: Metadata = {
  title: 'Sign In | TechEniac LMS',
  description: 'Sign in with your organization credentials to access the learning platform.',
};

export default function LoginPage() {
  const loginFooter = (
    <div className="pt-2 text-center">
      <Span className="text-sm font-medium text-slate-600 sm:text-base">
        New to TechEniac LMS?{' '}
        <Span className="font-semibold text-[#0044D3]">Contact Administrator</Span>
      </Span>
    </div>
  );

  return (
    <AuthShell title="Welcome To TechEniac LMS" footerContent={loginFooter}>
      <LoginForm />
    </AuthShell>
  );
}

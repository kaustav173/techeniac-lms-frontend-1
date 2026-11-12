import type { Metadata } from 'next';
import React from 'react';

import { AuthShell } from '@/components/app/auth/AuthShell';
import { LoginForm } from '@/components/app/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In | TechEniac LMS',
  description: 'Sign in with your organization credentials to access the learning platform.',
};

export default function LoginPage() {
  return (
    <AuthShell title="Welcome To TechEniac LMS">
      <LoginForm />
    </AuthShell>
  );
}

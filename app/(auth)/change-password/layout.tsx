import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Change Temporary Password | TechEniac LMS',
  description: 'Update your temporary password on your first sign-in.',
};

export default function ChangePasswordLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}

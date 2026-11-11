'use client';

import React from 'react';

import { useRoleGuard } from '@/hooks/useRoleGuard';

export default function MentorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  useRoleGuard('MENTOR');

  return <>{children}</>;
}

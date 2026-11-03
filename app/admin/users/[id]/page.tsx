import type { Metadata } from 'next';
import React, { Suspense } from 'react';

import { ADMIN_USERS_NAV } from '@/components/app/navigation/portal-nav.config';
import { User360Shell, User360Skeleton } from '@/components/app/user-360/User360Shell';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'User 360 Profile | TechEniac LMS',
  description: 'Complete 360-degree historical and performance profile of a user.',
};

export default async function AdminUser360Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header {...ADMIN_USERS_NAV} />
      <DashboardContent>
        <Suspense fallback={<User360Skeleton />}>
          <User360Shell userId={id} />
        </Suspense>
      </DashboardContent>
    </div>
  );
}

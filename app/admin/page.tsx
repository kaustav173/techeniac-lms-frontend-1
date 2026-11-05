import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import React, { Suspense } from 'react';

import {
  AdminDashboardSkeleton,
  AdminDashboardView,
} from '@/components/app/dashboard/AdminDashboardView';
import { prefetchAdminDashboard } from '@/hooks/useDashboard';
import { ApiError } from '@/lib/errors';
import { getQueryClient } from '@/lib/query-client';
import { verifyServerSession } from '@/lib/server/auth';

export const metadata: Metadata = {
  title: 'Super Admin Control Center | TechEniac LMS',
  description: 'Manage curriculum standards, allocations, progress metrics, and system audit logs.',
};

async function AdminPageServerContent() {
  const cookieStore = await cookies();
  const rawAccessToken = cookieStore.get('accessToken')?.value;
  const rawRefreshToken = cookieStore.get('refreshToken')?.value;

  if (!rawAccessToken && !rawRefreshToken) {
    redirect('/login');
  }

  const { user, accessToken } = await verifyServerSession(rawAccessToken, rawRefreshToken);

  if (!user || user.role !== 'SUPER_ADMIN') {
    redirect('/login');
  }

  if (user.mustChangePassword) {
    redirect('/change-password');
  }

  const queryClient = getQueryClient();

  if (accessToken) {
    try {
      await prefetchAdminDashboard(queryClient, accessToken);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        redirect('/login');
      }
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminDashboardView initialUser={user} />
    </HydrationBoundary>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <AdminPageServerContent />
    </Suspense>
  );
}

import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import React, { Suspense } from 'react';

import {
  AdminDashboardSkeleton,
  AdminDashboardView,
} from '@/components/app/dashboard/AdminDashboardView';
import { getQueryClient } from '@/lib/query-client';
import { verifyServerSession } from '@/lib/server/auth';
import { prefetchAdminDashboard } from '@/lib/server/dashboard';

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

  const queryClient = getQueryClient();

  // Run session verification and dashboard prefetch in parallel when token is present
  const [sessionResult] = await Promise.all([
    verifyServerSession(rawAccessToken, rawRefreshToken).catch(() => ({
      user: null,
      accessToken: null,
    })),
    rawAccessToken
      ? prefetchAdminDashboard(queryClient, rawAccessToken).catch(() => null)
      : Promise.resolve(null),
  ]);

  const { user, accessToken } = sessionResult;

  if (!user || user.role !== 'SUPER_ADMIN') {
    redirect('/login');
  }

  if (user.mustChangePassword) {
    redirect('/change-password');
  }

  // If token was refreshed during session verification, prefetch with new token
  if (accessToken && accessToken !== rawAccessToken) {
    try {
      await prefetchAdminDashboard(queryClient, accessToken);
    } catch {
      // Client useAdminDashboard handles if prefetch didn't complete
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

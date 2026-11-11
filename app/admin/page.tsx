import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import React, { Suspense } from 'react';

import {
  AdminDashboardSkeleton,
  AdminDashboardView,
} from '@/components/app/dashboard/AdminDashboardView';
import { PortalSessionState } from '@/components/app/navigation/PortalSessionState';
import { getQueryClient } from '@/lib/query-client';
import { requirePortalServerSession } from '@/lib/server/auth';
import { prefetchAdminDashboard } from '@/lib/server/dashboard';

export const metadata: Metadata = {
  title: 'Super Admin Control Center | TechEniac LMS',
  description: 'Manage courses, allocations, progress metrics, and system logs.',
};

async function AdminPageServerContent() {
  const session = await requirePortalServerSession(['SUPER_ADMIN']);

  if (session.status === 'error') {
    return <PortalSessionState sessionError={session.message} variant="admin" />;
  }

  const queryClient = getQueryClient();
  await prefetchAdminDashboard(queryClient, session.accessToken);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminDashboardView initialUser={session.user} />
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

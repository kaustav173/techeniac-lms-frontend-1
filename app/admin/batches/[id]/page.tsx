import type { Metadata } from 'next';
import React, { Suspense } from 'react';

import {
  BatchDashboardSkeleton,
  BatchDashboardView,
} from '@/components/app/batches/BatchDashboardView';
import { ADMIN_BATCHES_NAV } from '@/components/app/navigation/portal-nav.config';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'Batch Dashboard | TechEniac LMS',
  description: 'Detailed overview of batch members, course progress, and status timeline.',
};

export default async function AdminBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header {...ADMIN_BATCHES_NAV} />
      <DashboardContent>
        <Suspense fallback={<BatchDashboardSkeleton />}>
          <BatchDashboardView batchId={id} />
        </Suspense>
      </DashboardContent>
    </div>
  );
}

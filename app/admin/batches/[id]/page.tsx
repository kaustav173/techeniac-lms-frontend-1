import type { Metadata } from 'next';
import React, { Suspense } from 'react';

import { BatchDashboardView } from '@/components/app/batches/BatchDashboardView';
import { ADMIN_BATCHES_NAV } from '@/components/app/navigation/portal-nav.config';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'Batch Dashboard | TechEniac LMS',
  description: 'Detailed overview of batch members, course progress, and status timeline.',
};

async function BatchDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header {...ADMIN_BATCHES_NAV} />
      <DashboardContent>
        <BatchDashboardView batchId={id} />
      </DashboardContent>
    </div>
  );
}

export default function AdminBatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm font-medium text-slate-500">
          Loading batch dashboard...
        </div>
      }
    >
      <BatchDetailContent params={params} />
    </Suspense>
  );
}

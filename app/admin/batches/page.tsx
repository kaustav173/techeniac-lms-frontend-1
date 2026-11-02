import type { Metadata } from 'next';

import { BatchesTable } from '@/components/app/batches/BatchesTable';
import { ADMIN_BATCHES_NAV } from '@/components/app/navigation/portal-nav.config';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'Batches Management | TechEniac LMS',
  description:
    'Manage cohorts, member rosters, allocated courses, and lifecycle status transitions.',
};

export default function AdminBatchesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header {...ADMIN_BATCHES_NAV} />
      <DashboardContent>
        <BatchesTable />
      </DashboardContent>
    </div>
  );
}

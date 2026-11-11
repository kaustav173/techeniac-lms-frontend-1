import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuditLogTable } from '@/components/app/audit';
import { ADMIN_LOGS_NAV } from '@/components/app/navigation/portal-nav.config';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'Logs | TechEniac LMS',
  description:
    'Immutable, append-only record of system events, authentication, role changes, and course edits.',
};

export default function AdminLogsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header {...ADMIN_LOGS_NAV} />
      <DashboardContent>
        <Suspense fallback={null}>
          <AuditLogTable />
        </Suspense>
      </DashboardContent>
    </div>
  );
}

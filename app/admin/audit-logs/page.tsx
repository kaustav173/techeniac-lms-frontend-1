import type { Metadata } from 'next';

import { AuditLogTable } from '@/components/app/audit';
import { ADMIN_AUDIT_LOGS_NAV } from '@/components/app/navigation/portal-nav.config';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { H1, P } from '@/components/ui/Typography';

export const metadata: Metadata = {
  title: 'Audit Log | TechEniac LMS',
  description:
    'Immutable, append-only record of system events, authentication, role changes, and course edits.',
};

export default function AdminAuditLogsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header {...ADMIN_AUDIT_LOGS_NAV} />
      <DashboardContent>
        <div className="mb-6 space-y-1">
          <H1 className="text-2xl font-bold tracking-tight text-slate-900">System Audit Trail</H1>
          <P className="text-xs text-slate-500">
            Immutable, append-only record of all system events, authentication, role modifications,
            course live edits, batch changes, and grading actions (M14 / AUD-01–05).
          </P>
        </div>
        <AuditLogTable />
      </DashboardContent>
    </div>
  );
}

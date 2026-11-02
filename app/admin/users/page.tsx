import type { Metadata } from 'next';

import { ADMIN_USERS_NAV } from '@/components/app/navigation/portal-nav.config';
import { UsersTable } from '@/components/app/users/UsersTable';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'Users Management | TechEniac LMS',
  description: 'Manage platform users, roles, batch enrollments, and access status.',
};

export default function AdminUsersPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header {...ADMIN_USERS_NAV} />
      <DashboardContent>
        <UsersTable />
      </DashboardContent>
    </div>
  );
}

'use client';

import React from 'react';

import { AdminDashboardView } from '@/components/app/dashboard/AdminDashboardView';
import { PortalSessionState } from '@/components/app/navigation/PortalSessionState';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';

export default function AdminPage() {
  const { user, isAuthorized, sessionError } = useRoleRedirect({
    allowedRoles: ['SUPER_ADMIN'],
  });

  if (!isAuthorized || !user) {
    return (
      <PortalSessionState
        sessionError={sessionError}
        loadingMessage="Loading super admin control center..."
        variant="admin"
      />
    );
  }

  return <AdminDashboardView />;
}

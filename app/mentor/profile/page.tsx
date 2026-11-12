'use client';

import React from 'react';

import { MENTOR_PROFILE_NAV } from '@/components/app/navigation/portal-nav.config';
import { PortalSessionState } from '@/components/app/navigation/PortalSessionState';
import { ProfileView } from '@/components/app/profile/ProfileView';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';

export default function MentorProfilePage() {
  const { user, isAuthorized, sessionError } = useRoleRedirect({ allowedRoles: ['MENTOR'] });

  if (!isAuthorized || !user) {
    return (
      <PortalSessionState
        sessionError={sessionError}
        loadingMessage="Loading mentor profile..."
        variant="mentor"
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F8FC] text-[#111827]">
      <Header {...MENTOR_PROFILE_NAV} title="Profile" />
      <DashboardContent>
        <ProfileView user={user} />
      </DashboardContent>
    </div>
  );
}

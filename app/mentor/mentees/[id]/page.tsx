import type { Metadata } from 'next';
import React, { Suspense } from 'react';

import { MENTOR_MENTEES_NAV } from '@/components/app/navigation/portal-nav.config';
import { User360Shell, User360Skeleton } from '@/components/app/user-360/User360Shell';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'Mentee 360 Profile | Mentor Portal',
  description: 'Complete 360-degree historical and performance profile of an assigned mentee.',
};

export default async function MentorMentee360Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header {...MENTOR_MENTEES_NAV} />
      <DashboardContent>
        <Suspense fallback={<User360Skeleton />}>
          <User360Shell userId={id} backHref="/mentor/mentees" backLabel="Back to Mentees" />
        </Suspense>
      </DashboardContent>
    </div>
  );
}

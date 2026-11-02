import type { Metadata } from 'next';
import React, { Suspense } from 'react';

import { ADMIN_USERS_NAV } from '@/components/app/navigation/portal-nav.config';
import { User360Shell } from '@/components/app/user-360/User360Shell';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'User 360 Profile | TechEniac LMS',
  description: 'Complete 360-degree historical and performance profile of a user.',
};

async function User360Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header {...ADMIN_USERS_NAV} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <User360Shell userId={id} />
      </main>
    </div>
  );
}

export default function AdminUser360Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm font-medium text-slate-500">
          Loading User 360 profile...
        </div>
      }
    >
      <User360Content params={params} />
    </Suspense>
  );
}

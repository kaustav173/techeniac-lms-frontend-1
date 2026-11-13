'use client';

import React from 'react';

import { MENTOR_HISTORY_NAV } from '@/components/app/navigation/portal-nav.config';
import { LearningHistoryView } from '@/components/app/performance';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { useLearningHistoryQuery } from '@/hooks/usePerformance';
import { useRoleGuard } from '@/hooks/useRoleGuard';

export default function MentorHistoryPage() {
  useRoleGuard('MENTOR');

  const { data: history, isLoading, isError, error, refetch } = useLearningHistoryQuery();

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F8FC] text-[#111827]">
      <Header {...MENTOR_HISTORY_NAV} title="History" />
      <DashboardContent>
        <LearningHistoryView
          history={history}
          isLoading={isLoading}
          isMentorPastView={true}
          hideSummary={true}
          isError={isError}
          error={error}
          onRetry={() => void refetch()}
        />
      </DashboardContent>
    </div>
  );
}

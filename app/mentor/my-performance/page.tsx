'use client';

import React from 'react';

import { MENTOR_MY_PERFORMANCE_NAV } from '@/components/app/navigation/portal-nav.config';
import { LearningHistoryView } from '@/components/app/performance';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { PageTitle, SubText } from '@/components/ui/Typography';
import { useLearningHistoryQuery } from '@/hooks/usePerformance';
import { useRoleGuard } from '@/hooks/useRoleGuard';

export default function MentorMyPerformancePage() {
  useRoleGuard('MENTOR');

  const { data: history, isLoading, isError, error, refetch } = useLearningHistoryQuery();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header {...MENTOR_MY_PERFORMANCE_NAV} />
      <DashboardContent>
        <div className="mb-6">
          <PageTitle className="text-2xl font-bold tracking-tight sm:text-3xl">
            My Performance (Past Learning History)
          </PageTitle>
          <SubText className="mt-1">
            View historical batch enrollments, course allocations, grades, and mentor feedback from
            your time as a mentee (FR-11.5).
          </SubText>
        </div>

        <LearningHistoryView
          history={history}
          isLoading={isLoading}
          isMentorPastView={true}
          isError={isError}
          error={error}
          onRetry={() => void refetch()}
        />
      </DashboardContent>
    </div>
  );
}

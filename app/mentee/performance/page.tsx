'use client';

import React from 'react';

import { MENTEE_PERFORMANCE_NAV } from '@/components/app/navigation/portal-nav.config';
import { LearningHistoryView } from '@/components/app/performance';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { PageTitle, SubText } from '@/components/ui/Typography';
import { useLearningHistoryQuery } from '@/hooks/usePerformance';
import { useRoleGuard } from '@/hooks/useRoleGuard';

export default function MenteePerformancePage() {
  useRoleGuard('MENTEE');

  const { data: history, isLoading, isError, error, refetch } = useLearningHistoryQuery();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header {...MENTEE_PERFORMANCE_NAV} />
      <DashboardContent>
        <div className="mb-6">
          <PageTitle className="text-2xl font-bold tracking-tight sm:text-3xl">
            My Grades & Performance
          </PageTitle>
          <SubText className="mt-1">
            Track your curriculum completion, assignment scores, letter grades, and mentor feedback
            (FR-11.4).
          </SubText>
        </div>

        <LearningHistoryView
          history={history}
          isLoading={isLoading}
          isMentorPastView={false}
          isError={isError}
          error={error}
          onRetry={() => void refetch()}
        />
      </DashboardContent>
    </div>
  );
}

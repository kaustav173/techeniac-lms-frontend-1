'use client';

import React from 'react';

import { MENTOR_PERFORMANCE_NAV } from '@/components/app/navigation/portal-nav.config';
import { PerformanceDashboardShell } from '@/components/app/performance';

export default function MentorMenteesPerformancePage() {
  return (
    <PerformanceDashboardShell
      navConfig={MENTOR_PERFORMANCE_NAV}
      role="MENTOR"
      title="Mentee Performance"
      description="Performance analytics, submission timeliness, and scores for your mapped mentees in active batches (FR-11.3)."
      showMetricsCards={false}
    />
  );
}

'use client';

import React from 'react';

import { ADMIN_PERFORMANCE_NAV } from '@/components/app/navigation/portal-nav.config';
import { PerformanceDashboardShell } from '@/components/app/performance';

export default function AdminPerformancePage() {
  return (
    <PerformanceDashboardShell
      navConfig={ADMIN_PERFORMANCE_NAV}
      role="SUPER_ADMIN"
      title="Performance Analytics & Mentee Metrics"
      description="System-wide course performance, marks distribution, on-time delivery rates, and overdue monitoring (FR-11.1, FR-11.2, FR-11.6)."
    />
  );
}

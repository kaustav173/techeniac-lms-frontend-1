import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ProgressTrackerView } from '@/components/app/progress/ProgressTrackerView';

export const metadata: Metadata = {
  title: 'Progress Tracker | Mentor Portal',
  description: 'Track mentee topic progress, cadence telemetry, and manage topic deadlines.',
};

export default function MentorProgressPage() {
  return (
    <Suspense>
      <ProgressTrackerView portalType="mentor" />
    </Suspense>
  );
}

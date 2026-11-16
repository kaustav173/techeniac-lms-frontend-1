import type { Metadata } from 'next';
import React, { Suspense } from 'react';

import {
  MenteeProgressDetailSkeleton,
  MenteeProgressDetailView,
} from '@/components/app/progress/MenteeProgressDetailView';

export const metadata: Metadata = {
  title: 'Mentee Progress Details | Mentor Portal',
  description: 'Detailed view of mentee course progress, syllabus topic milestones, and deadlines.',
};

async function ProgressDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MenteeProgressDetailView allocationId={id} portalType="mentor" />;
}

export default function MentorMenteeProgressDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<MenteeProgressDetailSkeleton portalType="mentor" />}>
      <ProgressDetailContent params={params} />
    </Suspense>
  );
}

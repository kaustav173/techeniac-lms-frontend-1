import type { Metadata } from 'next';
import React, { Suspense } from 'react';

import {
  MenteeCourseView,
  MenteeCourseWorkspaceSkeleton,
} from '@/components/app/courses/MenteeCourseView';

export const metadata: Metadata = {
  title: 'Course Workspace | Learning Progress',
  description: 'Interactive curriculum reading, topic progress controls, and assignments.',
};

interface MenteeCoursePageProps {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

async function MenteeCourseContent({ params }: MenteeCoursePageProps) {
  const { id } = await params;
  return <MenteeCourseView allocationId={id} />;
}

export default function MenteeCoursePage({ params }: MenteeCoursePageProps) {
  return (
    <Suspense fallback={<MenteeCourseWorkspaceSkeleton />}>
      <MenteeCourseContent params={params} />
    </Suspense>
  );
}

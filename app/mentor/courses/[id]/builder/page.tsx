import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import React, { Suspense } from 'react';

import {
  CourseBuilderSkeleton,
  CourseBuilderView,
} from '@/components/app/courses/CourseBuilderView';
import { PortalSessionState } from '@/components/app/navigation/PortalSessionState';
import { getQueryClient } from '@/lib/query-client';
import { requirePortalServerSession } from '@/lib/server/auth';
import { prefetchCourseBuilder } from '@/lib/server/courses';

export const metadata: Metadata = {
  title: 'Course Builder | TechEniac LMS',
  description: 'Design modular learning paths, structured topics, and benchmark assignments.',
};

async function MentorCourseBuilderServerContent({ id }: Readonly<{ id: string }>) {
  const session = await requirePortalServerSession(['MENTOR', 'SUPER_ADMIN']);

  if (session.status === 'error') {
    return <PortalSessionState sessionError={session.message} variant="mentor" />;
  }

  const queryClient = getQueryClient();

  if (id) {
    await prefetchCourseBuilder(queryClient, id, session.accessToken);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CourseBuilderView portal="mentor" courseId={id} />
    </HydrationBoundary>
  );
}

export default async function MentorCourseBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<CourseBuilderSkeleton portal="mentor" />}>
      <MentorCourseBuilderServerContent id={id} />
    </Suspense>
  );
}

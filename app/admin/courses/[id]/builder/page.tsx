import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import React, { Suspense } from 'react';

import {
  CourseBuilderSkeleton,
  CourseBuilderView,
} from '@/components/app/courses/CourseBuilderView';
import { getQueryClient } from '@/lib/query-client';
import { prefetchCourseBuilder } from '@/lib/server/courses';

export const metadata: Metadata = {
  title: 'Course Builder | TechEniac LMS',
  description: 'Design modular learning paths, structured topics, and benchmark assignments.',
};

export default async function AdminCourseBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const rawAccessToken = cookieStore.get('accessToken')?.value;

  const queryClient = getQueryClient();

  if (id && rawAccessToken) {
    try {
      await prefetchCourseBuilder(queryClient, id, rawAccessToken);
    } catch {
      // Handled by client-side useCourseBuilder if prefetch fails
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<CourseBuilderSkeleton portal="admin" />}>
        <CourseBuilderView portal="admin" courseId={id} />
      </Suspense>
    </HydrationBoundary>
  );
}

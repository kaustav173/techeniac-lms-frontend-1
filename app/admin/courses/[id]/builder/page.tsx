import type { Metadata } from 'next';
import React, { Suspense } from 'react';

import {
  CourseBuilderSkeleton,
  CourseBuilderView,
} from '@/components/app/courses/CourseBuilderView';

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

  return (
    <Suspense fallback={<CourseBuilderSkeleton portal="admin" />}>
      <CourseBuilderView portal="admin" courseId={id} />
    </Suspense>
  );
}

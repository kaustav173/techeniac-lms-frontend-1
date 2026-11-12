import type { Metadata } from 'next';
import React from 'react';

import { CourseBuilderView } from '@/components/app/courses/CourseBuilderView';

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

  return <CourseBuilderView portal="admin" courseId={id} />;
}

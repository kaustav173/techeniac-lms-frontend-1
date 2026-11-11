import type { Metadata } from 'next';

import { CourseLibraryView } from '@/components/app/courses/CourseLibraryView';

export const metadata: Metadata = {
  title: 'Courses Management | TechEniac LMS',
  description:
    'Design modular learning paths, structured topics, subtopics, and benchmark assignments.',
};

export default function AdminCourseLibraryPage() {
  return <CourseLibraryView portal="admin" />;
}

import type { Metadata } from 'next';

import { CourseLibraryView } from '@/components/app/courses/CourseLibraryView';

export const metadata: Metadata = {
  title: 'Assigned Courses | Mentor Portal',
  description: 'Curriculum reference and authorized course builder management.',
};

export default function MentorCourseLibraryPage() {
  return <CourseLibraryView portal="mentor" />;
}

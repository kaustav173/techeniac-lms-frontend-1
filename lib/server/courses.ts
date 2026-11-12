import type { QueryClient } from '@tanstack/react-query';

import { coursesService } from '@/services/courses.service';

export async function prefetchCourseBuilder(
  queryClient: QueryClient,
  courseId: string,
  authToken?: string,
): Promise<void> {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['course', courseId],
      queryFn: () => coursesService.getCourseById(courseId, true, authToken),
      staleTime: 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['course-impact', courseId],
      queryFn: () => coursesService.getCourseImpact(courseId, authToken),
      staleTime: 60 * 1000,
    }),
  ]);
}

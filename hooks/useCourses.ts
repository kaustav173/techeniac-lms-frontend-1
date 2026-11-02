'use client';

import { keepPreviousData, noop, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { coursesService } from '@/services/courses.service';
import type {
  Assignment,
  Course,
  CourseImpact,
  CoursePagination,
  CreateAssignmentInput,
  CreateCourseInput,
  CreateSubtopicInput,
  CreateTopicInput,
  ListCoursesQuery,
  ReorderItemInput,
  Subtopic,
  Topic,
  UpdateAssignmentInput,
  UpdateCourseInput,
  UpdateSubtopicInput,
  UpdateTopicInput,
} from '@/types/courses';

export function useCourses(initialQuery?: ListCoursesQuery) {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
  } = useQuery({
    queryKey: ['courses', initialQuery],
    queryFn: ({ signal }) => coursesService.listCourses(initialQuery, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });

  const courses = data?.courses ?? [];
  const pagination: CoursePagination = data?.pagination ?? {
    page: initialQuery?.page ?? 1,
    limit: initialQuery?.limit ?? 10,
    total: 0,
    totalPages: 1,
  };
  const total = pagination.total;
  const error = queryError instanceof Error ? queryError.message : null;

  const fetchCourses = useCallback(
    async (query?: ListCoursesQuery) => {
      await queryClient.invalidateQueries({ queryKey: ['courses', query ?? initialQuery] });
    },
    [queryClient, initialQuery],
  );

  const createCourse = async (payload: CreateCourseInput): Promise<Course> => {
    const created = await coursesService.createCourse(payload);
    await queryClient.invalidateQueries({ queryKey: ['courses'] });
    return created;
  };

  const deleteCourse = async (id: string): Promise<void> => {
    await coursesService.deleteCourse(id);
    await queryClient.invalidateQueries({ queryKey: ['courses'] });
  };

  const toggleCourseStatus = async (
    id: string,
    isActive: boolean,
    expectedUpdatedAt?: string,
  ): Promise<Course> => {
    const updated = await coursesService.toggleCourseStatus(id, isActive, expectedUpdatedAt);
    await queryClient.invalidateQueries({ queryKey: ['courses'] });
    return updated;
  };

  const cloneCourse = async (id: string): Promise<Course> => {
    const cloned = await coursesService.cloneCourse(id);
    await queryClient.invalidateQueries({ queryKey: ['courses'] });
    return cloned;
  };

  const getCourseImpact = async (id: string): Promise<CourseImpact> => {
    return await coursesService.getCourseImpact(id);
  };

  return {
    courses,
    pagination,
    total,
    isLoading,
    isFetching,
    error,
    fetchCourses,
    createCourse,
    deleteCourse,
    toggleCourseStatus,
    cloneCourse,
    getCourseImpact,
  };
}

export function useCourseDetail(courseId: string) {
  return useQuery<Course | null>({
    queryKey: ['course', courseId],
    queryFn: () => coursesService.getCourseById(courseId, true),
    enabled: Boolean(courseId),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePrefetchCourse() {
  const queryClient = useQueryClient();
  return useCallback(
    (courseId: string) => {
      if (!courseId) return;
      void queryClient
        .query({
          queryKey: ['course', courseId],
          queryFn: () => coursesService.getCourseById(courseId, true),
          staleTime: 5 * 60 * 1000,
        })
        .catch(noop);
      void queryClient
        .query({
          queryKey: ['course-impact', courseId],
          queryFn: () => coursesService.getCourseImpact(courseId),
          staleTime: 5 * 60 * 1000,
        })
        .catch(noop);
    },
    [queryClient],
  );
}

export function useCourseBuilder(courseId: string) {
  const queryClient = useQueryClient();

  const {
    data: course = null,
    isLoading: isCourseLoading,
    error: courseError,
  } = useQuery<Course | null>({
    queryKey: ['course', courseId],
    queryFn: () => coursesService.getCourseById(courseId, true),
    enabled: Boolean(courseId),
  });

  const {
    data: impact = null,
    isLoading: isImpactLoading,
    error: impactError,
  } = useQuery<CourseImpact | null>({
    queryKey: ['course-impact', courseId],
    queryFn: () => coursesService.getCourseImpact(courseId),
    enabled: Boolean(courseId),
  });

  const isLoading = isCourseLoading || isImpactLoading;
  const activeError = courseError ?? impactError;
  const error = activeError instanceof Error ? activeError.message : null;

  const reloadCourseOnly = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['course', courseId] });
  }, [queryClient, courseId]);

  const reloadCourse = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['course', courseId] }),
      queryClient.invalidateQueries({ queryKey: ['course-impact', courseId] }),
    ]);
  }, [queryClient, courseId]);

  const updateCourse = async (payload: UpdateCourseInput): Promise<Course> => {
    const updated = await coursesService.updateCourse(courseId, payload);
    queryClient.setQueryData<Course | null>(['course', courseId], (prev) =>
      prev ? { ...prev, ...updated } : updated,
    );
    return updated;
  };

  const createTopic = async (payload: CreateTopicInput): Promise<Topic> => {
    const created = await coursesService.createTopic(courseId, payload);
    await reloadCourseOnly();
    return created;
  };

  const updateTopic = async (id: string, payload: UpdateTopicInput): Promise<Topic> => {
    const updated = await coursesService.updateTopic(id, payload);
    queryClient.setQueryData<Course | null>(['course', courseId], (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        topics: prev.topics?.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
      };
    });
    return updated;
  };

  const deleteTopic = async (id: string): Promise<void> => {
    await coursesService.deleteTopic(id);
    await reloadCourseOnly();
  };

  const reorderTopics = async (items: ReorderItemInput[]): Promise<void> => {
    const previous = queryClient.getQueryData<Course | null>(['course', courseId]);
    queryClient.setQueryData<Course | null>(['course', courseId], (prev) => {
      if (!prev || !prev.topics) return prev;
      const orderMap = new Map(items.map((it) => [it.id, it.displayOrder]));
      const sortedTopics = [...prev.topics]
        .map((t) => ({ ...t, displayOrder: orderMap.get(t.id) ?? t.displayOrder }))
        .sort((a, b) => a.displayOrder - b.displayOrder);
      return { ...prev, topics: sortedTopics };
    });
    try {
      await coursesService.reorderTopics(courseId, items);
      await reloadCourseOnly();
    } catch (err: unknown) {
      if (previous) {
        queryClient.setQueryData(['course', courseId], previous);
      }
      throw err;
    }
  };

  const createSubtopic = async (
    topicId: string,
    payload: CreateSubtopicInput,
  ): Promise<Subtopic> => {
    const created = await coursesService.createSubtopic(topicId, payload);
    await reloadCourseOnly();
    return created;
  };

  const updateSubtopic = async (id: string, payload: UpdateSubtopicInput): Promise<Subtopic> => {
    const updated = await coursesService.updateSubtopic(id, payload);
    queryClient.setQueryData<Course | null>(['course', courseId], (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        topics: prev.topics?.map((t) => ({
          ...t,
          subtopics: t.subtopics?.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)),
        })),
      };
    });
    return updated;
  };

  const deleteSubtopic = async (id: string): Promise<void> => {
    await coursesService.deleteSubtopic(id);
    await reloadCourseOnly();
  };

  const reorderSubtopics = async (topicId: string, items: ReorderItemInput[]): Promise<void> => {
    const previous = queryClient.getQueryData<Course | null>(['course', courseId]);
    queryClient.setQueryData<Course | null>(['course', courseId], (prev) => {
      if (!prev || !prev.topics) return prev;
      const orderMap = new Map(items.map((it) => [it.id, it.displayOrder]));
      const updatedTopics = prev.topics.map((t) => {
        if (t.id !== topicId || !t.subtopics) return t;
        const sortedSubtopics = [...t.subtopics]
          .map((s) => ({ ...s, displayOrder: orderMap.get(s.id) ?? s.displayOrder }))
          .sort((a, b) => a.displayOrder - b.displayOrder);
        return { ...t, subtopics: sortedSubtopics };
      });
      return { ...prev, topics: updatedTopics };
    });
    try {
      await coursesService.reorderSubtopics(topicId, items);
      await reloadCourseOnly();
    } catch (err: unknown) {
      if (previous) {
        queryClient.setQueryData(['course', courseId], previous);
      }
      throw err;
    }
  };

  const createAssignment = async (payload: CreateAssignmentInput): Promise<Assignment> => {
    const created = await coursesService.createAssignment(courseId, payload);
    await reloadCourseOnly();
    return created;
  };

  const updateAssignment = async (
    id: string,
    payload: UpdateAssignmentInput,
  ): Promise<Assignment> => {
    const updated = await coursesService.updateAssignment(id, payload);
    queryClient.setQueryData<Course | null>(['course', courseId], (prev) => {
      if (!prev) return prev;
      const updatedCourseAssignments = (prev.courseAssignments || prev.assignments)?.map((a) =>
        a.id === updated.id ? { ...a, ...updated } : a,
      );
      const updatedTopics = prev.topics?.map((t) => ({
        ...t,
        assignments: t.assignments?.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)),
      }));
      return {
        ...prev,
        assignments: updatedCourseAssignments,
        courseAssignments: updatedCourseAssignments,
        topics: updatedTopics,
      };
    });
    return updated;
  };

  const deleteAssignment = async (id: string): Promise<void> => {
    await coursesService.deleteAssignment(id);
    await reloadCourseOnly();
  };

  const reorderAssignments = async (items: ReorderItemInput[], topicId?: string): Promise<void> => {
    const previous = queryClient.getQueryData<Course | null>(['course', courseId]);
    queryClient.setQueryData<Course | null>(['course', courseId], (prev) => {
      if (!prev) return prev;
      const orderMap = new Map(items.map((it) => [it.id, it.displayOrder]));
      if (topicId) {
        const updatedTopics = prev.topics?.map((t) => {
          if (t.id !== topicId || !t.assignments) return t;
          const sortedTopicAssigns = [...t.assignments]
            .map((a) => ({ ...a, displayOrder: orderMap.get(a.id) ?? a.displayOrder }))
            .sort((a, b) => a.displayOrder - b.displayOrder);
          return { ...t, assignments: sortedTopicAssigns };
        });
        return { ...prev, topics: updatedTopics };
      }
      const currentCourseAssigns = prev.courseAssignments || prev.assignments || [];
      const updatedCourseAssigns = currentCourseAssigns
        .map((a) => ({ ...a, displayOrder: orderMap.get(a.id) ?? a.displayOrder }))
        .sort((a, b) => a.displayOrder - b.displayOrder);
      return {
        ...prev,
        assignments: updatedCourseAssigns,
        courseAssignments: updatedCourseAssigns,
      };
    });
    try {
      await coursesService.reorderAssignments(courseId, items);
      await reloadCourseOnly();
    } catch (err: unknown) {
      if (previous) {
        queryClient.setQueryData(['course', courseId], previous);
      }
      throw err;
    }
  };

  return {
    course,
    impact,
    isLoading,
    error,
    reloadCourse,
    updateCourse,
    createTopic,
    updateTopic,
    deleteTopic,
    reorderTopics,
    createSubtopic,
    updateSubtopic,
    deleteSubtopic,
    reorderSubtopics,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    reorderAssignments,
  };
}

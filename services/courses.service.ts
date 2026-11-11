import {
  Assignment,
  AssignmentScope,
  Course,
  CourseImpact,
  CoursePagination,
  CreateAssignmentInput,
  CreateCourseInput,
  CreateSubtopicInput,
  CreateTopicInput,
  ListCoursesQuery,
  ReorderItemInput,
  ResourceItem,
  SubmissionMode,
  Subtopic,
  Topic,
  UpdateAssignmentInput,
  UpdateCourseInput,
  UpdateSubtopicInput,
  UpdateTopicInput,
} from '@/types/courses';

import { apiClient } from './api.client';

export {
  type Assignment,
  AssignmentScope,
  type Course,
  type CourseImpact,
  type CoursePagination,
  type CreateAssignmentInput,
  type CreateCourseInput,
  type CreateSubtopicInput,
  type CreateTopicInput,
  type ListCoursesQuery,
  type ReorderItemInput,
  type ResourceItem,
  SubmissionMode,
  type Subtopic,
  type Topic,
  type UpdateAssignmentInput,
  type UpdateCourseInput,
  type UpdateSubtopicInput,
  type UpdateTopicInput,
};

// API Response Wrappers
interface ApiResponse<T> {
  status?: string;
  success?: boolean;
  data: T;
  meta?: CoursePagination;
  message?: string;
}

export const coursesService = {
  // Course APIs
  async listCourses(
    params?: ListCoursesQuery,
    options?: { signal?: AbortSignal },
  ): Promise<{ courses: Course[]; pagination: CoursePagination }> {
    const res = await apiClient<
      ApiResponse<{ courses: Course[]; pagination: CoursePagination } | Course[]>
    >('/courses', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search || undefined,
        isActive:
          params?.isActive !== undefined && params.isActive !== 'all'
            ? String(params.isActive)
            : undefined,
        sortBy: params?.sortBy ?? 'createdAt',
        sortOrder: params?.sortOrder ?? 'desc',
      },
      ...(options?.signal ? { signal: options.signal } : {}),
    });

    if (res.data && 'courses' in res.data && Array.isArray(res.data.courses)) {
      return res.data;
    }
    if (res.data && Array.isArray(res.data)) {
      const meta = res.meta;
      return {
        courses: res.data,
        pagination: meta ?? {
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          total: res.data.length,
          totalPages: Math.max(1, Math.ceil(res.data.length / (params?.limit ?? 10))),
        },
      };
    }
    return {
      courses: [],
      pagination: { page: 1, limit: params?.limit ?? 10, total: 0, totalPages: 1 },
    };
  },

  async getCourseById(id: string, outline = true, authToken?: string): Promise<Course> {
    const res = await apiClient<ApiResponse<{ course?: Course } & Course>>(`/courses/${id}`, {
      params: { outline: String(outline) },
      ...(authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {}),
    });
    return res.data?.course ?? res.data;
  },

  async createCourse(payload: CreateCourseInput): Promise<Course> {
    const res = await apiClient<ApiResponse<{ course?: Course } & Course>>('/courses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data?.course ?? res.data;
  },

  async updateCourse(id: string, payload: UpdateCourseInput): Promise<Course> {
    const res = await apiClient<ApiResponse<{ course?: Course } & Course>>(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data?.course ?? res.data;
  },

  async toggleCourseStatus(
    id: string,
    isActive: boolean,
    expectedUpdatedAt?: string,
  ): Promise<Course> {
    const res = await apiClient<ApiResponse<{ course?: Course } & Course>>(
      `/courses/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ isActive, expectedUpdatedAt }),
      },
    );
    return res.data?.course ?? res.data;
  },

  async deleteCourse(id: string): Promise<void> {
    await apiClient<ApiResponse<void>>(`/courses/${id}`, {
      method: 'DELETE',
    });
  },

  async cloneCourse(id: string): Promise<Course> {
    const res = await apiClient<ApiResponse<{ course?: Course } & Course>>(`/courses/${id}/clone`, {
      method: 'POST',
    });
    return res.data?.course ?? res.data;
  },

  async getCourseImpact(id: string, authToken?: string): Promise<CourseImpact> {
    const res = await apiClient<ApiResponse<{ impact?: CourseImpact } & CourseImpact>>(
      `/courses/${id}/impact`,
      authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {},
    );
    return res.data?.impact ?? res.data;
  },

  // Topic APIs
  async createTopic(courseId: string, payload: CreateTopicInput): Promise<Topic> {
    const res = await apiClient<ApiResponse<{ topic?: Topic } & Topic>>(
      `/courses/${courseId}/topics`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
    return res.data?.topic ?? res.data;
  },

  async updateTopic(id: string, payload: UpdateTopicInput): Promise<Topic> {
    const res = await apiClient<ApiResponse<{ topic?: Topic } & Topic>>(`/courses/topics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data?.topic ?? res.data;
  },

  async toggleTopicStatus(
    id: string,
    isActive: boolean,
    expectedUpdatedAt?: string,
  ): Promise<Topic> {
    const res = await apiClient<ApiResponse<{ topic?: Topic } & Topic>>(
      `/courses/topics/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ isActive, expectedUpdatedAt }),
      },
    );
    return res.data?.topic ?? res.data;
  },

  async deleteTopic(id: string): Promise<void> {
    await apiClient<ApiResponse<void>>(`/courses/topics/${id}`, {
      method: 'DELETE',
    });
  },

  async reorderTopics(courseId: string, items: ReorderItemInput[]): Promise<void> {
    await apiClient<ApiResponse<void>>(`/courses/${courseId}/topics/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
  },

  // Subtopic APIs
  async createSubtopic(topicId: string, payload: CreateSubtopicInput): Promise<Subtopic> {
    const res = await apiClient<ApiResponse<{ subtopic?: Subtopic } & Subtopic>>(
      `/courses/topics/${topicId}/subtopics`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
    return res.data?.subtopic ?? res.data;
  },

  async updateSubtopic(id: string, payload: UpdateSubtopicInput): Promise<Subtopic> {
    const res = await apiClient<ApiResponse<{ subtopic?: Subtopic } & Subtopic>>(
      `/courses/subtopics/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
    );
    return res.data?.subtopic ?? res.data;
  },

  async toggleSubtopicStatus(
    id: string,
    isActive: boolean,
    expectedUpdatedAt?: string,
  ): Promise<Subtopic> {
    const res = await apiClient<ApiResponse<{ subtopic?: Subtopic } & Subtopic>>(
      `/courses/subtopics/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ isActive, expectedUpdatedAt }),
      },
    );
    return res.data?.subtopic ?? res.data;
  },

  async deleteSubtopic(id: string): Promise<void> {
    await apiClient<ApiResponse<void>>(`/courses/subtopics/${id}`, {
      method: 'DELETE',
    });
  },

  async reorderSubtopics(topicId: string, items: ReorderItemInput[]): Promise<void> {
    await apiClient<ApiResponse<void>>(`/courses/topics/${topicId}/subtopics/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
  },

  // Assignment APIs
  async createAssignment(courseId: string, payload: CreateAssignmentInput): Promise<Assignment> {
    const res = await apiClient<ApiResponse<{ assignment?: Assignment } & Assignment>>(
      `/courses/${courseId}/assignments`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
    return res.data?.assignment ?? res.data;
  },

  async updateAssignment(id: string, payload: UpdateAssignmentInput): Promise<Assignment> {
    const res = await apiClient<ApiResponse<{ assignment?: Assignment } & Assignment>>(
      `/courses/assignments/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
    );
    return res.data?.assignment ?? res.data;
  },

  async deleteAssignment(id: string): Promise<void> {
    await apiClient<ApiResponse<void>>(`/courses/assignments/${id}`, {
      method: 'DELETE',
    });
  },

  async reorderAssignments(courseId: string, items: ReorderItemInput[]): Promise<void> {
    await apiClient<ApiResponse<void>>(`/courses/${courseId}/assignments/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
  },
};

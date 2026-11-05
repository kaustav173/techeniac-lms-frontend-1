import type { CourseAllocationStatus } from '@/services/allocations.service';
import { apiClient } from '@/services/api.client';

export type TopicProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface TopicProgressItem {
  readonly topicId: string;
  readonly title: string;
  readonly description: string | null;
  readonly displayOrder: number;
  readonly estimatedMinutes: number | null;
  readonly status: TopicProgressStatus;
  readonly deadline: string | null;
  readonly completedAt: string | null;
  readonly note: string | null;
  readonly isOverdue: boolean;
}

export interface AllocationProgressOverview {
  readonly id: string;
  readonly courseId: string;
  readonly courseTitle: string;
  readonly status: CourseAllocationStatus;
  readonly progressPercent: number;
  readonly startDate: string;
  readonly dueDate: string;
  readonly isOverdue: boolean;
  readonly readOnly: boolean;
}

export interface AllocationProgressResponse {
  readonly allocation: AllocationProgressOverview;
  readonly topics: TopicProgressItem[];
}

export interface UpdateTopicStatusPayload {
  readonly status: TopicProgressStatus;
  readonly note?: string | undefined;
}

export interface UpdateTopicStatusResponse {
  readonly topicProgress: {
    readonly topicId: string;
    readonly status: TopicProgressStatus;
    readonly completedAt: string | null;
    readonly note: string | null;
  };
  readonly allocation: {
    readonly progressPercent: number;
    readonly status: CourseAllocationStatus;
  };
}

export interface UpdateTopicDeadlinePayload {
  readonly deadline: string;
}

export interface UpdateTopicDeadlineResponse {
  readonly topicId: string;
  readonly deadline: string;
}

export interface ProgressTrackerItem {
  readonly allocationId: string;
  readonly menteeId: string;
  readonly menteeName: string;
  readonly batchId: string | null;
  readonly batchName: string | null;
  readonly courseId: string;
  readonly courseTitle: string;
  readonly progressPercent: number;
  readonly status: CourseAllocationStatus;
  readonly totalActiveTopics: number;
  readonly completedTopicsCount: number;
  readonly overdueTopicsCount: number;
  readonly isOverdue: boolean;
}

export interface ProgressTrackerPagination {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface ProgressTrackerResponse {
  readonly trackers: ProgressTrackerItem[];
  readonly pagination: ProgressTrackerPagination;
}

export interface ProgressTrackerFilters {
  readonly batchId?: string | undefined;
  readonly menteeId?: string | undefined;
  readonly courseId?: string | undefined;
  readonly search?: string | undefined;
  readonly page?: number | undefined;
  readonly limit?: number | undefined;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  message?: string;
}

const BASE = '/course-allocations';
const DEFAULT_PAGE_LIMIT = 10;

function buildFallbackPagination(
  filters: ProgressTrackerFilters,
  total: number,
): ProgressTrackerPagination {
  const limit = filters.limit ?? DEFAULT_PAGE_LIMIT;
  return {
    page: filters.page ?? 1,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export const progressService = {
  async getAllocationProgress(allocationId: string): Promise<AllocationProgressResponse> {
    const res = await apiClient<ApiResponse<AllocationProgressResponse>>(
      `${BASE}/${allocationId}/topic-progress`,
      { method: 'GET' },
    );
    if (!res.data) {
      throw new Error('No progress data returned from server');
    }
    return res.data;
  },

  async updateTopicStatus(
    allocationId: string,
    topicId: string,
    payload: UpdateTopicStatusPayload,
  ): Promise<UpdateTopicStatusResponse> {
    const res = await apiClient<ApiResponse<UpdateTopicStatusResponse>>(
      `${BASE}/${allocationId}/topics/${topicId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    );
    if (!res.data) {
      throw new Error('Failed to update topic status');
    }
    return res.data;
  },

  async updateTopicDeadline(
    allocationId: string,
    topicId: string,
    payload: UpdateTopicDeadlinePayload,
  ): Promise<UpdateTopicDeadlineResponse> {
    const res = await apiClient<ApiResponse<UpdateTopicDeadlineResponse>>(
      `${BASE}/${allocationId}/topics/${topicId}/deadline`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    );
    if (!res.data) {
      throw new Error('Failed to update topic deadline');
    }
    return res.data;
  },

  async getProgressTrackers(
    filters: ProgressTrackerFilters = {},
  ): Promise<ProgressTrackerResponse> {
    const params: Record<string, string> = {};
    if (filters.batchId) params.batchId = filters.batchId;
    if (filters.menteeId) params.menteeId = filters.menteeId;
    if (filters.courseId) params.courseId = filters.courseId;
    if (filters.search) params.search = filters.search;
    if (filters.page) params.page = String(filters.page);
    if (filters.limit) params.limit = String(filters.limit);

    const res = await apiClient<
      ApiResponse<
        | ProgressTrackerItem[]
        | {
            trackers: ProgressTrackerItem[];
            pagination?: ProgressTrackerPagination;
          }
      >
    >('/progress/trackers', {
      method: 'GET',
      params,
    });

    const trackers: ProgressTrackerItem[] = Array.isArray(res.data)
      ? res.data
      : res.data && Array.isArray(res.data.trackers)
        ? res.data.trackers
        : [];

    let pagination: ProgressTrackerPagination;

    if (res.meta) {
      const page = res.meta.page ?? filters.page ?? 1;
      const limit = res.meta.limit ?? filters.limit ?? DEFAULT_PAGE_LIMIT;
      const total = res.meta.total ?? trackers.length;
      const totalPages = res.meta.totalPages ?? (Math.ceil(total / limit) || 1);
      pagination = { page, limit, total, totalPages };
    } else if (!Array.isArray(res.data) && res.data?.pagination) {
      const legacy = res.data.pagination;
      const page = legacy.page ?? filters.page ?? 1;
      const limit = legacy.limit ?? filters.limit ?? DEFAULT_PAGE_LIMIT;
      const total = legacy.total ?? trackers.length;
      const totalPages = legacy.totalPages ?? (Math.ceil(total / limit) || 1);
      pagination = { page, limit, total, totalPages };
    } else {
      pagination = buildFallbackPagination(filters, trackers.length);
    }

    return { trackers, pagination };
  },
};

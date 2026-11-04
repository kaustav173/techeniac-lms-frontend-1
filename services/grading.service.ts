import type {
  GradeSubmissionInput,
  PaginatedSubmissionQueueResponse,
  RequestResubmissionInput,
  SubmissionQueueItem,
  SubmissionQueueQuery,
  SubmissionReviewDetails,
} from '@/types/grading';

import { apiClient, type RequestOptions } from './api.client';
import { normalizeSubmissionData } from './submissions.service';

interface QueueApiResponse {
  data: SubmissionQueueItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ReviewApiResponse {
  data: SubmissionReviewDetails;
}

export const gradingService = {
  async getSubmissionQueue(
    query?: SubmissionQueueQuery,
    signal?: AbortSignal,
  ): Promise<PaginatedSubmissionQueueResponse> {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (query?.status) params.status = query.status;
    if (query?.batchId) params.batchId = query.batchId;
    if (query?.menteeId) params.menteeId = query.menteeId;
    if (query?.courseId) params.courseId = query.courseId;
    if (query?.topicId) params.topicId = query.topicId;
    if (query?.isLate !== undefined) params.isLate = query.isLate;
    if (query?.search) params.search = query.search;
    if (query?.fromDate) params.fromDate = query.fromDate;
    if (query?.toDate) params.toDate = query.toDate;
    if (query?.sort) params.sort = query.sort;
    if (query?.page) params.page = query.page;
    if (query?.limit) params.limit = query.limit;

    const options: RequestOptions = { method: 'GET', params };
    if (signal) {
      options.signal = signal;
    }

    const res = await apiClient<QueueApiResponse>('/submissions/queue', options);

    return {
      items: res.data || [],
      total: res.meta?.total || 0,
      page: res.meta?.page || 1,
      limit: res.meta?.limit || 20,
      totalPages: res.meta?.totalPages || 1,
    };
  },

  async getReviewDetails(
    submissionId: string,
    signal?: AbortSignal,
  ): Promise<SubmissionReviewDetails> {
    const options: RequestOptions = { method: 'GET' };
    if (signal) {
      options.signal = signal;
    }

    const res = await apiClient<ReviewApiResponse>(`/submissions/${submissionId}/review`, options);
    return {
      ...res.data,
      submissionData: normalizeSubmissionData(
        res.data.submissionData as unknown as Record<string, unknown> | null | undefined,
      ),
    };
  },

  async gradeSubmission(
    submissionId: string,
    payload: GradeSubmissionInput,
  ): Promise<SubmissionReviewDetails> {
    const res = await apiClient<ReviewApiResponse>(`/submissions/${submissionId}/grade`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async requestResubmission(
    submissionId: string,
    payload: RequestResubmissionInput,
  ): Promise<SubmissionReviewDetails> {
    const res = await apiClient<ReviewApiResponse>(
      `/submissions/${submissionId}/resubmit-request`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
    return res.data;
  },
};

import type {
  AssignmentSubmissionDetails,
  AssignmentWithSubmissionStatus,
  CreateSubmissionInput,
  ListMyAssignmentsQuery,
  PaginatedAssignmentsResponse,
  SubmissionData,
  SubmissionVersion,
} from '@/types/submissions';

import { apiClient } from './api.client';

interface ListApiResponse {
  data: AssignmentWithSubmissionStatus[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface DetailApiResponse {
  data: AssignmentSubmissionDetails;
}

interface SubmitApiResponse {
  data: SubmissionVersion;
}

/**
 * Normalizes submissionData across raw API responses and legacy aliases
 * into the canonical camelCase structure (pdfUrl, zipUrl, linkUrl).
 */
export function normalizeSubmissionData(
  raw: Record<string, unknown> | null | undefined,
): SubmissionData {
  if (!raw) return {};
  return {
    pdfUrl: ((raw.pdfUrl ?? raw.pdf_url ?? null) as string | null) || undefined,
    zipUrl: ((raw.zipUrl ?? raw.zip_url ?? null) as string | null) || undefined,
    linkUrl: ((raw.linkUrl ?? raw.link_url ?? raw.url ?? null) as string | null) || undefined,
  };
}

function normalizeSubmissionVersion(v: SubmissionVersion): SubmissionVersion {
  return {
    ...v,
    submissionData: normalizeSubmissionData(
      v.submissionData as unknown as Record<string, unknown> | null | undefined,
    ),
  };
}

export const submissionsService = {
  async getMyAssignments(
    query?: ListMyAssignmentsQuery,
    signal?: AbortSignal,
  ): Promise<PaginatedAssignmentsResponse> {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (query?.page) params.page = query.page;
    if (query?.limit) params.limit = query.limit;
    if (query?.status) params.status = query.status;
    if (query?.statuses && query.statuses.length > 0) {
      params.statuses = query.statuses.join(',');
    }
    if (query?.search) params.search = query.search;
    if (query?.courseId) params.courseId = query.courseId;

    const response = await apiClient<ListApiResponse>('/submissions/my-assignments', {
      params,
      ...(signal ? { signal } : {}),
    });

    return {
      items: response.data,
      total: response.meta.total,
      page: response.meta.page,
      limit: response.meta.limit,
      totalPages: response.meta.totalPages,
    };
  },

  async getAssignmentSubmissionDetails(
    assignmentId: string,
    signal?: AbortSignal,
  ): Promise<AssignmentSubmissionDetails> {
    const response = await apiClient<DetailApiResponse>(
      `/submissions/assignments/${assignmentId}`,
      signal ? { signal } : {},
    );

    return {
      ...response.data,
      versions: (response.data.versions || []).map(normalizeSubmissionVersion),
    };
  },

  async submitAssignment(input: CreateSubmissionInput): Promise<SubmissionVersion> {
    const payload = {
      ...input,
      submissionData: {
        pdfUrl: input.submissionData.pdfUrl || undefined,
        zipUrl: input.submissionData.zipUrl || undefined,
        linkUrl: input.submissionData.linkUrl || undefined,
        // Backend compatibility: include snake_case and 'url' aliases for legacy backend validators
        pdf_url: input.submissionData.pdfUrl || undefined,
        zip_url: input.submissionData.zipUrl || undefined,
        link_url: input.submissionData.linkUrl || undefined,
        url: input.submissionData.linkUrl || undefined,
      },
    };

    const response = await apiClient<SubmitApiResponse>('/submissions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return normalizeSubmissionVersion(response.data);
  },
};

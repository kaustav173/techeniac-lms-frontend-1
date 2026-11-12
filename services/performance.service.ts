import { apiBlobClient, apiClient, type RequestOptions } from './api.client';

export interface GradeDistributionBucket {
  readonly count: number;
  readonly percentage: number;
}

export interface PerformanceOverviewMetrics {
  readonly averageMarks: number;
  readonly gradeDistribution: Record<'A+' | 'A' | 'B' | 'C' | 'D' | 'F', GradeDistributionBucket>;
  readonly onTimeRate: number;
  readonly completionPercentage: number;
  readonly overdueCount: number;
  readonly totalMentees: number;
  readonly totalSubmissions: number;
}

export interface MenteePerformanceRow {
  readonly menteeId: string;
  readonly menteeName: string;
  readonly menteeEmail: string;
  readonly batchId: string | null;
  readonly batchName: string | null;
  readonly assignedCoursesCount: number;
  readonly completedCoursesCount: number;
  readonly completionPercentage: number;
  readonly averageMarks: number | null;
  readonly totalSubmissions: number;
  readonly onTimeSubmissions: number;
  readonly onTimeRate: number;
  readonly overdueCount: number;
  readonly latestGrade: string | null;
}

export interface PaginatedPerformanceData {
  readonly metrics: PerformanceOverviewMetrics;
  readonly mentees: readonly MenteePerformanceRow[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

export interface PerformanceFilterParams {
  readonly batchId?: string | string[] | undefined;
  readonly mentorId?: string | undefined;
  readonly courseId?: string | string[] | undefined;
  readonly startDate?: string | undefined;
  readonly endDate?: string | undefined;
  readonly gradeRange?: string | undefined;
  readonly status?: string | string[] | undefined;
  readonly search?: string | undefined;
  readonly page?: number | undefined;
  readonly limit?: number | undefined;
  readonly sortBy?:
    | (
        | 'averageMarks'
        | 'completionPercentage'
        | 'onTimeRate'
        | 'overdueCount'
        | 'name'
        | 'batch'
        | 'courses'
        | 'grade'
      )
    | undefined;
  readonly sortOrder?: ('ASC' | 'DESC') | undefined;
}

export interface LearningHistoryAssignment {
  readonly assignmentId: string;
  readonly assignmentTitle: string;
  readonly maxMarks: number;
  readonly passMarks: number;
  readonly version: number;
  readonly submittedAt: string;
  readonly isLate: boolean;
  readonly status: string;
  readonly marks: number | null;
  readonly gradeLabel: string | null;
  readonly feedback: string | null;
}

export interface LearningHistoryAllocation {
  readonly allocationId: string;
  readonly courseId: string;
  readonly courseTitle: string;
  readonly progressPercent: number;
  readonly status: string;
  readonly startDate: string;
  readonly dueDate: string;
  readonly completedAt: string | null;
  readonly assignments: readonly LearningHistoryAssignment[];
}

export interface LearningHistoryBatch {
  readonly batchId: string;
  readonly batchName: string;
  readonly status: string;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly courseAllocations: readonly LearningHistoryAllocation[];
}

export interface LearningHistoryResult {
  readonly user: {
    readonly id: string;
    readonly name: string;
    readonly email: string;
  };
  readonly batches: readonly LearningHistoryBatch[];
  readonly summary: {
    readonly totalAllocations: number;
    readonly completedAllocations: number;
    readonly overallProgress: number;
    readonly averageMarks: number | null;
  };
}

export const performanceService = {
  async getPerformance(params?: PerformanceFilterParams): Promise<PaginatedPerformanceData> {
    const options: RequestOptions = {};
    if (params) {
      const sanitizedParams: Record<string, string | number | undefined> = {};

      if (params.page !== undefined && params.page !== null) {
        sanitizedParams.page = params.page;
      }
      if (params.limit !== undefined && params.limit !== null) {
        sanitizedParams.limit = params.limit;
      }
      if (params.sortBy) {
        sanitizedParams.sortBy = params.sortBy;
      }
      if (params.sortOrder) {
        sanitizedParams.sortOrder = params.sortOrder;
      }
      if (params.search && params.search.trim() !== '') {
        sanitizedParams.search = params.search.trim();
      }
      if (params.batchId) {
        const val = Array.isArray(params.batchId)
          ? params.batchId.join(',')
          : params.batchId.trim();
        if (val) sanitizedParams.batchId = val;
      }
      if (params.courseId) {
        const val = Array.isArray(params.courseId)
          ? params.courseId.join(',')
          : params.courseId.trim();
        if (val) sanitizedParams.courseId = val;
      }
      if (params.gradeRange && params.gradeRange !== 'ALL' && params.gradeRange.trim() !== '') {
        sanitizedParams.gradeRange = params.gradeRange.trim();
      }
      if (params.status) {
        const val = Array.isArray(params.status) ? params.status.join(',') : params.status.trim();
        if (val) sanitizedParams.status = val;
      }
      if (params.startDate && params.startDate.trim() !== '') {
        sanitizedParams.startDate = params.startDate.trim();
      }
      if (params.endDate && params.endDate.trim() !== '') {
        sanitizedParams.endDate = params.endDate.trim();
      }
      if (params.mentorId && params.mentorId.trim() !== '') {
        sanitizedParams.mentorId = params.mentorId.trim();
      }

      options.params = sanitizedParams;
    }
    const res = await apiClient<{
      success: boolean;
      data: {
        metrics: PerformanceOverviewMetrics;
        mentees: readonly MenteePerformanceRow[];
        pagination?: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
      meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>('/performance', options);

    const pagination = res.data.pagination ??
      res.meta ?? {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        total: res.data.mentees?.length ?? 0,
        totalPages: Math.ceil((res.data.mentees?.length ?? 0) / (params?.limit ?? 10)) || 1,
      };

    return {
      metrics: res.data.metrics,
      mentees: res.data.mentees ?? [],
      pagination,
    };
  },

  async getLearningHistory(batchId?: string): Promise<LearningHistoryResult> {
    const options: RequestOptions = {};
    if (batchId) {
      options.params = { batchId };
    }
    const res = await apiClient<{ success: boolean; data: LearningHistoryResult }>(
      '/me/learning-history',
      options,
    );
    return res.data;
  },

  async downloadCsv(params?: PerformanceFilterParams): Promise<void> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      format: 'csv',
    };
    if (params) {
      if (params.sortBy) queryParams.sortBy = params.sortBy;
      if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
      if (params.search && params.search.trim() !== '') queryParams.search = params.search.trim();
      if (params.batchId) {
        const val = Array.isArray(params.batchId)
          ? params.batchId.join(',')
          : params.batchId.trim();
        if (val) queryParams.batchId = val;
      }
      if (params.courseId) {
        const val = Array.isArray(params.courseId)
          ? params.courseId.join(',')
          : params.courseId.trim();
        if (val) queryParams.courseId = val;
      }
      if (params.gradeRange && params.gradeRange !== 'ALL' && params.gradeRange.trim() !== '') {
        queryParams.gradeRange = params.gradeRange.trim();
      }
      if (params.status) {
        const val = Array.isArray(params.status) ? params.status.join(',') : params.status.trim();
        if (val) queryParams.status = val;
      }
      if (params.startDate && params.startDate.trim() !== '')
        queryParams.startDate = params.startDate.trim();
      if (params.endDate && params.endDate.trim() !== '')
        queryParams.endDate = params.endDate.trim();
      if (params.mentorId && params.mentorId.trim() !== '')
        queryParams.mentorId = params.mentorId.trim();
    }

    const blob = await apiBlobClient('/performance/export', {
      params: queryParams,
    });

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `performance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  },
};

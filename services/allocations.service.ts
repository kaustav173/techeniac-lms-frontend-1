import { apiClient } from '@/services/api.client';

export const CourseAllocationStatus = {
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REVOKED: 'REVOKED',
  CLOSED_ROLE_CHANGE: 'CLOSED_ROLE_CHANGE',
  CLOSED_BATCH_CHANGE: 'CLOSED_BATCH_CHANGE',
} as const;

export type CourseAllocationStatus =
  (typeof CourseAllocationStatus)[keyof typeof CourseAllocationStatus];

export const AllocationDisplayStatus = {
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  REVOKED: 'Revoked',
  ROLE_CHANGED: 'Role Changed',
  BATCH_TRANSFERRED: 'Batch Transferred',
  OVERDUE: 'Overdue',
} as const;

export type AllocationDisplayStatus =
  (typeof AllocationDisplayStatus)[keyof typeof AllocationDisplayStatus];

export function isTerminalAllocationStatus(status: CourseAllocationStatus): boolean {
  return (
    status === CourseAllocationStatus.COMPLETED ||
    status === CourseAllocationStatus.REVOKED ||
    status === CourseAllocationStatus.CLOSED_ROLE_CHANGE ||
    status === CourseAllocationStatus.CLOSED_BATCH_CHANGE
  );
}

export type AllocationTargetType = 'BATCH' | 'SELECTED_MENTEES' | 'INDIVIDUAL_MENTEES';

export interface AssignmentDueOverride {
  readonly id: string;
  readonly courseAllocationId: string;
  readonly assignmentId: string;
  readonly dueDate: string;
  readonly estimatedMinutes?: number | null | undefined;
  readonly setBy: string;
  readonly assignment?:
    | {
        readonly id: string;
        readonly title: string;
        readonly maxMarks: number;
      }
    | undefined;
}

export interface CourseAllocation {
  readonly id: string;
  readonly courseId: string;
  readonly batchId?: string | null | undefined;
  readonly userId: string;
  readonly startDate: string;
  readonly dueDate: string;
  readonly estimatedMinutes?: number | null | undefined;
  readonly status: CourseAllocationStatus;
  readonly completedAt?: string | null | undefined;
  readonly progressPercent: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly course?:
    | {
        readonly id: string;
        readonly title: string;
        readonly description?: string | null | undefined;
        readonly estimatedMinutes?: number | null | undefined;
      }
    | undefined;
  readonly batch?:
    | {
        readonly id: string;
        readonly name: string;
        readonly code: string;
      }
    | null
    | undefined;
  readonly user?:
    | {
        readonly id: string;
        readonly name: string;
        readonly email: string;
      }
    | undefined;
  readonly isOverdue?: boolean | undefined;
  readonly assignmentOverrides?: readonly AssignmentDueOverride[] | undefined;
}

export interface CreateAllocationsPayload {
  readonly courseId: string;
  readonly targetType: AllocationTargetType;
  readonly batchId?: string | undefined;
  readonly menteeIds?: readonly string[] | undefined;
  readonly startDate: string;
  readonly dueDate?: string | undefined;
}

export interface CreateAllocationsResponse {
  readonly created: readonly CourseAllocation[];
  readonly allocations?: readonly CourseAllocation[] | undefined;
  readonly skipped: ReadonlyArray<{ readonly menteeId: string; readonly reason: string }>;
}

export interface AllocationFilters {
  readonly page?: number | undefined;
  readonly limit?: number | undefined;
  readonly courseId?: string | undefined;
  readonly courseIds?: readonly string[] | undefined;
  readonly batchId?: string | undefined;
  readonly batchIds?: readonly string[] | undefined;
  readonly menteeId?: string | undefined;
  readonly status?: CourseAllocationStatus | 'OVERDUE' | undefined;
  readonly statuses?: readonly (CourseAllocationStatus | 'OVERDUE')[] | undefined;
  readonly isOverdue?: boolean | undefined;
  readonly search?: string | undefined;
  readonly dueDateFrom?: string | undefined;
  readonly dueDateTo?: string | undefined;
  readonly sortBy?:
    | 'course'
    | 'mentee'
    | 'batch'
    | 'started'
    | 'due'
    | 'progress'
    | 'status'
    | 'createdAt'
    | undefined;
  readonly sortOrder?: 'asc' | 'desc' | undefined;
}

export interface AllocationListResponse {
  readonly items: readonly CourseAllocation[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

export interface UpdateAllocationDatesPayload {
  readonly startDate?: string | undefined;
  readonly dueDate?: string | undefined;
}

export interface BulkUpdateAllocationDatesPayload {
  readonly allocationIds: readonly string[];
  readonly startDate?: string | undefined;
  readonly dueDate?: string | undefined;
}

export interface AddMenteesPayload {
  readonly menteeIds: readonly string[];
  readonly startDate?: string | undefined;
  readonly dueDate?: string | undefined;
}

export interface AssignmentDueOverridePayload {
  readonly assignmentId: string;
  readonly dueDate: string;
}

export interface BulkAssignmentDueOverridePayload {
  readonly allocationIds: readonly string[];
  readonly assignmentId: string;
  readonly dueDate: string;
}

interface ApiResponse<T> {
  readonly success?: boolean | undefined;
  readonly data: T;
  readonly meta?:
    | {
        readonly page?: number | undefined;
        readonly limit?: number | undefined;
        readonly total?: number | undefined;
      }
    | undefined;
  readonly message?: string | undefined;
}

interface RawAllocationsEnvelope {
  readonly allocations?: readonly CourseAllocation[] | undefined;
  readonly created?: readonly CourseAllocation[] | undefined;
  readonly skipped?:
    ReadonlyArray<{ readonly menteeId: string; readonly reason: string }> | undefined;
}

function normalizeAllocationsResponse(
  data: RawAllocationsEnvelope | undefined,
): CreateAllocationsResponse {
  const created = data?.created ?? data?.allocations ?? [];
  return {
    created,
    allocations: created,
    skipped: data?.skipped ?? [],
  };
}

const BASE = '/course-allocations';

export const allocationsService = {
  async listAllocations(filters: AllocationFilters = {}): Promise<AllocationListResponse> {
    const params: Record<string, string | number> = {};
    if (filters.page !== undefined) params.page = filters.page;
    if (filters.limit !== undefined) params.limit = filters.limit;
    if (filters.courseId) params.courseId = filters.courseId;
    if (filters.courseIds && filters.courseIds.length > 0) {
      params.courseIds = filters.courseIds.join(',');
    }
    if (filters.batchId) params.batchId = filters.batchId;
    if (filters.batchIds && filters.batchIds.length > 0) {
      params.batchIds = filters.batchIds.join(',');
    }
    if (filters.menteeId) params.menteeId = filters.menteeId;
    if (filters.status) params.status = filters.status;
    if (filters.statuses && filters.statuses.length > 0) {
      params.statuses = filters.statuses.join(',');
    }
    if (filters.isOverdue !== undefined) params.isOverdue = String(filters.isOverdue);
    if (filters.search) params.search = filters.search;
    if (filters.dueDateFrom) params.dueDateFrom = filters.dueDateFrom;
    if (filters.dueDateTo) params.dueDateTo = filters.dueDateTo;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    const res = await apiClient<ApiResponse<readonly CourseAllocation[]>>(BASE, {
      method: 'GET',
      params,
    });

    const items = Array.isArray(res.data) ? res.data : [];
    const page = res.meta?.page ?? filters.page ?? 1;
    const limit = res.meta?.limit ?? filters.limit ?? 20;
    const total = res.meta?.total ?? items.length;
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  },

  async getAllocationById(id: string): Promise<CourseAllocation> {
    const res = await apiClient<ApiResponse<{ readonly allocation: CourseAllocation }>>(
      `${BASE}/${id}`,
      {
        method: 'GET',
      },
    );
    return res.data.allocation;
  },

  async createAllocations(payload: CreateAllocationsPayload): Promise<CreateAllocationsResponse> {
    const res = await apiClient<ApiResponse<RawAllocationsEnvelope>>(BASE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeAllocationsResponse(res.data);
  },

  async updateAllocationDates(
    id: string,
    payload: UpdateAllocationDatesPayload,
  ): Promise<CourseAllocation> {
    const res = await apiClient<ApiResponse<{ readonly allocation: CourseAllocation }>>(
      `${BASE}/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    );
    return res.data.allocation;
  },

  async bulkUpdateAllocationDates(
    payload: BulkUpdateAllocationDatesPayload,
  ): Promise<readonly CourseAllocation[]> {
    const res = await apiClient<ApiResponse<{ readonly allocations: readonly CourseAllocation[] }>>(
      `${BASE}/bulk`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    );
    return res.data.allocations;
  },

  async revokeAllocation(id: string): Promise<CourseAllocation> {
    const res = await apiClient<ApiResponse<{ readonly allocation: CourseAllocation }>>(
      `${BASE}/${id}/revoke`,
      {
        method: 'POST',
      },
    );
    return res.data.allocation;
  },

  async addMenteesToAllocation(
    id: string,
    payload: AddMenteesPayload,
  ): Promise<CreateAllocationsResponse> {
    const res = await apiClient<ApiResponse<RawAllocationsEnvelope>>(`${BASE}/${id}/add-mentees`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeAllocationsResponse(res.data);
  },

  async getAssignmentOverrides(id: string): Promise<readonly AssignmentDueOverride[]> {
    const res = await apiClient<
      ApiResponse<{ readonly overrides: readonly AssignmentDueOverride[] }>
    >(`${BASE}/${id}/assignment-overrides`, {
      method: 'GET',
    });
    return res.data.overrides;
  },

  async setAssignmentOverride(
    id: string,
    payload: AssignmentDueOverridePayload,
  ): Promise<AssignmentDueOverride> {
    const res = await apiClient<ApiResponse<{ readonly override: AssignmentDueOverride }>>(
      `${BASE}/${id}/assignment-overrides`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
    return res.data.override;
  },

  async bulkSetAssignmentOverrides(
    payload: BulkAssignmentDueOverridePayload,
  ): Promise<readonly AssignmentDueOverride[]> {
    const res = await apiClient<
      ApiResponse<{ readonly overrides: readonly AssignmentDueOverride[] }>
    >(`${BASE}/bulk-assignment-overrides`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data.overrides;
  },
};

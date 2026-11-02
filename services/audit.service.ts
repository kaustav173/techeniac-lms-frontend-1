import {
  auditLogFilterSchema,
  type AuditLogsResponse,
  type AuditPagination,
  type AuditType,
} from '@/lib/validation';
import { apiClient } from '@/services/api.client';

export interface AuditQueryFilters {
  page?: number | undefined;
  limit?: number | undefined;
  type?: AuditType | 'ALL' | undefined;
  actorId?: string | undefined;
  entity?: string | undefined;
  action?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
}

function buildFallbackPagination(
  validated: { page: number; limit: number },
  dataLength: number,
): AuditPagination {
  const minKnownTotal = (validated.page - 1) * validated.limit + dataLength;
  return {
    page: validated.page,
    limit: validated.limit,
    total: minKnownTotal,
    totalPages: Math.max(1, Math.ceil(minKnownTotal / validated.limit)),
  };
}

function resolvePagination(
  res: AuditLogsResponse,
  validated: { page: number; limit: number },
): AuditPagination {
  const dataLength = res.data?.length ?? 0;

  if (res.meta) {
    const page = res.meta.page ?? validated.page;
    const limit = res.meta.limit ?? validated.limit;
    const total = res.meta.total ?? dataLength;
    const totalPages = res.meta.totalPages ?? (Math.ceil(total / limit) || 1);
    return { page, limit, total, totalPages };
  }

  if (res.pagination) {
    const page = res.pagination.page ?? validated.page;
    const limit = res.pagination.limit ?? validated.limit;
    const total = res.pagination.total ?? dataLength;
    const totalPages = res.pagination.totalPages ?? (Math.ceil(total / limit) || 1);
    return { page, limit, total, totalPages };
  }

  return buildFallbackPagination(validated, dataLength);
}

export const auditService = {
  async getAuditLogs(filters: AuditQueryFilters = {}): Promise<AuditLogsResponse> {
    const result = auditLogFilterSchema.safeParse(filters);
    if (!result.success) {
      throw new Error(result.error.issues[0]?.message || 'Invalid audit log filters');
    }
    const validated = result.data;
    const params: Record<string, string | number | undefined> = {};

    if (validated.page !== undefined) params.page = validated.page;
    if (validated.limit !== undefined) params.limit = validated.limit;
    if (validated.type !== undefined && (validated.type as string) !== 'ALL') {
      params.type = validated.type;
    }
    if (validated.actorId !== undefined) params.actorId = validated.actorId;
    if (validated.entity !== undefined) params.entity = validated.entity;
    if (validated.action !== undefined) params.action = validated.action;
    if (validated.startDate !== undefined) {
      params.startDate = `${validated.startDate}T00:00:00.000+05:30`;
    }
    if (validated.endDate !== undefined) {
      params.endDate = `${validated.endDate}T23:59:59.999+05:30`;
    }

    const res = await apiClient<AuditLogsResponse>('/audit-logs', {
      method: 'GET',
      params,
    });

    const pagination = resolvePagination(res, validated);

    return {
      success: res.success,
      data: res.data ?? [],
      pagination,
    };
  },
};

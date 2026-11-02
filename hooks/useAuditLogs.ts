'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { type AuditQueryFilters, auditService } from '@/services/audit.service';

export const auditKeys = {
  all: ['audit-logs'] as const,
  lists: () => [...auditKeys.all, 'list'] as const,
  list: (filters: AuditQueryFilters) => [...auditKeys.lists(), filters] as const,
};

export function useAuditLogs(filters: AuditQueryFilters = {}) {
  const query = useQuery({
    queryKey: auditKeys.list(filters),
    queryFn: () => auditService.getAuditLogs(filters),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  return {
    logs: query.data?.data ?? [],
    pagination: query.data?.pagination ?? {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      total: 0,
      totalPages: 1,
    },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? query.error.message : null,
    refetch: query.refetch,
  };
}

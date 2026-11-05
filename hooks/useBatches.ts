'use client';

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import type { BatchStatus, CreateBatchFormData } from '@/lib/validation';
import {
  type ApiBatchDetailData,
  type ApiBatchListResponse,
  type ApiBatchSummary,
  batchesService,
  type BatchQueryFilters,
} from '@/services/batches.service';

export const batchKeys = {
  all: ['batches'] as const,
  lists: () => [...batchKeys.all, 'list'] as const,
  list: (filters: BatchQueryFilters) => [...batchKeys.lists(), filters] as const,
  details: () => [...batchKeys.all, 'detail'] as const,
  detail: (id: string) => [...batchKeys.details(), id] as const,
  available: () => [...batchKeys.all, 'available'] as const,
  mappings: (id: string) => [...batchKeys.detail(id), 'mappings'] as const,
  mentorBatches: (filters?: BatchQueryFilters) => ['mentor', 'batches', filters] as const,
  mentorMentees: (batchId?: string) => ['mentor', 'mentees', batchId] as const,
  menteeBatch: () => ['mentee', 'batch'] as const,
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function useBatchesList(filters: BatchQueryFilters = {}, options?: { enabled?: boolean }) {
  return useQuery<ApiBatchListResponse>({
    queryKey: batchKeys.list(filters),
    queryFn: () => batchesService.listBatches(filters),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useBatchDetail(id: string, initialData?: ApiBatchDetailData) {
  const isValidUuid = Boolean(id && UUID_REGEX.test(id));
  return useQuery<ApiBatchDetailData>({
    queryKey: batchKeys.detail(id),
    queryFn: () => batchesService.getBatchById(id),
    ...(initialData ? { initialData } : {}),
    enabled: isValidUuid,
  });
}

export function useAvailableBatches() {
  return useQuery<ApiBatchSummary[]>({
    queryKey: batchKeys.available(),
    queryFn: async () => {
      const res = await batchesService.listBatches({ limit: 100 });
      return res.items;
    },
    staleTime: 5 * 60_000,
  });
}

export function useInfiniteBatches(pageSize: number = 10) {
  return useInfiniteQuery({
    queryKey: ['batches', 'infinite-dropdown', pageSize],
    queryFn: ({ pageParam = 1 }) =>
      batchesService.listBatches({ page: pageParam, limit: pageSize }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBatchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBatchFormData) => batchesService.createBatch(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: batchKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['users', 'role-impact'] });
    },
  });
}

export function useUpdateBatchStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      batchId: string;
      newStatus: BatchStatus;
      reason?: string | undefined;
    }) =>
      batchesService.updateBatchStatus(variables.batchId, {
        newStatus: variables.newStatus,
        reason: variables.reason,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: batchKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['users', 'role-impact'] });
    },
  });
}

export function useTransferMenteeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      sourceBatchId: string;
      menteeId: string;
      targetBatchId: string;
      reason?: string | undefined;
    }) =>
      batchesService.transferMentee(variables.sourceBatchId, {
        menteeId: variables.menteeId,
        targetBatchId: variables.targetBatchId,
        reason: variables.reason,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: batchKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['users', 'role-impact'] });
    },
  });
}

export function useAddBatchMembersMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      batchId: string;
      userIds: string[];
      memberRole: 'MENTOR' | 'MENTEE';
    }) =>
      batchesService.addMembers(variables.batchId, {
        userIds: variables.userIds,
        memberRole: variables.memberRole,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: batchKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['users', 'role-impact'] });
    },
  });
}

export function useRemoveBatchMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { batchId: string; userId: string }) =>
      batchesService.removeMember(variables.batchId, variables.userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: batchKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['users', 'role-impact'] });
    },
  });
}

export function useBatchMappings(batchId: string) {
  return useQuery({
    queryKey: batchKeys.mappings(batchId),
    queryFn: () => batchesService.getBatchMappings(batchId),
    enabled: Boolean(batchId),
  });
}

export function useMapMenteesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { batchId: string; mentorId: string; menteeIds: string[] }) =>
      batchesService.mapMentees(variables.batchId, {
        mentorId: variables.mentorId,
        menteeIds: variables.menteeIds,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: batchKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['users', 'role-impact'] });
    },
  });
}

export function useReassignMenteeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      batchId: string;
      menteeId: string;
      newMentorId: string;
      reason?: string | undefined;
    }) =>
      batchesService.reassignMentee(variables.batchId, {
        menteeId: variables.menteeId,
        newMentorId: variables.newMentorId,
        reason: variables.reason,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: batchKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['users', 'role-impact'] });
    },
  });
}

export function useMentorBatches(filters: BatchQueryFilters = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: batchKeys.mentorBatches(filters),
    queryFn: () => batchesService.listMentorBatches(filters),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useMentorMentees(batchId?: string) {
  return useQuery({
    queryKey: batchKeys.mentorMentees(batchId),
    queryFn: () => batchesService.getMentorMentees(batchId),
  });
}

export function useMenteeBatch() {
  return useQuery({
    queryKey: batchKeys.menteeBatch(),
    queryFn: () => batchesService.getMyBatch(),
  });
}

export function useBatchesMentors(batchIds: string[]) {
  const uniqueBatchIds = Array.from(new Set(batchIds.filter((id) => UUID_REGEX.test(id))));
  return useQuery({
    queryKey: ['batches', 'mentors-for-batches', uniqueBatchIds],
    queryFn: async () => {
      const results = await Promise.all(
        uniqueBatchIds.map(async (batchId) => {
          const detail = await batchesService.getBatchById(batchId);
          return detail.members
            .filter((m) => m.memberRole === 'MENTOR')
            .map((m) => ({
              id: m.id,
              name: m.name,
              email: m.email,
              batchId,
              batchName: detail.name,
            }));
        }),
      );
      const map = new Map<
        string,
        { id: string; name: string; email: string; batchId: string; batchName: string }
      >();
      for (const m of results.flat()) {
        if (!map.has(m.id)) {
          map.set(m.id, m);
        }
      }
      return Array.from(map.values());
    },
    enabled: uniqueBatchIds.length > 0,
  });
}

/**
 * Optimized batch roster mapper:
 * Resolves batches and live member mappings so batch and mentor are always displayed accurately.
 * Constrains batch queries to active/populated batches with 5-minute caching to eliminate N+1 cascades.
 */
export function useAllBatchMembers(activeBatchIds?: string[]) {
  const shouldFetchSummaries = !activeBatchIds || activeBatchIds.length === 0;
  const { data: batchesResponse, isLoading: isBatchesLoading } = useBatchesList(
    { limit: 100 },
    { enabled: shouldFetchSummaries },
  );

  const targetIds = useMemo(() => {
    if (activeBatchIds && activeBatchIds.length > 0) {
      return activeBatchIds;
    }
    const items = batchesResponse?.items ?? [];
    const populated = items.filter(
      (b) =>
        (b.menteesCount ?? 0) > 0 ||
        (b.mentorsCount ?? 0) > 0 ||
        b.status === 'LIVE' ||
        b.status === 'ON_HOLD',
    );
    const selected = populated.length > 0 ? populated : items;
    return selected.slice(0, 25).map((b) => b.id);
  }, [activeBatchIds, batchesResponse]);

  const batchDetailsQueries = useQueries({
    queries: targetIds.map((id) => ({
      queryKey: ['batch-detail-with-members', id],
      queryFn: () => batchesService.getBatchById(id),
      staleTime: 5 * 60_000,
      enabled: Boolean(id),
    })),
  });

  const isDetailsLoading = batchDetailsQueries.some((q) => q.isLoading);
  const isDetailsError = batchDetailsQueries.some((q) => q.isError);

  return useMemo(() => {
    const bMap = new Map<string, string[]>();
    const mMap = new Map<string, string>();

    for (const q of batchDetailsQueries) {
      if (q.data) {
        const batch = q.data;
        for (const member of batch.members ?? []) {
          const existing = bMap.get(member.id);
          if (existing) {
            if (!existing.includes(batch.name)) {
              existing.push(batch.name);
            }
          } else {
            bMap.set(member.id, [batch.name]);
          }

          if (member.mappedToName) {
            mMap.set(member.id, member.mappedToName);
          }
        }
      }
    }
    return {
      userBatchMap: bMap,
      userMentorMap: mMap,
      isLoading: (shouldFetchSummaries && isBatchesLoading) || isDetailsLoading,
      isError: isDetailsError,
    };
  }, [
    batchDetailsQueries,
    isBatchesLoading,
    isDetailsLoading,
    isDetailsError,
    shouldFetchSummaries,
  ]);
}

export type { ApiBatchDetailData, ApiBatchListResponse, ApiBatchSummary, BatchQueryFilters };

'use client';

import {
  keepPreviousData,
  noop,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback } from 'react';

import {
  type AddMenteesPayload,
  type AllocationFilters,
  type AllocationListResponse,
  allocationsService,
  type AllocationTargetType,
  type AssignmentDueOverride,
  type AssignmentDueOverridePayload,
  type BulkAssignmentDueOverridePayload,
  type BulkUpdateAllocationDatesPayload,
  type CourseAllocation,
  type CourseAllocationStatus,
  type CreateAllocationsPayload,
  type CreateAllocationsResponse,
  getLocalDateString,
  isTerminalAllocationStatus,
  type UpdateAllocationDatesPayload,
} from '@/services/allocations.service';

export {
  type AddMenteesPayload,
  type AllocationFilters,
  type AllocationListResponse,
  allocationsService,
  type AllocationTargetType,
  type AssignmentDueOverride,
  type AssignmentDueOverridePayload,
  type BulkAssignmentDueOverridePayload,
  type BulkUpdateAllocationDatesPayload,
  type CourseAllocation,
  type CourseAllocationStatus,
  type CreateAllocationsPayload,
  type CreateAllocationsResponse,
  getLocalDateString,
  isTerminalAllocationStatus,
  type UpdateAllocationDatesPayload,
};

export const allocationKeys = {
  all: ['allocations'] as const,
  lists: () => [...allocationKeys.all, 'list'] as const,
  list: (filters: AllocationFilters) => [...allocationKeys.lists(), filters] as const,
  details: () => [...allocationKeys.all, 'detail'] as const,
  detail: (id: string) => [...allocationKeys.details(), id] as const,
  overrides: (id: string) => [...allocationKeys.detail(id), 'overrides'] as const,
  batchAllocations: (batchId: string) => [...allocationKeys.all, 'batch', batchId] as const,
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function useAllocationsList(filters: AllocationFilters = {}) {
  return useQuery<AllocationListResponse>({
    queryKey: allocationKeys.list(filters),
    queryFn: () => allocationsService.listAllocations(filters),
    placeholderData: keepPreviousData,
  });
}

export function usePrefetchAllocation() {
  const queryClient = useQueryClient();
  return useCallback(
    (id: string) => {
      if (!id || !UUID_REGEX.test(id)) return;
      void queryClient
        .query({
          queryKey: allocationKeys.detail(id),
          queryFn: () => allocationsService.getAllocationById(id),
          staleTime: 30 * 1000,
        })
        .catch(noop);
    },
    [queryClient],
  );
}

export function useAllocationDetail(id: string) {
  const isValidUuid = Boolean(id && UUID_REGEX.test(id));
  return useQuery<CourseAllocation>({
    queryKey: allocationKeys.detail(id),
    queryFn: () => allocationsService.getAllocationById(id),
    enabled: isValidUuid,
  });
}

export function useBatchAllocations(batchId: string) {
  const isValidUuid = Boolean(batchId && UUID_REGEX.test(batchId));
  return useQuery<AllocationListResponse>({
    queryKey: allocationKeys.batchAllocations(batchId),
    queryFn: () => allocationsService.listAllocations({ batchId, limit: 100 }),
    placeholderData: keepPreviousData,
    enabled: isValidUuid,
  });
}

export function useAssignmentOverrides(allocationId: string) {
  const isValidUuid = Boolean(allocationId && UUID_REGEX.test(allocationId));
  return useQuery<readonly AssignmentDueOverride[]>({
    queryKey: allocationKeys.overrides(allocationId),
    queryFn: () => allocationsService.getAssignmentOverrides(allocationId),
    enabled: isValidUuid,
  });
}

export function useCreateAllocationsMutation() {
  const qc = useQueryClient();
  return useMutation<CreateAllocationsResponse, Error, CreateAllocationsPayload>({
    mutationFn: (payload) => allocationsService.createAllocations(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: allocationKeys.all });
      void qc.invalidateQueries({ queryKey: ['batches'] });
      void qc.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useUpdateAllocationDatesMutation() {
  const qc = useQueryClient();
  return useMutation<
    CourseAllocation,
    Error,
    { readonly id: string; readonly payload: UpdateAllocationDatesPayload }
  >({
    mutationFn: ({ id, payload }) => allocationsService.updateAllocationDates(id, payload),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: allocationKeys.all });
      void qc.invalidateQueries({ queryKey: allocationKeys.detail(id) });
    },
  });
}

export function useBulkUpdateAllocationDatesMutation() {
  const qc = useQueryClient();
  return useMutation<readonly CourseAllocation[], Error, BulkUpdateAllocationDatesPayload>({
    mutationFn: (payload) => allocationsService.bulkUpdateAllocationDates(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: allocationKeys.all });
    },
  });
}

export function useRevokeAllocationMutation() {
  const qc = useQueryClient();
  return useMutation<CourseAllocation, Error, string>({
    mutationFn: (id) => allocationsService.revokeAllocation(id),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: allocationKeys.all });
      void qc.invalidateQueries({ queryKey: allocationKeys.detail(id) });
    },
  });
}

export function useAddMenteesToAllocationMutation() {
  const qc = useQueryClient();
  return useMutation<
    CreateAllocationsResponse,
    Error,
    { readonly id: string; readonly payload: AddMenteesPayload }
  >({
    mutationFn: ({ id, payload }) => allocationsService.addMenteesToAllocation(id, payload),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: allocationKeys.all });
      void qc.invalidateQueries({ queryKey: allocationKeys.detail(id) });
    },
  });
}

export function useSetAssignmentOverrideMutation() {
  const qc = useQueryClient();
  return useMutation<
    AssignmentDueOverride,
    Error,
    { readonly id: string; readonly payload: AssignmentDueOverridePayload }
  >({
    mutationFn: ({ id, payload }) => allocationsService.setAssignmentOverride(id, payload),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: allocationKeys.overrides(id) });
      void qc.invalidateQueries({ queryKey: allocationKeys.detail(id) });
    },
  });
}

export function useBulkSetAssignmentOverridesMutation() {
  const qc = useQueryClient();
  return useMutation<readonly AssignmentDueOverride[], Error, BulkAssignmentDueOverridePayload>({
    mutationFn: (payload) => allocationsService.bulkSetAssignmentOverrides(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: allocationKeys.all });
    },
  });
}

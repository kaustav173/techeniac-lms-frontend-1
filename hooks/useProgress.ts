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
  type AllocationProgressResponse,
  progressService,
  type ProgressTrackerFilters,
  type ProgressTrackerItem,
  type ProgressTrackerPagination,
  type ProgressTrackerResponse,
  type TopicProgressItem,
  type TopicProgressStatus,
  type UpdateTopicDeadlinePayload,
  type UpdateTopicDeadlineResponse,
  type UpdateTopicStatusPayload,
  type UpdateTopicStatusResponse,
} from '@/services/progress.service';

export {
  type AllocationProgressResponse,
  progressService,
  type ProgressTrackerFilters,
  type ProgressTrackerItem,
  type ProgressTrackerPagination,
  type ProgressTrackerResponse,
  type TopicProgressItem,
  type TopicProgressStatus,
  type UpdateTopicDeadlinePayload,
  type UpdateTopicDeadlineResponse,
  type UpdateTopicStatusPayload,
  type UpdateTopicStatusResponse,
};

export const progressKeys = {
  all: ['progress'] as const,
  allocations: () => [...progressKeys.all, 'allocation'] as const,
  allocation: (id: string) => [...progressKeys.allocations(), id] as const,
  trackers: (filters: ProgressTrackerFilters = {}) =>
    [...progressKeys.all, 'trackers', filters] as const,
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function useAllocationProgress(allocationId: string | undefined) {
  const isValidUuid = Boolean(allocationId && UUID_REGEX.test(allocationId));
  return useQuery<AllocationProgressResponse>({
    queryKey: progressKeys.allocation(allocationId ?? ''),
    queryFn: () => {
      if (!allocationId || !UUID_REGEX.test(allocationId)) {
        return Promise.reject(new Error('Invalid or missing allocation ID'));
      }
      return progressService.getAllocationProgress(allocationId);
    },
    enabled: isValidUuid,
    staleTime: 30 * 1000,
  });
}

export function usePrefetchAllocationProgress() {
  const queryClient = useQueryClient();
  return useCallback(
    (allocationId: string | undefined) => {
      if (!allocationId || !UUID_REGEX.test(allocationId)) return;
      void queryClient
        .query({
          queryKey: progressKeys.allocation(allocationId),
          queryFn: () => progressService.getAllocationProgress(allocationId),
          staleTime: 30 * 1000,
        })
        .catch(noop);
    },
    [queryClient],
  );
}

export function useProgressTrackers(filters: ProgressTrackerFilters = {}) {
  return useQuery<ProgressTrackerResponse>({
    queryKey: progressKeys.trackers(filters),
    queryFn: () => progressService.getProgressTrackers(filters),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateTopicStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateTopicStatusResponse,
    Error,
    {
      readonly allocationId: string;
      readonly topicId: string;
      readonly payload: UpdateTopicStatusPayload;
    }
  >({
    mutationFn: ({ allocationId, topicId, payload }) =>
      progressService.updateTopicStatus(allocationId, topicId, payload),
    onSuccess: (_, { allocationId }) => {
      void queryClient.invalidateQueries({ queryKey: progressKeys.allocation(allocationId) });
      void queryClient.invalidateQueries({ queryKey: ['allocations'] });
      void queryClient.invalidateQueries({ queryKey: progressKeys.all });
    },
  });
}

export function useUpdateTopicDeadlineMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateTopicDeadlineResponse,
    Error,
    {
      readonly allocationId: string;
      readonly topicId: string;
      readonly payload: UpdateTopicDeadlinePayload;
    }
  >({
    mutationFn: ({ allocationId, topicId, payload }) =>
      progressService.updateTopicDeadline(allocationId, topicId, payload),
    onSuccess: (_, { allocationId }) => {
      void queryClient.invalidateQueries({ queryKey: progressKeys.allocation(allocationId) });
      void queryClient.invalidateQueries({ queryKey: ['allocations'] });
      void queryClient.invalidateQueries({ queryKey: progressKeys.all });
    },
  });
}

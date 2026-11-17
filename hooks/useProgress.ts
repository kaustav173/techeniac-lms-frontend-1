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
    staleTime: 5 * 60 * 1000,
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
          staleTime: 5 * 60 * 1000,
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
    },
    { readonly previousAllocation?: AllocationProgressResponse | undefined }
  >({
    mutationFn: ({ allocationId, topicId, payload }) =>
      progressService.updateTopicStatus(allocationId, topicId, payload),
    onMutate: async ({ allocationId, topicId, payload }) => {
      await queryClient.cancelQueries({ queryKey: progressKeys.allocation(allocationId) });

      const previousAllocation = queryClient.getQueryData<AllocationProgressResponse>(
        progressKeys.allocation(allocationId),
      );

      if (previousAllocation) {
        const isCompleted = payload.status === 'COMPLETED';
        const updatedTopics = previousAllocation.topics.map((t) =>
          t.topicId === topicId
            ? {
                ...t,
                status: payload.status,
                completedAt: isCompleted ? new Date().toISOString() : null,
                isOverdue: isCompleted
                  ? false
                  : Boolean(t.deadline && new Date(t.deadline) < new Date()),
              }
            : t,
        );
        const completedCount = updatedTopics.filter((t) => t.status === 'COMPLETED').length;
        const total = updatedTopics.length;
        const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

        queryClient.setQueryData<AllocationProgressResponse>(
          progressKeys.allocation(allocationId),
          {
            ...previousAllocation,
            allocation: {
              ...previousAllocation.allocation,
              progressPercent,
            },
            topics: updatedTopics,
          },
        );
      }

      return { previousAllocation };
    },
    onError: (_err, { allocationId }, context) => {
      if (context?.previousAllocation) {
        queryClient.setQueryData(progressKeys.allocation(allocationId), context.previousAllocation);
      }
    },
    onSuccess: (data, { allocationId, topicId }) => {
      queryClient.setQueryData<AllocationProgressResponse>(
        progressKeys.allocation(allocationId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            allocation: {
              ...old.allocation,
              progressPercent: data.allocation.progressPercent,
              status: data.allocation.status,
            },
            topics: old.topics.map((t) =>
              t.topicId === topicId
                ? {
                    ...t,
                    status: data.topicProgress.status,
                    completedAt: data.topicProgress.completedAt,
                    note: data.topicProgress.note,
                    isOverdue:
                      data.topicProgress.status === 'COMPLETED'
                        ? false
                        : Boolean(t.deadline && new Date(t.deadline) < new Date()),
                  }
                : t,
            ),
          };
        },
      );
    },
    onSettled: (_, __, { allocationId }) => {
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
    },
    { readonly previousAllocation?: AllocationProgressResponse | undefined }
  >({
    mutationFn: ({ allocationId, topicId, payload }) =>
      progressService.updateTopicDeadline(allocationId, topicId, payload),
    onMutate: async ({ allocationId, topicId, payload }) => {
      await queryClient.cancelQueries({ queryKey: progressKeys.allocation(allocationId) });

      const previousAllocation = queryClient.getQueryData<AllocationProgressResponse>(
        progressKeys.allocation(allocationId),
      );

      if (previousAllocation) {
        queryClient.setQueryData<AllocationProgressResponse>(
          progressKeys.allocation(allocationId),
          {
            ...previousAllocation,
            topics: previousAllocation.topics.map((t) =>
              t.topicId === topicId
                ? {
                    ...t,
                    deadline: payload.deadline,
                    isOverdue:
                      t.status !== 'COMPLETED' &&
                      Boolean(payload.deadline && new Date(payload.deadline) < new Date()),
                  }
                : t,
            ),
          },
        );
      }

      return { previousAllocation };
    },
    onError: (_err, { allocationId }, context) => {
      if (context?.previousAllocation) {
        queryClient.setQueryData(progressKeys.allocation(allocationId), context.previousAllocation);
      }
    },
    onSuccess: (data, { allocationId, topicId, payload }) => {
      const savedDeadline = data?.deadline || payload.deadline;
      queryClient.setQueryData<AllocationProgressResponse>(
        progressKeys.allocation(allocationId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            topics: old.topics.map((t) =>
              t.topicId === topicId
                ? {
                    ...t,
                    deadline: savedDeadline,
                    isOverdue:
                      t.status !== 'COMPLETED' &&
                      Boolean(savedDeadline && new Date(savedDeadline) < new Date()),
                  }
                : t,
            ),
          };
        },
      );
    },
    onSettled: (_, __, { allocationId }) => {
      void queryClient.invalidateQueries({ queryKey: progressKeys.allocation(allocationId) });
      void queryClient.invalidateQueries({ queryKey: ['allocations'] });
      void queryClient.invalidateQueries({ queryKey: progressKeys.all });
    },
  });
}

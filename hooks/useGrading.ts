'use client';

import {
  keepPreviousData,
  noop,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback } from 'react';

import { gradingService } from '@/services/grading.service';
import type {
  GradeSubmissionInput,
  PaginatedSubmissionQueueResponse,
  RequestResubmissionInput,
  SubmissionQueueQuery,
  SubmissionReviewDetails,
} from '@/types/grading';

export const GRADING_QUERY_KEYS = {
  queue: (query?: SubmissionQueueQuery) => ['submission-queue', query] as const,
  review: (submissionId: string) => ['submission-review', submissionId] as const,
};

export function useSubmissionQueue(query?: SubmissionQueueQuery) {
  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery<PaginatedSubmissionQueueResponse, Error>({
    queryKey: GRADING_QUERY_KEYS.queue(query),
    queryFn: ({ signal }) => gradingService.getSubmissionQueue(query, signal),
    placeholderData: keepPreviousData,
  });

  return {
    submissions: data?.items ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 20,
    totalPages: data?.totalPages ?? 1,
    isLoading,
    isFetching,
    error: queryError?.message ?? null,
    refetch,
  };
}

export function useReviewDetails(submissionId: string | null, enabled = true) {
  const {
    data: reviewDetails,
    isLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery<SubmissionReviewDetails, Error>({
    queryKey: GRADING_QUERY_KEYS.review(submissionId || ''),
    queryFn: ({ signal }) => {
      if (!submissionId) {
        return Promise.reject(new Error('No submission selected'));
      }
      return gradingService.getReviewDetails(submissionId, signal);
    },
    enabled: Boolean(submissionId) && enabled,
  });

  return {
    reviewDetails,
    isLoading,
    isFetching,
    error: queryError?.message ?? null,
    refetch,
  };
}

export function usePrefetchSubmissionReview() {
  const queryClient = useQueryClient();
  return useCallback(
    (submissionId: string) => {
      if (!submissionId) return;
      void queryClient
        .query({
          queryKey: GRADING_QUERY_KEYS.review(submissionId),
          queryFn: ({ signal }) => gradingService.getReviewDetails(submissionId, signal),
          staleTime: 30 * 1000,
        })
        .catch(noop);
    },
    [queryClient],
  );
}

export function useGradeSubmissionMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    SubmissionReviewDetails,
    Error,
    { submissionId: string; payload: GradeSubmissionInput }
  >({
    mutationFn: ({ submissionId, payload }) =>
      gradingService.gradeSubmission(submissionId, payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['submission-queue'] });
      void queryClient.invalidateQueries({ queryKey: ['performance'] });
      queryClient.setQueryData(GRADING_QUERY_KEYS.review(data.id), data);
    },
  });
}

export function useRequestResubmissionMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    SubmissionReviewDetails,
    Error,
    { submissionId: string; payload: RequestResubmissionInput }
  >({
    mutationFn: ({ submissionId, payload }) =>
      gradingService.requestResubmission(submissionId, payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['submission-queue'] });
      void queryClient.invalidateQueries({ queryKey: ['performance'] });
      queryClient.setQueryData(GRADING_QUERY_KEYS.review(data.id), data);
    },
  });
}

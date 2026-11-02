'use client';

import {
  keepPreviousData,
  noop,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback } from 'react';

import { submissionsService } from '@/services/submissions.service';
import type {
  AssignmentSubmissionDetails,
  CreateSubmissionInput,
  ListMyAssignmentsQuery,
  PaginatedAssignmentsResponse,
  SubmissionVersion,
} from '@/types/submissions';

export const SUBMISSION_QUERY_KEYS = {
  myAssignments: (query?: ListMyAssignmentsQuery) => ['my-assignments', query] as const,
  assignmentDetails: (assignmentId: string) =>
    ['assignment-submission-details', assignmentId] as const,
};

export function useMyAssignments(query?: ListMyAssignmentsQuery) {
  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery<PaginatedAssignmentsResponse, Error>({
    queryKey: SUBMISSION_QUERY_KEYS.myAssignments(query),
    queryFn: ({ signal }) => submissionsService.getMyAssignments(query, signal),
    placeholderData: keepPreviousData,
  });

  const assignments = data?.items ?? [];
  const total = data?.total ?? 0;
  const page = data?.page ?? 1;
  const limit = data?.limit ?? 10;
  const totalPages = data?.totalPages ?? 1;
  const error = queryError?.message ?? null;

  return {
    assignments,
    total,
    page,
    limit,
    totalPages,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

export function useAssignmentSubmissionDetails(assignmentId: string) {
  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery<AssignmentSubmissionDetails, Error>({
    queryKey: SUBMISSION_QUERY_KEYS.assignmentDetails(assignmentId),
    queryFn: ({ signal }) =>
      submissionsService.getAssignmentSubmissionDetails(assignmentId, signal),
    enabled: Boolean(assignmentId),
    staleTime: 30 * 1000,
  });

  return {
    assignment: data?.assignment ?? null,
    allocation: data?.allocation ?? null,
    versions: data?.versions ?? [],
    isLoading,
    isFetching,
    error: queryError?.message ?? null,
    refetch,
  };
}

export function usePrefetchAssignmentDetails() {
  const queryClient = useQueryClient();
  return useCallback(
    (assignmentId: string) => {
      if (!assignmentId) return;
      void queryClient
        .query({
          queryKey: SUBMISSION_QUERY_KEYS.assignmentDetails(assignmentId),
          queryFn: ({ signal }) =>
            submissionsService.getAssignmentSubmissionDetails(assignmentId, signal),
          staleTime: 30 * 1000,
        })
        .catch(noop);
    },
    [queryClient],
  );
}

export function useSubmitAssignment() {
  const queryClient = useQueryClient();

  return useMutation<SubmissionVersion, Error, CreateSubmissionInput>({
    mutationFn: (input: CreateSubmissionInput) => submissionsService.submitAssignment(input),
    onSuccess: (data) => {
      // Invalidate both lists and detail cache
      void queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
      void queryClient.invalidateQueries({
        queryKey: SUBMISSION_QUERY_KEYS.assignmentDetails(data.assignmentId),
      });
    },
  });
}

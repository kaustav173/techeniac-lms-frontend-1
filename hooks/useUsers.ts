'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import type { ChangeRoleFormData, CreateUserFormData, EditUserFormData } from '@/lib/validation';
import {
  type ApiUser,
  type UserDirectoryCounts,
  type UserQueryFilters,
  usersService,
} from '@/services/users.service';

export type { ApiUser, UserQueryFilters };

export type BulkImportRowData = CreateUserFormData & { rowNumber?: number };

export interface BulkImportFailure {
  row: BulkImportRowData;
  error: string;
}

export interface BulkImportResult {
  successCount: number;
  failures: BulkImportFailure[];
}

export interface UseUsersReturn {
  users: ApiUser[];
  total: number;
  counts: UserDirectoryCounts;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  fetchUsers: (filters?: UserQueryFilters) => Promise<void>;
  createUser: (data: CreateUserFormData) => Promise<ApiUser>;
  createUsersBulk: (
    rows: BulkImportRowData[],
    onProgress?: (progress: { current: number; total: number }) => void,
  ) => Promise<BulkImportResult>;
  updateUser: (id: string, data: Partial<EditUserFormData>) => Promise<ApiUser>;
  changeRole: (id: string, data: ChangeRoleFormData) => Promise<ApiUser>;
  toggleStatus: (id: string, activate: boolean) => Promise<ApiUser>;
  resendInvite: (id: string) => Promise<{ message: string }>;
}

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserQueryFilters) => [...userKeys.lists(), filters] as const,
};

export const DEFAULT_USERS_PAGE_SIZE = 10;

const DEFAULT_FILTERS: UserQueryFilters = {
  page: 1,
  limit: DEFAULT_USERS_PAGE_SIZE,
};

export function useUsers(
  initialFilters: UserQueryFilters = DEFAULT_FILTERS,
  options?: { enabled?: boolean },
): UseUsersReturn {
  const queryClient = useQueryClient();
  const [overrideFilters, setOverrideFilters] = useState<UserQueryFilters | null>(null);

  const serializedInitial = JSON.stringify(initialFilters);
  const activeFilters = useMemo(() => {
    return {
      ...DEFAULT_FILTERS,
      ...(overrideFilters ?? initialFilters),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrideFilters, serializedInitial]);

  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: userKeys.list(activeFilters),
    queryFn: () => usersService.listUsers(activeFilters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    ...options,
  });

  const fetchUsers = useCallback(
    async (filters?: UserQueryFilters) => {
      if (filters) {
        setOverrideFilters(filters);
      } else {
        await refetch();
      }
    },
    [refetch],
  );

  const createUserMutation = useMutation({
    mutationFn: (newUserData: CreateUserFormData) => usersService.createUser(newUserData),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (variables: { id: string; data: Partial<EditUserFormData> }) =>
      usersService.updateUser(variables.id, variables.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: (variables: { id: string; data: ChangeRoleFormData }) =>
      usersService.changeRole(variables.id, variables.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (variables: { id: string; activate: boolean }) =>
      usersService.toggleStatus(variables.id, variables.activate),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });

  const createUser = async (formData: CreateUserFormData): Promise<ApiUser> => {
    return await createUserMutation.mutateAsync(formData);
  };

  const updateUser = async (id: string, editData: Partial<EditUserFormData>): Promise<ApiUser> => {
    return await updateUserMutation.mutateAsync({ id, data: editData });
  };

  const changeRole = async (id: string, roleData: ChangeRoleFormData): Promise<ApiUser> => {
    return await changeRoleMutation.mutateAsync({ id, data: roleData });
  };

  const toggleStatus = async (id: string, activate: boolean): Promise<ApiUser> => {
    return await toggleStatusMutation.mutateAsync({ id, activate });
  };

  const resendInvite = async (id: string): Promise<{ message: string }> => {
    return await usersService.resendInvite(id);
  };

  const createUsersBulk = async (
    rows: BulkImportRowData[],
    onProgress?: (progress: { current: number; total: number }) => void,
  ): Promise<BulkImportResult> => {
    let successCount = 0;
    const failures: BulkImportFailure[] = [];

    const processIndex = async (i: number): Promise<void> => {
      if (i >= rows.length) return;
      const r = rows[i];
      if (r) {
        onProgress?.({ current: i + 1, total: rows.length });
        try {
          await usersService.createUser({ name: r.name, email: r.email, role: r.role });
          successCount++;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to create user';
          failures.push({ row: r, error: message });
        }
      }
      await processIndex(i + 1);
    };

    await processIndex(0);

    void queryClient.invalidateQueries({ queryKey: userKeys.all });
    return { successCount, failures };
  };

  const users = useMemo(() => data?.users ?? [], [data?.users]);
  const total = data?.total ?? 0;
  const counts = useMemo<UserDirectoryCounts>(() => {
    if (data?.counts) {
      return data.counts;
    }
    return {
      total,
      active: users.filter((u) => u.isActive).length,
      inactive: users.filter((u) => !u.isActive).length,
    };
  }, [data?.counts, total, users]);

  const error = queryError instanceof Error ? queryError.message : null;

  return {
    users,
    total,
    counts,
    isLoading,
    isFetching,
    error,
    fetchUsers,
    createUser,
    createUsersBulk,
    updateUser,
    changeRole,
    toggleStatus,
    resendInvite,
  };
}

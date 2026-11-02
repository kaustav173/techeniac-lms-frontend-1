'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/app/batches/batchStatus';
import { BulkImportModal, type CsvUserRowWithLine } from '@/components/app/users/BulkImportModal';
import { ChangeRoleModal } from '@/components/app/users/ChangeRoleModal';
import { CreateUserDrawer } from '@/components/app/users/CreateUserDrawer';
import { EditUserModal } from '@/components/app/users/EditUserModal';
import { DebouncedSearchInput } from '@/components/patterns/DebouncedSearchInput';
import { PageHeader } from '@/components/patterns/PageHeader';
import { PaginationControls } from '@/components/patterns/PaginationControls';
import { SortableColumnHeader } from '@/components/patterns/SortableColumnHeader';
import { Button } from '@/components/ui/Button';
import { MultiSelectDropdown, type MultiSelectOption } from '@/components/ui/MultiSelectDropdown';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { P, Span } from '@/components/ui/Typography';
import { useAuth } from '@/hooks/useAuth';
import { useAllBatchMembers } from '@/hooks/useBatches';
import { useUsers } from '@/hooks/useUsers';
import {
  type ChangeRoleFormData,
  type CreateUserFormData,
  type UserRole,
  type UserStatus,
} from '@/lib/validation';

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  batch?: string | undefined;
  mentorName?: string | undefined;
  hasLoggedIn?: boolean | undefined;
  mustChangePassword?: boolean | undefined;
  activeMenteesCount?: number | undefined;
  isLastSuperAdmin?: boolean | undefined;
}

interface ToggleSwitchProps {
  checked: boolean;
  disabled?: boolean | undefined;
  onChange: () => void;
  title?: string | undefined;
  ariaLabel: string;
}

function ToggleSwitch({ checked, disabled, onChange, title, ariaLabel }: ToggleSwitchProps) {
  return (
    <Button
      type="button"
      role="switch"
      variant="ghost"
      size="sm"
      aria-checked={checked}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-start gap-0 rounded-full border-2 border-transparent p-0 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0044D3] focus-visible:ring-offset-2 ${
        checked ? 'bg-[#0044D3] hover:bg-[#0039B3]' : 'bg-slate-300 hover:bg-slate-400'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </Button>
  );
}

const USER_STATUS_OPTIONS: MultiSelectOption[] = [
  { value: 'ACTIVE', label: 'Active Users' },
  { value: 'INACTIVE', label: 'Inactive Users' },
];

interface FilterUpdateOptions {
  role?: string | undefined;
  status?: string | undefined;
  search?: string | undefined;
  mentorId?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
  sortBy?: 'name' | 'email' | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
}

export function UsersTable() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedMentor, setSelectedMentor] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Roster of mentors for the filter dropdown
  const { users: mentorRoster } = useUsers({ role: 'MENTOR', limit: 100 });
  const mentorOptions = useMemo<MultiSelectOption[]>(() => {
    return mentorRoster.map((m) => ({
      value: m.id,
      label: m.name,
    }));
  }, [mentorRoster]);

  // Sorting state for Name and Email columns
  const [sortField, setSortField] = useState<'name' | 'email' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filtersRef = useRef({
    role: selectedRole,
    status: selectedStatus,
    search,
    mentorId: selectedMentor,
    page,
    limit,
    sortBy: sortField ?? undefined,
    sortOrder: sortField ? sortOrder : undefined,
  });

  useEffect(() => {
    filtersRef.current = {
      role: selectedRole,
      status: selectedStatus,
      search,
      mentorId: selectedMentor,
      page,
      limit,
      sortBy: sortField ?? undefined,
      sortOrder: sortField ? sortOrder : undefined,
    };
  }, [selectedRole, selectedStatus, search, selectedMentor, page, limit, sortField, sortOrder]);

  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated || !currentUser) {
        router.replace('/login');
      } else if (currentUser.mustChangePassword) {
        router.replace('/change-password');
      } else if (currentUser.role !== 'SUPER_ADMIN') {
        router.replace(currentUser.role === 'MENTOR' ? '/mentor' : '/mentee');
      }
    }
  }, [isAuthLoading, isAuthenticated, currentUser, router]);

  const {
    users: apiUsers,
    total: totalCount,
    isLoading,
    isFetching,
    error: usersError,
    fetchUsers,
    createUser,
    createUsersBulk,
    updateUser,
    changeRole,
    toggleStatus,
    resendInvite,
  } = useUsers({ page: 1, limit: 10 });

  const { userBatchMap, userMentorMap } = useAllBatchMembers();

  const isInitialLoading = isLoading && apiUsers.length === 0;
  const isTableLoading = isInitialLoading;

  const handleSort = (field: 'name' | 'email') => {
    let nextField: 'name' | 'email' | null = field;
    let nextOrder: 'asc' | 'desc' = 'asc';

    if (sortField === field) {
      if (sortOrder === 'asc') {
        nextOrder = 'desc';
      } else {
        nextField = null;
        nextOrder = 'asc';
      }
    }

    setSortField(nextField);
    setSortOrder(nextOrder);
    setPage(1);

    handleFilterUpdate({
      page: 1,
      sortBy: nextField ?? undefined,
      sortOrder: nextField ? nextOrder : undefined,
    });
  };

  // Modal controls
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [userToChangeRole, setUserToChangeRole] = useState<UserItem | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserItem | null>(null);

  // In-flight row actions tracking
  const [inFlightAction, setInFlightAction] = useState<Record<string, 'resend' | 'status'>>({});

  // Toast notification state with unmount cleanup
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const activeAdminsCount = useMemo(
    () => apiUsers.filter((u) => u.role === 'SUPER_ADMIN' && u.isActive).length,
    [apiUsers],
  );

  const users: UserItem[] = useMemo(() => {
    return apiUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.isActive ? 'ACTIVE' : 'INACTIVE',
      batch: userBatchMap.get(u.id) || '—',
      mentorName: userMentorMap.get(u.id) || '—',
      hasLoggedIn: u.lastLoginAt !== null,
      mustChangePassword: u.mustChangePassword,
      isLastSuperAdmin: u.role === 'SUPER_ADMIN' && activeAdminsCount <= 1,
    }));
  }, [apiUsers, activeAdminsCount, userBatchMap, userMentorMap]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const handleFilterUpdate = ({
    role = filtersRef.current.role,
    status = filtersRef.current.status,
    search: searchVal = filtersRef.current.search,
    mentorId = filtersRef.current.mentorId,
    page: newPage = filtersRef.current.page,
    limit: newLimit = filtersRef.current.limit,
    sortBy = filtersRef.current.sortBy,
    sortOrder: newSortOrder = filtersRef.current.sortOrder,
  }: FilterUpdateOptions = {}) => {
    filtersRef.current = {
      role,
      status,
      search: searchVal,
      mentorId,
      page: newPage,
      limit: newLimit,
      sortBy,
      sortOrder: newSortOrder,
    };

    void fetchUsers({
      page: newPage,
      limit: newLimit,
      role: role !== 'ALL' ? role : undefined,
      status: status !== 'ALL' ? status : undefined,
      search: searchVal.trim() || undefined,
      mentorId: mentorId !== 'ALL' ? mentorId : undefined,
      sortBy,
      sortOrder: newSortOrder,
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    handleFilterUpdate({ page: newPage });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    handleFilterUpdate({ page: 1, limit: newLimit });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    handleFilterUpdate({ search: val, page: 1 });
  };

  const handleCreateUser = async (data: CreateUserFormData) => {
    try {
      const newUser = await createUser(data);
      showToast(`User ${newUser.name} created successfully.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create user';
      showToast(msg, 'error');
      throw err;
    }
  };

  const handleRoleChangeSuccess = async (userId: string, data: ChangeRoleFormData) => {
    try {
      await changeRole(userId, data);
      showToast(`Role updated to ${data.newRole}.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update role';
      showToast(msg, 'error');
      throw err;
    }
  };

  const handleEditUserSuccess = async (userId: string, data: { name: string; email: string }) => {
    try {
      await updateUser(userId, data);
      showToast(`User ${data.name} updated successfully.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update user';
      showToast(msg, 'error');
      throw err;
    }
  };

  const handleResendInvite = async (userId: string, userName: string) => {
    if (inFlightAction[userId]) return;
    setInFlightAction((prev) => ({ ...prev, [userId]: 'resend' }));
    try {
      const res = await resendInvite(userId);
      showToast(res.message, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to resend invite to ${userName}`;
      showToast(msg, 'error');
    } finally {
      setInFlightAction((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }
  };

  const handleBulkImport = async (
    rows: CsvUserRowWithLine[],
    onProgress?: (progress: { current: number; total: number }) => void,
  ) => {
    const result = await createUsersBulk(rows, onProgress);
    if (result.failures.length === 0) {
      showToast(`Bulk import complete: ${result.successCount} user(s) created.`, 'success');
    } else {
      showToast(
        `Bulk import finished: ${result.successCount} created, ${result.failures.length} failed.`,
        'error',
      );
    }
    return result;
  };

  const handleToggleStatus = async (user: UserItem) => {
    const nextActivate = user.status !== 'ACTIVE';
    if (!nextActivate) {
      if (currentUser && user.id === currentUser.id) {
        showToast('You cannot deactivate your own administrative account.', 'error');
        return;
      }
      if (user.isLastSuperAdmin) {
        showToast('Cannot deactivate the last active Super Admin on the platform.', 'error');
        return;
      }
    }
    setInFlightAction((prev) => ({ ...prev, [user.id]: 'status' }));
    try {
      await toggleStatus(user.id, nextActivate);
      showToast(
        `User ${user.name} ${nextActivate ? 'activated' : 'deactivated'} successfully.`,
        'success',
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle status';
      showToast(msg, 'error');
    } finally {
      setInFlightAction((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
    }
  };

  if (isAuthLoading || !isAuthenticated || !currentUser || currentUser.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0044D3] border-t-transparent" />
          <P className="text-sm font-medium text-slate-500">Verifying administrator access...</P>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header via Global PageHeader with no breadcrumbs */}
      <PageHeader
        title="Users"
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBulkImportOpen(true)}
              className="h-9 gap-2 rounded-full border-[#E1E6EC] px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:h-10 sm:text-sm"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <Span>Bulk Import CSV</Span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="h-9 gap-2 rounded-full bg-[#0044D3] px-4 text-xs font-semibold text-white shadow-xs hover:bg-[#0039B3] sm:h-10 sm:text-sm"
            >
              <Span className="text-base font-bold">+</Span>
              <Span>Create User</Span>
            </Button>
          </>
        }
      />

      {/* Role-Based Navigation Tabs */}
      <div className="flex [scrollbar-width:none] items-center gap-6 overflow-x-auto overflow-y-hidden border-b border-[#E1E6EC] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {[
          { label: 'All Users', value: 'ALL' },
          { label: 'Mentees', value: 'MENTEE' },
          { label: 'Mentors', value: 'MENTOR' },
          { label: 'Super Admins', value: 'SUPER_ADMIN' },
        ].map((tab) => {
          const isActive = selectedRole === tab.value;
          return (
            <Button
              key={tab.value}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedRole(tab.value);
                setPage(1);
                handleFilterUpdate({ role: tab.value, page: 1 });
              }}
              className={`-mb-px flex h-10 items-center rounded-none border-b-2 px-1 pb-2.5 text-sm transition-colors hover:bg-transparent ${
                isActive
                  ? 'border-[#0044D3] font-bold text-[#0044D3]'
                  : 'border-transparent font-medium text-[#667085] hover:text-slate-900'
              }`}
            >
              <Span>{tab.label}</Span>
            </Button>
          );
        })}
      </div>

      {/* Filter Row with Expanded Search Input and Rounded Dropdowns at the End */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E1E6EC] bg-white p-3.5 shadow-xs">
        {/* Expanded Search Input */}
        <div className="w-full flex-1 sm:max-w-md lg:max-w-lg">
          <DebouncedSearchInput
            value={search}
            onSearchChange={handleSearchChange}
            placeholder="Search by name or email..."
          />
        </div>

        {/* Rounded Dropdowns at the End */}
        <div className="flex w-full flex-wrap items-center gap-3 sm:ml-auto sm:w-auto">
          {/* Status Dropdown */}
          <MultiSelectDropdown
            label="Status"
            singleSelect
            options={USER_STATUS_OPTIONS}
            selectedValues={selectedStatus === 'ALL' ? [] : [selectedStatus]}
            onChange={(vals) => {
              const nextVal = vals[0] ?? 'ALL';
              setSelectedStatus(nextVal);
              setPage(1);
              handleFilterUpdate({ status: nextVal, page: 1 });
            }}
          />

          {/* Mentor Dropdown */}
          {selectedRole === 'ALL' || selectedRole === 'MENTEE' ? (
            <MultiSelectDropdown
              label="Mentor"
              singleSelect
              options={mentorOptions}
              selectedValues={selectedMentor === 'ALL' ? [] : [selectedMentor]}
              onChange={(vals) => {
                const nextVal = vals[0] ?? 'ALL';
                setSelectedMentor(nextVal);
                setPage(1);
                handleFilterUpdate({ mentorId: nextVal, page: 1 });
              }}
            />
          ) : null}
        </div>
      </div>

      {/* Users Data Table */}
      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableColumnHeader<'name' | 'email'>
                field="name"
                label="Name"
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
                tooltip="Sort visible page by Name"
              />
              <SortableColumnHeader<'name' | 'email'>
                field="email"
                label="Email"
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
                tooltip="Sort visible page by Email"
              />
              {selectedRole === 'ALL' ? <TableHead>Role</TableHead> : null}
              <TableHead>
                {selectedRole === 'MENTEE'
                  ? 'Mentor'
                  : selectedRole === 'MENTOR'
                    ? 'Batches'
                    : selectedRole === 'SUPER_ADMIN'
                      ? 'Batches'
                      : 'Batch / Mentor'}
              </TableHead>
              <TableHead className="w-20 text-center">Status</TableHead>
              <TableHead className="w-24 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            className={
              isFetching && !isInitialLoading
                ? 'opacity-60 transition-opacity'
                : 'transition-opacity'
            }
          >
            {isInitialLoading ? (
              // Loading Skeleton Rows - calibrated to exact data row dimensions
              Array.from({ length: limit }).map((_, i) => (
                <TableRow key={`loading-skel-${i}`} className="h-14">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-36 rounded-md" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-44 rounded-md" />
                  </TableCell>
                  {selectedRole === 'ALL' ? (
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <Skeleton className="h-5 w-28 rounded-md" />
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      <Skeleton className="h-6 w-11 rounded-full" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : usersError ? (
              <TableRow>
                <TableCell colSpan={selectedRole === 'ALL' ? 6 : 5} className="py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <div>
                      <P className="text-sm font-semibold text-slate-900">Failed to load users</P>
                      <P variant="muted" className="mt-1 text-xs text-slate-500">
                        {usersError}
                      </P>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        handleFilterUpdate();
                      }}
                    >
                      Retry Fetch
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={selectedRole === 'ALL' ? 6 : 5}
                  className="py-12 text-center text-slate-400"
                >
                  <Span>No users match your filters.</Span>
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const initials =
                  (u.name || 'User')
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'U';

                const isSelf = currentUser?.id === u.id;
                const isBlockedAdmin = Boolean(u.isLastSuperAdmin && u.status === 'ACTIVE');
                const isDeactivateDisabled = (isSelf || isBlockedAdmin) && u.status === 'ACTIVE';
                const isRowPending = Boolean(inFlightAction[u.id]);
                const deactivateTooltip = isSelf
                  ? 'Cannot deactivate your own account'
                  : isBlockedAdmin
                    ? 'Cannot deactivate the last active Super Admin'
                    : undefined;

                return (
                  <TableRow
                    key={u.id}
                    tabIndex={0}
                    role="link"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        const target = e.target as HTMLElement;
                        if (!target.closest('button, input, [role="switch"], a')) {
                          e.preventDefault();
                          router.push(`/admin/users/${u.id}`);
                        }
                      }
                    }}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (!target.closest('button, input, [role="switch"], a')) {
                        router.push(`/admin/users/${u.id}`);
                      }
                    }}
                    className="h-14 cursor-pointer transition-colors hover:bg-slate-50/70 focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#0044D3] focus-visible:outline-none focus-visible:ring-inset"
                  >
                    {/* User Column (Avatar + Name - Clean non-nested Link with wrapping) */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/users/${u.id}`}
                          title={`View user profile for ${u.name}`}
                          className="group flex items-center gap-3 rounded-xl p-0.5 text-left transition-colors hover:opacity-85 focus-visible:ring-2 focus-visible:ring-[#0044D3] focus-visible:outline-none"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#0044D3] shadow-xs transition-colors group-hover:bg-[#0044D3] group-hover:text-white">
                            {initials}
                          </div>
                          <div className="max-w-[180px] min-w-0 sm:max-w-[220px]">
                            <Span className="block text-base leading-snug font-semibold break-words text-slate-900 transition-colors group-hover:text-[#0044D3]">
                              {u.name || '—'}
                            </Span>
                          </div>
                        </Link>
                        {u.mustChangePassword ? (
                          <div className="flex shrink-0 items-center gap-1.5">
                            <Span className="text-xs font-semibold text-amber-700">
                              Invite pending
                            </Span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={inFlightAction[u.id] === 'resend'}
                              onClick={() => {
                                void handleResendInvite(u.id, u.name);
                              }}
                              className="h-5.5 rounded-full border border-amber-300 bg-amber-50 px-2 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                            >
                              {inFlightAction[u.id] === 'resend' ? 'Sending...' : 'Resend'}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </TableCell>

                    {/* Email Column */}
                    <TableCell className="max-w-[200px] font-mono text-sm break-all text-slate-600 select-all sm:max-w-[240px]">
                      {u.email}
                    </TableCell>

                    {/* Role Column (only displayed on ALL filter) */}
                    {selectedRole === 'ALL' ? (
                      <TableCell>
                        <Span
                          className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                            u.role === 'SUPER_ADMIN'
                              ? 'bg-purple-50 text-purple-700'
                              : u.role === 'MENTOR'
                                ? 'bg-blue-50 text-[#0044D3]'
                                : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {u.role === 'SUPER_ADMIN'
                            ? 'Super Admin'
                            : u.role === 'MENTOR'
                              ? 'Mentor'
                              : 'Mentee'}
                        </Span>
                      </TableCell>
                    ) : null}

                    {/* Dynamic Role-Specific Column */}
                    <TableCell className="text-sm font-medium">
                      {selectedRole === 'MENTEE' ? (
                        <Span className="text-slate-700">{u.mentorName || '—'}</Span>
                      ) : selectedRole === 'MENTOR' || selectedRole === 'SUPER_ADMIN' ? (
                        <Span className="text-slate-700">{u.batch || '—'}</Span>
                      ) : u.role === 'MENTEE' ? (
                        u.batch && u.batch !== '—' ? (
                          <div className="flex flex-col">
                            <Span className="text-slate-700">{u.batch}</Span>
                            {u.mentorName && u.mentorName !== '—' ? (
                              <Span className="text-xs text-slate-400">Mentor: {u.mentorName}</Span>
                            ) : null}
                          </div>
                        ) : (
                          <Span className="text-slate-700">{u.mentorName || '—'}</Span>
                        )
                      ) : (
                        <Span className="text-slate-700">{u.batch || '—'}</Span>
                      )}
                    </TableCell>

                    {/* Status Column with Switch Only (Tag Removed) */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <ToggleSwitch
                          checked={u.status === 'ACTIVE'}
                          disabled={isDeactivateDisabled || isRowPending}
                          title={deactivateTooltip}
                          ariaLabel={`${u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} account for ${u.name}`}
                          onChange={() => void handleToggleStatus(u)}
                        />
                      </div>
                    </TableCell>

                    {/* Actions Column (Pencil Edit Icon Center-Aligned with Actions Title) */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setUserToEdit(u)}
                          title="Edit user"
                          aria-label={`Edit ${u.name}`}
                          className="h-8 w-8 rounded-full p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.75}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                            />
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* LeadNest-Style Pagination Controls with Loading State */}
        {!usersError && (
          <PaginationControls
            page={page}
            limit={limit}
            total={totalCount}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            isLoading={isTableLoading}
            itemLabel="entries"
            pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
          />
        )}
      </TableContainer>

      {/* Drawers and Modals */}
      <CreateUserDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateUser}
      />

      <EditUserModal
        user={userToEdit}
        isOpen={Boolean(userToEdit)}
        onClose={() => setUserToEdit(null)}
        onSuccess={handleEditUserSuccess}
        onChangeRoleClick={() => {
          if (userToEdit) {
            setUserToChangeRole(userToEdit);
          }
        }}
        canChangeRole={
          Boolean(userToEdit) && currentUser?.id !== userToEdit?.id && !userToEdit?.isLastSuperAdmin
        }
      />

      <ChangeRoleModal
        user={userToChangeRole}
        isOpen={Boolean(userToChangeRole)}
        onClose={() => setUserToChangeRole(null)}
        onSuccess={handleRoleChangeSuccess}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImport={handleBulkImport}
      />

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={`animate-in fade-in fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === 'error'
              ? 'border border-red-300 bg-red-900 text-white'
              : 'bg-slate-900 text-white'
          }`}
        >
          {toast.type === 'error' ? (
            <svg
              className="h-4 w-4 shrink-0 text-red-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4 shrink-0 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          <Span>{toast.message}</Span>
        </div>
      ) : null}
    </div>
  );
}

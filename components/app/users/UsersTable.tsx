'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/app/batches/batchStatus';
import { BulkImportModal, type CsvUserRowWithLine } from '@/components/app/users/BulkImportModal';
import { ChangeRoleModal, type UserToChangeRole } from '@/components/app/users/ChangeRoleModal';
import { CreateUserModal } from '@/components/app/users/CreateUserModal';
import { EditUserModal } from '@/components/app/users/EditUserModal';
import { DebouncedSearchInput } from '@/components/patterns/DebouncedSearchInput';
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
import { getRolePortalPath } from '@/hooks/useRoleRedirect';
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
  batches?: readonly string[] | undefined;
  mentorName?: string | undefined;
  hasLoggedIn?: boolean | undefined;
  mustChangePassword?: boolean | undefined;
  activeMenteesCount?: number | undefined;
  isLastSuperAdmin?: boolean | undefined;
}

const STATUS_OPTIONS: MultiSelectOption[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const ROLE_OPTIONS: MultiSelectOption[] = [
  { value: 'SUPER_ADMIN', label: 'Admin' },
  { value: 'MENTOR', label: 'Mentor' },
  { value: 'MENTEE', label: 'Mentee' },
];

type UserSortField = 'name' | 'email' | 'role' | 'status';

export function UsersTable() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Sorting state across all entries in the whole table
  const [sortField, setSortField] = useState<UserSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Floating Action Menu state
  interface ActionMenuState {
    id: string;
    user: UserItem;
    isPending: boolean;
    isSelf: boolean;
    isBlockedAdmin: boolean;
    isDeactivateDisabled: boolean;
    deactivateTooltip?: string | undefined;
    coords: {
      top: number;
      right: number;
      placement: 'top' | 'bottom';
    };
  }

  const [activeMenuState, setActiveMenuState] = useState<ActionMenuState | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeMenuState) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setActiveMenuState(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveMenuState(null);
    };
    const handleScroll = () => {
      setActiveMenuState(null);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeMenuState]);

  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated || !currentUser) {
        router.replace('/login');
      } else if (currentUser.mustChangePassword) {
        router.replace('/change-password');
      } else if (currentUser.role !== 'SUPER_ADMIN') {
        router.replace(getRolePortalPath(currentUser.role));
      }
    }
  }, [isAuthLoading, isAuthenticated, currentUser, router]);

  const userQuery = useMemo(
    () => ({
      page,
      limit,
      search: search.trim() || undefined,
      role: selectedRoles.length > 0 ? selectedRoles : undefined,
      status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      sortBy: sortField ?? undefined,
      sortOrder: sortField ? sortOrder : undefined,
    }),
    [page, limit, search, selectedRoles, selectedStatuses, sortField, sortOrder],
  );

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
  } = useUsers(userQuery);

  const isTableLoading = isLoading || isFetching;

  const hasActiveFilters = Boolean(
    search.trim() || selectedStatuses.length > 0 || selectedRoles.length > 0,
  );

  const handleClearFilters = () => {
    setSearch('');
    setSelectedStatuses([]);
    setSelectedRoles([]);
    setSortField(null);
    setSortOrder('asc');
    setPage(1);
  };

  const handleSort = (field: UserSortField) => {
    let nextField: UserSortField | null = field;
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
  };

  // Modal controls
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [userToChangeRole, setUserToChangeRole] = useState<UserToChangeRole | null>(null);
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
      status: u.isActive ? ('ACTIVE' as const) : ('INACTIVE' as const),
      hasLoggedIn: u.lastLoginAt !== null,
      mustChangePassword: u.mustChangePassword,
      isLastSuperAdmin: u.role === 'SUPER_ADMIN' && activeAdminsCount <= 1,
    }));
  }, [apiUsers, activeAdminsCount]);

  const displayedUsers = users;
  const effectiveTotal = totalCount;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / limit));

  const handleStatusesChange = (vals: string[]) => {
    setSelectedStatuses(vals);
    setPage(1);
  };

  const handleRolesChange = (vals: string[]) => {
    setSelectedRoles(vals);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
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
      {/* Unified Filter & Actions Toolbar */}
      <div className="flex flex-col gap-3 py-1 xl:flex-row xl:items-center xl:justify-between">
        {/* Search Input & Dropdowns */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Search Input */}
          <div className="w-full sm:w-72 lg:w-80">
            <DebouncedSearchInput
              value={search}
              onSearchChange={handleSearchChange}
              placeholder="Search by name or email..."
            />
          </div>

          {/* Status MultiSelect Dropdown */}
          <MultiSelectDropdown
            label="Status"
            options={STATUS_OPTIONS}
            selectedValues={selectedStatuses}
            onChange={handleStatusesChange}
            align="left"
          />

          {/* Role MultiSelect Dropdown */}
          <MultiSelectDropdown
            label="Role"
            options={ROLE_OPTIONS}
            selectedValues={selectedRoles}
            onChange={handleRolesChange}
            align="left"
          />

          {/* Circular Red Cross Button to Clear All Active Filters */}
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              title="Clear all filters"
              aria-label="Clear all filters"
              className="h-8.5 w-8.5 rounded-full border border-red-200 bg-red-50 p-0 text-red-600 shadow-2xs transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          ) : null}
        </div>

        {/* Right Side: Action Buttons in one row */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
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
            <Span>Import CSV</Span>
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
        </div>
      </div>

      {/* Users Data Table */}
      <TableContainer>
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <SortableColumnHeader<UserSortField>
                field="name"
                label="Name"
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
                tooltip="Sort all users by Name"
                className="w-[32%]"
              />
              <SortableColumnHeader<UserSortField>
                field="email"
                label="Email"
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
                tooltip="Sort all users by Email"
                className="w-[32%]"
              />
              <SortableColumnHeader<UserSortField>
                field="role"
                label="Role"
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
                tooltip="Sort all users by Role"
                className="w-[14%]"
              />
              <SortableColumnHeader<UserSortField>
                field="status"
                label="Status"
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
                tooltip="Sort all users by Status"
                className="w-[12%] text-center"
              />
              <TableHead className="w-[10%] text-center font-semibold text-slate-700">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isTableLoading ? (
              // Loading Skeleton Rows - calibrated to exact data row dimensions
              Array.from({ length: limit }).map((_, i) => (
                <TableRow key={`loading-skel-${i}`} className="h-14">
                  <TableCell className="w-[32%]">
                    <Skeleton className="h-4 w-40 rounded-md" />
                  </TableCell>
                  <TableCell className="w-[32%]">
                    <Skeleton className="h-4 w-48 rounded-md" />
                  </TableCell>
                  <TableCell className="w-[14%]">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="w-[12%] text-center">
                    <div className="flex items-center justify-center">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </TableCell>
                  <TableCell className="w-[10%] text-center">
                    <div className="flex items-center justify-center">
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : usersError ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
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
                        void fetchUsers();
                      }}
                    >
                      Retry Fetch
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-slate-400">
                  <Span>No users match your filters.</Span>
                </TableCell>
              </TableRow>
            ) : (
              displayedUsers.map((u, idx) => {
                const isSelf = currentUser?.id === u.id;
                const isBlockedAdmin = Boolean(u.isLastSuperAdmin && u.status === 'ACTIVE');
                const isDeactivateDisabled = (isSelf || isBlockedAdmin) && u.status === 'ACTIVE';
                const isPending = Boolean(u.mustChangePassword && u.status === 'ACTIVE');
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
                    style={{ animationDelay: `${Math.min(idx * 35, 350)}ms` }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        const target = e.target as HTMLElement;
                        if (
                          !target.closest('button, input, [role="switch"], a, [data-action-menu]')
                        ) {
                          e.preventDefault();
                          router.push(`/admin/users/${u.id}`);
                        }
                      }
                    }}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (
                        !target.closest('button, input, [role="switch"], a, [data-action-menu]')
                      ) {
                        router.push(`/admin/users/${u.id}`);
                      }
                    }}
                    className="animate-row-enter h-14 cursor-pointer transition-colors hover:bg-slate-50/70 focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#0044D3] focus-visible:outline-none focus-visible:ring-inset"
                  >
                    {/* User Column (Name only) */}
                    <TableCell className="w-[32%]">
                      <div className="flex items-center truncate">
                        <Link
                          href={`/admin/users/${u.id}`}
                          title={`View user profile for ${u.name}`}
                          className="group flex min-w-0 items-center rounded-xl p-0.5 text-left transition-colors hover:opacity-85 focus-visible:ring-2 focus-visible:ring-[#0044D3] focus-visible:outline-none"
                        >
                          <Span className="block truncate text-base leading-snug font-semibold text-slate-900 transition-colors group-hover:text-[#0044D3]">
                            {u.name || '—'}
                          </Span>
                        </Link>
                      </div>
                    </TableCell>

                    {/* Email Column */}
                    <TableCell className="w-[32%] truncate text-sm text-slate-600 select-all">
                      <Span title={u.email} className="block truncate">
                        {u.email}
                      </Span>
                    </TableCell>

                    {/* Role Column */}
                    <TableCell className="w-[14%]">
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
                          ? 'Admin'
                          : u.role === 'MENTOR'
                            ? 'Mentor'
                            : 'Mentee'}
                      </Span>
                    </TableCell>

                    {/* Status Column with Badge */}
                    <TableCell className="w-[12%] text-center">
                      <div className="flex items-center justify-center">
                        {isPending ? (
                          <Span className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            Pending
                          </Span>
                        ) : u.status === 'ACTIVE' ? (
                          <Span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Active
                          </Span>
                        ) : (
                          <Span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            Inactive
                          </Span>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions Column with Three-Dots Menu */}
                    <TableCell className="w-[10%] text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-block text-left">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeMenuState?.id === u.id) {
                              setActiveMenuState(null);
                              return;
                            }
                            const btn = e.currentTarget;
                            const rect = btn.getBoundingClientRect();
                            const menuHeight = 220;
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const placement = spaceBelow < menuHeight + 20 ? 'top' : 'bottom';
                            const top = placement === 'bottom' ? rect.bottom + 6 : rect.top - 6;
                            const right = Math.max(8, window.innerWidth - rect.right);
                            setActiveMenuState({
                              id: u.id,
                              user: u,
                              isPending,
                              isSelf,
                              isBlockedAdmin,
                              isDeactivateDisabled,
                              deactivateTooltip,
                              coords: { top, right, placement },
                            });
                          }}
                          title="User actions"
                          aria-label={`Actions for ${u.name}`}
                          className={`h-8 w-8 rounded-full p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900 ${
                            activeMenuState?.id === u.id
                              ? 'bg-slate-100 text-slate-900 ring-2 ring-[#0044D3]'
                              : ''
                          }`}
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
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

        {/* Pagination Controls with Loading State */}
        {!usersError && (
          <PaginationControls
            page={page}
            limit={limit}
            total={effectiveTotal}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            isLoading={isTableLoading}
            pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
            itemLabel="users"
          />
        )}
      </TableContainer>

      {/* Drawers and Modals */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateUser}
      />

      <EditUserModal
        user={userToEdit}
        isOpen={Boolean(userToEdit)}
        onClose={() => setUserToEdit(null)}
        onSuccess={handleEditUserSuccess}
        onRoleChangeSuccess={handleRoleChangeSuccess}
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

      {activeMenuState && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={actionMenuRef}
              data-action-menu
              style={{
                position: 'fixed',
                ...(activeMenuState.coords.placement === 'bottom'
                  ? { top: `${activeMenuState.coords.top}px` }
                  : { bottom: `${window.innerHeight - activeMenuState.coords.top}px` }),
                right: `${activeMenuState.coords.right}px`,
                zIndex: 9999,
              }}
              className="animate-in fade-in zoom-in-95 w-52 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-2xl"
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  const targetUser = activeMenuState.user;
                  setActiveMenuState(null);
                  setUserToEdit(targetUser);
                }}
                className="flex w-full items-center justify-start gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              >
                <svg
                  className="h-4 w-4 text-slate-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                  />
                </svg>
                <Span>Edit Details</Span>
              </Button>

              {activeMenuState.isPending ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={inFlightAction[activeMenuState.user.id] === 'resend'}
                  onClick={(e) => {
                    e.stopPropagation();
                    const { id, name } = activeMenuState.user;
                    setActiveMenuState(null);
                    void handleResendInvite(id, name);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-50"
                >
                  <Span className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 text-amber-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <Span>
                      {inFlightAction[activeMenuState.user.id] === 'resend'
                        ? 'Sending...'
                        : 'Send Invite'}
                    </Span>
                  </Span>
                  <Span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                    Pending
                  </Span>
                </Button>
              ) : null}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={activeMenuState.isSelf || Boolean(activeMenuState.user.isLastSuperAdmin)}
                onClick={(e) => {
                  e.stopPropagation();
                  const targetUser = activeMenuState.user;
                  setActiveMenuState(null);
                  setUserToChangeRole({
                    id: targetUser.id,
                    name: targetUser.name,
                    email: targetUser.email,
                    role: targetUser.role,
                    currentRole: targetUser.role,
                  });
                }}
                title={
                  activeMenuState.isSelf
                    ? 'Cannot change your own role'
                    : activeMenuState.user.isLastSuperAdmin
                      ? 'Cannot change role of last Super Admin'
                      : undefined
                }
                className="flex w-full items-center justify-start gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  className="h-4 w-4 text-slate-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <Span>Change Role</Span>
              </Button>

              <div className="my-1 border-t border-slate-100" />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={
                  activeMenuState.isDeactivateDisabled ||
                  Boolean(inFlightAction[activeMenuState.user.id])
                }
                onClick={(e) => {
                  e.stopPropagation();
                  const targetUser = activeMenuState.user;
                  setActiveMenuState(null);
                  void handleToggleStatus(targetUser);
                }}
                title={activeMenuState.deactivateTooltip}
                className={`flex w-full items-center justify-start gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  activeMenuState.user.status === 'ACTIVE'
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                {activeMenuState.user.status === 'ACTIVE' ? (
                  <>
                    <svg
                      className="h-4 w-4 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                      />
                    </svg>
                    <Span>Deactivate User</Span>
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <Span>Activate User</Span>
                  </>
                )}
              </Button>
            </div>,
            document.body,
          )
        : null}

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
              strokeWidth={2}
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
              strokeWidth={2}
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

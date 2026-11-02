'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/app/batches/batchStatus';
import { BulkImportModal, type CsvUserRowWithLine } from '@/components/app/users/BulkImportModal';
import { ChangeRoleModal, type UserToChangeRole } from '@/components/app/users/ChangeRoleModal';
import { CreateUserDrawer } from '@/components/app/users/CreateUserDrawer';
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
import { useAllBatchMembers } from '@/hooks/useBatches';
import { useMultiMentorMentees, useUsers } from '@/hooks/useUsers';
import { cn } from '@/lib/cn';
import { compareStrings } from '@/lib/sort';
import {
  type ChangeRoleFormData,
  type CreateUserFormData,
  type UserRole,
  type UserStatus,
} from '@/lib/validation';

function isUserRole(role: unknown): role is UserRole {
  return role === 'SUPER_ADMIN' || role === 'MENTOR' || role === 'MENTEE';
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  batches: readonly string[];
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

const STATUS_OPTIONS: MultiSelectOption[] = [
  { value: 'ALL', label: 'All Users' },
  { value: 'ACTIVE', label: 'Active Users' },
  { value: 'PENDING', label: 'Pending Users' },
  { value: 'INACTIVE', label: 'Inactive Users' },
];

const BATCH_BADGE_COLORS = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-amber-50 text-amber-800 border-amber-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-pink-50 text-pink-700 border-pink-200',
  'bg-cyan-50 text-cyan-800 border-cyan-200',
];

function getBatchBadgeColor(batchName: string): string {
  let hash = 0;
  for (let i = 0; i < batchName.length; i++) {
    hash = (hash << 5) - hash + batchName.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % BATCH_BADGE_COLORS.length;
  return (
    BATCH_BADGE_COLORS[index] ?? BATCH_BADGE_COLORS[0] ?? 'bg-blue-50 text-blue-700 border-blue-200'
  );
}

function BatchBadges({ batches }: { batches?: readonly string[] | undefined }) {
  if (!batches || batches.length === 0) {
    return <Span className="text-slate-400">—</Span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {batches.map((batchName) => (
        <Span
          key={batchName}
          className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${getBatchBadgeColor(batchName)}`}
        >
          {batchName}
        </Span>
      ))}
    </div>
  );
}

interface FilterUpdateOptions {
  role?: string | undefined;
  statuses?: string[] | undefined;
  search?: string | undefined;
  mentorId?: string | undefined;
  mentorIds?: string[] | undefined;
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
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['ALL']);
  const [selectedMentorIds, setSelectedMentorIds] = useState<string[]>([]);
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
    statuses: selectedStatuses,
    search,
    mentorIds: selectedMentorIds,
    page,
    limit,
    sortBy: sortField ?? undefined,
    sortOrder: sortField ? sortOrder : undefined,
  });

  useEffect(() => {
    filtersRef.current = {
      role: selectedRole,
      statuses: selectedStatuses,
      search,
      mentorIds: selectedMentorIds,
      page,
      limit,
      sortBy: sortField ?? undefined,
      sortOrder: sortField ? sortOrder : undefined,
    };
  }, [
    selectedRole,
    selectedStatuses,
    search,
    selectedMentorIds,
    page,
    limit,
    sortField,
    sortOrder,
  ]);

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

  const { mentees: multiMentorMentees, isLoading: isMultiMentorLoading } =
    useMultiMentorMentees(selectedMentorIds);

  const isTableLoading = selectedMentorIds.length > 1 ? isMultiMentorLoading : isLoading;

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

  const hasLocalStatusFilter =
    !selectedStatuses.includes('ALL') &&
    !(
      selectedStatuses.length === 1 &&
      (selectedStatuses[0] === 'ACTIVE' || selectedStatuses[0] === 'INACTIVE')
    );

  const isClientPaginated = multiMentorMentees !== null || hasLocalStatusFilter;

  const users: UserItem[] = useMemo(() => {
    const singleFilteredMentor =
      selectedMentorIds.length === 1
        ? mentorRoster.find((m) => m.id === selectedMentorIds[0])
        : null;

    const sourceUsers = multiMentorMentees !== null ? multiMentorMentees : apiUsers;

    let list = sourceUsers.map((u) => {
      const mappedMentorName = userMentorMap.get(u.id);
      const resolvedMentorName =
        mappedMentorName || (singleFilteredMentor ? singleFilteredMentor.name : undefined) || '—';

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.isActive ? ('ACTIVE' as const) : ('INACTIVE' as const),
        batches: userBatchMap.get(u.id) ?? [],
        mentorName: resolvedMentorName,
        hasLoggedIn: u.lastLoginAt !== null,
        mustChangePassword: u.mustChangePassword,
        isLastSuperAdmin: u.role === 'SUPER_ADMIN' && activeAdminsCount <= 1,
      };
    });

    if (multiMentorMentees !== null && selectedRole !== 'ALL') {
      list = list.filter((u) => u.role === selectedRole);
    }

    if (multiMentorMentees !== null && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      );
    }

    if (!selectedStatuses.includes('ALL') && selectedStatuses.length > 0) {
      list = list.filter((u) => {
        if (selectedStatuses.includes('PENDING') && !u.hasLoggedIn) return true;
        if (selectedStatuses.includes('ACTIVE') && u.status === 'ACTIVE') return true;
        if (selectedStatuses.includes('INACTIVE') && u.status === 'INACTIVE') return true;
        return false;
      });
    }

    if (sortField) {
      list.sort((a, b) => {
        const valA = a[sortField] || '';
        const valB = b[sortField] || '';
        return compareStrings(valA, valB, sortOrder);
      });
    }

    return list;
  }, [
    multiMentorMentees,
    apiUsers,
    activeAdminsCount,
    userBatchMap,
    userMentorMap,
    mentorRoster,
    selectedRole,
    search,
    selectedStatuses,
    selectedMentorIds,
    sortField,
    sortOrder,
  ]);

  const effectiveTotal = isClientPaginated ? users.length : totalCount;

  const totalPages = Math.max(1, Math.ceil(effectiveTotal / limit));

  const displayedUsers = useMemo(() => {
    if (isClientPaginated) {
      const start = (page - 1) * limit;
      return users.slice(start, start + limit);
    }
    return users;
  }, [isClientPaginated, users, page, limit]);

  const handleFilterUpdate = ({
    role = filtersRef.current.role,
    statuses = filtersRef.current.statuses,
    search: searchVal = filtersRef.current.search,
    mentorIds = filtersRef.current.mentorIds,
    page: newPage = filtersRef.current.page,
    limit: newLimit = filtersRef.current.limit,
    sortBy = filtersRef.current.sortBy,
    sortOrder: newSortOrder = filtersRef.current.sortOrder,
  }: FilterUpdateOptions = {}) => {
    filtersRef.current = {
      role,
      statuses,
      search: searchVal,
      mentorIds,
      page: newPage,
      limit: newLimit,
      sortBy,
      sortOrder: newSortOrder,
    };

    const backendStatus =
      statuses.length === 1 && (statuses[0] === 'ACTIVE' || statuses[0] === 'INACTIVE')
        ? statuses[0]
        : undefined;
    const backendMentorId = mentorIds.length === 1 ? mentorIds[0] : undefined;

    const hasLocalStatus =
      !statuses.includes('ALL') &&
      !(statuses.length === 1 && (statuses[0] === 'ACTIVE' || statuses[0] === 'INACTIVE'));

    const effectiveLimit = hasLocalStatus ? 100 : newLimit;
    const effectivePage = hasLocalStatus ? 1 : newPage;

    void fetchUsers({
      page: effectivePage,
      limit: effectiveLimit,
      role: role !== 'ALL' ? role : undefined,
      status: backendStatus,
      search: searchVal.trim() || undefined,
      mentorId: backendMentorId,
      sortBy,
      sortOrder: newSortOrder,
    });
  };

  const handleStatusesChange = (vals: string[]) => {
    let next = vals;
    if (vals.length === 0) {
      next = ['ALL'];
    } else if (vals.includes('ALL') && vals.length > 1) {
      if (selectedStatuses.includes('ALL')) {
        next = vals.filter((v) => v !== 'ALL');
      } else {
        next = ['ALL'];
      }
    }
    setSelectedStatuses(next);
    setPage(1);

    handleFilterUpdate({
      statuses: next,
      page: 1,
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (!isClientPaginated) {
      handleFilterUpdate({ page: newPage });
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    if (!isClientPaginated) {
      handleFilterUpdate({ page: 1, limit: newLimit });
    }
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
      {/* Action Buttons Toolbar */}
      <div className="flex items-center justify-end gap-2.5 pt-2 sm:gap-3">
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
      </div>

      {/* Role-Based Navigation Tabs */}
      <div className="flex [scrollbar-width:none] items-center gap-6 overflow-x-auto overflow-y-hidden border-b border-[#E1E6EC] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {[
          { label: 'All', value: 'ALL' },
          { label: 'Mentees', value: 'MENTEE' },
          { label: 'Mentors', value: 'MENTOR' },
          { label: 'Super Admin', value: 'SUPER_ADMIN' },
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

      {/* Filter Row with Search Input, Status Dropdown, and Mentor Dropdown */}
      <div className="flex flex-wrap items-center gap-3 py-1">
        {/* Search Input */}
        <div className="w-full flex-1 sm:max-w-md lg:max-w-lg">
          <DebouncedSearchInput
            value={search}
            onSearchChange={handleSearchChange}
            placeholder="Search by name or email..."
          />
        </div>

        {/* Dropdowns aligned cleanly beside Search */}
        <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
          {/* Status MultiSelect Dropdown */}
          <MultiSelectDropdown
            label="Status"
            options={STATUS_OPTIONS}
            selectedValues={selectedStatuses}
            onChange={handleStatusesChange}
            align="left"
          />

          {/* Mentor Dropdown with Multi-select and Search */}
          {selectedRole === 'ALL' || selectedRole === 'MENTEE' ? (
            <MultiSelectDropdown
              label="Mentor"
              options={mentorOptions}
              selectedValues={selectedMentorIds}
              onChange={(vals) => {
                setSelectedMentorIds(vals);
                setPage(1);
                handleFilterUpdate({ mentorIds: vals, page: 1 });
              }}
              align="left"
            />
          ) : null}
        </div>
      </div>

      {/* Users Data Table */}
      <TableContainer>
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <SortableColumnHeader<'name' | 'email'>
                field="name"
                label="Name"
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
                tooltip="Sort visible page by Name"
                className={selectedRole === 'ALL' ? 'w-[27%]' : 'w-[32%]'}
              />
              <SortableColumnHeader<'name' | 'email'>
                field="email"
                label="Email"
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
                tooltip="Sort visible page by Email"
                className={selectedRole === 'ALL' ? 'w-[25%]' : 'w-[30%]'}
              />
              {selectedRole === 'ALL' ? <TableHead className="w-[8.5%]">Role</TableHead> : null}
              <TableHead className={selectedRole === 'ALL' ? 'w-[14.5%]' : 'w-[22%]'}>
                {selectedRole === 'MENTEE'
                  ? 'Mentor'
                  : selectedRole === 'MENTOR'
                    ? 'Batches'
                    : selectedRole === 'SUPER_ADMIN'
                      ? 'Batches'
                      : 'Batch / Mentor'}
              </TableHead>
              <TableHead className="w-20 text-center">Status</TableHead>
              <TableHead className="w-20 text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isTableLoading ? (
              // Loading Skeleton Rows - calibrated to exact data row dimensions
              Array.from({ length: limit }).map((_, i) => (
                <TableRow key={`loading-skel-${i}`} className="h-14">
                  <TableCell className={selectedRole === 'ALL' ? 'w-[27%]' : 'w-[32%]'}>
                    <Skeleton className="h-4 w-36 rounded-md" />
                  </TableCell>
                  <TableCell className={selectedRole === 'ALL' ? 'w-[25%]' : 'w-[30%]'}>
                    <Skeleton className="h-4 w-44 rounded-md" />
                  </TableCell>
                  {selectedRole === 'ALL' ? (
                    <TableCell className="w-[8.5%]">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                  ) : null}
                  <TableCell className={selectedRole === 'ALL' ? 'w-[14.5%]' : 'w-[22%]'}>
                    <Skeleton className="h-5 w-24 rounded-md" />
                  </TableCell>
                  <TableCell className="w-20 text-center">
                    <div className="flex items-center justify-center">
                      <Skeleton className="h-6 w-11 rounded-full" />
                    </div>
                  </TableCell>
                  <TableCell className="w-20 text-center">
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
                <TableCell
                  colSpan={selectedRole === 'ALL' ? 6 : 5}
                  className="py-12 text-center text-slate-400"
                >
                  <Span>No users match your filters.</Span>
                </TableCell>
              </TableRow>
            ) : (
              displayedUsers.map((u) => {
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
                    {/* User Column (Name only - Avatar circle removed) */}
                    <TableCell className={selectedRole === 'ALL' ? 'w-[27%]' : 'w-[32%]'}>
                      <div className="flex items-center gap-2.5 truncate">
                        <Link
                          href={`/admin/users/${u.id}`}
                          title={`View user profile for ${u.name}`}
                          className="group flex min-w-0 items-center rounded-xl p-0.5 text-left transition-colors hover:opacity-85 focus-visible:ring-2 focus-visible:ring-[#0044D3] focus-visible:outline-none"
                        >
                          <Span className="block truncate text-base leading-snug font-semibold text-slate-900 transition-colors group-hover:text-[#0044D3]">
                            {u.name || '—'}
                          </Span>
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

                    {/* Email Column - Shifted to x=717, no awkward line breaks */}
                    <TableCell
                      className={cn(
                        'truncate text-sm text-slate-600 select-all',
                        selectedRole === 'ALL' ? 'w-[25%]' : 'w-[30%]',
                      )}
                    >
                      <span title={u.email} className="block truncate">
                        {u.email}
                      </span>
                    </TableCell>

                    {/* Role Column (only displayed on ALL filter) */}
                    {selectedRole === 'ALL' ? (
                      <TableCell className="w-[8.5%]">
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
                    <TableCell
                      className={cn(
                        'text-sm font-medium',
                        selectedRole === 'ALL' ? 'w-[14.5%]' : 'w-[22%]',
                      )}
                    >
                      {selectedRole === 'MENTEE' ? (
                        <Span className="text-slate-700">{u.mentorName || '—'}</Span>
                      ) : selectedRole === 'MENTOR' || selectedRole === 'SUPER_ADMIN' ? (
                        <BatchBadges batches={u.batches} />
                      ) : u.role === 'MENTEE' ? (
                        u.batches.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            <BatchBadges batches={u.batches} />
                            {u.mentorName && u.mentorName !== '—' ? (
                              <Span className="text-xs text-slate-400">Mentor: {u.mentorName}</Span>
                            ) : null}
                          </div>
                        ) : (
                          <Span className="text-slate-700">{u.mentorName || '—'}</Span>
                        )
                      ) : (
                        <BatchBadges batches={u.batches} />
                      )}
                    </TableCell>

                    {/* Status Column with Switch Only (Tag Removed) */}
                    <TableCell className="w-20 text-center">
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
                    <TableCell className="w-20 text-center">
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
            total={effectiveTotal}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            isLoading={isTableLoading}
            itemLabel="users"
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
        onChangeRoleClick={(selectedUser) => {
          if (selectedUser?.role && isUserRole(selectedUser.role)) {
            setUserToChangeRole({
              id: selectedUser.id,
              name: selectedUser.name,
              email: selectedUser.email,
              role: selectedUser.role,
            });
          } else if (userToEdit && isUserRole(userToEdit.role)) {
            setUserToChangeRole({
              id: userToEdit.id,
              name: userToEdit.name,
              email: userToEdit.email,
              role: userToEdit.role,
            });
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

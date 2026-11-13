'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import { AssignCourseModal } from '@/components/app/allocations/AssignCourseModal';
import { AddMemberModal } from '@/components/app/batches/AddMemberModal';
import { BatchStatusModal } from '@/components/app/batches/BatchStatusModal';
import { MapMenteeModal } from '@/components/app/batches/MapMenteeModal';
import {
  type BatchOption,
  TransferMenteeModal,
} from '@/components/app/batches/TransferMenteeModal';
import { PortalSessionState } from '@/components/app/navigation/PortalSessionState';
import { ConfirmationModal } from '@/components/patterns/ConfirmationModal';
import { SortableColumnHeader } from '@/components/patterns/SortableColumnHeader';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
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
import { H1, H3, P, Span } from '@/components/ui/Typography';
import { useBatchAllocations } from '@/hooks/useAllocations';
import {
  useAvailableBatches,
  useBatchDetail,
  useRemoveBatchMemberMutation,
} from '@/hooks/useBatches';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import { cn } from '@/lib/cn';
import { formatDateDMY } from '@/lib/date';
import { type BatchStatus, isBatchLocked } from '@/lib/validation';

import { getBatchStatusBadgeClass } from './batchStatus';

export interface BatchMemberItem {
  id: string;
  name: string;
  email: string;
  memberRole: 'MENTOR' | 'MENTEE';
  mappedToName?: string | undefined;
  joinedAt: string;
}

export interface AllocatedCourseItem {
  id: string;
  title: string;
  dueDate: string;
  averageProgress: number;
  status: string;
}

export interface StatusHistoryEntry {
  id: string;
  fromStatus: BatchStatus;
  toStatus: BatchStatus;
  changedBy: string;
  changedAt: string;
  reason?: string | undefined;
}

export interface BatchDetailData {
  id: string;
  name: string;
  code: string;
  status: BatchStatus;
  startDate: string;
  endDate: string;
  description?: string | undefined;
  members: BatchMemberItem[];
  courses: AllocatedCourseItem[];
  history: StatusHistoryEntry[];
}

function MentorMappingCell({
  member,
  onOpenMapping,
  isArchived = false,
}: Readonly<{
  member: BatchMemberItem;
  onOpenMapping: (targetMentee: {
    id: string;
    name: string;
    currentMentorName?: string | undefined;
  }) => void;
  isArchived?: boolean | undefined;
}>) {
  if (member.memberRole !== 'MENTEE') {
    return <Span className="text-slate-400">—</Span>;
  }

  if (member.mappedToName) {
    return (
      <div className="flex items-center gap-2">
        <Span className="font-semibold text-slate-900">{member.mappedToName}</Span>
        {!isArchived ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              onOpenMapping({
                id: member.id,
                name: member.name,
                currentMentorName: member.mappedToName,
              })
            }
            className="h-6 px-1.5 text-[11px] font-semibold text-[#0044D3] hover:bg-blue-50"
          >
            Reassign
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {!isArchived ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onOpenMapping({
              id: member.id,
              name: member.name,
            })
          }
          className="h-7 rounded-full border-[#0044D3] px-3 text-xs font-semibold text-[#0044D3] hover:bg-blue-50"
        >
          Assign Mentor
        </Button>
      ) : (
        <Span className="text-xs text-slate-400">Unassigned</Span>
      )}
    </div>
  );
}

export function BatchDashboardSkeleton() {
  return (
    <div className="animate-in fade-in space-y-6 duration-150">
      {/* Back Button & Header Skeleton */}
      <div className="space-y-3">
        <div className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 shadow-xs">
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
          <Skeleton className="h-3.5 w-24 rounded-md" />
        </div>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-60 rounded-xl" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* 4 KPI Cards Skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <Skeleton className="h-3.5 w-24 rounded-md" />
            <Skeleton className="mt-3 h-8 w-16 rounded-lg" />
            <Skeleton className="mt-2 h-3 w-32 rounded-md" />
          </div>
        ))}
      </div>

      {/* Tab Bar Skeleton */}
      <div className="flex gap-4 border-b border-slate-200 pb-2">
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-36 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>

      {/* Content Table Skeleton */}
      <div className="overflow-hidden rounded-2xl border border-[#E1E6EC] bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div className="space-y-1">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-3 w-48 rounded-md" />
          </div>
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex h-14 items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-44 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BatchDashboardView({
  batchId,
  initialBatch,
}: Readonly<{
  batchId?: string | undefined;
  initialBatch?: BatchDetailData | undefined;
}>) {
  const router = useRouter();
  const { user, isAuthorized, sessionError } = useRoleRedirect({ allowedRoles: ['SUPER_ADMIN'] });

  const [activeTab, setActiveTab] = useState<'members' | 'courses' | 'timeline'>('members');

  // Modals state
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [menteeToTransfer, setMenteeToTransfer] = useState<{
    id: string;
    name: string;
    currentBatchId: string;
    currentBatchName: string;
  } | null>(null);
  const [mapMenteeTarget, setMapMenteeTarget] = useState<{
    isOpen: boolean;
    targetMentee?: { id: string; name: string; currentMentorName?: string | undefined } | null;
  }>({ isOpen: false, targetMentee: null });

  const activeId = batchId ?? initialBatch?.id ?? '';
  const [isAssignCourseModalOpen, setIsAssignCourseModalOpen] = useState(false);
  const {
    data: serverBatchDetail,
    isLoading,
    isError,
    error: batchError,
    refetch: refetchBatch,
  } = useBatchDetail(activeId);
  const { data: batchAllocationsData, refetch: refetchAllocations } = useBatchAllocations(activeId);
  const { data: availableBatchesList } = useAvailableBatches({
    enabled: Boolean(menteeToTransfer),
  });
  const removeMemberMutation = useRemoveBatchMemberMutation();

  const [memberToRemove, setMemberToRemove] = useState<{
    id: string;
    name: string;
    role: string;
  } | null>(null);

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      await removeMemberMutation.mutateAsync({ batchId: activeId, userId: memberToRemove.id });
      setMemberToRemove(null);
    } catch {
      // Mutation error handled by removeMemberMutation
    }
  };

  const allocatedCourses = useMemo<AllocatedCourseItem[]>(() => {
    const allocs = batchAllocationsData?.items ?? [];
    if (allocs.length === 0) return [];

    const map = new Map<
      string,
      { title: string; dueDate: string; totalProgress: number; count: number; status: string }
    >();

    for (const a of allocs) {
      const cId = a.courseId;
      const title = a.course?.title ?? 'Untitled Course';
      const existing = map.get(cId);
      if (!existing) {
        map.set(cId, {
          title,
          dueDate: new Date(a.dueDate).toLocaleDateString(),
          totalProgress: a.progressPercent,
          count: 1,
          status: a.status,
        });
      } else {
        existing.totalProgress += a.progressPercent;
        existing.count += 1;
      }
    }

    return Array.from(map.entries()).map(([id, val]) => ({
      id,
      title: val.title,
      dueDate: val.dueDate,
      averageProgress: Math.round(val.totalProgress / val.count),
      status: val.status,
    }));
  }, [batchAllocationsData]);

  const batch: BatchDetailData | null = useMemo(() => {
    if (serverBatchDetail) {
      return {
        id: serverBatchDetail.id,
        name: serverBatchDetail.name,
        code: serverBatchDetail.code,
        status: serverBatchDetail.status,
        startDate: serverBatchDetail.startDate,
        endDate: serverBatchDetail.endDate,
        description: serverBatchDetail.description ?? initialBatch?.description,
        members: serverBatchDetail.members ?? [],
        courses: allocatedCourses,
        history: serverBatchDetail.history ?? [],
      };
    }
    return initialBatch ?? null;
  }, [serverBatchDetail, initialBatch, allocatedCourses]);

  const availableBatches: BatchOption[] = useMemo(() => {
    if (!availableBatchesList || !Array.isArray(availableBatchesList)) return [];
    return availableBatchesList.map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      status: b.status,
    }));
  }, [availableBatchesList]);

  const mentees = useMemo(() => {
    if (!batch) return [];
    return batch.members.filter((m) => m.memberRole === 'MENTEE');
  }, [batch]);

  const mentors = useMemo(() => {
    if (!batch) return [];
    return batch.members.filter((m) => m.memberRole === 'MENTOR');
  }, [batch]);

  const unmappedMentees = useMemo(() => {
    return mentees
      .filter((m) => !m.mappedToName)
      .map((m) => ({ id: m.id, name: m.name, email: m.email }));
  }, [mentees]);

  const mentorOptions = useMemo(() => {
    return mentors.map((m) => ({ id: m.id, name: m.name, email: m.email }));
  }, [mentors]);

  // Sorting state for Batch Members
  const [memberSortField, setMemberSortField] = useState<'name' | null>(null);
  const [memberSortOrder, setMemberSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleMemberSort = (field: 'name') => {
    if (memberSortField === field) {
      if (memberSortOrder === 'asc') {
        setMemberSortOrder('desc');
      } else {
        setMemberSortField(null);
        setMemberSortOrder('asc');
      }
    } else {
      setMemberSortField(field);
      setMemberSortOrder('asc');
    }
  };

  const sortedMembers = useMemo(() => {
    if (!batch?.members) return [];
    if (!memberSortField) return batch.members;
    return [...batch.members].sort((a, b) => {
      const valA = a.name || '';
      const valB = b.name || '';
      return memberSortOrder === 'asc'
        ? valA.localeCompare(valB, undefined, { sensitivity: 'base' })
        : valB.localeCompare(valA, undefined, { sensitivity: 'base' });
    });
  }, [batch, memberSortField, memberSortOrder]);

  // Sorting state for Batch Courses
  const [courseSortField, setCourseSortField] = useState<'title' | null>(null);
  const [courseSortOrder, setCourseSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleCourseSort = (field: 'title') => {
    if (courseSortField === field) {
      if (courseSortOrder === 'asc') {
        setCourseSortOrder('desc');
      } else {
        setCourseSortField(null);
        setCourseSortOrder('asc');
      }
    } else {
      setCourseSortField(field);
      setCourseSortOrder('asc');
    }
  };

  const sortedBatchCourses = useMemo(() => {
    if (!batch?.courses) return [];
    if (!courseSortField) return batch.courses;
    return [...batch.courses].sort((a, b) => {
      const valA = a.title || '';
      const valB = b.title || '';
      return courseSortOrder === 'asc'
        ? valA.localeCompare(valB, undefined, { sensitivity: 'base' })
        : valB.localeCompare(valA, undefined, { sensitivity: 'base' });
    });
  }, [batch, courseSortField, courseSortOrder]);

  const isArchived = Boolean(batch && isBatchLocked(batch.status));

  const handleStatusSuccess = () => {
    // TanStack Query invalidation automatically synchronizes batch state
  };

  const handleTransferSuccess = () => {
    // TanStack Query invalidation automatically synchronizes batch state
  };

  if (!isAuthorized || !user) {
    if (sessionError) {
      return (
        <PortalSessionState
          sessionError={sessionError}
          loadingMessage="Verifying administrator authorization..."
          spinnerColor="border-blue-600"
        />
      );
    }
    return <BatchDashboardSkeleton />;
  }

  if (isLoading || !batch) {
    return <BatchDashboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <Alert
          variant="error"
          title="Failed to Load Batch Details"
          message={
            batchError instanceof Error
              ? batchError.message
              : 'An unexpected error occurred while fetching the batch details.'
          }
        />
        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/batches')}
          >
            ← Back to Batches
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              void refetchBatch();
            }}
          >
            Retry Fetch
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="space-y-3">
        <div className="flex items-center">
          <Link
            href="/admin/batches"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900 sm:text-sm"
          >
            <svg
              className="h-4 w-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <Span>Back to Batches</Span>
          </Link>
        </div>

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex max-w-3xl min-w-0 flex-1 flex-wrap items-center gap-3">
            <H1 className="text-2xl font-extrabold tracking-tight break-words text-slate-900 sm:text-3xl">
              {batch.name}
            </H1>
            <Span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase ${getBatchStatusBadgeClass(
                batch.status,
              )}`}
            >
              {batch.status}
            </Span>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            {batch.status !== 'ARCHIVED' ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsStatusOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[#0044D3] bg-white px-4 py-2 text-xs font-bold text-[#0044D3] shadow-2xs transition-all hover:border-[#0039B3] hover:bg-blue-50/70 hover:text-[#0039B3] sm:text-sm"
              >
                <Span>Change Status</Span>
              </Button>
            ) : null}
          </div>
        </div>

        {batch.description ? (
          <P className="mt-1 text-sm break-words text-slate-600">{batch.description}</P>
        ) : null}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <Span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
            Active Mentees
          </Span>
          <P className="mt-1 text-3xl font-bold text-slate-900">{mentees.length}</P>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <Span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
            Assigned Mentors
          </Span>
          <P className="mt-1 text-3xl font-bold text-slate-900">{mentors.length}</P>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <Span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
            Allocated Courses
          </Span>
          <P className="mt-1 text-3xl font-bold text-slate-900">{batch.courses.length}</P>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <Span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
            Timeline Window
          </Span>
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
            <Span className="text-base font-bold text-slate-900">
              {formatDateDMY(batch.startDate) || '—'}
            </Span>
            <Span className="text-sm font-medium text-slate-400">to</Span>
            <Span className="text-base font-bold text-slate-900">
              {formatDateDMY(batch.endDate) || '—'}
            </Span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setActiveTab('members')}
          className={`h-auto rounded-none border-b-2 px-4 py-3 text-sm font-bold transition-all ${
            activeTab === 'members'
              ? 'border-blue-600 text-blue-600 hover:text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Members ({batch.members.length})
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setActiveTab('courses')}
          className={`h-auto rounded-none border-b-2 px-4 py-3 text-sm font-bold transition-all ${
            activeTab === 'courses'
              ? 'border-blue-600 text-blue-600 hover:text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Allocated Courses ({batch.courses.length})
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setActiveTab('timeline')}
          className={`h-auto rounded-none border-b-2 px-4 py-3 text-sm font-bold transition-all ${
            activeTab === 'timeline'
              ? 'border-blue-600 text-blue-600 hover:text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Timeline ({batch.history.length})
        </Button>
      </div>

      {/* Tab 1: Members */}
      {activeTab === 'members' ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <div>
              <H3 className="text-sm font-bold text-slate-800">Cohort Roster</H3>
            </div>
            <div className="flex items-center gap-2">
              {mentors.length > 0 && unmappedMentees.length > 0 && !isArchived ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMapMenteeTarget({ isOpen: true, targetMentee: null })}
                  className="flex items-center gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  <Span>Map Mentees ({unmappedMentees.length})</Span>
                </Button>
              ) : null}
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isArchived}
                title={isArchived ? "Can't add in archived batch" : undefined}
                onClick={() => setIsAddMemberOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#0044D3] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#0039B3] disabled:opacity-50"
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <Span className="leading-none">Add Member</Span>
              </Button>
            </div>
          </div>

          {batch.members.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="mx-auto h-10 w-10 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <H3 className="mt-3 text-base font-bold text-slate-800">No Members Enrolled Yet</H3>
            </div>
          ) : (
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableColumnHeader<'name'>
                      field="name"
                      label="Member"
                      sortField={memberSortField}
                      sortOrder={memberSortOrder}
                      onSort={handleMemberSort}
                      tooltip="Sort members by Name"
                    />
                    <TableHead>Role</TableHead>
                    <TableHead>Mapped Mentor</TableHead>
                    <TableHead>Enrolled Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMembers.map((m, idx) => {
                    const isLastMentor = m.memberRole === 'MENTOR' && mentors.length <= 1;

                    return (
                      <TableRow
                        key={m.id}
                        style={{ animationDelay: `${Math.min(idx * 35, 350)}ms` }}
                        className="animate-row-enter transition-colors hover:bg-slate-50/60"
                      >
                        <TableCell>
                          <P className="font-semibold text-slate-900">{m.name}</P>
                          <P className="text-xs text-slate-500">{m.email}</P>
                        </TableCell>
                        <TableCell>
                          <Span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              m.memberRole === 'MENTOR'
                                ? 'border border-blue-200 bg-blue-50 text-blue-700'
                                : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {m.memberRole}
                          </Span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">
                          <MentorMappingCell
                            member={m}
                            isArchived={isArchived}
                            onOpenMapping={(target) =>
                              setMapMenteeTarget({ isOpen: true, targetMentee: target })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          <Span>{formatDateDMY(m.joinedAt)}</Span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {m.memberRole === 'MENTEE' && !isArchived ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setMenteeToTransfer({
                                    id: m.id,
                                    name: m.name,
                                    currentBatchId: batch.id,
                                    currentBatchName: batch.name,
                                  })
                                }
                                className="px-2.5 py-1 text-xs text-[#0044D3] hover:bg-blue-50"
                              >
                                Transfer
                              </Button>
                            ) : null}
                            {!isLastMentor ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={removeMemberMutation.isPending || isArchived}
                                title={
                                  isArchived
                                    ? "Can't remove from archived batch"
                                    : `Remove ${m.name}`
                                }
                                aria-label={`Remove ${m.name}`}
                                onClick={() => {
                                  setMemberToRemove({ id: m.id, name: m.name, role: m.memberRole });
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg p-0 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={1.75}
                                  aria-hidden="true"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      ) : null}

      {/* Tab 2: Courses */}
      {activeTab === 'courses' ? (
        <div className="space-y-4">
          {batch.courses.length > 0 ? (
            <div className="flex items-center justify-end">
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isArchived}
                title={isArchived ? "Can't allocate in archived batch" : undefined}
                onClick={() => setIsAssignCourseModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#0044D3] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#0039B3] disabled:opacity-50"
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <Span className="leading-none">Allocate Course</Span>
              </Button>
            </div>
          ) : null}
          {batch.courses.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableColumnHeader<'title'>
                      field="title"
                      label="Course"
                      sortField={courseSortField}
                      sortOrder={courseSortOrder}
                      onSort={handleCourseSort}
                      tooltip="Sort allocated courses by Title"
                    />
                    <TableHead>Target Due Date</TableHead>
                    <TableHead>Cohort Avg Progress</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedBatchCourses.map((c, idx) => (
                    <TableRow
                      key={c.id}
                      style={{ animationDelay: `${Math.min(idx * 35, 350)}ms` }}
                      className="animate-row-enter transition-colors hover:bg-slate-50/60"
                    >
                      <TableCell className="max-w-xs font-semibold break-words text-slate-900">
                        <Span>{c.title}</Span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        <Span>{formatDateDMY(c.dueDate)}</Span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[#0044D3]"
                              style={{ width: `${c.averageProgress}%` }}
                            />
                          </div>
                          <Span className="text-xs font-semibold text-slate-700">
                            {c.averageProgress}%
                          </Span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          {c.status}
                        </Span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-sm">
              <svg
                className="mx-auto h-10 w-10 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <H3 className="mt-3 text-base font-bold text-slate-900">No Courses Allocated Yet</H3>
              <P className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                Allocate active courses from the Course Library to this batch.
              </P>
              <div className="mt-4">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={isArchived}
                  title={isArchived ? "Can't allocate in archived batch" : undefined}
                  onClick={() => setIsAssignCourseModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#0044D3] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#0039B3] disabled:opacity-50"
                >
                  <svg
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <Span className="leading-none">Allocate Course</Span>
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Tab 3: Timeline */}
      {activeTab === 'timeline' ? (
        <div className="space-y-6">
          {/* Cohort Schedule Overview */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <H3 className="text-base font-bold text-slate-900">Cohort Schedule</H3>
            <P className="mt-1 text-sm text-slate-500">
              Active operating window and lifecycle span for this batch.
            </P>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Start Date */}
              <div className="flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <Span className="block text-xs font-bold tracking-wider text-slate-500 uppercase">
                    Start Date
                  </Span>
                  <Span className="mt-1 block text-base font-bold text-slate-900">
                    {formatDateDMY(batch.startDate) || '—'}
                  </Span>
                </div>
              </div>

              {/* Current Status */}
              <div className="flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <Span className="block text-xs font-bold tracking-wider text-slate-500 uppercase">
                    Current Status
                  </Span>
                  <Span
                    className={cn(
                      'mt-1.5 inline-block rounded-full px-3 py-0.5 text-xs font-bold uppercase',
                      getBatchStatusBadgeClass(batch.status),
                    )}
                  >
                    {batch.status}
                  </Span>
                </div>
              </div>

              {/* End Date */}
              <div className="flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
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
                      d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <Span className="block text-xs font-bold tracking-wider text-slate-500 uppercase">
                    Target End Date
                  </Span>
                  <Span className="mt-1 block text-base font-bold text-slate-900">
                    {formatDateDMY(batch.endDate) || '—'}
                  </Span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Transitions Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <H3 className="text-base font-bold text-slate-900">Status Transition History</H3>
            <P className="mt-1 text-sm text-slate-500">
              Audit log of all lifecycle status changes performed on this batch.
            </P>

            {batch.history.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center">
                <P className="text-sm text-slate-500">
                  No status transitions recorded for this batch yet.
                </P>
              </div>
            ) : (
              <div className="relative mt-6 space-y-6 pl-6 before:absolute before:top-2 before:bottom-2 before:left-2.5 before:w-0.5 before:bg-slate-200">
                {batch.history.map((h) => (
                  <div key={h.id} className="relative">
                    <Span className="absolute top-1.5 -left-6 h-3.5 w-3.5 rounded-full bg-[#0044D3] ring-4 ring-blue-50" />
                    <div className="flex flex-wrap items-center gap-2">
                      <Span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        {h.fromStatus}
                      </Span>
                      <svg
                        className="h-4 w-4 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                      <Span
                        className={cn(
                          'rounded-md px-2.5 py-0.5 text-xs font-bold uppercase',
                          getBatchStatusBadgeClass(h.toStatus),
                        )}
                      >
                        {h.toStatus}
                      </Span>
                      <Span className="text-xs text-slate-400">•</Span>
                      <Span className="text-sm font-medium text-slate-500">
                        {formatDateDMY(h.changedAt)}
                      </Span>
                    </div>
                    <P className="mt-1.5 text-sm text-slate-600">
                      Changed by <Span className="font-semibold text-slate-900">{h.changedBy}</Span>
                      {h.reason ? ` — "${h.reason}"` : ''}
                    </P>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Modals */}
      <BatchStatusModal
        key={`batch-status-${batch.id}-${batch.status}-${isStatusOpen ? 'open' : 'closed'}`}
        batchId={batch.id}
        batchName={batch.name}
        currentStatus={batch.status}
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        onSuccess={handleStatusSuccess}
      />

      <TransferMenteeModal
        key={`transfer-mentee-${menteeToTransfer?.id ?? 'none'}`}
        mentee={menteeToTransfer}
        availableBatches={availableBatches}
        isOpen={Boolean(menteeToTransfer)}
        onClose={() => setMenteeToTransfer(null)}
        onSuccess={handleTransferSuccess}
      />

      <AddMemberModal
        key={`add-member-${batch.id}-${batch.status}-${isAddMemberOpen ? 'open' : 'closed'}`}
        batchId={batch.id}
        batchName={batch.name}
        batchStatus={batch.status}
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onSuccess={() => {}}
        existingMemberUserIds={batch.members.map((m) => m.id)}
      />

      <MapMenteeModal
        key={`map-mentee-${batch.id}-${batch.status}-${mapMenteeTarget.targetMentee?.id ?? 'batch-map'}`}
        isOpen={mapMenteeTarget.isOpen}
        onClose={() => setMapMenteeTarget({ isOpen: false, targetMentee: null })}
        onSuccess={() => setMapMenteeTarget({ isOpen: false, targetMentee: null })}
        batchId={batch.id}
        batchName={batch.name}
        batchStatus={batch.status}
        mentors={mentorOptions}
        targetMentee={mapMenteeTarget.targetMentee}
        unmappedMentees={unmappedMentees}
      />

      {/* Remove Member Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(memberToRemove)}
        onClose={() => {
          if (!removeMemberMutation.isPending) {
            setMemberToRemove(null);
          }
        }}
        onConfirm={handleConfirmRemoveMember}
        title="Remove Member?"
        description={`Are you sure you want to remove ${memberToRemove?.role.toLowerCase() || 'member'} ${memberToRemove?.name || ''} from this batch? Their historical logs and learning history will be preserved.`}
        confirmLabel="Remove Member"
        confirmVariant="danger"
        isLoading={removeMemberMutation.isPending}
      />

      <AssignCourseModal
        isOpen={isAssignCourseModalOpen}
        onClose={() => setIsAssignCourseModalOpen(false)}
        userRole="SUPER_ADMIN"
        onSuccess={() => {
          void refetchAllocations();
        }}
      />
    </div>
  );
}

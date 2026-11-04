'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { AssignCourseModal } from '@/components/app/allocations/AssignCourseModal';
import { ImpactNoticeModal } from '@/components/app/courses/ImpactNoticeModal';
import {
  ADMIN_COURSES_NAV,
  MENTOR_COURSES_NAV,
} from '@/components/app/navigation/portal-nav.config';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { DebouncedSearchInput } from '@/components/patterns/DebouncedSearchInput';
import { Modal } from '@/components/patterns/Modal';
import { PaginationControls } from '@/components/patterns/PaginationControls';
import { SortableColumnHeader } from '@/components/patterns/SortableColumnHeader';
import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
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
import { H3, P, Span } from '@/components/ui/Typography';
import { useAuth } from '@/hooks/useAuth';
import { useCourses } from '@/hooks/useCourses';
import { useDurationInput } from '@/hooks/useDurationInput';
import { getRolePortalPath } from '@/hooks/useRoleRedirect';
import { formatErrorMessage } from '@/lib/errors';
import type { Course, CourseImpact } from '@/types/courses';

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
      <Span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </Button>
  );
}

const COURSE_STATUS_OPTIONS: MultiSelectOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

interface CourseLibraryViewProps {
  portal: 'admin' | 'mentor';
}

export function CourseLibraryView({ portal }: Readonly<CourseLibraryViewProps>) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Sorting state for Course Name column
  const [sortField, setSortField] = useState<'title' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const resolvedIsActive = useMemo(() => {
    if (selectedStatuses.includes('active') && !selectedStatuses.includes('inactive')) return true;
    if (selectedStatuses.includes('inactive') && !selectedStatuses.includes('active')) return false;
    return 'all' as const;
  }, [selectedStatuses]);

  const courseQuery = useMemo(
    () => ({
      page,
      limit,
      search: search.trim() || undefined,
      isActive: resolvedIsActive,
      sortBy: sortField ?? undefined,
      sortOrder: sortField ? sortOrder : undefined,
    }),
    [page, limit, search, resolvedIsActive, sortField, sortOrder],
  );

  const hasActiveFilters = Boolean(search.trim() || selectedStatuses.length > 0);
  const handleClearFilters = () => {
    setSearch('');
    setSelectedStatuses([]);
    setSortField(null);
    setSortOrder('asc');
    setPage(1);
  };

  const {
    courses,
    pagination,
    isLoading: loadingCourses,
    isFetching: isFetchingCourses,
    createCourse,
    deleteCourse,
    toggleCourseStatus,
    cloneCourse,
    getCourseImpact,
  } = useCourses(courseQuery);

  const handleSort = (field: 'title') => {
    let nextField: 'title' | null = field;
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

  // Create Course Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const {
    durationHours,
    durationMinutes,
    handleHoursChange,
    handleMinutesChange,
    resetDuration,
    estimatedMinutes,
  } = useDurationInput({
    initialMinutes: 2400,
  });
  const [newIsActive, setNewIsActive] = useState(true);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Impact & Action Modals State
  const [activeActionCourse, setActiveActionCourse] = useState<Course | null>(null);
  const [assignModalCourse, setAssignModalCourse] = useState<Course | null>(null);
  const [courseImpact, setCourseImpact] = useState<CourseImpact | null>(null);
  const [impactStatus, setImpactStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );
  const [modalActionType, setModalActionType] = useState<'DELETE' | 'TOGGLE_STATUS' | null>(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openActionMenuId) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setOpenActionMenuId(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenActionMenuId(null);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openActionMenuId]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.replace('/login');
      } else if (user.role !== 'SUPER_ADMIN' && user.role !== 'MENTOR') {
        router.replace(getRolePortalPath('MENTEE'));
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) {
      setCreateError('Course title cannot be empty.');
      return;
    }
    if (trimmedTitle.length < 3) {
      setCreateError('Course title must be at least 3 characters.');
      return;
    }
    if (trimmedTitle.length > 150) {
      setCreateError('Course title cannot exceed 150 characters.');
      return;
    }

    const totalEstimatedMins =
      estimatedMinutes !== null && estimatedMinutes > 0 ? estimatedMinutes : undefined;

    setIsSubmittingCreate(true);
    setCreateError(null);

    try {
      const created = await createCourse({
        title: trimmedTitle,
        description: newDescription.trim() || undefined,
        estimatedMinutes: totalEstimatedMins,
        isActive: newIsActive,
      });

      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      resetDuration(2400);
      router.push(`/${portal}/courses/${created.id}/builder`);
    } catch (err: unknown) {
      setCreateError(formatErrorMessage(err, 'Failed to create course'));
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const onRequestDelete = async (course: Course) => {
    setActiveActionCourse(course);
    setModalActionType('DELETE');
    setImpactStatus('loading');
    try {
      const impactData = await getCourseImpact(course.id);
      setCourseImpact(impactData);
      setImpactStatus('success');
    } catch {
      setCourseImpact(null);
      setImpactStatus('error');
    }
  };

  const onRequestToggleStatus = async (course: Course) => {
    setActiveActionCourse(course);
    setModalActionType('TOGGLE_STATUS');
    setImpactStatus('loading');
    try {
      const impactData = await getCourseImpact(course.id);
      setCourseImpact(impactData);
      setImpactStatus('success');
    } catch {
      setCourseImpact(null);
      setImpactStatus('error');
    }
  };

  const handleConfirmAction = async () => {
    if (!activeActionCourse || !modalActionType) return;

    setIsActionSubmitting(true);
    try {
      if (modalActionType === 'DELETE') {
        await deleteCourse(activeActionCourse.id);
      } else if (modalActionType === 'TOGGLE_STATUS') {
        await toggleCourseStatus(
          activeActionCourse.id,
          !activeActionCourse.isActive,
          activeActionCourse.updatedAt,
        );
      }
      setActiveActionCourse(null);
      setModalActionType(null);
      setCourseImpact(null);
      setImpactStatus('idle');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  if (isLoading || !isAuthenticated || !user) {
    const fallbackNav = portal === 'mentor' ? MENTOR_COURSES_NAV : ADMIN_COURSES_NAV;
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <Header {...fallbackNav} />
        <DashboardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64 rounded-xl" />
              <Skeleton className="h-4 w-96 rounded-md" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Skeleton className="h-24 rounded-3xl" />
              <Skeleton className="h-24 rounded-3xl" />
              <Skeleton className="h-24 rounded-3xl" />
            </div>
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        </DashboardContent>
      </div>
    );
  }

  const navConfig = portal === 'mentor' ? MENTOR_COURSES_NAV : ADMIN_COURSES_NAV;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header {...navConfig} />

      <DashboardContent>
        {/* Search, Filter Toolbar & Actions */}
        <div className="flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:w-72 lg:w-80">
              <DebouncedSearchInput
                value={search}
                onSearchChange={(val) => {
                  setSearch(val);
                  setPage(1);
                }}
                placeholder="Search courses by title or topic..."
              />
            </div>

            {/* Status Dropdown Filter */}
            <MultiSelectDropdown
              label="Status"
              options={COURSE_STATUS_OPTIONS}
              selectedValues={selectedStatuses}
              onChange={(vals) => {
                setSelectedStatuses(vals);
                setPage(1);
              }}
              align="left"
            />

            {/* Circular Red Cross Clear Button */}
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

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#0044D3] px-4 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#0039B3] sm:h-10 sm:text-sm"
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
              <Span className="leading-none">Create New Course</Span>
            </Button>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="mt-6">
          {loadingCourses ? (
            <TableContainer className="w-full">
              <Table className="w-full table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[48%]">Course</TableHead>
                    <TableHead className="w-28 text-center">Topics</TableHead>
                    <TableHead className="w-28 text-center">Tasks</TableHead>
                    <TableHead className="w-28 text-center">Activate</TableHead>
                    <TableHead className="w-20 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <TableRow key={`course-skel-${idx}`} className="h-16">
                      <TableCell>
                        <Skeleton className="h-4 w-52 rounded-md" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="mx-auto h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="mx-auto h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell className="w-28 text-center">
                        <Skeleton className="mx-auto h-6 w-11 rounded-full" />
                      </TableCell>
                      <TableCell className="w-20 text-center">
                        <Skeleton className="mx-auto h-8 w-8 rounded-full" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls
                page={page}
                limit={limit}
                total={pagination.total || 10}
                totalPages={pagination.totalPages || 1}
                onPageChange={setPage}
                onLimitChange={(newLimit) => {
                  setLimit(newLimit);
                  setPage(1);
                }}
                isLoading={true}
                itemLabel="courses"
                pageSizeOptions={[10, 20, 50, 100]}
              />
            </TableContainer>
          ) : (
            <>
              {courses.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                  <H3 className="text-base font-bold text-slate-800">No courses found</H3>
                  <P className="mt-1 text-sm text-slate-500">
                    Try modifying your search or filter settings, or click &quot;Create New
                    Course&quot;.
                  </P>
                </div>
              ) : (
                <TableContainer
                  className={`w-full ${
                    isFetchingCourses && !loadingCourses ? 'opacity-60 transition-opacity' : ''
                  }`}
                >
                  <Table className="w-full table-fixed">
                    <TableHeader>
                      <TableRow>
                        <SortableColumnHeader<'title'>
                          field="title"
                          label="Course"
                          sortField={sortField}
                          sortOrder={sortOrder}
                          onSort={handleSort}
                          tooltip="Sort all courses by Title"
                          className="w-[48%]"
                        />
                        <TableHead className="w-28 text-center">Topics</TableHead>
                        <TableHead className="w-28 text-center">Tasks</TableHead>
                        <TableHead className="w-28 text-center">Activate</TableHead>
                        <TableHead className="w-20 text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((c) => {
                        const topicCount = c.topicCount ?? c.topics?.length ?? 0;
                        const assignmentCount =
                          c.assignmentCount ??
                          (c.courseAssignments?.length ?? c.assignments?.length ?? 0) +
                            (c.topics?.reduce((acc, t) => acc + (t.assignments?.length ?? 0), 0) ??
                              0);

                        return (
                          <TableRow
                            key={c.id}
                            onClick={() => router.push(`/${portal}/courses/${c.id}/builder`)}
                            className="cursor-pointer transition-colors hover:bg-slate-50/80"
                          >
                            <TableCell>
                              <div className="flex max-w-[280px] sm:max-w-xs md:max-w-md">
                                <Link
                                  href={`/${portal}/courses/${c.id}/builder`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="truncate text-sm font-bold text-slate-900 transition-colors hover:text-[#0044D3]"
                                  title={c.title}
                                >
                                  {c.title}
                                </Link>
                              </div>
                            </TableCell>

                            <TableCell className="text-center text-xs text-slate-600">
                              <Span className="inline-flex min-w-[70px] items-center justify-center rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-700">
                                {topicCount} {topicCount === 1 ? 'topic' : 'topics'}
                              </Span>
                            </TableCell>

                            <TableCell className="text-center text-xs text-slate-600">
                              <Span className="inline-flex min-w-[70px] items-center justify-center rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-700">
                                {assignmentCount} {assignmentCount === 1 ? 'task' : 'tasks'}
                              </Span>
                            </TableCell>

                            <TableCell
                              className="w-28 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-center">
                                <ToggleSwitch
                                  checked={c.isActive}
                                  disabled={isActionSubmitting && activeActionCourse?.id === c.id}
                                  title={c.isActive ? 'Deactivate course' : 'Activate course'}
                                  ariaLabel={`${c.isActive ? 'Deactivate' : 'Activate'} course ${c.title}`}
                                  onChange={() => void onRequestToggleStatus(c)}
                                />
                              </div>
                            </TableCell>

                            <TableCell
                              className="w-20 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div
                                className="relative inline-block text-left"
                                ref={openActionMenuId === c.id ? actionMenuRef : undefined}
                              >
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenActionMenuId(openActionMenuId === c.id ? null : c.id);
                                  }}
                                  title="Course actions"
                                  aria-label={`Actions for ${c.title}`}
                                  className="h-8 w-8 rounded-full p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                >
                                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </Button>

                                {openActionMenuId === c.id && (
                                  <div className="animate-in fade-in zoom-in-95 absolute top-9 right-0 z-30 w-44 rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-xl">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      disabled={!c.isActive}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenActionMenuId(null);
                                        setAssignModalCourse(c);
                                      }}
                                      title={
                                        c.isActive
                                          ? 'Assign to batch or mentees'
                                          : 'Only active courses can be assigned'
                                      }
                                      className="flex w-full items-center justify-start gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      <svg
                                        className="h-3.5 w-3.5 text-[#0044D3]"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                        />
                                      </svg>
                                      <Span>Assign</Span>
                                    </Button>

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenActionMenuId(null);
                                        void cloneCourse(c.id);
                                      }}
                                      className="flex w-full items-center justify-start gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                                    >
                                      <svg
                                        className="h-3.5 w-3.5 text-slate-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                      </svg>
                                      <Span>Clone</Span>
                                    </Button>

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenActionMenuId(null);
                                        router.push(`/${portal}/courses/${c.id}/builder`);
                                      }}
                                      className="flex w-full items-center justify-start gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                                    >
                                      <svg
                                        className="h-3.5 w-3.5 text-slate-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                        />
                                      </svg>
                                      <Span>Edit</Span>
                                    </Button>

                                    <div className="my-1 border-t border-slate-100" />

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenActionMenuId(null);
                                        void onRequestDelete(c);
                                      }}
                                      className="flex w-full items-center justify-start gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                                    >
                                      <svg
                                        className="h-3.5 w-3.5 text-red-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                      <Span>Delete</Span>
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Attached Pagination Controls */}
                  {pagination.total > 0 && (
                    <PaginationControls
                      page={page}
                      limit={limit}
                      total={pagination.total}
                      totalPages={pagination.totalPages}
                      onPageChange={setPage}
                      onLimitChange={(newLimit) => {
                        setLimit(newLimit);
                        setPage(1);
                      }}
                      itemLabel="courses"
                      pageSizeOptions={[10, 20, 50, 100]}
                    />
                  )}
                </TableContainer>
              )}
            </>
          )}
        </div>
      </DashboardContent>

      {/* Create Course Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Course"
        description="Initialize a curriculum standard. You will be redirected to the Course Builder to add topics and assignments."
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-course-form"
              size="sm"
              disabled={isSubmittingCreate}
              isLoading={isSubmittingCreate}
            >
              Create & Open Builder
            </Button>
          </>
        }
      >
        {createError && (
          <FieldError
            error={createError}
            className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
          />
        )}

        <form
          id="create-course-form"
          noValidate
          onSubmit={(e) => {
            void handleCreateCourse(e);
          }}
          className="space-y-4"
        >
          <div>
            <Label
              required={true}
              className="block text-xs font-bold tracking-wide text-slate-700 uppercase"
            >
              Course Title
            </Label>
            <Input
              type="text"
              value={newTitle}
              hasError={Boolean(createError)}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (createError) setCreateError(null);
              }}
              placeholder="e.g. Git & GitHub Mastery"
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <Label className="block text-xs font-bold tracking-wide text-slate-700 uppercase">
              Description
            </Label>
            <textarea
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Core objectives and competency goals..."
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <Label className="block text-xs font-bold tracking-wide text-slate-700 uppercase">
              Estimated Duration
            </Label>
            <div className="mt-1.5 grid grid-cols-2 gap-3">
              <div>
                <Label className="block text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                  Hours
                </Label>
                <div className="relative mt-1">
                  <Input
                    type="number"
                    min={0}
                    value={durationHours}
                    onChange={(e) => handleHoursChange(e.target.value)}
                    placeholder="0"
                    className="h-9 w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-xs text-slate-900 shadow-xs focus:border-blue-600 focus:outline-hidden"
                  />
                  <Span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-400">
                    hrs
                  </Span>
                </div>
              </div>
              <div>
                <Label className="block text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                  Minutes
                </Label>
                <div className="relative mt-1">
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={durationMinutes}
                    onChange={(e) => handleMinutesChange(e.target.value)}
                    placeholder="0"
                    className="h-9 w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-xs text-slate-900 shadow-xs focus:border-blue-600 focus:outline-hidden"
                  />
                  <Span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-400">
                    mins
                  </Span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
            <Span className="text-xs font-bold text-slate-800">Initial Active State</Span>
            <Button
              type="button"
              variant="ghost"
              role="switch"
              aria-checked={newIsActive}
              aria-label="Course active status"
              onClick={() => setNewIsActive(!newIsActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent p-0 transition-colors duration-200 ease-in-out hover:opacity-90 focus:outline-hidden ${
                newIsActive
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-slate-300 hover:bg-slate-400'
              }`}
            >
              <Span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  newIsActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </Button>
          </div>
        </form>
      </Modal>

      {/* Impact & Action Notice Modal */}
      {activeActionCourse && modalActionType && (
        <ImpactNoticeModal
          isOpen={true}
          isLoading={isActionSubmitting || impactStatus === 'loading'}
          loadingLabel={
            impactStatus === 'loading'
              ? 'Verifying live impact...'
              : modalActionType === 'DELETE'
                ? 'Deleting...'
                : activeActionCourse.isActive
                  ? 'Deactivating...'
                  : 'Activating...'
          }
          impact={courseImpact}
          actionTitle={
            modalActionType === 'DELETE'
              ? `Delete Course "${activeActionCourse.title}"?`
              : activeActionCourse.isActive
                ? `Deactivate Course "${activeActionCourse.title}"?`
                : `Activate Course "${activeActionCourse.title}"?`
          }
          actionMessage={
            modalActionType === 'DELETE'
              ? 'Are you sure you want to delete this course? Courses with active mentee allocations cannot be deleted.'
              : activeActionCourse.isActive
                ? 'Deactivating this course prevents new allocations. Existing mentee enrollments continue normally.'
                : 'Activating this course makes it available for immediate mentee assignment across batches.'
          }
          isDestructive={modalActionType === 'DELETE' || activeActionCourse.isActive}
          isBlocked={
            impactStatus === 'error' ||
            (modalActionType === 'DELETE' && (courseImpact?.openAllocationsCount ?? 0) > 0)
          }
          blockedMessage={
            impactStatus === 'error'
              ? 'Could not verify live impact — please retry.'
              : 'This course has active mentee allocations. It cannot be deleted. Please deactivate the course instead.'
          }
          confirmLabel={
            modalActionType === 'DELETE'
              ? 'Confirm Deletion'
              : activeActionCourse.isActive
                ? 'Confirm Deactivation'
                : 'Confirm Activation'
          }
          onConfirm={() => {
            void handleConfirmAction();
          }}
          onCancel={() => {
            setActiveActionCourse(null);
            setModalActionType(null);
            setCourseImpact(null);
            setImpactStatus('idle');
          }}
        />
      )}

      {/* Assign Course Modal */}
      <AssignCourseModal
        isOpen={Boolean(assignModalCourse)}
        onClose={() => setAssignModalCourse(null)}
        initialCourseId={assignModalCourse?.id}
        userRole={portal === 'admin' ? 'SUPER_ADMIN' : 'MENTOR'}
      />
    </div>
  );
}

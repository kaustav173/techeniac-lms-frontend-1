'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import { AssignCourseModal } from '@/components/app/allocations/AssignCourseModal';
import { ImpactNoticeModal } from '@/components/app/courses/ImpactNoticeModal';
import { formatDurationMinutes } from '@/components/app/courses/types';
import {
  ADMIN_COURSES_NAV,
  MENTOR_COURSES_NAV,
} from '@/components/app/navigation/portal-nav.config';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { Modal } from '@/components/patterns/Modal';
import { PaginationControls } from '@/components/patterns/PaginationControls';
import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
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
import { H3, P, PageTitle, Span, SubText } from '@/components/ui/Typography';
import { useAuth } from '@/hooks/useAuth';
import { useCourses } from '@/hooks/useCourses';
import { useDurationInput } from '@/hooks/useDurationInput';
import { formatErrorMessage } from '@/lib/errors';
import type { Course, CourseImpact } from '@/types/courses';

interface CourseLibraryViewProps {
  portal: 'admin' | 'mentor';
}

export function CourseLibraryView({ portal }: Readonly<CourseLibraryViewProps>) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const courseQuery = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch.trim() || undefined,
      isActive: activeFilter === 'all' ? ('all' as const) : activeFilter === 'active',
    }),
    [page, limit, debouncedSearch, activeFilter],
  );

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

  const { total: totalAllCourses, error: totalCoursesError } = useCourses({ limit: 1 });
  const { total: totalActiveTracks, error: activeTracksError } = useCourses({
    isActive: true,
    limit: 1,
  });
  const { total: totalDraftTracks, error: draftTracksError } = useCourses({
    isActive: false,
    limit: 1,
  });

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

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.replace('/login');
      } else if (user.role !== 'SUPER_ADMIN' && user.role !== 'MENTOR') {
        router.replace('/mentee');
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

  const totalCountDisplay = totalCoursesError ? '—' : totalAllCourses;
  const activeCountDisplay = activeTracksError ? '—' : totalActiveTracks;
  const draftCountDisplay = draftTracksError ? '—' : totalDraftTracks;

  const navConfig = portal === 'mentor' ? MENTOR_COURSES_NAV : ADMIN_COURSES_NAV;
  const breadcrumbRoot = portal === 'mentor' ? 'Mentor' : 'Admin';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header {...navConfig} />

      <DashboardContent>
        {/* Top Breadcrumb & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Link href={`/${portal}`} className="transition-colors hover:text-slate-900">
                {breadcrumbRoot}
              </Link>
              <Span className="text-slate-300">/</Span>
              <Span className="font-semibold text-slate-900">Curriculum & Course Library</Span>
            </div>
            <PageTitle className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Course Library
            </PageTitle>
            <SubText className="mt-1.5 max-w-2xl">
              Manage enterprise learning tracks, syllabus outlines, and live assignments.
            </SubText>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex h-auto items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-slate-800 hover:shadow-sm focus-visible:ring-slate-800 active:bg-slate-950"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <Span>Create New Course</Span>
            </Button>
          </div>
        </div>

        {/* Telemetry Stat Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
            <div>
              <Span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Total Courses
              </Span>
              <div className="mt-1.5 text-3xl font-extrabold tracking-tight text-slate-900">
                {totalCountDisplay}
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
            <div>
              <Span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Active Tracks
              </Span>
              <div className="mt-1.5 text-3xl font-extrabold tracking-tight text-emerald-600">
                {activeCountDisplay}
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <svg
                className="h-5 w-5"
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
            </div>
          </div>
          <div className="flex items-center justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
            <div>
              <Span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Draft / Inactive
              </Span>
              <div className="mt-1.5 text-3xl font-extrabold tracking-tight text-slate-700">
                {draftCountDisplay}
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses by title or topic..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-3.5 pl-10 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Segmented Filter */}
            <div className="inline-flex rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 text-sm">
              {(['all', 'active', 'inactive'] as const).map((st) => (
                <Button
                  key={st}
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setActiveFilter(st);
                    setPage(1);
                  }}
                  className={`h-auto rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                    activeFilter === st
                      ? 'bg-white text-slate-900 shadow-xs hover:bg-white active:bg-white'
                      : 'border-transparent bg-transparent text-slate-600 shadow-none hover:bg-slate-200/60 hover:text-slate-900 active:bg-slate-200'
                  }`}
                >
                  {st === 'all' ? 'All' : st === 'active' ? 'Active' : 'Inactive'}
                </Button>
              ))}
            </div>
            {isFetchingCourses && !loadingCourses && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
                <Span>Updating...</Span>
              </div>
            )}
          </div>
        </div>

        {/* Courses Grid */}
        <div className="mt-6">
          {loadingCourses ? (
            <TableContainer className="w-full">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[36%]">Course</TableHead>
                    <TableHead>Content Stats</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <TableRow key={`course-skel-${idx}`} className="h-16">
                      <TableCell>
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-48 rounded-md" />
                          <Skeleton className="h-3 w-72 rounded-md" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28 rounded-md" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20 rounded-md" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-8 w-24 rounded-xl" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[36%]">Course</TableHead>
                        <TableHead>Content Stats</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
                          <TableRow key={c.id} className="hover:bg-slate-50/70">
                            <TableCell>
                              <div className="flex flex-col">
                                <Link
                                  href={`/${portal}/courses/${c.id}/builder`}
                                  className="text-sm font-bold text-slate-900 transition-colors hover:text-[#0044D3]"
                                >
                                  {c.title}
                                </Link>
                                <Span className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                                  {c.description || 'No description provided.'}
                                </Span>
                              </div>
                            </TableCell>

                            <TableCell className="text-xs text-slate-600">
                              <div className="flex items-center gap-2">
                                <Span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                                  {topicCount} topics
                                </Span>
                                <Span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                                  {assignmentCount} tasks
                                </Span>
                              </div>
                            </TableCell>

                            <TableCell className="text-xs font-medium text-slate-600">
                              {formatDurationMinutes(c.estimatedMinutes)}
                            </TableCell>

                            <TableCell>
                              <Span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  c.isActive
                                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border border-slate-200 bg-slate-100 text-slate-600'
                                }`}
                              >
                                <Span
                                  className={`h-1.5 w-1.5 rounded-full ${c.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
                                />
                                {c.isActive ? 'Active' : 'Inactive'}
                              </Span>
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/${portal}/courses/${c.id}/builder`)}
                                  title="Open course builder"
                                  className="h-8 text-xs font-semibold"
                                >
                                  Builder →
                                </Button>

                                <Button
                                  type="button"
                                  variant="primary"
                                  size="sm"
                                  disabled={!c.isActive}
                                  onClick={() => setAssignModalCourse(c)}
                                  title={
                                    c.isActive
                                      ? 'Assign to batch or mentees'
                                      : 'Only active courses can be assigned'
                                  }
                                  className="h-8 text-xs font-semibold"
                                >
                                  Assign
                                </Button>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => void cloneCourse(c.id)}
                                  title="Clone course"
                                  className="h-8 text-xs font-medium"
                                >
                                  Clone
                                </Button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => void onRequestToggleStatus(c)}
                                  title={c.isActive ? 'Deactivate course' : 'Activate course'}
                                  className="h-8 text-xs text-slate-600 hover:text-slate-900"
                                >
                                  {c.isActive ? 'Deactivate' : 'Activate'}
                                </Button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => void onRequestDelete(c)}
                                  title="Delete course"
                                  aria-label="Delete course"
                                  className="h-8 w-8 rounded-lg p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                                >
                                  <svg
                                    className="h-3.5 w-3.5"
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
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Pagination Controls */}
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
                  className="mt-8 rounded-2xl border border-slate-200/80 shadow-xs"
                />
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

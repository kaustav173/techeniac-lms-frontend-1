'use client';

import Link from 'next/link';
import React, { useState } from 'react';

import { formatDurationMinutes } from '@/components/app/courses/types';
import { Button } from '@/components/ui/Button';
import { H3, P, Span } from '@/components/ui/Typography';
import { usePrefetchCourse } from '@/hooks/useCourses';
import { useHoverPrefetch } from '@/hooks/useHoverPrefetch';
import type { Course } from '@/types/courses';

interface CourseCardProps {
  course: Course;
  basePath?: string;
  onCloneCourse: (course: Course) => Promise<void>;
  onRequestDelete: (course: Course) => void;
  onRequestToggleStatus: (course: Course) => void;
  onAssignCourse?: (course: Course) => void;
}

export function CourseCard({
  course,
  basePath = '/admin/courses',
  onCloneCourse,
  onRequestDelete,
  onRequestToggleStatus,
  onAssignCourse,
}: Readonly<CourseCardProps>) {
  const prefetchCourse = usePrefetchCourse();
  const { getHoverHandlers } = useHoverPrefetch();
  const [isCloning, setIsCloning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClone = async () => {
    setIsCloning(true);
    setErrorMsg(null);
    try {
      await onCloneCourse(course);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to clone course';
      setErrorMsg(msg);
    } finally {
      setIsCloning(false);
    }
  };

  const topicCount = course.topicCount ?? course.topics?.length ?? 0;
  const assignmentCount =
    course.assignmentCount ??
    (course.courseAssignments?.length ?? course.assignments?.length ?? 0) +
      (course.topics?.reduce((acc, t) => acc + (t.assignments?.length ?? 0), 0) ?? 0);

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md">
      <div>
        {/* Top Header: Badges & Duration */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${
                course.isActive
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border border-slate-200 bg-slate-100 text-slate-600'
              }`}
            >
              <Span
                className={`h-2 w-2 rounded-full ${course.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
              />
              {course.isActive ? 'Active' : 'Inactive'}
            </Span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
            <svg
              className="h-3.5 w-3.5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <Span>{formatDurationMinutes(course.estimatedMinutes)}</Span>
          </div>
        </div>

        {/* Course Title & Description */}
        <H3 className="mt-3.5 line-clamp-1 text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600">
          {course.title}
        </H3>
        <P className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-slate-600">
          {course.description || 'No description provided.'}
        </P>

        {/* Outline Stats Box: Topics, Tasks */}
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
          <div className="grid grid-cols-2 divide-x divide-slate-200/80 text-center">
            <div className="px-2">
              <Span className="block text-base font-bold text-slate-900">{topicCount}</Span>
              <Span className="mt-0.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Topics
              </Span>
            </div>
            <div className="px-2">
              <Span className="block text-base font-bold text-slate-900">{assignmentCount}</Span>
              <Span className="mt-0.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Tasks
              </Span>
            </div>
          </div>
        </div>

        {/* Course Recency / Updated info */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <svg
            className="h-4 w-4 shrink-0 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <Span className="truncate">
            Updated {new Date(course.updatedAt).toLocaleDateString()}
          </Span>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-700">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          <Link
            href={`${basePath}/${course.id}/builder`}
            {...getHoverHandlers(() => prefetchCourse(course.id))}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-slate-800"
          >
            <Span>Builder</Span>
            <Span aria-hidden="true">&rarr;</Span>
          </Link>

          {/* Assign Button (M7 Course Allocation) */}
          <Button
            type="button"
            variant={course.isActive ? 'primary' : 'outline'}
            disabled={!course.isActive || !onAssignCourse}
            onClick={() => onAssignCourse?.(course)}
            title={
              course.isActive
                ? 'Assign this course to a batch or mentees'
                : 'Only active courses can be allocated (Section 2.1, Section 7)'
            }
            className={
              course.isActive
                ? 'h-auto rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700'
                : 'h-auto cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs font-medium text-slate-400'
            }
          >
            Assign
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Clone Button (FR-6.7, CRS-21) */}
          <Button
            type="button"
            variant="outline"
            disabled={isCloning}
            isLoading={isCloning}
            onClick={() => {
              void handleClone();
            }}
            title="Clone Course (Creates Inactive Copy)"
            className="h-auto rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-400 active:bg-slate-100 disabled:opacity-50"
          >
            Clone
          </Button>

          {/* Toggle Active/Inactive (FR-6.11) */}
          <Button
            type="button"
            variant="outline"
            onClick={() => onRequestToggleStatus(course)}
            title={course.isActive ? 'Deactivate course' : 'Activate course'}
            className="h-auto rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-400 active:bg-slate-100"
          >
            {course.isActive ? 'Deactivate' : 'Activate'}
          </Button>

          {/* Soft Delete (FR-6.7, CRS-20) */}
          <Button
            type="button"
            variant="outline"
            onClick={() => onRequestDelete(course)}
            title="Delete course"
            className="h-auto rounded-lg border border-rose-200/80 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:border-rose-300 hover:bg-rose-50 focus-visible:ring-rose-400 active:bg-rose-100"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import React, { useId, useMemo, useState } from 'react';

import { AllocationStatusBadge } from '@/components/app/allocations/AllocationStatusBadge';
import { MENTEE_COURSES_NAV } from '@/components/app/navigation/portal-nav.config';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { MarkdownViewer } from '@/components/ui/MarkdownViewer';
import { Skeleton } from '@/components/ui/Skeleton';
import { H1, H2, H3, H4, Muted, P, Span } from '@/components/ui/Typography';
import { useCourseDetail } from '@/hooks/useCourses';
import {
  type TopicProgressItem,
  type TopicProgressStatus,
  useAllocationProgress,
  useUpdateTopicStatusMutation,
} from '@/hooks/useProgress';
import { formatDateIST } from '@/lib/date';
import { type Assignment, AssignmentScope, type Subtopic, type Topic } from '@/types/courses';

/* -------------------------------------------------------------------------- */
/* Sub-component: Capstone Assignment Card                                    */
/* -------------------------------------------------------------------------- */

interface CapstoneAssignmentCardProps {
  readonly assignment: Assignment;
}

export function CapstoneAssignmentCard({ assignment }: CapstoneAssignmentCardProps) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-[#E1E6EC] bg-[#F6F8FC] p-3.5">
      <div className="flex items-start justify-between gap-2">
        <H4 className="text-xs font-bold text-[#111827]">{assignment.title}</H4>
        <Span className="rounded-full bg-[#E1E6EC] px-2 py-0.5 text-xs font-semibold text-[#111827]">
          {assignment.maxMarks} Marks
        </Span>
      </div>
      <Muted className="text-xs text-[#667085]">
        Pass: {assignment.passMarks} • Est: {assignment.estimatedMinutes}m
      </Muted>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-component: Course Outline Sidebar                                      */
/* -------------------------------------------------------------------------- */

interface CourseOutlineSidebarProps {
  readonly activeTopics: Topic[];
  readonly currentTopic: Topic | null | undefined;
  readonly currentSubtopic: Subtopic | null | undefined;
  readonly progressMap: Map<string, TopicProgressItem>;
  readonly courseAssignments: Assignment[];
  readonly onSelectTopic: (topicId: string) => void;
  readonly onSelectSubtopic: (subtopicId: string) => void;
}

export function CourseOutlineSidebar({
  activeTopics,
  currentTopic,
  currentSubtopic,
  progressMap,
  courseAssignments,
  onSelectTopic,
  onSelectSubtopic,
}: CourseOutlineSidebarProps) {
  return (
    <aside className="flex flex-col gap-6 lg:col-span-4">
      <div className="sticky top-24 rounded-3xl border border-[#E1E6EC] bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E1E6EC] pb-3">
          <div>
            <H2 className="text-base font-bold text-[#111827]">Course Outline</H2>
            <Muted className="mt-0.5 text-xs text-[#667085]">
              {activeTopics.length} Topics • {courseAssignments.length} Capstone
            </Muted>
          </div>
        </div>

        {/* Topics Tree */}
        <nav aria-label="Course Syllabus" className="mt-4 flex flex-col gap-3">
          {activeTopics.map((topic, index) => {
            const p = progressMap.get(topic.id);
            const isCurrent = currentTopic?.id === topic.id;
            const isCompleted = p?.status === 'COMPLETED';
            const isInProgress = p?.status === 'IN_PROGRESS';
            const isOverdue = Boolean(p?.isOverdue);
            const subtopics = (topic.subtopics ?? []).filter((s) => s.isActive);

            return (
              <div
                key={topic.id}
                className={`rounded-2xl border transition-all ${
                  isCurrent
                    ? 'border-[#0044D3]/40 bg-blue-50/40 shadow-xs'
                    : 'border-[#E1E6EC] bg-white hover:bg-[#F6F8FC]'
                }`}
              >
                {/* Topic Trigger */}
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  aria-pressed={isCurrent}
                  onClick={() => onSelectTopic(topic.id)}
                  className="flex h-auto w-full items-center justify-between p-3 text-left font-normal"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <div
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-700'
                          : isInProgress
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <Span
                      className={`truncate text-xs font-semibold ${
                        isCurrent ? 'text-blue-900' : 'text-slate-800'
                      }`}
                    >
                      {topic.title}
                    </Span>
                  </div>

                  <div className="ml-2 flex flex-shrink-0 items-center gap-1.5">
                    {isOverdue && (
                      <Span className="rounded bg-rose-100 px-1.5 py-0.5 text-xs font-bold text-rose-700">
                        OVERDUE
                      </Span>
                    )}
                    <Span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isCompleted
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          : isInProgress
                            ? 'border border-blue-200 bg-blue-50 text-blue-700'
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isCompleted ? 'Done' : isInProgress ? 'Active' : 'Unstarted'}
                    </Span>
                  </div>
                </Button>

                {/* Subtopics List under Selected Topic */}
                {isCurrent && subtopics.length > 0 && (
                  <div className="flex flex-col gap-1 border-t border-blue-100/60 p-2.5 pt-2">
                    {subtopics.map((sub, sIdx) => {
                      const isSubActive = currentSubtopic?.id === sub.id;
                      return (
                        <Button
                          key={sub.id}
                          variant="ghost"
                          size="sm"
                          type="button"
                          aria-pressed={isSubActive}
                          onClick={() => onSelectSubtopic(sub.id)}
                          className={`flex h-auto w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-normal transition-colors ${
                            isSubActive
                              ? 'bg-white font-semibold text-blue-600 shadow-xs'
                              : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                          }`}
                        >
                          <Span className="truncate pr-2">
                            {index + 1}.{sIdx + 1} {sub.title}
                          </Span>
                          {sub.estimatedMinutes != null && (
                            <Span className="text-xs text-slate-400">{sub.estimatedMinutes}m</Span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Course-Level Capstone Assignments Section (FR-8.2) */}
        {courseAssignments.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-4">
            <div className="mb-3 flex items-center gap-1.5">
              <Span className="text-sm">🎯</Span>
              <H4 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                Course Capstone & Milestones
              </H4>
            </div>
            <div className="flex flex-col gap-2">
              {courseAssignments.map((assign) => (
                <CapstoneAssignmentCard key={assign.id} assignment={assign} />
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-component: Progress Control Strip                                      */
/* -------------------------------------------------------------------------- */

interface ProgressControlStripProps {
  readonly isReadOnly: boolean;
  readonly currentTopicStatus: TopicProgressStatus;
  readonly studyNote: string;
  readonly onStudyNoteChange: (val: string) => void;
  readonly onStatusChange: (newStatus: TopicProgressStatus) => void;
  readonly isPending: boolean;
  readonly isError: boolean;
  readonly errorMessage?: string | null | undefined;
  readonly actionSuccessMessage?: string | null | undefined;
  readonly studyNoteInputId: string;
}

export function ProgressControlStrip({
  isReadOnly,
  currentTopicStatus,
  studyNote,
  onStudyNoteChange,
  onStatusChange,
  isPending,
  isError,
  errorMessage,
  actionSuccessMessage,
  studyNoteInputId,
}: ProgressControlStripProps) {
  return (
    <>
      {/* Feedback Alert Messages */}
      {actionSuccessMessage && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-800">
          <Span>✓ {actionSuccessMessage}</Span>
        </div>
      )}

      {isError && errorMessage && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800">
          <Span>✕ {errorMessage}</Span>
        </div>
      )}

      {/* Interactive Mentee Progress Control Strip (Stitch Screen 5701db0470ab457abdb95e73661bc5dc) */}
      <div className="-mx-6 mt-10 -mb-6 rounded-b-3xl border-t border-[#E1E6EC] bg-[#F6F8FC] p-6 sm:-mx-10 sm:-mb-10 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Span className="font-bold text-[#0044D3]">📝</Span>
            <H4 className="text-xs font-bold text-[#111827]">
              Mentee Progress Status Controls (FR-8.3)
            </H4>
          </div>

          {/* Segmented Status Selector */}
          <div
            role="radiogroup"
            aria-label="Topic Progress Status"
            className="flex items-center rounded-full border border-[#E1E6EC] bg-white p-1 shadow-xs"
          >
            {(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const).map((st) => {
              const isSelected = currentTopicStatus === st;
              return (
                <Button
                  key={st}
                  type="button"
                  variant={isSelected ? 'primary' : 'ghost'}
                  size="sm"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={isReadOnly || isPending}
                  onClick={() => onStatusChange(st)}
                  className={`h-auto rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#0044D3] text-white shadow-xs'
                      : 'text-[#667085] hover:text-[#111827] disabled:opacity-40'
                  }`}
                >
                  {st === 'NOT_STARTED'
                    ? 'Not Started'
                    : st === 'IN_PROGRESS'
                      ? 'In Progress'
                      : 'Completed'}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Optional Study Note Input & Quick Action Button */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Label htmlFor={studyNoteInputId} className="sr-only">
              Optional study note or question for mentor
            </Label>
            <Input
              id={studyNoteInputId}
              type="text"
              disabled={isReadOnly || isPending}
              value={studyNote}
              onChange={(e) => onStudyNoteChange(e.target.value)}
              placeholder="Add an optional study log note or questions for your mentor..."
              className="h-12 rounded-full border-[#E1E6EC] bg-white px-4 text-xs shadow-xs focus-visible:ring-2 focus-visible:ring-[#0044D3]"
            />
          </div>

          <Button
            type="button"
            disabled={isReadOnly || currentTopicStatus === 'COMPLETED' || isPending}
            onClick={() => onStatusChange('COMPLETED')}
            className="h-12 flex-shrink-0 rounded-full px-6 text-xs font-semibold"
          >
            {isPending
              ? 'Saving Progress...'
              : currentTopicStatus === 'COMPLETED'
                ? '✓ Topic Completed'
                : 'Mark as Completed →'}
          </Button>
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-component: Topic Reading Pane                                          */
/* -------------------------------------------------------------------------- */

interface TopicReadingPaneProps {
  readonly currentTopic: Topic | null | undefined;
  readonly currentSubtopic: Subtopic | null | undefined;
  readonly currentTopicProgress?: TopicProgressItem | null | undefined;
  readonly topicAssignments: Assignment[];
  readonly controlStrip: React.ReactNode;
}

export function TopicReadingPane({
  currentTopic,
  currentSubtopic,
  currentTopicProgress,
  topicAssignments,
  controlStrip,
}: TopicReadingPaneProps) {
  return (
    <section className="flex flex-col gap-8 lg:col-span-8">
      <article className="overflow-hidden rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs sm:p-10">
        {/* Module Header Badge */}
        <div className="border-b border-[#E1E6EC] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold tracking-wider text-[#0044D3] uppercase">
                Topic Progress • Module Active
              </Span>
              {currentTopicProgress?.deadline && (
                <Span
                  className={`text-xs font-semibold ${
                    currentTopicProgress.isOverdue ? 'text-rose-600' : 'text-[#667085]'
                  }`}
                >
                  Target Deadline: {formatDateIST(currentTopicProgress.deadline)}
                </Span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Span className="text-xs text-[#667085]">
                ⏱{' '}
                {currentTopic?.estimatedMinutes != null
                  ? `${currentTopic.estimatedMinutes} mins`
                  : 'Flexible'}
              </Span>
            </div>
          </div>

          <H2 className="mt-4 text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">
            {currentSubtopic ? currentSubtopic.title : (currentTopic?.title ?? 'Lesson Content')}
          </H2>
          <P className="mt-2 text-sm text-[#667085]">
            {currentTopic?.description ??
              'Study the curriculum reading below and mark your progress when completed.'}
          </P>
        </div>

        {/* Subtopic Reading Prose */}
        <div className="mt-6 flex flex-col gap-6 text-sm leading-relaxed text-slate-700 sm:text-base">
          {currentSubtopic?.content ? (
            <MarkdownViewer
              content={currentSubtopic.content}
              className="max-w-none leading-7 text-slate-700"
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-[#E1E6EC] bg-[#F6F8FC] p-8 text-center">
              <P className="text-sm text-[#667085]">
                Review the curriculum syllabus guidelines, reference documentation, and complete
                associated labs below to satisfy milestone clearance.
              </P>
            </div>
          )}

          {/* Subtopic Resources if present */}
          {currentSubtopic?.resources && currentSubtopic.resources.length > 0 && (
            <div className="mt-4 rounded-2xl border border-[#E1E6EC] bg-[#F6F8FC] p-4">
              <H4 className="mb-2 text-xs font-bold tracking-wider text-[#111827] uppercase">
                Reference Resources & External Documentation
              </H4>
              <ul className="flex flex-col gap-2">
                {currentSubtopic.resources.map((res) => (
                  <li key={res.url} className="flex items-center gap-2 text-xs">
                    <Span className="text-[#0044D3]">🔗</Span>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#0044D3] hover:underline"
                    >
                      {res.title || res.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Injected Control Strip */}
        {controlStrip}
      </article>

      {/* Topic Assignments Section (FR-8.2) */}
      {topicAssignments.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <H3 className="text-lg font-bold tracking-tight text-[#111827]">
                Topic Assignments & Practical Labs
              </H3>
              <P className="text-xs text-[#667085]">
                Action items and tasks associated with this module milestone.
              </P>
            </div>
            <Span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#0044D3]">
              {topicAssignments.length} Assignment{topicAssignments.length === 1 ? '' : 's'}
            </Span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {topicAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex flex-col justify-between gap-4 rounded-3xl border border-[#E1E6EC] bg-white p-5 shadow-xs transition-all hover:border-[#0044D3]/40 hover:shadow-md"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#0044D3]">
                      Topic Task
                    </Span>
                    <Span className="text-xs font-bold text-[#111827]">
                      {assignment.maxMarks} Marks
                    </Span>
                  </div>
                  <H4 className="text-sm font-bold text-[#111827]">{assignment.title}</H4>
                  <P className="line-clamp-2 text-xs text-[#667085]">
                    {assignment.instructions ||
                      'Review instructions and prepare submission repository.'}
                  </P>
                </div>

                <div className="flex items-center justify-between border-t border-[#E1E6EC] pt-3 text-xs text-[#667085]">
                  <Span>⏱ {assignment.estimatedMinutes}m est.</Span>
                  <Span className="font-semibold text-[#0044D3]">Pass: {assignment.passMarks}</Span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Shell: MenteeCourseView                                               */
/* -------------------------------------------------------------------------- */

interface MenteeCourseViewProps {
  readonly allocationId: string;
}

export function MenteeCourseView({ allocationId }: MenteeCourseViewProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string | null>(null);
  const [studyNote, setStudyNote] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const studyNoteInputId = useId();

  // 1. Fetch Allocation Progress Telemetry (M8 Backend API)
  const {
    data: progressData,
    isLoading: isProgressLoading,
    isError: isProgressError,
    error: progressError,
    refetch: refetchProgress,
  } = useAllocationProgress(allocationId);

  const courseId = progressData?.allocation.courseId;

  // 2. Fetch Course Outline Hierarchy (Topics, Subtopics, Assignments)
  const {
    data: courseData,
    isLoading: isCourseLoading,
    isError: isCourseError,
    error: courseError,
    refetch: refetchCourse,
  } = useCourseDetail(courseId ?? '');

  // Mutation for updating topic progress status
  const updateStatusMutation = useUpdateTopicStatusMutation();

  // Filter only active topics and map with progress
  const activeTopics = useMemo(() => {
    const rawTopics = courseData?.topics ?? [];
    return rawTopics.filter((t) => t.isActive);
  }, [courseData]);

  // Topic progress lookup map
  const progressMap = useMemo(() => {
    const map = new Map<string, TopicProgressItem>();
    if (progressData?.topics) {
      for (const item of progressData.topics) {
        map.set(item.topicId, item);
      }
    }
    return map;
  }, [progressData]);

  // Determine active topic
  const currentTopic = useMemo(() => {
    if (!activeTopics.length) return null;
    if (selectedTopicId) {
      const found = activeTopics.find((t) => t.id === selectedTopicId);
      if (found) return found;
    }
    // Default to first in-progress or first uncompleted topic
    const inProgress = activeTopics.find((t) => progressMap.get(t.id)?.status === 'IN_PROGRESS');
    if (inProgress) return inProgress;
    const notStarted = activeTopics.find((t) => progressMap.get(t.id)?.status === 'NOT_STARTED');
    if (notStarted) return notStarted;
    return activeTopics[0];
  }, [activeTopics, selectedTopicId, progressMap]);

  // Active subtopic within current topic
  const currentSubtopic = useMemo(() => {
    const subtopics = (currentTopic?.subtopics ?? []).filter((s) => s.isActive);
    if (!subtopics.length) return null;
    if (selectedSubtopicId) {
      const found = subtopics.find((s) => s.id === selectedSubtopicId);
      if (found) return found;
    }
    return subtopics[0];
  }, [currentTopic, selectedSubtopicId]);

  // Course-level assignments (Capstone/Defense)
  const courseAssignments = useMemo(() => {
    return (courseData?.assignments ?? []).filter((a) => a.scope === AssignmentScope.COURSE);
  }, [courseData]);

  // Topic-level assignments for the selected topic
  const topicAssignments = useMemo(() => {
    if (!currentTopic) return [];
    return (currentTopic.assignments ?? []).filter((a) => a.scope === AssignmentScope.TOPIC);
  }, [currentTopic]);

  const allocation = progressData?.allocation;
  const isReadOnly = Boolean(allocation?.readOnly);

  // Status transition handler
  const handleStatusChange = async (newStatus: TopicProgressStatus) => {
    if (!currentTopic || isReadOnly) return;
    try {
      setActionSuccessMessage(null);
      await updateStatusMutation.mutateAsync({
        allocationId,
        topicId: currentTopic.id,
        payload: {
          status: newStatus,
          note: studyNote.trim() ? studyNote.trim() : undefined,
        },
      });
      setActionSuccessMessage(
        `Topic status successfully updated to ${newStatus.replace('_', ' ')}.`,
      );
      setStudyNote('');
    } catch {
      // Error handled by mutation state
    }
  };

  const currentTopicProgress = currentTopic ? progressMap.get(currentTopic.id) : null;
  const currentTopicStatus: TopicProgressStatus = currentTopicProgress?.status ?? 'NOT_STARTED';

  // Completed topics count
  const completedCount = useMemo(() => {
    return activeTopics.filter((t) => progressMap.get(t.id)?.status === 'COMPLETED').length;
  }, [activeTopics, progressMap]);

  if (isProgressLoading || isCourseLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F6F8FC] antialiased">
        <Header {...MENTEE_COURSES_NAV} />
        <DashboardContent className="space-y-6">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Skeleton className="h-[480px] w-full rounded-3xl" />
            </div>
            <div className="lg:col-span-8">
              <Skeleton className="h-[600px] w-full rounded-3xl" />
            </div>
          </div>
        </DashboardContent>
      </div>
    );
  }

  if (isProgressError || isCourseError || !allocation) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F6F8FC] antialiased">
        <Header {...MENTEE_COURSES_NAV} />
        <DashboardContent className="space-y-6">
          <div className="rounded-3xl border border-rose-200 bg-white p-8 shadow-xs">
            <ErrorMessage
              error={progressError || courseError || new Error('Failed to load course workspace')}
              onRetry={() => {
                void refetchProgress();
                void refetchCourse();
              }}
            />
            <div className="mt-6 flex justify-start">
              <Link href="/mentee/courses">
                <Button variant="outline" size="sm">
                  ← Back to My Courses
                </Button>
              </Link>
            </div>
          </div>
        </DashboardContent>
      </div>
    );
  }

  const formattedDueDate = allocation.dueDate ? formatDateIST(allocation.dueDate) : 'No deadline';

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F8FC] text-[#111827] antialiased">
      <Header {...MENTEE_COURSES_NAV} />

      <DashboardContent className="space-y-6">
        {/* Read-Only State Awareness Banner (Stitch Screen 5701db0470ab457abdb95e73661bc5dc) */}
        {isReadOnly && (
          <div className="flex items-start gap-3.5 rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-xs">
            <Span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-sm font-bold text-amber-700">
              ⏸
            </Span>
            <div className="flex flex-col gap-0.5">
              <Span className="text-xs font-bold tracking-wider text-amber-900 uppercase">
                Review Mode • Read-Only
              </Span>
              <P className="text-xs leading-relaxed text-amber-800">
                This curriculum allocation is currently in read-only review state. Syllabus modules
                and notes remain fully readable, while automated progress advancement is locked
                (FR-8.8).
              </P>
            </div>
          </div>
        )}

        {/* Back Link & Breadcrumb Header */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <Link
            href="/mentee/courses"
            className="group inline-flex items-center gap-2 text-xs font-semibold text-[#0044D3] transition-colors hover:text-[#0036AB]"
          >
            <Span className="transition-transform group-hover:-translate-x-1">←</Span>
            <Span>Back to My Courses</Span>
          </Link>

          <div className="flex items-center gap-2">
            <AllocationStatusBadge
              status={allocation.status}
              isOverdue={Boolean(allocation.isOverdue)}
            />
          </div>
        </div>

        {/* Course Header Telemetry Card */}
        <section className="rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-3xl">
              <div className="mb-2 flex items-center gap-2">
                <Span className="text-xs font-bold tracking-wider text-[#0044D3] uppercase">
                  Curriculum Track
                </Span>
                <Span className="text-slate-300">•</Span>
                <Span className="text-xs text-[#667085] uppercase">
                  {activeTopics.length} Active Modules
                </Span>
              </div>

              <H1 className="text-2xl font-extrabold tracking-tight text-[#111827] sm:text-3xl">
                {allocation.courseTitle}
              </H1>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#667085]">
                <div className="flex items-center gap-1.5">
                  <Span className="text-[#667085]">📅</Span>
                  <Span>Due {formattedDueDate}</Span>
                </div>
                <Span className="text-slate-300">•</Span>
                <div className="flex items-center gap-1.5">
                  <Span className="text-[#667085]">⏱</Span>
                  <Span>
                    {courseData?.estimatedMinutes != null
                      ? `${Math.floor(courseData.estimatedMinutes / 60)}h ${courseData.estimatedMinutes % 60}m duration`
                      : 'Self-paced'}
                  </Span>
                </div>
                <Span className="text-slate-300">•</Span>
                <div className="flex items-center gap-1.5">
                  <Span className="text-[#667085]">👤</Span>
                  <Span>
                    Curriculum Track •{' '}
                    <Span className="font-semibold text-[#111827]">Standard</Span>
                  </Span>
                </div>
              </div>
            </div>

            {/* Progress Metric Ring Box */}
            <div className="flex min-w-[260px] items-center gap-5 rounded-2xl border border-[#E1E6EC] bg-[#F6F8FC] p-5 shadow-xs">
              <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center">
                <svg className="h-16 w-16 -rotate-90 transform" viewBox="0 0 64 64">
                  <circle
                    className="text-slate-200"
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="5"
                    fill="none"
                  />
                  <circle
                    className={`transition-all duration-1000 ease-out ${
                      allocation.status === 'COMPLETED'
                        ? 'text-emerald-500'
                        : allocation.isOverdue
                          ? 'text-rose-500'
                          : 'text-[#0044D3]'
                    }`}
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeDasharray="175.9"
                    strokeDashoffset={
                      175.9 - (175.9 * Math.min(100, allocation.progressPercent)) / 100
                    }
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Span className="text-sm font-bold text-[#111827]">
                    {Math.round(allocation.progressPercent)}%
                  </Span>
                </div>
              </div>

              <div className="flex flex-col">
                <Span className="text-xs font-bold tracking-wider text-[#667085] uppercase">
                  Curriculum Pace
                </Span>
                <Span className="text-sm font-bold text-[#111827]">
                  {completedCount} of {activeTopics.length} Topics
                </Span>
                <Span
                  className={`mt-0.5 text-xs font-semibold ${
                    allocation.status === 'COMPLETED'
                      ? 'text-emerald-600'
                      : allocation.isOverdue
                        ? 'text-rose-600'
                        : 'text-[#0044D3]'
                  }`}
                >
                  {allocation.status === 'COMPLETED'
                    ? '✓ Fully Certified'
                    : allocation.isOverdue
                      ? '⚠️ Overdue'
                      : 'On Track'}
                </Span>
              </div>
            </div>
          </div>
        </section>

        {/* 2-Column Workspace Grid */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left Column: CourseOutlineSidebar */}
          <CourseOutlineSidebar
            activeTopics={activeTopics}
            currentTopic={currentTopic}
            currentSubtopic={currentSubtopic}
            progressMap={progressMap}
            courseAssignments={courseAssignments}
            onSelectTopic={(topicId) => {
              setSelectedTopicId(topicId);
              setSelectedSubtopicId(null);
              setStudyNote('');
              setActionSuccessMessage(null);
            }}
            onSelectSubtopic={(subtopicId) => {
              setSelectedSubtopicId(subtopicId);
              setStudyNote('');
              setActionSuccessMessage(null);
            }}
          />

          {/* Right Column: TopicReadingPane & ProgressControlStrip */}
          <TopicReadingPane
            currentTopic={currentTopic}
            currentSubtopic={currentSubtopic}
            currentTopicProgress={currentTopicProgress}
            topicAssignments={topicAssignments}
            controlStrip={
              <ProgressControlStrip
                isReadOnly={isReadOnly}
                currentTopicStatus={currentTopicStatus}
                studyNote={studyNote}
                onStudyNoteChange={setStudyNote}
                onStatusChange={(newStatus) => void handleStatusChange(newStatus)}
                isPending={updateStatusMutation.isPending}
                isError={updateStatusMutation.isError}
                errorMessage={updateStatusMutation.error?.message}
                actionSuccessMessage={actionSuccessMessage}
                studyNoteInputId={studyNoteInputId}
              />
            }
          />
        </div>
      </DashboardContent>
    </div>
  );
}

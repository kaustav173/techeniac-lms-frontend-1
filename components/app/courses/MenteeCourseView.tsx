'use client';

import Link from 'next/link';
import React, { useId, useMemo, useState } from 'react';

import { MENTEE_COURSES_NAV } from '@/components/app/navigation/portal-nav.config';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import {
  ArrowLeftIcon,
  BarChartIcon,
  BookIcon,
  CalendarIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
} from '@/components/ui/Icons';
import { MarkdownViewer } from '@/components/ui/MarkdownViewer';
import { Skeleton } from '@/components/ui/Skeleton';
import { H1, H2, H3, P, Span } from '@/components/ui/Typography';
import { useCourseDetail } from '@/hooks/useCourses';
import {
  type TopicProgressItem,
  type TopicProgressStatus,
  useAllocationProgress,
  useUpdateTopicStatusMutation,
} from '@/hooks/useProgress';
import { cn } from '@/lib/cn';
import { formatDateDMY } from '@/lib/date';
import { type Subtopic, type Topic } from '@/types/courses';

/* -------------------------------------------------------------------------- */
/* Decorative SVG Icons for Mentee Course Workspace                           */
/* -------------------------------------------------------------------------- */

function LaptopGraduationIcon({ className = 'h-10 w-10 text-[#0044D3]' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 48 48" stroke="currentColor">
      {/* Screen Outline */}
      <rect x="8" y="10" width="32" height="22" rx="3" strokeWidth="2.5" fill="none" />
      {/* Laptop Base */}
      <path d="M4 36h40" strokeWidth="2.5" strokeLinecap="round" />
      {/* Graduation Cap inside screen */}
      <path
        d="M24 16l8 4-8 4-8-4 8-4z"
        fill="currentColor"
        fillOpacity="0.15"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M19 22.5v3.5c0 2 2.2 3.5 5 3.5s5-1.5 5-3.5v-3.5"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M30 20v5" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function OutlineTrophyIcon({ className = 'h-8 w-8 text-[#0044D3]' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 4h3a2 2 0 012 2v2a5 5 0 01-5 5h-1M8 4H5a2 2 0 00-2 2v2a5 5 0 005 5h1m8-9H8m8 0v7a4 4 0 01-8 0V4m4 11v3m-4 3h8"
      />
    </svg>
  );
}

function ConfettiCelebrationGraphic() {
  return (
    <div className="relative flex items-center justify-center p-3 select-none">
      {/* Decorative festive confetti dashes */}
      <span className="absolute -top-1 -left-1 h-2 w-0.5 rotate-45 rounded-full bg-amber-400" />
      <span className="absolute top-0 right-1 h-2 w-0.5 -rotate-45 rounded-full bg-blue-500" />
      <span className="absolute bottom-1 -left-2 h-2 w-0.5 -rotate-12 rounded-full bg-indigo-500" />
      <span className="absolute right-0 -bottom-1 h-2 w-0.5 rotate-35 rounded-full bg-purple-500" />
      <span className="absolute -top-2 left-6 h-2 w-0.5 rotate-15 rounded-full bg-rose-400" />
      <span className="absolute bottom-0 left-1 h-1.5 w-1.5 rounded-full bg-yellow-400" />
      <span className="absolute top-2 -right-2 h-1.5 w-1.5 rounded-full bg-teal-400" />

      {/* Main green celebration check badge */}
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400 text-white shadow-sm ring-4 ring-emerald-100/70">
        <CheckIcon className="h-6 w-6 stroke-[3]" />
      </div>
    </div>
  );
}

function CircularProgressRing({
  percentage,
  size = 84,
  strokeWidth = 6,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (circumference * clamped) / 100;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg className="-rotate-90 transform" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#0044D3"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className="absolute text-base font-bold text-slate-900">{Math.round(clamped)}%</span>
      </div>
      <span className="mt-1 text-xs font-medium text-slate-500">Completed</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main MenteeCourseView Component                                            */
/* -------------------------------------------------------------------------- */

interface MenteeCourseViewProps {
  readonly allocationId: string;
}

export function MenteeCourseView({ allocationId }: MenteeCourseViewProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'progress'>('content');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(null);
  const [studyNote, setStudyNote] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const studyNoteInputId = useId();

  // 1. Fetch Allocation Progress
  const {
    data: progressData,
    isLoading: isProgressLoading,
    isError: isProgressError,
    error: progressError,
    refetch: refetchProgress,
  } = useAllocationProgress(allocationId);

  const courseId = progressData?.allocation.courseId;

  // 2. Fetch Course Hierarchy
  const {
    data: courseData,
    isLoading: isCourseLoading,
    isError: isCourseError,
    error: courseError,
    refetch: refetchCourse,
  } = useCourseDetail(courseId ?? '');

  const updateStatusMutation = useUpdateTopicStatusMutation();

  // Active topics
  const activeTopics = useMemo(() => {
    return (courseData?.topics ?? []).filter((t) => t.isActive);
  }, [courseData]);

  // Topic progress map
  const progressMap = useMemo(() => {
    const map = new Map<string, TopicProgressItem>();
    if (progressData?.topics) {
      for (const item of progressData.topics) {
        map.set(item.topicId, item);
      }
    }
    return map;
  }, [progressData]);

  // Initialize module accordions to open by default
  const isModuleExpanded = (topicId: string) => {
    return expandedModules[topicId] !== false;
  };

  const toggleModuleAccordion = (topicId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [topicId]: !isModuleExpanded(topicId),
    }));
  };

  const allocation = progressData?.allocation;
  const isReadOnly = Boolean(allocation?.readOnly);

  // Status transition handler
  const handleStatusChange = async (topicId: string, newStatus: TopicProgressStatus) => {
    if (isReadOnly) return;
    try {
      setActionSuccessMessage(null);
      await updateStatusMutation.mutateAsync({
        allocationId,
        topicId,
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

  const completedCount = useMemo(() => {
    return activeTopics.filter((t) => progressMap.get(t.id)?.status === 'COMPLETED').length;
  }, [activeTopics, progressMap]);

  if (isProgressLoading || isCourseLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F6F8FC] antialiased">
        <Header {...MENTEE_COURSES_NAV} />
        <DashboardContent className="space-y-6">
          <Skeleton className="h-6 w-32 rounded-lg" />
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
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
              <Link
                href="/mentee/courses"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                <span>Back to Courses</span>
              </Link>
            </div>
          </div>
        </DashboardContent>
      </div>
    );
  }

  const formattedDueDate = allocation.dueDate ? formatDateDMY(allocation.dueDate) : 'No deadline';
  const durationText =
    courseData?.estimatedMinutes != null
      ? `${Math.round(courseData.estimatedMinutes / 60)}h Duration`
      : 'Self-paced';

  const isCourseFullyCompleted =
    allocation.progressPercent >= 100 || allocation.status === 'COMPLETED';

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F8FC] text-[#111827] antialiased">
      <Header {...MENTEE_COURSES_NAV} />

      <DashboardContent className="space-y-6">
        {/* Back Link */}
        <div>
          <Link
            href="/mentee/courses"
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Courses</span>
          </Link>
        </div>

        {/* Hero Card */}
        <div className="rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            {/* Left: Icon & Meta */}
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-[#EEF4FF]">
                <LaptopGraduationIcon className="h-11 w-11 text-[#0044D3]" />
              </div>

              <div className="space-y-1">
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                  Active
                </span>
                <H1 className="text-2xl font-extrabold tracking-tight text-[#111827]">
                  {allocation.courseTitle}
                </H1>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                    <span>Due {formattedDueDate}</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <div className="flex items-center gap-1.5">
                    <ClockIcon className="h-3.5 w-3.5 text-slate-400" />
                    <span>{durationText}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: SVG Circular Gauge */}
            <div className="flex flex-shrink-0 items-center justify-end">
              <CircularProgressRing percentage={allocation.progressPercent} />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-8 border-b border-[#E1E6EC]">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={cn(
              'flex cursor-pointer items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition-all',
              activeTab === 'content'
                ? 'border-[#0044D3] text-[#0044D3]'
                : 'border-transparent text-slate-500 hover:text-slate-800',
            )}
          >
            <BookIcon className="h-4 w-4" />
            <span>Course Content</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('progress')}
            className={cn(
              'flex cursor-pointer items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition-all',
              activeTab === 'progress'
                ? 'border-[#0044D3] text-[#0044D3]'
                : 'border-transparent text-slate-500 hover:text-slate-800',
            )}
          >
            <BarChartIcon className="h-4 w-4" />
            <span>Progress</span>
          </button>
        </div>

        {/* Tab 1: Course Content */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            {/* Accordion Modules */}
            {activeTopics.map((topic, topicIndex) => {
              const p = progressMap.get(topic.id);
              const isTopicCompleted = p?.status === 'COMPLETED';
              const isOpen = isModuleExpanded(topic.id);
              const subtopics = (topic.subtopics ?? []).filter((s) => s.isActive);
              const moduleNumber = topicIndex + 1;

              return (
                <div
                  key={topic.id}
                  className="rounded-2xl border border-[#E1E6EC] bg-white shadow-xs transition-shadow hover:shadow-sm"
                >
                  {/* Module Header Bar */}
                  <button
                    type="button"
                    onClick={() => toggleModuleAccordion(topic.id)}
                    className="flex w-full cursor-pointer items-center justify-between p-5 text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#0044D3] text-xs font-bold text-white">
                        {moduleNumber}
                      </div>
                      <H3 className="text-base font-bold text-slate-900">{topic.title}</H3>
                    </div>

                    <div className="flex items-center gap-3">
                      <svg
                        className={cn(
                          'h-4 w-4 text-slate-400 transition-transform duration-200',
                          isOpen && 'rotate-180',
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Module Expanded Content */}
                  {isOpen && (
                    <div className="border-t border-slate-100 px-6 py-4">
                      <div className="relative ml-3 space-y-4 border-l-2 border-blue-100 pl-6">
                        {/* Lessons / Subtopics */}
                        {subtopics.length > 0 ? (
                          subtopics.map((subtopic) => {
                            const isLessonDone = isTopicCompleted;

                            return (
                              <div
                                key={subtopic.id}
                                className="group flex items-center justify-between gap-4 py-1"
                              >
                                <div className="flex items-center gap-3">
                                  {isLessonDone ? (
                                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                                      <CheckIcon className="h-3 w-3 stroke-[3]" />
                                    </div>
                                  ) : (
                                    <div className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-slate-300 bg-white" />
                                  )}
                                  <span className="text-sm font-medium text-slate-800">
                                    {subtopic.title}
                                  </span>
                                </div>

                                <div>
                                  {isLessonDone ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedTopic(topic);
                                        setSelectedSubtopic(subtopic);
                                      }}
                                      className="cursor-pointer text-xs font-semibold text-slate-400 transition-colors hover:text-[#0044D3]"
                                    >
                                      Review
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedTopic(topic);
                                        setSelectedSubtopic(subtopic);
                                      }}
                                      className="flex cursor-pointer items-center gap-1 rounded-full bg-[#0044D3] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700"
                                    >
                                      <span>
                                        {p?.status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
                                      </span>
                                      <ChevronRightIcon className="h-3 w-3 stroke-[3]" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          /* Topic has no subtopics: topic itself is the lesson */
                          <div className="flex items-center justify-between gap-4 py-1">
                            <div className="flex items-center gap-3">
                              {isTopicCompleted ? (
                                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                                  <CheckIcon className="h-3 w-3 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-slate-300 bg-white" />
                              )}
                              <span className="text-sm font-medium text-slate-800">
                                {topic.title}
                              </span>
                            </div>

                            <div>
                              {isTopicCompleted ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTopic(topic);
                                    setSelectedSubtopic(null);
                                  }}
                                  className="cursor-pointer text-xs font-semibold text-slate-400 transition-colors hover:text-[#0044D3]"
                                >
                                  Review
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTopic(topic);
                                    setSelectedSubtopic(null);
                                  }}
                                  className="flex cursor-pointer items-center gap-1 rounded-full bg-[#0044D3] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700"
                                >
                                  <span>{p?.status === 'IN_PROGRESS' ? 'Continue' : 'Start'}</span>
                                  <ChevronRightIcon className="h-3 w-3 stroke-[3]" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Course Completed Celebration Card */}
            {isCourseFullyCompleted && (
              <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-[#EEF4FF] p-5 shadow-xs">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white text-[#0044D3] shadow-xs">
                    <OutlineTrophyIcon className="h-6 w-6 text-[#0044D3]" />
                  </div>
                  <div>
                    <H3 className="text-base font-bold text-slate-900">Course Completed!</H3>
                    <P className="text-xs text-slate-600">
                      Great job! You have finished this course.
                    </P>
                  </div>
                </div>

                <ConfettiCelebrationGraphic />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Progress Tab */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs">
                <Span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Modules Progress
                </Span>
                <P className="mt-2 text-2xl font-black text-slate-900">
                  {completedCount} / {activeTopics.length}
                </P>
                <Span className="mt-1 block text-xs text-slate-500">Topics completed</Span>
              </div>

              <div className="rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs">
                <Span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Completion Rate
                </Span>
                <P className="mt-2 text-2xl font-black text-[#0044D3]">
                  {Math.round(allocation.progressPercent)}%
                </P>
                <Span className="mt-1 block text-xs text-slate-500">Overall syllabus</Span>
              </div>

              <div className="rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs">
                <Span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Course Timeline
                </Span>
                <P className="mt-2 text-2xl font-black text-emerald-600">
                  {allocation.isOverdue ? 'Overdue' : 'On Track'}
                </P>
                <Span className="mt-1 block text-xs text-slate-500">Due {formattedDueDate}</Span>
              </div>
            </div>

            {/* Topics Telemetry Table */}
            <div className="rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs">
              <H3 className="text-base font-bold text-slate-900">Topic Completion Checklist</H3>
              <div className="mt-4 divide-y divide-slate-100">
                {activeTopics.map((topic, index) => {
                  const p = progressMap.get(topic.id);
                  const isDone = p?.status === 'COMPLETED';
                  const isInProg = p?.status === 'IN_PROGRESS';

                  return (
                    <div key={topic.id} className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                            isDone
                              ? 'bg-emerald-500 text-white'
                              : isInProg
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 text-slate-700',
                          )}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <P className="text-sm font-semibold text-slate-900">{topic.title}</P>
                          {p?.completedAt && (
                            <Span className="text-[11px] text-slate-500">
                              Completed {formatDateDMY(p.completedAt)}
                            </Span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            isDone
                              ? 'bg-emerald-50 text-emerald-700'
                              : isInProg
                                ? 'bg-blue-50 text-[#0044D3]'
                                : 'bg-slate-100 text-slate-600',
                          )}
                        >
                          {isDone ? 'Completed' : isInProg ? 'In Progress' : 'Not Started'}
                        </span>

                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTopic(topic);
                              setSelectedSubtopic(null);
                            }}
                            className="cursor-pointer text-xs font-semibold text-[#0044D3] hover:underline"
                          >
                            Update
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Lesson Reading & Completion Modal Drawer */}
        {selectedTopic && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl border border-[#E1E6EC] bg-white shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <Span className="text-xs font-bold tracking-wider text-[#0044D3] uppercase">
                    {selectedSubtopic ? 'Lesson' : 'Topic'}
                  </Span>
                  <H2 className="text-lg font-bold text-slate-900">
                    {selectedSubtopic?.title ?? selectedTopic.title}
                  </H2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTopic(null);
                    setSelectedSubtopic(null);
                    setActionSuccessMessage(null);
                  }}
                  className="cursor-pointer rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close lesson"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {actionSuccessMessage && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                    {actionSuccessMessage}
                  </div>
                )}

                {/* Content */}
                <div className="prose prose-sm max-w-none text-slate-700">
                  <MarkdownViewer
                    content={
                      selectedSubtopic?.content ??
                      selectedTopic.description ??
                      'No content available for this lesson yet.'
                    }
                  />
                </div>

                {/* Study Notes & Status Control */}
                {!isReadOnly && (
                  <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <label
                      htmlFor={studyNoteInputId}
                      className="block text-xs font-bold text-slate-700 uppercase"
                    >
                      Study Notes (Optional)
                    </label>
                    <textarea
                      id={studyNoteInputId}
                      value={studyNote}
                      onChange={(e) => setStudyNote(e.target.value)}
                      rows={2}
                      placeholder="Add key takeaways, notes or questions..."
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 shadow-2xs focus:border-[#0044D3] focus:ring-1 focus:ring-[#0044D3] focus:outline-none"
                    />

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={updateStatusMutation.isPending}
                        onClick={() => void handleStatusChange(selectedTopic.id, 'IN_PROGRESS')}
                        className="cursor-pointer rounded-full"
                      >
                        Mark In Progress
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={updateStatusMutation.isPending}
                        onClick={() => void handleStatusChange(selectedTopic.id, 'COMPLETED')}
                        className="cursor-pointer rounded-full bg-[#0044D3] hover:bg-blue-700"
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                        <span>Mark Completed</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end border-t border-slate-100 p-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTopic(null);
                    setSelectedSubtopic(null);
                    setActionSuccessMessage(null);
                  }}
                  className="cursor-pointer rounded-full"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </DashboardContent>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';

import { AssignmentEditor } from '@/components/app/courses/AssignmentEditor';
import { ConflictResolutionModal } from '@/components/app/courses/ConflictResolutionModal';
import { CourseDetailsEditor } from '@/components/app/courses/CourseDetailsEditor';
import {
  CourseOutlineTree,
  type OutlineReorderPayload,
} from '@/components/app/courses/CourseOutlineTree';
import { ImpactNoticeModal } from '@/components/app/courses/ImpactNoticeModal';
import { SubtopicEditor } from '@/components/app/courses/SubtopicEditor';
import { TopicEditor } from '@/components/app/courses/TopicEditor';
import { ActiveNodeSelection, sanitizeDurationMinutes } from '@/components/app/courses/types';
import { UnsavedChangesModal } from '@/components/app/courses/UnsavedChangesModal';
import {
  ADMIN_COURSES_NAV,
  MENTOR_COURSES_NAV,
} from '@/components/app/navigation/portal-nav.config';
import { Header } from '@/components/layout/Header';
import { Modal } from '@/components/patterns/Modal';
import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Skeleton } from '@/components/ui/Skeleton';
import { Span } from '@/components/ui/Typography';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/hooks/useAuth';
import { useCourseBuilder } from '@/hooks/useCourses';
import { getRolePortalPath } from '@/hooks/useRoleRedirect';
import { useToast } from '@/hooks/useToast';
import { formatErrorMessage } from '@/lib/errors';
import {
  Assignment,
  AssignmentScope,
  Course,
  CourseImpact,
  CreateAssignmentInput,
  SubmissionMode,
  Subtopic,
  Topic,
  UpdateAssignmentInput,
  UpdateCourseInput,
  UpdateSubtopicInput,
  UpdateTopicInput,
} from '@/types/courses';

interface CourseBuilderViewProps {
  portal: 'admin' | 'mentor';
  courseId?: string | undefined;
}

function findSubtopicAndParent(topics: Topic[] = [], id: string) {
  for (const t of topics) {
    const match = t.subtopics?.find((s) => s.id === id);
    if (match) return { subtopic: match, parentTopic: t };
  }
  return { subtopic: undefined, parentTopic: undefined };
}

function findAssignment(course: Course, id: string): Assignment | undefined {
  const directMatch = (course.courseAssignments || course.assignments)?.find((a) => a.id === id);
  if (directMatch) return directMatch;
  for (const t of course.topics || []) {
    const match = t.assignments?.find((a) => a.id === id);
    if (match) return match;
  }
  return undefined;
}

interface CourseActiveEditorProps {
  course: Course;
  selectedNode: ActiveNodeSelection;
  impact?: CourseImpact | null;
  updateCourse: (payload: UpdateCourseInput) => Promise<Course>;
  updateTopic: (id: string, payload: UpdateTopicInput) => Promise<Topic>;
  updateSubtopic: (id: string, payload: UpdateSubtopicInput) => Promise<Subtopic>;
  updateAssignment: (id: string, payload: UpdateAssignmentInput) => Promise<Assignment>;
  onConflict: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

function CourseActiveEditor({
  course,
  selectedNode,
  impact,
  updateCourse,
  updateTopic,
  updateSubtopic,
  updateAssignment,
  onConflict,
  onDirtyChange,
}: Readonly<CourseActiveEditorProps>) {
  if (selectedNode.type === 'COURSE') {
    const topicsTotalMinutes =
      course.topics?.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0) || 0;

    return (
      <CourseDetailsEditor
        key={`${course.id}-${course.updatedAt}`}
        course={course}
        impact={impact}
        topicsTotalMinutes={topicsTotalMinutes}
        onSaveCourse={updateCourse}
        onConflict={onConflict}
        onDirtyChange={onDirtyChange}
      />
    );
  }

  if (selectedNode.type === 'TOPIC') {
    const topic = course.topics?.find((t) => t.id === selectedNode.id);
    if (!topic) return null;

    const otherTopicsMinutes =
      course.topics
        ?.filter((t) => t.id !== topic.id)
        .reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0) || 0;

    return (
      <TopicEditor
        key={`${topic.id}-${topic.updatedAt}`}
        topic={topic}
        impact={impact}
        courseEstimatedMinutes={course.estimatedMinutes}
        otherTopicsMinutes={otherTopicsMinutes}
        onSaveTopic={(payload) => updateTopic(topic.id, payload)}
        onConflict={onConflict}
        onDirtyChange={onDirtyChange}
      />
    );
  }

  if (selectedNode.type === 'SUBTOPIC') {
    const { subtopic, parentTopic } = findSubtopicAndParent(course.topics, selectedNode.id);
    if (!subtopic) return null;

    const otherSubtopicsMinutes =
      parentTopic?.subtopics
        ?.filter((s) => s.id !== subtopic.id)
        .reduce((acc, s) => acc + (s.estimatedMinutes || 0), 0) || 0;

    return (
      <SubtopicEditor
        key={`${subtopic.id}-${subtopic.updatedAt}`}
        subtopic={subtopic}
        impact={impact}
        courseEstimatedMinutes={course.estimatedMinutes}
        parentTopicTitle={parentTopic?.title}
        parentTopicEstimatedMinutes={parentTopic?.estimatedMinutes}
        otherSubtopicsMinutes={otherSubtopicsMinutes}
        onSaveSubtopic={(payload) => updateSubtopic(subtopic.id, payload)}
        onConflict={onConflict}
        onDirtyChange={onDirtyChange}
      />
    );
  }

  if (selectedNode.type === 'ASSIGNMENT') {
    const assignment = findAssignment(course, selectedNode.id);
    if (!assignment) return null;

    return (
      <AssignmentEditor
        key={`${assignment.id}-${assignment.updatedAt}`}
        assignment={assignment}
        onSaveAssignment={(payload) => updateAssignment(assignment.id, payload)}
        onConflict={onConflict}
        onDirtyChange={onDirtyChange}
      />
    );
  }

  return null;
}

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
}

function AddTopicModal({ isOpen, onClose, onCreate }: Readonly<AddTopicModalProps>) {
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Topic title cannot be empty.');
      return;
    }
    if (trimmed.length > 150) {
      setError('Topic title cannot exceed 150 characters.');
      return;
    }

    setError(null);
    setIsCreating(true);
    try {
      await onCreate(trimmed);
      setTitle('');
      onClose();
    } catch (err: unknown) {
      setError(formatErrorMessage(err, 'Failed to create topic'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setError(null);
      }}
      title="Add New Topic"
      size="sm"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={isCreating}
            onClick={() => {
              onClose();
              setError(null);
            }}
            size="sm"
            className="rounded-full border-slate-300 px-4 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-topic-form"
            disabled={isCreating}
            isLoading={isCreating}
            size="sm"
            className="rounded-full bg-[#0044D3] px-5 text-white hover:bg-[#0039B3]"
          >
            Create Topic
          </Button>
        </>
      }
    >
      {error && (
        <FieldError
          error={error}
          className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
        />
      )}

      <form
        id="add-topic-form"
        noValidate
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="space-y-4"
      >
        <div>
          <Label required={true} className="block text-xs font-bold text-slate-700 uppercase">
            Topic Title
          </Label>
          <Input
            type="text"
            value={title}
            hasError={Boolean(error)}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. Distributed Consensus"
            className="mt-1 h-8 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
          />
        </div>
      </form>
    </Modal>
  );
}

interface AddSubtopicModalProps {
  isOpen: boolean;
  topicId: string | null;
  onClose: () => void;
  onCreate: (topicId: string, title: string) => Promise<void>;
}

function AddSubtopicModal({ isOpen, topicId, onClose, onCreate }: Readonly<AddSubtopicModalProps>) {
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !topicId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Subtopic title cannot be empty.');
      return;
    }
    if (trimmed.length > 150) {
      setError('Subtopic title cannot exceed 150 characters.');
      return;
    }

    setError(null);
    setIsCreating(true);
    try {
      await onCreate(topicId, trimmed);
      setTitle('');
      onClose();
    } catch (err: unknown) {
      setError(formatErrorMessage(err, 'Failed to create subtopic'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setError(null);
      }}
      title="Add New Subtopic Lesson"
      size="sm"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={isCreating}
            onClick={() => {
              onClose();
              setError(null);
            }}
            size="sm"
            className="rounded-full border-slate-300 px-4 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-subtopic-form"
            disabled={isCreating}
            isLoading={isCreating}
            size="sm"
            className="rounded-full bg-[#0044D3] px-5 text-white hover:bg-[#0039B3]"
          >
            Create Subtopic
          </Button>
        </>
      }
    >
      {error && (
        <FieldError
          error={error}
          className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
        />
      )}

      <form
        id="add-subtopic-form"
        noValidate
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="space-y-4"
      >
        <div>
          <Label required={true} className="block text-xs font-bold text-slate-700 uppercase">
            Subtopic Title
          </Label>
          <Input
            type="text"
            value={title}
            hasError={Boolean(error)}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. Raft Leader Election Protocol"
            className="mt-1 h-8 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
          />
        </div>
      </form>
    </Modal>
  );
}

function validateAssignmentInput({
  title,
  calculatedMinutes,
  minutes,
  maxMarks,
  passMarks,
}: {
  title: string;
  calculatedMinutes: number;
  minutes: string;
  maxMarks: number;
  passMarks: number;
}): string | null {
  if (!title) return 'Assignment title cannot be empty.';
  if (title.length > 150) return 'Assignment title cannot exceed 150 characters.';
  if (calculatedMinutes <= 0) return 'Estimated duration must be greater than 0 minutes.';
  if (minutes !== '') {
    const parsedMins = Number.parseInt(minutes, 10);
    if (Number.isNaN(parsedMins) || parsedMins < 0 || parsedMins > 59) {
      return 'Minutes must be between 0 and 59.';
    }
  }
  if (!maxMarks || maxMarks <= 0) return 'Max marks must be greater than 0.';
  if (maxMarks > 1000) return 'Max marks cannot exceed 1000.';
  if (!passMarks || passMarks <= 0) return 'Pass marks must be greater than 0.';
  if (passMarks > maxMarks) return 'Pass marks cannot be greater than max marks.';
  return null;
}

interface AddAssignmentModalProps {
  isOpen: boolean;
  scope: AssignmentScope;
  topicId: string | null;
  onClose: () => void;
  onCreate: (payload: CreateAssignmentInput) => Promise<void>;
}

function AddAssignmentModal({
  isOpen,
  scope,
  topicId,
  onClose,
  onCreate,
}: Readonly<AddAssignmentModalProps>) {
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState('1');
  const [minutes, setMinutes] = useState('0');
  const [maxMarks, setMaxMarks] = useState(100);
  const [passMarks, setPassMarks] = useState(50);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const calculatedMinutes =
      (Number.parseInt(hours, 10) || 0) * 60 + (Number.parseInt(minutes, 10) || 0);

    const validationError = validateAssignmentInput({
      title: trimmedTitle,
      calculatedMinutes,
      minutes,
      maxMarks,
      passMarks,
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsCreating(true);
    try {
      await onCreate({
        scope,
        topicId: scope === AssignmentScope.TOPIC ? topicId : null,
        title: trimmedTitle,
        estimatedMinutes: calculatedMinutes,
        maxMarks,
        passMarks,
        pdfMode: SubmissionMode.REQUIRED,
        zipMode: SubmissionMode.OFF,
        urlMode: SubmissionMode.OFF,
      });
      setTitle('');
      setHours('1');
      setMinutes('0');
      onClose();
    } catch (err: unknown) {
      setError(formatErrorMessage(err, 'Failed to create assignment'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setError(null);
      }}
      title={`Add ${scope} Assignment`}
      size="sm"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={isCreating}
            onClick={() => {
              onClose();
              setError(null);
            }}
            size="sm"
            className="rounded-full border-slate-300 px-4 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-assignment-form"
            disabled={isCreating}
            isLoading={isCreating}
            size="sm"
            className="rounded-full bg-purple-600 px-5 text-white hover:bg-purple-700 focus-visible:ring-purple-500"
          >
            Create Assignment
          </Button>
        </>
      }
    >
      {error && (
        <FieldError
          error={error}
          className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
        />
      )}

      <form
        id="add-assignment-form"
        noValidate
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="space-y-4"
      >
        <div>
          <Label required={true} className="block text-xs font-bold text-slate-700 uppercase">
            Assignment Title
          </Label>
          <Input
            type="text"
            value={title}
            hasError={Boolean(error)}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. Implement Raft Log Compaction"
            className="mt-1 h-8 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label required={true} className="block text-xs font-bold text-slate-700 uppercase">
              Est. Hours
            </Label>
            <div className="relative mt-1">
              <Input
                type="number"
                min={0}
                value={hours}
                onChange={(e) => {
                  setHours(e.target.value);
                  if (error) setError(null);
                }}
                className="h-8 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 pr-8 text-xs focus:border-blue-600 focus:outline-hidden"
              />
              <Span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs font-medium text-slate-400">
                hrs
              </Span>
            </div>
          </div>
          <div>
            <Label className="block text-xs font-bold text-slate-700 uppercase">Est. Minutes</Label>
            <div className="relative mt-1">
              <Input
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={(e) => {
                  setMinutes(sanitizeDurationMinutes(e.target.value));
                  if (error) setError(null);
                }}
                className="h-8 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 pr-8 text-xs focus:border-blue-600 focus:outline-hidden"
              />
              <Span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs font-medium text-slate-400">
                mins
              </Span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label required={true} className="block text-xs font-bold text-slate-700 uppercase">
              Max Marks
            </Label>
            <Input
              type="number"
              min={1}
              max={1000}
              value={maxMarks || ''}
              onChange={(e) => {
                setMaxMarks(Number(e.target.value));
                if (error) setError(null);
              }}
              className="mt-1 h-8 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-blue-600 focus:outline-hidden"
            />
          </div>
          <div>
            <Label required={true} className="block text-xs font-bold text-slate-700 uppercase">
              Pass Marks
            </Label>
            <Input
              type="number"
              min={1}
              value={passMarks || ''}
              onChange={(e) => {
                setPassMarks(Number(e.target.value));
                if (error) setError(null);
              }}
              className="mt-1 h-8 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-blue-600 focus:outline-hidden"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

export function CourseBuilderBodySkeleton({ contentMarginClass }: { contentMarginClass: string }) {
  return (
    <div
      className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${contentMarginClass}`}
    >
      {/* Top Command Bar Skeleton */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 shadow-xs">
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
            <Skeleton className="h-3.5 w-24 rounded-md" />
          </div>
          <div className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden="true" />
          <Skeleton className="h-5 w-52 rounded-md" />
        </div>
      </div>

      {/* Dual Pane Layout Skeleton */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: Outline Tree Skeleton (Matching lg:w-[420px] xl:w-[460px]) */}
        <div className="hidden flex-col overflow-hidden border-r border-slate-200 bg-slate-50/60 p-3.5 lg:flex lg:w-[420px] lg:flex-none xl:w-[460px]">
          {/* Header */}
          <div className="flex items-center justify-between rounded-xl border-b border-slate-200 bg-white px-4 py-3 shadow-xs">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          {/* Topics Section Header */}
          <div className="mt-3.5 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-12 rounded-md" />
              <Skeleton className="h-4 w-5 rounded-full" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>

          {/* Topic Cards (6 rows matching actual data) */}
          <div className="mt-2 space-y-2">
            {[180, 210, 195, 170, 150, 185].map((pixelWidth, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-3 rounded-md" />
                  <Skeleton className="h-3.5 w-3.5 rounded-md" />
                  <Skeleton className="h-4 rounded-md" style={{ width: `${pixelWidth}px` }} />
                </div>
                <Skeleton className="h-4 w-4 rounded-md" />
              </div>
            ))}
          </div>

          {/* Course Assignments Section Header */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-200/80 px-1 pt-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-36 rounded-md" />
              <Skeleton className="h-4 w-5 rounded-full" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>

          {/* Course Assignment Card */}
          <div className="mt-2 flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50/50 px-3 py-2.5 shadow-xs">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-3 rounded-md" />
              <Skeleton className="h-4 w-48 rounded-md" />
            </div>
            <Skeleton className="h-3.5 w-3.5 rounded-md" />
          </div>
        </div>

        {/* Right Pane: Form Field Editor Skeleton */}
        <div className="min-w-0 flex-1 [scrollbar-gutter:stable] overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-4xl space-y-6">
            {/* Top Banner Card */}
            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="mt-2 h-7 w-72 rounded-md sm:h-8" />
              </div>
              <Skeleton className="h-10 w-32 rounded-full" />
            </div>

            {/* Card 1: Title & Instructions */}
            <div className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-28 rounded-md" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-52 rounded-md" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            </div>

            {/* Card 2: Grading & Duration Calibration */}
            <div className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
              <div>
                <Skeleton className="h-5 w-48 rounded-md" />
                <Skeleton className="mt-1 h-3 w-64 rounded-md" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
              </div>
              {/* Late Submissions Toggle Row */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-4">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40 rounded-md" />
                  <Skeleton className="h-3 w-60 rounded-md" />
                </div>
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CourseBuilderSkeleton({ portal = 'admin' }: { portal?: 'admin' | 'mentor' }) {
  const { contentMarginClass } = useSidebar();
  const navConfig = portal === 'mentor' ? MENTOR_COURSES_NAV : ADMIN_COURSES_NAV;

  return (
    <div
      data-portal={portal}
      className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900"
    >
      <Header {...navConfig} />
      <CourseBuilderBodySkeleton contentMarginClass={contentMarginClass} />
    </div>
  );
}

function CourseBuilderContent({
  portal,
  courseId: propCourseId,
}: Readonly<CourseBuilderViewProps>) {
  const { contentMarginClass } = useSidebar();
  const params = useParams();
  const router = useRouter();
  const rawId = params.id;
  const courseId = propCourseId ?? (Array.isArray(rawId) ? rawId[0] : rawId) ?? '';
  const { user, isAuthenticated, isLoading } = useAuth();
  const isAuthorized =
    !isLoading &&
    isAuthenticated &&
    user !== null &&
    (user.role === 'SUPER_ADMIN' || user.role === 'MENTOR');

  const {
    course,
    impact,
    reloadCourse,
    updateCourse,
    createTopic,
    updateTopic,
    deleteTopic,
    reorderTopics,
    createSubtopic,
    updateSubtopic,
    deleteSubtopic,
    reorderSubtopics,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    reorderAssignments,
  } = useCourseBuilder(courseId, { enabled: isAuthorized });
  const { toastSuccess, toastError } = useToast();

  // Active selection in outline tree
  const [selectedNode, setSelectedNode] = useState<ActiveNodeSelection>({
    type: 'COURSE',
    id: courseId,
  });
  const [pendingSelection, setPendingSelection] = useState<ActiveNodeSelection | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'outline' | 'editor'>('outline');

  // Form and outline dirty states
  const [isDirty, setIsDirty] = useState(false);
  const [isOrderDirty, setIsOrderDirty] = useState(false);
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  const hasUnsavedChanges = isDirty || isOrderDirty;

  // Intercept browser back/refresh/close when form or outline order is dirty
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Add Item Modals State
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [isAddSubtopicOpen, setIsAddSubtopicOpen] = useState(false);
  const [targetTopicId, setTargetTopicId] = useState<string | null>(null);

  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);
  const [assignmentScope, setAssignmentScope] = useState<AssignmentScope>(AssignmentScope.COURSE);
  const [assignmentTopicId, setAssignmentTopicId] = useState<string | null>(null);

  // Delete Safeguard State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'TOPIC' | 'SUBTOPIC' | 'ASSIGNMENT';
    id: string;
    title: string;
  } | null>(null);
  const [isDeletingNode, setIsDeletingNode] = useState(false);

  // Reorder loading state - array of active reordering IDs for non-blocking concurrent reorders
  const [reorderingIds, setReorderingIds] = useState<string[]>([]);
  const [isReorderingTopics, setIsReorderingTopics] = useState(false);
  const [reorderingSubtopicTopicIds, setReorderingSubtopicTopicIds] = useState<string[]>([]);
  const [reorderingTopicAssignmentTopicIds, setReorderingTopicAssignmentTopicIds] = useState<
    string[]
  >([]);
  const [isReorderingCourseAssignments, setIsReorderingCourseAssignments] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'MENTOR') {
      router.replace(getRolePortalPath('MENTEE'));
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Node Selection with Unsaved Changes Guard (FR-6.14, CRS-22)
  const handleSelectNode = (selection: ActiveNodeSelection) => {
    if (selection.type === selectedNode.type && selection.id === selectedNode.id) {
      setMobileTab('editor');
      return;
    }
    if (isDirty) {
      setPendingSelection(selection);
      setIsUnsavedModalOpen(true);
      return;
    }
    setSelectedNode(selection);
    setMobileTab('editor');
  };

  const handleNavigateLibrary = (e: React.MouseEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      setPendingNavigation(`/${portal}/courses`);
      setIsUnsavedModalOpen(true);
    }
  };

  const confirmDiscardChanges = () => {
    setIsDirty(false);
    setIsOrderDirty(false);
    setIsUnsavedModalOpen(false);
    if (pendingNavigation) {
      const target = pendingNavigation;
      setPendingNavigation(null);
      router.push(target);
      return;
    }
    if (pendingSelection) {
      setSelectedNode(pendingSelection);
      setPendingSelection(null);
      setMobileTab('editor');
    }
  };

  // Outline reorder persistence handler
  const handleOutlineSaveOrder = async (payload: OutlineReorderPayload) => {
    const promises: Promise<unknown>[] = [];
    if (payload.topicItems && payload.topicItems.length > 0) {
      promises.push(reorderTopics(payload.topicItems));
    }
    if (payload.subtopicItems && payload.subtopicItems.length > 0) {
      for (const sub of payload.subtopicItems) {
        promises.push(reorderSubtopics(sub.topicId, sub.items));
      }
    }
    if (payload.topicAssignmentItems && payload.topicAssignmentItems.length > 0) {
      for (const tAssign of payload.topicAssignmentItems) {
        promises.push(reorderAssignments(tAssign.items, tAssign.topicId));
      }
    }
    if (payload.courseAssignmentItems && payload.courseAssignmentItems.length > 0) {
      promises.push(reorderAssignments(payload.courseAssignmentItems));
    }
    await Promise.all(promises);
  };

  // Reorder handlers
  const handleReorderTopics = async (targetId: string, orderedIds: string[]) => {
    setIsReorderingTopics(true);
    setReorderingIds((prev) => (prev.includes(targetId) ? prev : [...prev, targetId]));
    const items = orderedIds.map((id, index) => ({ id, displayOrder: index }));
    try {
      await reorderTopics(items);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to reorder topics', 'Reorder Failed');
    } finally {
      setIsReorderingTopics(false);
      setReorderingIds((prev) => prev.filter((id) => id !== targetId));
    }
  };

  const handleReorderSubtopics = async (
    targetId: string,
    topicId: string,
    orderedIds: string[],
  ) => {
    setReorderingSubtopicTopicIds((prev) => (prev.includes(topicId) ? prev : [...prev, topicId]));
    setReorderingIds((prev) => (prev.includes(targetId) ? prev : [...prev, targetId]));
    const items = orderedIds.map((id, index) => ({ id, displayOrder: index }));
    try {
      await reorderSubtopics(topicId, items);
    } catch (err: unknown) {
      toastError(
        err instanceof Error ? err.message : 'Failed to reorder subtopics',
        'Reorder Failed',
      );
    } finally {
      setReorderingSubtopicTopicIds((prev) => prev.filter((id) => id !== topicId));
      setReorderingIds((prev) => prev.filter((id) => id !== targetId));
    }
  };

  const handleReorderAssignments = async (
    targetId: string,
    orderedIds: string[],
    topicId?: string,
  ) => {
    if (topicId) {
      setReorderingTopicAssignmentTopicIds((prev) =>
        prev.includes(topicId) ? prev : [...prev, topicId],
      );
    } else {
      setIsReorderingCourseAssignments(true);
    }
    setReorderingIds((prev) => (prev.includes(targetId) ? prev : [...prev, targetId]));
    const items = orderedIds.map((id, index) => ({ id, displayOrder: index }));
    try {
      await reorderAssignments(items, topicId);
    } catch (err: unknown) {
      toastError(
        err instanceof Error ? err.message : 'Failed to reorder assignments',
        'Reorder Failed',
      );
    } finally {
      if (topicId) {
        setReorderingTopicAssignmentTopicIds((prev) => prev.filter((id) => id !== topicId));
      } else {
        setIsReorderingCourseAssignments(false);
      }
      setReorderingIds((prev) => prev.filter((id) => id !== targetId));
    }
  };

  // Add Item Actions
  const handleCreateTopic = async (title: string) => {
    if (!course) return;
    try {
      const created = await createTopic({
        title,
        displayOrder: (course.topics?.length ?? 0) + 1,
      });
      toastSuccess(`Topic "${created.title}" created.`, 'Topic Created');
      setSelectedNode({ type: 'TOPIC', id: created.id });
      setMobileTab('editor');
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to create topic', 'Creation Failed');
      throw err;
    }
  };

  const handleCreateSubtopic = async (topicId: string, title: string) => {
    try {
      const created = await createSubtopic(topicId, { title });
      toastSuccess(`Subtopic "${created.title}" created.`, 'Subtopic Created');
      setSelectedNode({
        type: 'SUBTOPIC',
        id: created.id,
        parentTopicId: topicId,
      });
      setMobileTab('editor');
    } catch (err: unknown) {
      toastError(
        err instanceof Error ? err.message : 'Failed to create subtopic',
        'Creation Failed',
      );
      throw err;
    }
  };

  const handleCreateAssignment = async (payload: CreateAssignmentInput) => {
    try {
      const created = await createAssignment(payload);
      toastSuccess(`Assignment "${created.title}" created.`, 'Assignment Created');
      setSelectedNode({
        type: 'ASSIGNMENT',
        id: created.id,
        parentTopicId: payload.topicId ?? undefined,
      });
      setMobileTab('editor');
    } catch (err: unknown) {
      toastError(
        err instanceof Error ? err.message : 'Failed to create assignment',
        'Creation Failed',
      );
      throw err;
    }
  };

  // Delete Action Confirmation (FR-6.10, CRS-14)
  const handleConfirmDeleteNode = async () => {
    if (!deleteTarget) return;
    setIsDeletingNode(true);
    try {
      if (deleteTarget.type === 'TOPIC') {
        await deleteTopic(deleteTarget.id);
      } else if (deleteTarget.type === 'SUBTOPIC') {
        await deleteSubtopic(deleteTarget.id);
      } else if (deleteTarget.type === 'ASSIGNMENT') {
        await deleteAssignment(deleteTarget.id);
      }
      toastSuccess(`Item "${deleteTarget.title}" deleted.`, 'Item Deleted');
      setDeleteTarget(null);
      setSelectedNode({ type: 'COURSE', id: courseId });
      setMobileTab('outline');
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to delete item', 'Delete Failed');
    } finally {
      setIsDeletingNode(false);
    }
  };

  if (!course) {
    return <CourseBuilderBodySkeleton contentMarginClass={contentMarginClass} />;
  }

  return (
    <>
      <div
        className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${contentMarginClass}`}
      >
        {/* Builder Top Command Bar */}
        <div className="flex items-center justify-between bg-white px-3 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 truncate sm:gap-3">
            <Link
              href={`/${portal}/courses`}
              onClick={handleNavigateLibrary}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900"
              title="Return to Course Library"
            >
              <svg
                className="h-3.5 w-3.5 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <Span>Back to Courses</Span>
            </Link>

            <div className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden="true" />

            {/* Shifted Course Name & Status Badge - Clickable to open Course Details */}
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleSelectNode({ type: 'COURSE', id: course.id })}
              className={`hidden h-auto min-w-0 items-center gap-2 truncate rounded-xl px-2.5 py-1 text-left transition-colors sm:flex ${
                selectedNode.type === 'COURSE' && selectedNode.id === course.id
                  ? 'bg-blue-50/90 text-blue-900 ring-1 ring-blue-500/40 hover:bg-blue-50/90'
                  : 'text-slate-800 hover:bg-slate-100/80'
              }`}
              title="Click to view & edit Course Details"
            >
              <Span className="max-w-[280px] truncate text-sm font-bold md:max-w-md lg:max-w-xl">
                {course.title}
              </Span>
            </Button>
          </div>

          {/* View Switcher on < lg screens */}
          <div className="flex items-center rounded-full bg-slate-100 p-0.5 text-xs font-medium lg:hidden">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMobileTab('outline')}
              className={`h-auto rounded-full px-3 py-1 transition-colors ${
                mobileTab === 'outline'
                  ? 'bg-white font-bold text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Outline
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMobileTab('editor')}
              className={`flex h-auto items-center gap-1 rounded-full px-3 py-1 transition-colors ${
                mobileTab === 'editor'
                  ? 'bg-white font-bold text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Span>Editor</Span>
              {isDirty && (
                <Span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Unsaved changes" />
              )}
            </Button>
          </div>
        </div>

        {/* Dual Pane Layout: 420px/460px Left Tree + Fluid Right Editor on lg+; Switched tabs on <lg */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Pane: Outline Tree */}
          <div
            className={`w-full lg:flex lg:w-[420px] lg:flex-none lg:flex-col xl:w-[460px] ${
              mobileTab === 'outline' ? 'flex flex-1 flex-col overflow-hidden' : 'hidden'
            }`}
          >
            <CourseOutlineTree
              course={course}
              selectedNode={selectedNode}
              reorderingIds={reorderingIds}
              isReorderingTopics={isReorderingTopics}
              isReorderingCourseAssignments={isReorderingCourseAssignments}
              reorderingSubtopicTopicIds={reorderingSubtopicTopicIds}
              reorderingTopicAssignmentTopicIds={reorderingTopicAssignmentTopicIds}
              onSelectNode={handleSelectNode}
              onAddTopic={() => setIsAddTopicOpen(true)}
              onAddSubtopic={(topicId) => {
                setTargetTopicId(topicId);
                setIsAddSubtopicOpen(true);
              }}
              onAddTopicAssignment={(topicId) => {
                setAssignmentScope(AssignmentScope.TOPIC);
                setAssignmentTopicId(topicId);
                setIsAddAssignmentOpen(true);
              }}
              onAddCourseAssignment={() => {
                setAssignmentScope(AssignmentScope.COURSE);
                setAssignmentTopicId(null);
                setIsAddAssignmentOpen(true);
              }}
              onReorderTopics={(targetId, orderedIds) => {
                void handleReorderTopics(targetId, orderedIds);
              }}
              onReorderSubtopics={(targetId, topicId, orderedIds) => {
                void handleReorderSubtopics(targetId, topicId, orderedIds);
              }}
              onReorderAssignments={(targetId, orderedIds, topicId) => {
                void handleReorderAssignments(targetId, orderedIds, topicId);
              }}
              onOutlineReorder={handleOutlineSaveOrder}
              onOrderDirtyChange={setIsOrderDirty}
              onRequestDeleteNode={(type, id, title) => setDeleteTarget({ type, id, title })}
            />
          </div>

          {/* Right Pane: Dynamic Editor */}
          <div
            className={`w-full min-w-0 overflow-hidden bg-white lg:flex lg:flex-1 lg:flex-col ${
              mobileTab === 'editor' ? 'flex min-w-0 flex-1 flex-col' : 'hidden'
            }`}
          >
            {/* Mobile quick-return banner (< lg) */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2 lg:hidden">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setMobileTab('outline')}
                className="inline-flex h-auto items-center gap-1 p-0 text-xs font-semibold text-blue-600 hover:bg-transparent hover:text-blue-800"
              >
                &larr; Back to Outline
              </Button>
              <Span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                {selectedNode.type}
              </Span>
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <CourseActiveEditor
                course={course}
                selectedNode={selectedNode}
                impact={impact}
                updateCourse={updateCourse}
                updateTopic={updateTopic}
                updateSubtopic={updateSubtopic}
                updateAssignment={updateAssignment}
                onConflict={() => setIsConflictModalOpen(true)}
                onDirtyChange={setIsDirty}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Guard Modal (FR-6.14, CRS-22) */}
      <UnsavedChangesModal
        isOpen={isUnsavedModalOpen}
        onStay={() => {
          setIsUnsavedModalOpen(false);
          setPendingSelection(null);
          setPendingNavigation(null);
        }}
        onDiscard={confirmDiscardChanges}
      />

      {/* Concurrency Conflict Modal (FR-6.13, CRS-19) */}
      <ConflictResolutionModal
        isOpen={isConflictModalOpen}
        onReload={() => {
          setIsConflictModalOpen(false);
          void reloadCourse();
        }}
      />

      {/* Delete Item Impact Notice Modal (FR-6.10, CRS-14) */}
      {deleteTarget && (
        <ImpactNoticeModal
          isOpen={true}
          impact={impact}
          isLoading={isDeletingNode}
          loadingLabel="Deleting..."
          actionTitle={`Delete ${deleteTarget.type.toLowerCase()} "${deleteTarget.title}"?`}
          actionMessage="This item will be soft-deleted. Existing submissions and audit logs will be permanently retained."
          isDestructive={true}
          confirmLabel="Confirm Deletion"
          onConfirm={() => {
            void handleConfirmDeleteNode();
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Add Topic Modal */}
      <AddTopicModal
        isOpen={isAddTopicOpen}
        onClose={() => setIsAddTopicOpen(false)}
        onCreate={handleCreateTopic}
      />

      {/* Add Subtopic Modal */}
      <AddSubtopicModal
        isOpen={isAddSubtopicOpen}
        topicId={targetTopicId}
        onClose={() => {
          setIsAddSubtopicOpen(false);
          setTargetTopicId(null);
        }}
        onCreate={handleCreateSubtopic}
      />

      {/* Add Assignment Modal */}
      <AddAssignmentModal
        isOpen={isAddAssignmentOpen}
        scope={assignmentScope}
        topicId={assignmentTopicId}
        onClose={() => {
          setIsAddAssignmentOpen(false);
          setAssignmentTopicId(null);
        }}
        onCreate={handleCreateAssignment}
      />
    </>
  );
}

export function CourseBuilderView({ portal, courseId }: Readonly<CourseBuilderViewProps>) {
  const navConfig = portal === 'mentor' ? MENTOR_COURSES_NAV : ADMIN_COURSES_NAV;
  const { contentMarginClass } = useSidebar();

  return (
    <div
      data-portal={portal}
      className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900"
    >
      <Header {...navConfig} />
      <Suspense fallback={<CourseBuilderBodySkeleton contentMarginClass={contentMarginClass} />}>
        <CourseBuilderContent portal={portal} courseId={courseId} />
      </Suspense>
    </div>
  );
}

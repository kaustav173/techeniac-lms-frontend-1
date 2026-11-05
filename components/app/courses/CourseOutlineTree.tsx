'use client';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { useEffect, useState } from 'react';

import { ActiveNodeSelection } from '@/components/app/courses/types';
import { Button } from '@/components/ui/Button';
import { H2, Span } from '@/components/ui/Typography';
import type { Assignment, Course, Subtopic, Topic } from '@/types/courses';

interface CourseOutlineTreeProps {
  course: Course;
  selectedNode: ActiveNodeSelection;
  reorderingId?: string | null | undefined;
  reorderingIds?: string[] | undefined;
  isReorderingTopics?: boolean | undefined;
  isReorderingCourseAssignments?: boolean | undefined;
  reorderingSubtopicTopicIds?: string[] | undefined;
  reorderingTopicAssignmentTopicIds?: string[] | undefined;
  onSelectNode: (selection: ActiveNodeSelection) => void;
  onAddTopic: () => void;
  onAddSubtopic: (topicId: string) => void;
  onAddTopicAssignment: (topicId: string) => void;
  onAddCourseAssignment: () => void;
  onReorderTopics: (targetTopicId: string, topicIdsInOrder: string[]) => void;
  onReorderSubtopics: (
    targetSubtopicId: string,
    topicId: string,
    subtopicIdsInOrder: string[],
  ) => void;
  onReorderAssignments: (
    targetAssignmentId: string,
    assignmentIdsInOrder: string[],
    topicId?: string,
  ) => void;
  onRequestDeleteNode: (
    type: 'TOPIC' | 'SUBTOPIC' | 'ASSIGNMENT',
    id: string,
    title: string,
  ) => void;
}

// ---------------------------------------------------------------------------
// 1. Sortable Topic Component
// ---------------------------------------------------------------------------
interface SortableTopicItemProps {
  topic: Topic;
  isSelected: boolean;
  isCollapsed: boolean;
  isBeingSaved?: boolean | undefined;
  isDisabledDrag?: boolean | undefined;
  reorderingId?: string | null | undefined;
  onSelectNode: (selection: ActiveNodeSelection) => void;
  onToggleCollapse: (topicId: string) => void;
  onRequestDeleteNode: (
    type: 'TOPIC' | 'SUBTOPIC' | 'ASSIGNMENT',
    id: string,
    title: string,
  ) => void;
  children?: React.ReactNode;
}

function SortableTopicItem({
  topic,
  isSelected,
  isCollapsed,
  isBeingSaved: isBeingSavedProp,
  isDisabledDrag,
  reorderingId,
  onSelectNode,
  onToggleCollapse,
  onRequestDeleteNode,
  children,
}: Readonly<SortableTopicItemProps>) {
  const isBeingSaved = isBeingSavedProp ?? reorderingId === topic.id;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: topic.id,
    disabled: Boolean(isBeingSaved || isDisabledDrag),
    data: {
      type: 'TOPIC',
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative z-10 rounded-xl border bg-white shadow-xs transition-colors ${
        isDragging
          ? 'z-50 scale-[1.01] opacity-95 shadow-xl ring-2 ring-blue-400'
          : isSelected
            ? 'border-blue-300 ring-1 ring-blue-200'
            : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Topic Header Row */}
      <div
        className={`flex items-center justify-between rounded-t-xl px-2.5 py-2 transition-colors ${
          isCollapsed ? 'rounded-b-xl' : ''
        } ${isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'} ${
          isBeingSaved ? 'pointer-events-none opacity-60 transition-opacity duration-200' : ''
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
          {/* Vertical Drag Grip Handle with Mobile Touch Support */}
          <div
            {...attributes}
            {...listeners}
            className={`-m-1 rounded p-1 text-slate-400 transition-colors ${
              isDisabledDrag || isBeingSaved
                ? 'cursor-not-allowed opacity-40'
                : 'cursor-grab touch-none hover:text-slate-600 active:cursor-grabbing'
            }`}
            title={
              isDisabledDrag || isBeingSaved
                ? 'Reordering in progress...'
                : 'Drag vertically to reorder topic'
            }
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 2a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4zm6-12a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>

          {/* Expand / Collapse Chevron */}
          <Button
            type="button"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(topic.id);
            }}
            className="h-auto p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            title={isCollapsed ? 'Expand topic' : 'Collapse topic'}
          >
            <svg
              className={`h-3.5 w-3.5 transform transition-transform duration-200 ${
                isCollapsed ? '-rotate-90' : 'rotate-0'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </Button>

          {/* Topic Title Click Target with Hover Popup */}
          <div
            onClick={() => onSelectNode({ type: 'TOPIC', id: topic.id })}
            className="group/name relative flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 truncate"
            title={topic.title}
          >
            <Span className="truncate text-base font-bold text-slate-900">{topic.title}</Span>
            <Span className="pointer-events-none absolute bottom-full left-0 z-50 mb-1 hidden max-w-xs rounded-md bg-slate-900/95 px-2.5 py-1 text-xs font-normal break-words whitespace-normal text-white shadow-xl ring-1 ring-white/10 group-hover/name:block">
              {topic.title}
            </Span>
          </div>
        </div>

        {/* Direct Topic Delete Action */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onRequestDeleteNode('TOPIC', topic.id, topic.title);
            }}
            className="h-auto p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
            title="Delete Topic"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </Button>
        </div>
      </div>

      {/* Expanded Children Container */}
      {!isCollapsed && children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Sortable Subtopic Component
// ---------------------------------------------------------------------------
interface SortableSubtopicItemProps {
  subtopic: Subtopic;
  parentTopicId: string;
  isSelected: boolean;
  isBeingSaved?: boolean | undefined;
  isDisabledDrag?: boolean | undefined;
  reorderingId?: string | null | undefined;
  isMenuOpen: boolean;
  onSelectNode: (selection: ActiveNodeSelection) => void;
  onToggleMenu: (menuId: string) => void;
  onRequestDeleteNode: (
    type: 'TOPIC' | 'SUBTOPIC' | 'ASSIGNMENT',
    id: string,
    title: string,
  ) => void;
}

function SortableSubtopicItem({
  subtopic,
  parentTopicId,
  isSelected,
  isBeingSaved: isBeingSavedProp,
  isDisabledDrag,
  reorderingId,
  isMenuOpen,
  onSelectNode,
  onToggleMenu,
  onRequestDeleteNode,
}: Readonly<SortableSubtopicItemProps>) {
  const isBeingSaved = isBeingSavedProp ?? reorderingId === subtopic.id;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: subtopic.id,
    disabled: Boolean(isBeingSaved || isDisabledDrag),
    data: {
      type: 'SUBTOPIC',
      topicId: parentTopicId,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors ${
        isMenuOpen ? 'relative z-40' : 'relative z-10'
      } ${
        isDragging
          ? 'z-50 scale-[1.01] bg-white opacity-95 shadow-lg ring-2 ring-blue-400'
          : isSelected
            ? 'border border-blue-300 bg-blue-50 font-semibold text-blue-900 shadow-xs'
            : 'border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-100'
      } ${isBeingSaved ? 'pointer-events-none opacity-60 transition-opacity duration-200' : ''}`}
    >
      <div className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 truncate">
        {/* Subtopic Drag Handle with Mobile Touch Support */}
        <div
          {...attributes}
          {...listeners}
          className={`-m-1 rounded p-1 text-slate-400 transition-colors ${
            isDisabledDrag || isBeingSaved
              ? 'cursor-not-allowed opacity-40'
              : 'cursor-grab touch-none hover:text-slate-600 active:cursor-grabbing'
          }`}
          title={
            isDisabledDrag || isBeingSaved
              ? 'Reordering in progress...'
              : 'Drag vertically to reorder subtopic within this topic'
          }
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 2a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4zm6-12a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </div>

        {/* Click node to select with Hover Popup */}
        <div
          onClick={() =>
            onSelectNode({
              type: 'SUBTOPIC',
              id: subtopic.id,
              parentTopicId,
            })
          }
          className="group/name relative flex min-w-0 flex-1 items-center gap-1.5 truncate"
          title={subtopic.title}
        >
          <Span className="truncate text-sm font-semibold sm:text-base">{subtopic.title}</Span>
          <Span className="pointer-events-none absolute bottom-full left-0 z-50 mb-1 hidden max-w-xs rounded-md bg-slate-900/95 px-2 py-1 text-xs font-normal break-words whitespace-normal text-white shadow-xl ring-1 ring-white/10 group-hover/name:block">
            {subtopic.title}
          </Span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <div className="relative" data-dropdown-container>
          <Button
            type="button"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMenu(`subtopic-${subtopic.id}`);
            }}
            className="h-auto rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            title="Subtopic options"
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </Button>

          {isMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute top-full right-0 z-50 mt-1 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5"
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  onToggleMenu('');
                  onRequestDeleteNode('SUBTOPIC', subtopic.id, subtopic.title);
                }}
                className="flex h-auto w-full items-center justify-start gap-2 px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-600"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <Span>Delete Subtopic</Span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Sortable Assignment Component (Reusable for Topic & Course Assignments)
// ---------------------------------------------------------------------------
interface SortableAssignmentItemProps {
  assignment: Assignment;
  parentTopicId?: string;
  scope: 'TOPIC' | 'COURSE';
  isSelected: boolean;
  isBeingSaved?: boolean | undefined;
  isDisabledDrag?: boolean | undefined;
  reorderingId?: string | null | undefined;
  isMenuOpen: boolean;
  onSelectNode: (selection: ActiveNodeSelection) => void;
  onToggleMenu: (menuId: string) => void;
  onRequestDeleteNode: (
    type: 'TOPIC' | 'SUBTOPIC' | 'ASSIGNMENT',
    id: string,
    title: string,
  ) => void;
}

function SortableAssignmentItem({
  assignment,
  parentTopicId,
  scope,
  isSelected,
  isBeingSaved: isBeingSavedProp,
  isDisabledDrag,
  reorderingId,
  isMenuOpen,
  onSelectNode,
  onToggleMenu,
  onRequestDeleteNode,
}: Readonly<SortableAssignmentItemProps>) {
  const isBeingSaved = isBeingSavedProp ?? reorderingId === assignment.id;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: assignment.id,
    disabled: Boolean(isBeingSaved || isDisabledDrag),
    data: {
      type: scope === 'TOPIC' ? 'TOPIC_ASSIGNMENT' : 'COURSE_ASSIGNMENT',
      topicId: parentTopicId,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors ${
        isMenuOpen ? 'relative z-40' : 'relative z-10'
      } ${
        isDragging
          ? 'z-50 scale-[1.01] bg-white opacity-95 shadow-lg ring-2 ring-purple-400'
          : isSelected
            ? 'border border-purple-300 bg-purple-50 font-semibold text-purple-900 shadow-xs'
            : 'border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-100'
      } ${isBeingSaved ? 'pointer-events-none opacity-60 transition-opacity duration-200' : ''}`}
    >
      <div className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 truncate">
        {/* Assignment Drag Grip Handle */}
        <div
          {...attributes}
          {...listeners}
          className={`-m-1 rounded p-1 text-slate-400 transition-colors ${
            isDisabledDrag || isBeingSaved
              ? 'cursor-not-allowed opacity-40'
              : 'cursor-grab touch-none hover:text-slate-600 active:cursor-grabbing'
          }`}
          title={
            isDisabledDrag || isBeingSaved
              ? 'Reordering in progress...'
              : 'Drag vertically to reorder task'
          }
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 2a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4zm6-12a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </div>

        <div
          onClick={() =>
            onSelectNode({
              type: 'ASSIGNMENT',
              id: assignment.id,
              parentTopicId,
            })
          }
          className="group/name relative flex min-w-0 flex-1 items-center gap-1.5 truncate"
          title={assignment.title}
        >
          <Span className="truncate text-sm font-semibold sm:text-base">{assignment.title}</Span>
          <Span className="pointer-events-none absolute bottom-full left-0 z-50 mb-1 hidden max-w-xs rounded-md bg-slate-900/95 px-2 py-1 text-xs font-normal break-words whitespace-normal text-white shadow-xl ring-1 ring-white/10 group-hover/name:block">
            {assignment.title}
          </Span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <div className="relative" data-dropdown-container>
          <Button
            type="button"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMenu(`assign-${assignment.id}`);
            }}
            className="h-auto rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            title="Task options"
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </Button>

          {isMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute top-full right-0 z-50 mt-1 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5"
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  onToggleMenu('');
                  onRequestDeleteNode('ASSIGNMENT', assignment.id, assignment.title);
                }}
                className="flex h-auto w-full items-center justify-start gap-2 px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-600"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <Span>Delete Task</Span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Main CourseOutlineTree Component
// ---------------------------------------------------------------------------
export function CourseOutlineTree({
  course,
  selectedNode,
  reorderingId,
  reorderingIds,
  isReorderingTopics,
  isReorderingCourseAssignments,
  reorderingSubtopicTopicIds,
  reorderingTopicAssignmentTopicIds,
  onSelectNode,
  onAddTopic,
  onAddSubtopic,
  onAddTopicAssignment,
  onAddCourseAssignment,
  onReorderTopics,
  onReorderSubtopics,
  onReorderAssignments,
  onRequestDeleteNode,
}: Readonly<CourseOutlineTreeProps>) {
  const [collapsedTopics, setCollapsedTopics] = useState<Record<string, boolean>>({});
  const [isTopicsSectionCollapsed, setIsTopicsSectionCollapsed] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Active reordering IDs across all concurrent reordering operations
  const activeReorderingIds = reorderingIds ?? (reorderingId ? [reorderingId] : []);
  const hasActiveReorder =
    activeReorderingIds.length > 0 ||
    Boolean(isReorderingTopics) ||
    Boolean(isReorderingCourseAssignments) ||
    (reorderingSubtopicTopicIds && reorderingSubtopicTopicIds.length > 0) ||
    (reorderingTopicAssignmentTopicIds && reorderingTopicAssignmentTopicIds.length > 0);

  // Configure Sensors: Mouse (with distance constraint) and Touch (with press delay for mobile scrolling)
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!activeMenuId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('[data-dropdown-container]')) {
        setActiveMenuId(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeMenuId]);

  const toggleCollapse = (topicId: string) => {
    setCollapsedTopics((prev) => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const topics = [...(course.topics || [])].sort((a, b) => a.displayOrder - b.displayOrder);
  const courseAssignments = [...(course.courseAssignments || course.assignments || [])].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  // Drag End handler with non-blocking reordering across topics, subtopics, and tasks
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;
    if (!activeData || !overData) return;

    // 1. Reorder Topics
    if (activeData.type === 'TOPIC' && overData.type === 'TOPIC') {
      const oldIndex = topics.findIndex((t) => t.id === active.id);
      const newIndex = topics.findIndex((t) => t.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(topics, oldIndex, newIndex);
        onReorderTopics(
          String(active.id),
          reordered.map((t) => t.id),
        );
      }
      return;
    }

    // 2. Reorder Subtopics within same topic
    if (
      activeData.type === 'SUBTOPIC' &&
      overData.type === 'SUBTOPIC' &&
      typeof activeData.topicId === 'string' &&
      activeData.topicId === overData.topicId
    ) {
      const targetTopicId = activeData.topicId;
      const topic = topics.find((t) => t.id === targetTopicId);
      if (topic && topic.subtopics) {
        const subtopics = [...topic.subtopics].sort((a, b) => a.displayOrder - b.displayOrder);
        const oldIndex = subtopics.findIndex((s) => s.id === active.id);
        const newIndex = subtopics.findIndex((s) => s.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reordered = arrayMove(subtopics, oldIndex, newIndex);
          onReorderSubtopics(
            String(active.id),
            targetTopicId,
            reordered.map((s) => s.id),
          );
        }
      }
      return;
    }

    // 3. Reorder Topic Assignments within same topic
    if (
      activeData.type === 'TOPIC_ASSIGNMENT' &&
      overData.type === 'TOPIC_ASSIGNMENT' &&
      typeof activeData.topicId === 'string' &&
      activeData.topicId === overData.topicId
    ) {
      const targetTopicId = activeData.topicId;
      const topic = topics.find((t) => t.id === targetTopicId);
      if (topic && topic.assignments) {
        const topicAssignments = [...topic.assignments].sort(
          (a, b) => a.displayOrder - b.displayOrder,
        );
        const oldIndex = topicAssignments.findIndex((a) => a.id === active.id);
        const newIndex = topicAssignments.findIndex((a) => a.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reordered = arrayMove(topicAssignments, oldIndex, newIndex);
          onReorderAssignments(
            String(active.id),
            reordered.map((a) => a.id),
            targetTopicId,
          );
        }
      }
      return;
    }

    // 4. Reorder Course-Level Assignments
    if (activeData.type === 'COURSE_ASSIGNMENT' && overData.type === 'COURSE_ASSIGNMENT') {
      const oldIndex = courseAssignments.findIndex((a) => a.id === active.id);
      const newIndex = courseAssignments.findIndex((a) => a.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(courseAssignments, oldIndex, newIndex);
        onReorderAssignments(
          String(active.id),
          reordered.map((a) => a.id),
        );
      }
      return;
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full flex-col border-b border-slate-200 bg-slate-50/60 lg:border-r lg:border-b-0">
        {/* Outline Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3.5">
          <H2 className="text-base font-bold text-slate-900 sm:text-lg">Course Outline</H2>
          {hasActiveReorder && (
            <Span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600">
              <Span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <Span>Saving order...</Span>
            </Span>
          )}
        </div>

        {/* Tree Content with comfortable scroll area */}
        <div className="flex-1 [scrollbar-gutter:stable] space-y-2.5 overflow-y-auto p-3.5 pb-24">
          {/* 1. Course Root Item */}
          <div
            onClick={() => onSelectNode({ type: 'COURSE', id: course.id })}
            className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              selectedNode.type === 'COURSE' && selectedNode.id === course.id
                ? 'border-2 border-blue-500 bg-blue-50/80 text-blue-900 shadow-xs'
                : 'border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 truncate">
              <Span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-bold text-slate-500 uppercase">
                Course
              </Span>
              <Span className="truncate text-base font-bold text-slate-900">{course.title}</Span>
            </div>
            <div className="flex items-center gap-2">
              <Span className="text-xs font-medium text-slate-500">
                {course.isActive ? 'Active' : 'Draft'}
              </Span>
              <Span
                className={`h-2.5 w-2.5 rounded-full ${course.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
              />
            </div>
          </div>

          {/* 2. Topics Section - Clean unboxed layout */}
          <div className="mt-2">
            <div className="flex items-center justify-between pb-2">
              <button
                type="button"
                onClick={() => setIsTopicsSectionCollapsed((prev) => !prev)}
                className="flex items-center gap-2 text-left transition-colors hover:opacity-80 focus-visible:outline-hidden"
                title={isTopicsSectionCollapsed ? 'Expand topics' : 'Collapse topics'}
              >
                <svg
                  className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                    isTopicsSectionCollapsed ? '-rotate-90' : 'rotate-0'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                <Span className="text-sm font-bold tracking-tight text-slate-900">Topics</Span>
                <Span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                  {topics.length}
                </Span>
              </button>
              <Button
                type="button"
                variant="ghost"
                disabled={Boolean(isReorderingTopics)}
                onClick={onAddTopic}
                className="inline-flex h-auto items-center gap-1.5 rounded-full bg-[#0044D3] px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-[#0039B3] disabled:opacity-40"
                title="Add a new topic"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <Span>Topic</Span>
              </Button>
            </div>

            {/* Topics List with blur state when saving topics */}
            {!isTopicsSectionCollapsed && (
              <div
                className={`relative mt-2 transition-all duration-200 ${
                  isReorderingTopics
                    ? 'pointer-events-none opacity-50 blur-[0.6px] select-none'
                    : ''
                }`}
              >
                <SortableContext
                  items={topics.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {topics.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-3 text-center text-xs text-slate-500">
                        No topics created yet. Click + Topic above to add your first topic.
                      </div>
                    ) : (
                      topics.map((topic) => {
                        const isCollapsed = collapsedTopics[topic.id] ?? false;
                        const isSelected =
                          selectedNode.type === 'TOPIC' && selectedNode.id === topic.id;
                        const subtopics = [...(topic.subtopics || [])].sort(
                          (a, b) => a.displayOrder - b.displayOrder,
                        );
                        const topicAssignments = [...(topic.assignments || [])].sort(
                          (a, b) => a.displayOrder - b.displayOrder,
                        );

                        const isReorderingSubtopicsThisTopic = Boolean(
                          reorderingSubtopicTopicIds?.includes(topic.id),
                        );
                        const isReorderingTopicTasksThisTopic = Boolean(
                          reorderingTopicAssignmentTopicIds?.includes(topic.id),
                        );

                        return (
                          <SortableTopicItem
                            key={topic.id}
                            topic={topic}
                            isSelected={isSelected}
                            isCollapsed={isCollapsed}
                            isDisabledDrag={isReorderingTopics}
                            isBeingSaved={
                              isReorderingTopics || activeReorderingIds.includes(topic.id)
                            }
                            reorderingId={reorderingId}
                            onSelectNode={onSelectNode}
                            onToggleCollapse={toggleCollapse}
                            onRequestDeleteNode={onRequestDeleteNode}
                          >
                            {/* Subtopics Div & Topic Tasks Div */}
                            <div className="space-y-3 rounded-b-xl border-t border-slate-100 bg-slate-50/50 p-2.5">
                              {/* 1. Subtopics Section Div */}
                              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
                                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                                  <div className="flex items-center gap-1.5">
                                    <Span className="text-xs font-bold tracking-wider text-slate-600 uppercase">
                                      Subtopics
                                    </Span>
                                    <Span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                                      {subtopics.length}
                                    </Span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    disabled={Boolean(isReorderingSubtopicsThisTopic)}
                                    onClick={() => onAddSubtopic(topic.id)}
                                    className="inline-flex h-auto items-center gap-1 rounded-full border border-blue-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50 disabled:opacity-40"
                                    title="Add Subtopic"
                                  >
                                    <svg
                                      className="h-3 w-3"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 4v16m8-8H4"
                                      />
                                    </svg>
                                    <Span>Subtopic</Span>
                                  </Button>
                                </div>

                                <div
                                  className={`relative mt-1.5 transition-all duration-200 ${
                                    isReorderingSubtopicsThisTopic
                                      ? 'pointer-events-none opacity-50 blur-[0.6px] select-none'
                                      : ''
                                  }`}
                                >
                                  <SortableContext
                                    items={subtopics.map((s) => s.id)}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    <div className="space-y-1.5">
                                      {subtopics.length === 0 ? (
                                        <div className="py-2 text-center text-xs text-slate-400">
                                          No subtopics yet
                                        </div>
                                      ) : (
                                        subtopics.map((subtopic) => {
                                          const isSubSelected =
                                            selectedNode.type === 'SUBTOPIC' &&
                                            selectedNode.id === subtopic.id;
                                          return (
                                            <SortableSubtopicItem
                                              key={subtopic.id}
                                              subtopic={subtopic}
                                              parentTopicId={topic.id}
                                              isSelected={isSubSelected}
                                              isDisabledDrag={isReorderingSubtopicsThisTopic}
                                              isBeingSaved={
                                                isReorderingSubtopicsThisTopic ||
                                                activeReorderingIds.includes(subtopic.id)
                                              }
                                              reorderingId={reorderingId}
                                              isMenuOpen={
                                                activeMenuId === `subtopic-${subtopic.id}`
                                              }
                                              onSelectNode={onSelectNode}
                                              onToggleMenu={(id) =>
                                                setActiveMenuId((prev) => (prev === id ? null : id))
                                              }
                                              onRequestDeleteNode={onRequestDeleteNode}
                                            />
                                          );
                                        })
                                      )}
                                    </div>
                                  </SortableContext>
                                </div>
                              </div>

                              {/* 2. Topic Tasks Section Div */}
                              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
                                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                                  <div className="flex items-center gap-1.5">
                                    <Span className="text-xs font-bold tracking-wider text-purple-700 uppercase">
                                      Tasks
                                    </Span>
                                    <Span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
                                      {topicAssignments.length}
                                    </Span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    disabled={Boolean(isReorderingTopicTasksThisTopic)}
                                    onClick={() => onAddTopicAssignment(topic.id)}
                                    className="inline-flex h-auto items-center gap-1 rounded-full border border-purple-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-50 disabled:opacity-40"
                                    title="Add Task"
                                  >
                                    <svg
                                      className="h-3 w-3"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 4v16m8-8H4"
                                      />
                                    </svg>
                                    <Span>Task</Span>
                                  </Button>
                                </div>

                                <div
                                  className={`relative mt-1.5 transition-all duration-200 ${
                                    isReorderingTopicTasksThisTopic
                                      ? 'pointer-events-none opacity-50 blur-[0.6px] select-none'
                                      : ''
                                  }`}
                                >
                                  <SortableContext
                                    items={topicAssignments.map((a) => a.id)}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    <div className="space-y-1.5">
                                      {topicAssignments.length === 0 ? (
                                        <div className="py-2 text-center text-xs text-slate-400">
                                          No tasks yet
                                        </div>
                                      ) : (
                                        topicAssignments.map((tAssign) => {
                                          const isAssignSelected =
                                            selectedNode.type === 'ASSIGNMENT' &&
                                            selectedNode.id === tAssign.id;
                                          return (
                                            <SortableAssignmentItem
                                              key={tAssign.id}
                                              assignment={tAssign}
                                              parentTopicId={topic.id}
                                              scope="TOPIC"
                                              isSelected={isAssignSelected}
                                              isDisabledDrag={isReorderingTopicTasksThisTopic}
                                              isBeingSaved={
                                                isReorderingTopicTasksThisTopic ||
                                                activeReorderingIds.includes(tAssign.id)
                                              }
                                              reorderingId={reorderingId}
                                              isMenuOpen={activeMenuId === `assign-${tAssign.id}`}
                                              onSelectNode={onSelectNode}
                                              onToggleMenu={(id) =>
                                                setActiveMenuId((prev) => (prev === id ? null : id))
                                              }
                                              onRequestDeleteNode={onRequestDeleteNode}
                                            />
                                          );
                                        })
                                      )}
                                    </div>
                                  </SortableContext>
                                </div>
                              </div>
                            </div>
                          </SortableTopicItem>
                        );
                      })
                    )}
                  </div>
                </SortableContext>
              </div>
            )}
          </div>

          {/* 4. Course-Level Assignments Section (At bottom) */}
          <div className="mt-3.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Span className="text-xs font-bold tracking-wider text-slate-700 uppercase">
                  Course-Level Assignments
                </Span>
                <Span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
                  {courseAssignments.length}
                </Span>
              </div>
              <Button
                type="button"
                variant="ghost"
                disabled={Boolean(isReorderingCourseAssignments)}
                onClick={onAddCourseAssignment}
                className="inline-flex h-auto items-center gap-1 rounded-full border border-purple-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-50 disabled:opacity-40"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <Span>Task</Span>
              </Button>
            </div>

            <div
              className={`relative mt-2 transition-all duration-200 ${
                isReorderingCourseAssignments
                  ? 'pointer-events-none opacity-50 blur-[0.6px] select-none'
                  : ''
              }`}
            >
              <SortableContext
                items={courseAssignments.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1.5">
                  {courseAssignments.length === 0 ? (
                    <div className="py-2 text-center text-xs text-slate-400">
                      No course assignments created yet
                    </div>
                  ) : (
                    courseAssignments.map((assignment) => {
                      const isSelected =
                        selectedNode.type === 'ASSIGNMENT' && selectedNode.id === assignment.id;
                      return (
                        <SortableAssignmentItem
                          key={assignment.id}
                          assignment={assignment}
                          scope="COURSE"
                          isSelected={isSelected}
                          isDisabledDrag={isReorderingCourseAssignments}
                          isBeingSaved={
                            isReorderingCourseAssignments ||
                            activeReorderingIds.includes(assignment.id)
                          }
                          reorderingId={reorderingId}
                          isMenuOpen={activeMenuId === `assign-${assignment.id}`}
                          onSelectNode={onSelectNode}
                          onToggleMenu={(id) =>
                            setActiveMenuId((prev) => (prev === id ? null : id))
                          }
                          onRequestDeleteNode={onRequestDeleteNode}
                        />
                      );
                    })
                  )}
                </div>
              </SortableContext>
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
}

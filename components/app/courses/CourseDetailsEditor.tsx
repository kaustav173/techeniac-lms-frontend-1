'use client';

import React, { useState } from 'react';

import { EditorFormShell } from '@/components/app/courses/EditorFormShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { H3, P, Span } from '@/components/ui/Typography';
import { useDurationInput } from '@/hooks/useDurationInput';
import { formatErrorMessage, isConflictError } from '@/lib/errors';
import type { Course, CourseImpact, UpdateCourseInput } from '@/types/courses';

interface CourseDetailsEditorProps {
  course: Course;
  impact?: CourseImpact | null | undefined;
  topicsTotalMinutes?: number | undefined;
  onSaveCourse: (payload: UpdateCourseInput) => Promise<Course>;
  onConflict: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

export function CourseDetailsEditor({
  course,
  impact,
  topicsTotalMinutes = 0,
  onSaveCourse,
  onConflict,
  onDirtyChange,
}: Readonly<CourseDetailsEditorProps>) {
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description || '');

  const {
    durationHours,
    durationMinutes,
    handleHoursChange,
    handleMinutesChange,
    estimatedMinutes: totalEstimatedMins,
  } = useDurationInput({
    initialMinutes: course.estimatedMinutes,
  });

  const [isActive, setIsActive] = useState(course.isActive);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compute dirty state comparing current values against initial course props
  const isDirty =
    title.trim() !== course.title.trim() ||
    description.trim() !== (course.description || '').trim() ||
    (totalEstimatedMins ?? null) !== (course.estimatedMinutes ?? null) ||
    isActive !== course.isActive;

  React.useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isDirty || isSaving) return;

    if (!title.trim()) {
      setErrorMsg('Course title cannot be empty.');
      return;
    }
    if (title.trim().length > 100) {
      setErrorMsg('Course title cannot exceed 100 characters.');
      return;
    }
    if (description.trim().length > 2000) {
      setErrorMsg('Course description cannot exceed 2000 characters.');
      return;
    }

    const parsedHours = durationHours !== '' ? Number.parseInt(durationHours, 10) : 0;
    const parsedMins = durationMinutes !== '' ? Number.parseInt(durationMinutes, 10) : 0;

    if (Number.isNaN(parsedHours) || parsedHours < 0) {
      setErrorMsg('Hours cannot be negative.');
      return;
    }

    if (durationMinutes !== '') {
      if (Number.isNaN(parsedMins) || parsedMins < 0 || parsedMins > 59) {
        setErrorMsg('Minutes must be between 0 and 59.');
        return;
      }
    }

    const calculatedMins =
      durationHours !== '' || durationMinutes !== '' ? parsedHours * 60 + parsedMins : null;

    const finalEstimatedMinutes =
      calculatedMins !== null && calculatedMins > 0 ? calculatedMins : null;

    if (
      topicsTotalMinutes > 0 &&
      finalEstimatedMinutes !== null &&
      finalEstimatedMinutes < topicsTotalMinutes
    ) {
      setErrorMsg(
        `Course duration (${Math.floor(finalEstimatedMinutes / 60)}h ${finalEstimatedMinutes % 60}m) cannot be less than the total duration allocated to its topics (${Math.floor(topicsTotalMinutes / 60)}h ${topicsTotalMinutes % 60}m).`,
      );
      return;
    }

    if (topicsTotalMinutes > 0 && finalEstimatedMinutes === null) {
      setErrorMsg(
        `Course duration cannot be set to 0 because its topics have an allocated duration of ${Math.floor(topicsTotalMinutes / 60)}h ${topicsTotalMinutes % 60}m.`,
      );
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      await onSaveCourse({
        title: title.trim(),
        description: description.trim() || null,
        estimatedMinutes: finalEstimatedMinutes,
        isActive,
        expectedUpdatedAt: course.updatedAt,
      });

      onDirtyChange(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      if (isConflictError(err)) {
        onConflict();
      } else {
        setErrorMsg(formatErrorMessage(err, 'Failed to save course changes'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (updater: () => void) => {
    updater();
  };

  const affectedMentees = impact?.affectedMenteesCount ?? 0;

  return (
    <div className="flex h-full [scrollbar-gutter:stable] flex-col overflow-y-auto bg-slate-50/50 p-4 sm:p-8">
      <EditorFormShell
        category="Course"
        title={title || course.title}
        isDirty={isDirty}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        onSave={() => {
          void handleSave();
        }}
        errorMsg={errorMsg}
        notice={
          affectedMentees > 0 ? (
            <div className="mx-auto mt-5 w-full max-w-5xl rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900 shadow-xs">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                Live Impact Notice
              </div>
              <P className="mt-1 text-xs leading-relaxed text-amber-800">
                This course is allocated to{' '}
                <Span className="font-bold">{affectedMentees} active mentees</Span>. Changes saved
                here take effect live immediately across all enrolled dashboards with an audit log
                record.
              </P>
            </div>
          ) : null
        }
      >
        {/* Section 1: Core Course Information */}
        <div className="space-y-5">
          <div className="border-b border-slate-100 pb-3.5">
            <H3 className="text-base font-bold text-slate-900">Course Information</H3>
          </div>

          <div>
            <Label
              required={true}
              className="block text-sm font-semibold tracking-wide text-slate-800"
            >
              Title
            </Label>
            <Input
              type="text"
              maxLength={100}
              value={title}
              hasError={Boolean(errorMsg && (!title.trim() || title.trim().length > 100))}
              onChange={(e) => handleChange(() => setTitle(e.target.value.slice(0, 100)))}
              placeholder="e.g. Distributed Systems Engineering"
              className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-[#0044D3] focus:outline-hidden"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="block text-sm font-semibold tracking-wide text-slate-800">
                Description
              </Label>
              <Span className="text-xs font-medium text-slate-400">{description.length}/2000</Span>
            </div>
            <textarea
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => handleChange(() => setDescription(e.target.value.slice(0, 2000)))}
              placeholder="Provide a comprehensive syllabus overview, prerequisites, and target learning outcomes..."
              className="mt-2 min-h-[120px] w-full resize-y rounded-xl border border-slate-300 bg-white p-4 text-sm leading-relaxed text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-[#0044D3] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Section 2: Estimated Duration & Scheduling */}
        <div className="space-y-4 border-t border-slate-100 pt-7">
          <div className="border-b border-slate-100 pb-3.5">
            <H3 className="text-base font-bold text-slate-900">Estimated Duration & Benchmark</H3>
          </div>

          <div className="grid max-w-sm grid-cols-2 gap-4">
            <div>
              <Label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase">
                Hours
              </Label>
              <div className="relative mt-1.5">
                <Input
                  type="number"
                  min={0}
                  value={durationHours}
                  onChange={(e) => handleChange(() => handleHoursChange(e.target.value))}
                  placeholder="0"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 pr-11 text-base text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-[#0044D3] focus:outline-hidden"
                />
                <Span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-medium text-slate-400">
                  hrs
                </Span>
              </div>
            </div>
            <div>
              <Label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase">
                Minutes
              </Label>
              <div className="relative mt-1.5">
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={durationMinutes}
                  onChange={(e) => handleChange(() => handleMinutesChange(e.target.value))}
                  placeholder="0"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 pr-12 text-base text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-[#0044D3] focus:outline-hidden"
                />
                <Span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-medium text-slate-400">
                  mins
                </Span>
              </div>
            </div>
          </div>

          <div className="pt-1">
            <Span className="block text-sm font-medium text-slate-600">
              {totalEstimatedMins !== null && totalEstimatedMins > 0
                ? `${totalEstimatedMins} minutes total (${Math.floor(totalEstimatedMins / 60)}h ${totalEstimatedMins % 60}m)`
                : 'Optional duration benchmark'}
            </Span>
          </div>

          {topicsTotalMinutes > 0 && (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs font-medium text-slate-700">
              <svg
                className="h-4 w-4 shrink-0 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <Span>
                Currently allocated across topics:{' '}
                <strong>
                  {Math.floor(topicsTotalMinutes / 60)}h {topicsTotalMinutes % 60}m
                </strong>
                . Course duration cannot be lower than this total.
              </Span>
            </div>
          )}
        </div>

        {/* Section 3: Visibility & Publication Status */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-7">
          <div>
            <Span className="block text-base font-bold text-slate-900">
              Course Visibility Status
            </Span>
          </div>

          <div className="flex items-center gap-3">
            <Span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isActive
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border border-slate-200 bg-slate-100 text-slate-600'
              }`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </Span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              role="switch"
              aria-checked={isActive}
              aria-label="Course visibility status"
              onClick={() => handleChange(() => setIsActive(!isActive))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-start rounded-full border-2 border-transparent p-0 transition-colors duration-200 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0044D3] focus-visible:ring-offset-2 ${
                isActive ? 'bg-[#0044D3] hover:bg-[#0039B3]' : 'bg-slate-300 hover:bg-slate-400'
              }`}
            >
              <Span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </Button>
          </div>
        </div>
      </EditorFormShell>
    </div>
  );
}

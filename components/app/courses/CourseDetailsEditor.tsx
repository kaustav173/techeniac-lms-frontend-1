'use client';

import React, { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { H2, P, Span } from '@/components/ui/Typography';
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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Course title cannot be empty.');
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
    onDirtyChange(true);
  };

  const affectedMentees = impact?.affectedMenteesCount ?? 0;

  return (
    <div className="flex h-full [scrollbar-gutter:stable] flex-col overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      {/* Live Impact Notice on Open Allocations */}
      {affectedMentees > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            <Span>Live Impact Notice</Span>
          </div>
          <P className="mt-1 leading-relaxed text-amber-800">
            This course is allocated to <strong>{affectedMentees} active mentees</strong>. Changes
            saved here take effect live immediately across all enrolled dashboards with an audit log
            record.
          </P>
        </div>
      )}

      {errorMsg && (
        <FieldError
          error={errorMsg}
          className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 shadow-xs"
        />
      )}

      {/* Single Consolidated Form Card */}
      <form
        noValidate
        onSubmit={(e) => {
          void handleSave(e);
        }}
        className="w-full max-w-4xl rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6"
      >
        {/* Card Header with Save Changes Button */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div>
            <H2 className="text-base font-bold text-slate-900">Course Details</H2>
            <P className="text-xs text-slate-500">
              Manage title, description, duration, and status
            </P>
          </div>
          <div className="flex items-center gap-2.5">
            {saveSuccess && (
              <Span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <Span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <Span>Saved</Span>
              </Span>
            )}

            <Button
              type="submit"
              disabled={isSaving}
              isLoading={isSaving}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0044D3] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#0039B3] focus-visible:ring-[#0044D3] disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Form Fields with Reduced Spacing */}
        <div className="mt-4 space-y-3.5">
          {/* Title Field */}
          <div>
            <Label required={true} className="block text-xs font-semibold text-slate-800">
              Course Title
            </Label>
            <Input
              type="text"
              value={title}
              hasError={Boolean(errorMsg && !title.trim())}
              onChange={(e) => handleChange(() => setTitle(e.target.value))}
              placeholder="e.g. Distributed Systems Engineering"
              className="mt-1 h-9.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:border-[#0044D3] focus:outline-hidden"
            />
          </div>

          {/* Description Field */}
          <div>
            <Label className="block text-xs font-semibold text-slate-800">Description</Label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => handleChange(() => setDescription(e.target.value))}
              placeholder="Provide a comprehensive syllabus overview, prerequisites, and target learning outcomes..."
              className="mt-1 min-h-[140px] w-full resize-y rounded-xl border border-slate-300 bg-white p-3 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-[#0044D3] focus:outline-hidden"
            />
          </div>

          {/* Total Estimated Duration */}
          <div>
            <Label className="block text-xs font-semibold text-slate-800">
              Total Estimated Duration
            </Label>
            <div className="mt-1 grid max-w-xs grid-cols-2 gap-3">
              <div>
                <Label className="block text-[11px] font-medium text-slate-500 uppercase">
                  Hours
                </Label>
                <div className="relative mt-1">
                  <Input
                    type="number"
                    min={0}
                    value={durationHours}
                    onChange={(e) => handleChange(() => handleHoursChange(e.target.value))}
                    placeholder="0"
                    className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 pr-9 text-sm text-slate-900 focus:border-[#0044D3] focus:outline-hidden"
                  />
                  <Span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-slate-400">
                    hrs
                  </Span>
                </div>
              </div>
              <div>
                <Label className="block text-[11px] font-medium text-slate-500 uppercase">
                  Minutes
                </Label>
                <div className="relative mt-1">
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={durationMinutes}
                    onChange={(e) => handleChange(() => handleMinutesChange(e.target.value))}
                    placeholder="0"
                    className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 pr-9 text-sm text-slate-900 focus:border-[#0044D3] focus:outline-hidden"
                  />
                  <Span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-slate-400">
                    mins
                  </Span>
                </div>
              </div>
            </div>
            <P className="mt-1 text-xs text-slate-500">
              {totalEstimatedMins !== null && totalEstimatedMins > 0
                ? `${totalEstimatedMins} minutes total (${Math.floor(totalEstimatedMins / 60)}h ${totalEstimatedMins % 60}m)`
                : 'Optional duration benchmark'}
            </P>
          </div>

          {/* Visibility Status Toggle */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3.5">
            <div>
              <Label className="block text-xs font-semibold text-slate-800">
                Course Visibility Status
              </Label>
              <P className="text-xs text-slate-500">
                Inactive courses cannot be newly allocated to students.
              </P>
            </div>
            <div className="flex items-center gap-2.5">
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
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-start rounded-full border-2 border-transparent p-0 transition-colors duration-200 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0044D3] ${
                  isActive ? 'bg-[#0044D3]' : 'bg-slate-300'
                }`}
              >
                <Span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

'use client';

import React, { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { H2, H3, P, Span } from '@/components/ui/Typography';
import { useDurationInput } from '@/hooks/useDurationInput';
import { formatErrorMessage, isConflictError } from '@/lib/errors';
import type { CourseImpact, ResourceItem, Topic, UpdateTopicInput } from '@/types/courses';

function isValidWebUrl(urlString: string): boolean {
  try {
    const trimmed = urlString.trim();
    if (!trimmed) return false;
    const url = new URL(trimmed);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.length > 0;
  } catch {
    return false;
  }
}

interface TopicEditorProps {
  topic: Topic;
  impact?: CourseImpact | null | undefined;
  courseEstimatedMinutes?: number | null | undefined;
  otherTopicsMinutes?: number | undefined;
  onSaveTopic: (payload: UpdateTopicInput) => Promise<Topic>;
  onConflict: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

export function TopicEditor({
  topic,
  impact,
  courseEstimatedMinutes = null,
  otherTopicsMinutes = 0,
  onSaveTopic,
  onConflict,
  onDirtyChange,
}: Readonly<TopicEditorProps>) {
  const [title, setTitle] = useState(topic.title);
  const [description, setDescription] = useState(topic.description || '');
  const [resources, setResources] = useState<ResourceItem[]>(topic.resources || []);

  const {
    durationHours,
    durationMinutes,
    handleHoursChange,
    handleMinutesChange,
    estimatedMinutes: totalEstimatedMins,
  } = useDurationInput({
    initialMinutes: topic.estimatedMinutes,
  });

  const [isActive, setIsActive] = useState(topic.isActive);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const subtopicsTotalMinutes =
    topic.subtopics?.reduce((acc, s) => acc + (s.estimatedMinutes || 0), 0) || 0;

  const remainingBudget =
    courseEstimatedMinutes !== undefined &&
    courseEstimatedMinutes !== null &&
    courseEstimatedMinutes > 0
      ? Math.max(0, courseEstimatedMinutes - (otherTopicsMinutes || 0))
      : null;

  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceType, setNewResourceType] = useState<'LINK' | 'ATTACHMENT'>('LINK');

  const handleAddResource = () => {
    const trimmedTitle = newResourceTitle.trim();
    const trimmedUrl = newResourceUrl.trim();

    if (!trimmedTitle) {
      setErrorMsg('Resource title is required.');
      return;
    }
    if (!trimmedUrl) {
      setErrorMsg('Resource URL is required.');
      return;
    }
    if (!isValidWebUrl(trimmedUrl)) {
      setErrorMsg(
        'Invalid resource URL format. Please provide a valid web link (e.g. https://github.com/...).',
      );
      return;
    }

    const updated = [
      ...resources,
      {
        id: crypto.randomUUID(),
        title: trimmedTitle,
        url: trimmedUrl,
        type: newResourceType,
      },
    ];
    setResources(updated);
    setNewResourceTitle('');
    setNewResourceUrl('');
    setErrorMsg(null);
    onDirtyChange(true);
  };

  const handleRemoveResource = (indexToRemove: number) => {
    const updated = resources.filter((_, idx) => idx !== indexToRemove);
    setResources(updated);
    onDirtyChange(true);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Topic title cannot be empty.');
      return;
    }

    const parsedHours = durationHours !== '' ? parseInt(durationHours, 10) : 0;
    const parsedMins = durationMinutes !== '' ? parseInt(durationMinutes, 10) : 0;

    if (isNaN(parsedHours) || parsedHours < 0) {
      setErrorMsg('Hours cannot be negative.');
      return;
    }

    if (durationMinutes !== '') {
      if (isNaN(parsedMins) || parsedMins < 0 || parsedMins > 59) {
        setErrorMsg('Minutes must be between 0 and 59.');
        return;
      }
    }

    const calculatedMins =
      durationHours !== '' || durationMinutes !== '' ? parsedHours * 60 + parsedMins : null;

    const finalEstimatedMinutes =
      calculatedMins !== null && calculatedMins > 0 ? calculatedMins : null;

    if (
      remainingBudget !== null &&
      finalEstimatedMinutes !== null &&
      finalEstimatedMinutes > remainingBudget
    ) {
      setErrorMsg(
        `Topic duration (${Math.floor(finalEstimatedMinutes / 60)}h ${finalEstimatedMinutes % 60}m) exceeds the course's remaining duration budget (${Math.floor(remainingBudget / 60)}h ${remainingBudget % 60}m remaining out of ${Math.floor(courseEstimatedMinutes! / 60)}h ${courseEstimatedMinutes! % 60}m total).`,
      );
      return;
    }

    if (
      subtopicsTotalMinutes > 0 &&
      finalEstimatedMinutes !== null &&
      finalEstimatedMinutes < subtopicsTotalMinutes
    ) {
      setErrorMsg(
        `Topic duration (${Math.floor(finalEstimatedMinutes / 60)}h ${finalEstimatedMinutes % 60}m) cannot be less than the total allocated duration of its subtopics (${Math.floor(subtopicsTotalMinutes / 60)}h ${subtopicsTotalMinutes % 60}m).`,
      );
      return;
    }

    if (subtopicsTotalMinutes > 0 && finalEstimatedMinutes === null) {
      setErrorMsg(
        `Topic duration cannot be set to 0 because its subtopics have an allocated duration of ${Math.floor(subtopicsTotalMinutes / 60)}h ${subtopicsTotalMinutes % 60}m.`,
      );
      return;
    }

    // Validate pending resource inputs if user entered anything in title or URL
    const updatedResources = [...resources];
    const pendingTitle = newResourceTitle.trim();
    const pendingUrl = newResourceUrl.trim();

    if (pendingTitle || pendingUrl) {
      if (!pendingTitle) {
        setErrorMsg('Resource title is required (or clear the resource input before saving).');
        return;
      }
      if (!pendingUrl || !isValidWebUrl(pendingUrl)) {
        setErrorMsg(
          'Invalid resource URL format. Please provide a valid web link (e.g. https://github.com/...) or clear the pending resource fields.',
        );
        return;
      }
      updatedResources.push({
        id: crypto.randomUUID(),
        title: pendingTitle,
        url: pendingUrl,
        type: newResourceType,
      });
      setResources(updatedResources);
      setNewResourceTitle('');
      setNewResourceUrl('');
    }

    // Verify all resources in list have valid URL format
    for (const res of updatedResources) {
      if (!isValidWebUrl(res.url)) {
        setErrorMsg(
          `Resource "${res.title}" has an invalid URL format. Links must start with http:// or https://`,
        );
        return;
      }
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      await onSaveTopic({
        title: title.trim(),
        description: description.trim() || null,
        resources: updatedResources.length > 0 ? updatedResources : null,
        estimatedMinutes: finalEstimatedMinutes,
        isActive,
        expectedUpdatedAt: topic.updatedAt,
      });

      onDirtyChange(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      if (isConflictError(err)) {
        onConflict();
      } else {
        setErrorMsg(formatErrorMessage(err, 'Failed to save topic changes'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (updater: () => void) => {
    updater();
    if (errorMsg) setErrorMsg(null);
    onDirtyChange(true);
  };

  const affectedMentees = impact?.affectedMenteesCount ?? 0;

  return (
    <div className="flex h-full [scrollbar-gutter:stable] flex-col overflow-y-auto bg-slate-50/50 p-4 sm:p-8">
      {/* Top Header Command Bar */}
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <Span className="block text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Topic Parameters
          </Span>
          <H2 className="mt-1 text-2xl font-bold tracking-tight break-words text-slate-900 sm:text-3xl">
            {topic.title}
          </H2>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <Span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Span className="h-2 w-2 rounded-full bg-emerald-500" />
              Saved Live
            </Span>
          )}

          <Button
            type="button"
            disabled={isSaving}
            isLoading={isSaving}
            onClick={() => {
              void handleSave();
            }}
            className="inline-flex items-center gap-2 rounded-full bg-[#0044D3] px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#0039B3] focus-visible:ring-[#0044D3] active:bg-[#003199] disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {affectedMentees > 0 && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            Impact Notice
          </div>
          <P className="mt-1 text-xs leading-relaxed text-amber-800">
            Editing or deactivating this topic affects{' '}
            <Span className="font-bold">{affectedMentees} active mentees</Span>. Adding,
            deactivating, or reactivating triggers an automatic progress recalculation event.
          </P>
        </div>
      )}

      {errorMsg && (
        <FieldError
          error={errorMsg}
          className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-xs"
        />
      )}

      {/* Main Form Area */}
      <form
        noValidate
        onSubmit={(e) => {
          void handleSave(e);
        }}
        className="mt-6 w-full max-w-4xl space-y-6"
      >
        {/* Card 1: Core Topic Information */}
        <div className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
          <div>
            <Label
              required={true}
              className="block text-sm font-semibold tracking-wide text-slate-800"
            >
              Topic Title
            </Label>
            <Input
              type="text"
              value={title}
              hasError={Boolean(errorMsg && !title.trim())}
              onChange={(e) => handleChange(() => setTitle(e.target.value))}
              placeholder="e.g. Branching & Trunk Strategies"
              className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <Label className="block text-sm font-semibold tracking-wide text-slate-800">
              Description
            </Label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => handleChange(() => setDescription(e.target.value))}
              placeholder="Brief scope, prerequisites, and learning objectives for this topic..."
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-4 text-sm leading-relaxed text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Card 2: Estimated Duration & Planning */}
        <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
          <div>
            <Label className="block text-sm font-semibold tracking-wide text-slate-800">
              Estimated Duration
            </Label>
            <P className="mt-0.5 text-xs text-slate-500">
              Planned lecture and study duration allocated for this topic.
            </P>
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
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 pr-11 text-base text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden"
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
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 pr-12 text-base text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden"
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
                : 'Optional'}
            </Span>
          </div>

          {remainingBudget !== null && (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 text-xs font-medium text-blue-800">
              <svg
                className="h-4 w-4 shrink-0 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <Span>
                Available course budget:{' '}
                <Span className="font-bold">
                  {Math.floor(remainingBudget / 60)}h {remainingBudget % 60}m remaining
                </Span>{' '}
                (Course total: {Math.floor(courseEstimatedMinutes! / 60)}h{' '}
                {courseEstimatedMinutes! % 60}m, other topics:{' '}
                {Math.floor((otherTopicsMinutes || 0) / 60)}h {(otherTopicsMinutes || 0) % 60}m)
              </Span>
            </div>
          )}

          {subtopicsTotalMinutes > 0 && (
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
                Currently allocated across subtopics:{' '}
                <Span className="font-bold">
                  {Math.floor(subtopicsTotalMinutes / 60)}h {subtopicsTotalMinutes % 60}m
                </Span>
                . Topic duration cannot be lower than this total.
              </Span>
            </div>
          )}
        </div>

        {/* Card 3: Resources & Attachments Manager */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <H3 className="text-base font-bold text-slate-900">Resource Links & Attachments</H3>
              <P className="mt-0.5 text-xs text-slate-500">
                Supplementary links, documentation references, and download files.
              </P>
            </div>
            <Span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              {resources.length} {resources.length === 1 ? 'Resource' : 'Resources'}
            </Span>
          </div>

          <div className="mt-5 space-y-2.5">
            {resources.map((resItem, idx) => (
              <div
                key={resItem.id || idx}
                className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-sm transition-all hover:bg-slate-50"
              >
                <div className="flex items-center gap-3 truncate">
                  <Span
                    className={`rounded-lg px-2 py-0.5 text-xs font-bold tracking-wide uppercase ${
                      resItem.type === 'LINK'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {resItem.type}
                  </Span>
                  <Span className="truncate font-semibold text-slate-900">{resItem.title}</Span>
                  {isValidWebUrl(resItem.url) ? (
                    <a
                      href={resItem.url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-xs text-slate-400 hover:text-blue-600 hover:underline"
                    >
                      {resItem.url}
                    </a>
                  ) : (
                    <Span
                      className="truncate text-xs text-slate-400 italic"
                      title="Invalid or unverified URL"
                    >
                      {resItem.url}
                    </Span>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleRemoveResource(idx)}
                  className="h-8 w-8 rounded-lg p-0 text-slate-400 hover:bg-slate-200/70 hover:text-rose-600 focus-visible:ring-slate-400 active:bg-slate-200"
                  title="Remove resource"
                >
                  &times;
                </Button>
              </div>
            ))}

            {resources.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400 italic">
                No external resources attached yet. Add one below.
              </div>
            )}
          </div>

          {errorMsg && (
            <FieldError
              error={errorMsg}
              className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
            />
          )}

          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-12">
            <div className="sm:col-span-4">
              <Input
                type="text"
                placeholder="Resource title (e.g. Git Spec)"
                value={newResourceTitle}
                onChange={(e) => {
                  setNewResourceTitle(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="h-10 w-full rounded-xl border border-slate-300 px-3.5 text-sm text-slate-900 shadow-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>
            <div className="sm:col-span-5">
              <Input
                type="url"
                placeholder="https://example.com/spec.pdf"
                value={newResourceUrl}
                onChange={(e) => {
                  setNewResourceUrl(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="h-10 w-full rounded-xl border border-slate-300 px-3.5 text-sm text-slate-900 shadow-xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>
            <div className="sm:col-span-2">
              <select
                value={newResourceType}
                onChange={(e) => setNewResourceType(e.target.value as 'LINK' | 'ATTACHMENT')}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-xs focus:border-blue-600 focus:outline-hidden"
              >
                <option value="LINK">LINK</option>
                <option value="ATTACHMENT">FILE</option>
              </select>
            </div>
            <div className="sm:col-span-1">
              <Button
                type="button"
                onClick={handleAddResource}
                className="h-10 w-full rounded-full bg-[#0044D3] px-3 text-sm font-semibold text-white shadow-xs hover:bg-[#0039B3] focus-visible:ring-[#0044D3] active:bg-[#003199]"
              >
                <Span className="sm:hidden">+ Add</Span>
                <Span className="hidden sm:inline">+</Span>
              </Button>
            </div>
          </div>
        </div>

        {/* Card 4: Visibility & Active Toggle */}
        <div className="flex items-center justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
          <div>
            <Span className="block text-base font-bold text-slate-900">Topic Active Status</Span>
            <Span className="mt-0.5 block text-xs text-slate-500">
              When inactive, hidden from mentees and excluded from progress calculations.
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
              aria-label="Topic active status"
              onClick={() => handleChange(() => setIsActive(!isActive))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-start rounded-full border-2 border-transparent p-0 transition-colors duration-200 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0044D3] focus-visible:ring-offset-2 ${
                isActive ? 'bg-[#0044D3]' : 'bg-slate-300'
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
      </form>
    </div>
  );
}

'use client';

import React, { useState } from 'react';

import { EditorFormShell } from '@/components/app/courses/EditorFormShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { MarkdownViewer } from '@/components/ui/MarkdownViewer';
import { SingleSelectDropdown } from '@/components/ui/SingleSelectDropdown';
import { H3, P, Span } from '@/components/ui/Typography';
import { useDurationInput } from '@/hooks/useDurationInput';
import { useToast } from '@/hooks/useToast';
import {
  areResourcesEqual,
  findDuplicateTitle,
  isValidWebUrl,
  RESOURCE_TYPE_OPTIONS,
} from '@/lib/courses/courseUtils';
import { formatErrorMessage, isConflictError } from '@/lib/errors';
import type {
  CourseImpact,
  ResourceItem,
  Subtopic,
  Topic,
  UpdateSubtopicInput,
} from '@/types/courses';

interface SubtopicEditorProps {
  subtopic: Subtopic;
  existingTopics?: Topic[] | undefined;
  impact?: CourseImpact | null | undefined;
  courseEstimatedMinutes?: number | null | undefined;
  parentTopicTitle?: string | undefined;
  parentTopicEstimatedMinutes?: number | null | undefined;
  otherSubtopicsMinutes?: number | undefined;
  onSaveSubtopic: (payload: UpdateSubtopicInput) => Promise<Subtopic>;
  onConflict: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

export function SubtopicEditor({
  subtopic,
  existingTopics,
  impact,
  courseEstimatedMinutes = null,
  parentTopicTitle,
  parentTopicEstimatedMinutes = null,
  otherSubtopicsMinutes = 0,
  onSaveSubtopic,
  onConflict,
  onDirtyChange,
}: Readonly<SubtopicEditorProps>) {
  const [title, setTitle] = useState(subtopic.title);
  const [content, setContent] = useState(subtopic.content || '');

  const {
    durationHours,
    durationMinutes,
    handleHoursChange,
    handleMinutesChange,
    estimatedMinutes: totalEstimatedMins,
  } = useDurationInput({
    initialMinutes: subtopic.estimatedMinutes,
  });

  const [isActive, setIsActive] = useState(subtopic.isActive);
  const [resources, setResources] = useState<ResourceItem[]>(subtopic.resources || []);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceType, setNewResourceType] = useState<'LINK' | 'ATTACHMENT'>('LINK');

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { toastError } = useToast();

  // Compute dirty state comparing current values against initial subtopic props
  const isDirty =
    title.trim() !== subtopic.title.trim() ||
    content.trim() !== (subtopic.content || '').trim() ||
    (totalEstimatedMins ?? null) !== (subtopic.estimatedMinutes ?? null) ||
    isActive !== subtopic.isActive ||
    !areResourcesEqual(resources, subtopic.resources);

  React.useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const remainingBudget =
    parentTopicEstimatedMinutes !== undefined &&
    parentTopicEstimatedMinutes !== null &&
    parentTopicEstimatedMinutes > 0
      ? Math.max(0, parentTopicEstimatedMinutes - (otherSubtopicsMinutes || 0))
      : null;

  const handleAddResource = () => {
    const trimmedTitle = newResourceTitle.trim();
    const trimmedUrl = newResourceUrl.trim();

    if (!trimmedTitle) {
      toastError('Resource title is required.');
      return;
    }
    if (trimmedTitle.length > 100) {
      toastError('Resource title cannot exceed 100 characters.');
      return;
    }
    if (!trimmedUrl) {
      toastError('Resource URL is required.');
      return;
    }
    if (!isValidWebUrl(trimmedUrl)) {
      toastError(
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
  };

  const handleRemoveResource = (index: number) => {
    const updated = resources.filter((_, i) => i !== index);
    setResources(updated);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isDirty || isSaving) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMsg('Subtopic title cannot be empty.');
      toastError('Subtopic title cannot be empty.');
      return;
    }
    if (trimmedTitle.length > 100) {
      setErrorMsg('Subtopic title cannot exceed 100 characters.');
      toastError('Subtopic title cannot exceed 100 characters.');
      return;
    }
    if (content.length > 500) {
      setErrorMsg('Lesson content cannot exceed 500 characters.');
      toastError('Lesson content cannot exceed 500 characters.');
      return;
    }

    const parentTopic = existingTopics?.find((t) => t.subtopics?.some((s) => s.id === subtopic.id));
    const duplicateSibling = findDuplicateTitle(parentTopic?.subtopics, trimmedTitle, subtopic.id);
    if (duplicateSibling) {
      setErrorMsg(`A subtopic with the title "${trimmedTitle}" already exists in this topic.`);
      return;
    }

    const duplicateTopic = findDuplicateTitle(existingTopics, trimmedTitle);
    if (duplicateTopic) {
      setErrorMsg(
        `A subtopic cannot share the same title "${trimmedTitle}" with a topic in this course.`,
      );
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
      finalEstimatedMinutes !== null &&
      courseEstimatedMinutes !== null &&
      courseEstimatedMinutes !== undefined &&
      courseEstimatedMinutes > 0 &&
      finalEstimatedMinutes > courseEstimatedMinutes
    ) {
      setErrorMsg(
        `Subtopic duration (${Math.floor(finalEstimatedMinutes / 60)}h ${finalEstimatedMinutes % 60}m) cannot exceed the total course duration (${Math.floor(courseEstimatedMinutes / 60)}h ${courseEstimatedMinutes % 60}m).`,
      );
      return;
    }

    if (
      remainingBudget !== null &&
      finalEstimatedMinutes !== null &&
      finalEstimatedMinutes > remainingBudget
    ) {
      setErrorMsg(
        `Subtopic duration (${Math.floor(finalEstimatedMinutes / 60)}h ${finalEstimatedMinutes % 60}m) exceeds parent topic "${parentTopicTitle || 'Topic'}" remaining duration budget (${Math.floor(remainingBudget / 60)}h ${remainingBudget % 60}m remaining out of ${Math.floor(parentTopicEstimatedMinutes! / 60)}h ${parentTopicEstimatedMinutes! % 60}m total).`,
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
        toastError('Resource title is required (or clear the resource input before saving).');
        return;
      }
      if (pendingTitle.length > 100) {
        setErrorMsg('Resource title cannot exceed 100 characters.');
        toastError('Resource title cannot exceed 100 characters.');
        return;
      }
      if (!pendingUrl || !isValidWebUrl(pendingUrl)) {
        setErrorMsg(
          'Invalid resource URL format. Please provide a valid web link (e.g. https://github.com/...) or clear the pending resource fields.',
        );
        toastError(
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
      await onSaveSubtopic({
        title: title.trim(),
        content: content.trim() || null,
        resources: updatedResources.length > 0 ? updatedResources : null,
        estimatedMinutes: finalEstimatedMinutes,
        isActive,
        expectedUpdatedAt: subtopic.updatedAt,
      });

      onDirtyChange(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      if (isConflictError(err)) {
        onConflict();
      } else {
        const msg = formatErrorMessage(err, 'Failed to save subtopic changes');
        setErrorMsg(msg);
        toastError(msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (updater: () => void) => {
    updater();
    if (errorMsg) setErrorMsg(null);
  };

  const affectedMentees = impact?.affectedMenteesCount ?? 0;

  return (
    <div className="flex h-full [scrollbar-gutter:stable] flex-col overflow-y-auto scroll-smooth bg-slate-50/50 p-4 sm:p-8">
      <EditorFormShell
        category={
          parentTopicTitle
            ? `Topic: ${parentTopicTitle} • Subtopic Lesson`
            : 'Subtopic Lesson • Content'
        }
        title={title || subtopic.title}
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
                Impact Notice
              </div>
              <P className="mt-1 text-xs leading-relaxed text-amber-800">
                This subtopic lesson is active for{' '}
                <Span className="font-bold">{affectedMentees} mentees</Span>. Content saves update
                live immediately.
              </P>
            </div>
          ) : null
        }
      >
        {/* Section 1: Core Lesson Information & Markdown */}
        <div className="space-y-5">
          <div className="border-b border-slate-100 pb-3.5">
            <H3 className="text-base font-bold text-slate-900">Lesson Information</H3>
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
              placeholder="e.g. Interactive Rebase and Squash Commits"
              className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-[#0044D3] focus:outline-hidden"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="block text-sm font-semibold tracking-wide text-slate-800">
                  Lesson Content
                </Label>
                <Span className="text-xs font-medium text-slate-400">{content.length}/500</Span>
              </div>
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveTab('editor')}
                  className={`h-auto rounded-lg px-3.5 py-1.5 font-semibold transition-colors ${
                    activeTab === 'editor'
                      ? 'bg-white text-slate-900 shadow-xs hover:bg-white active:bg-white'
                      : 'border-transparent bg-transparent text-slate-600 shadow-none hover:bg-slate-200/60 hover:text-slate-900 active:bg-slate-200'
                  }`}
                >
                  Editor
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveTab('preview')}
                  className={`h-auto rounded-lg px-3.5 py-1.5 font-semibold transition-colors ${
                    activeTab === 'preview'
                      ? 'bg-white text-slate-900 shadow-xs hover:bg-white active:bg-white'
                      : 'border-transparent bg-transparent text-slate-600 shadow-none hover:bg-slate-200/60 hover:text-slate-900 active:bg-slate-200'
                  }`}
                >
                  Preview
                </Button>
              </div>
            </div>

            {activeTab === 'editor' ? (
              <textarea
                rows={12}
                maxLength={500}
                value={content}
                onChange={(e) => handleChange(() => setContent(e.target.value.slice(0, 500)))}
                placeholder="Enter markdown lesson content"
                className="mt-2.5 w-full rounded-xl border border-slate-300 bg-white p-4 font-mono text-sm leading-relaxed text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-[#0044D3] focus:outline-hidden"
              />
            ) : (
              <div className="mt-2.5 min-h-[300px] rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                {content.trim() ? (
                  <MarkdownViewer content={content} />
                ) : (
                  <div className="flex h-36 items-center justify-center text-sm text-slate-400 italic">
                    No lesson content entered yet. Switch to the Markdown Editor tab to write
                    content.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Estimated Duration & Caps */}
        <div className="space-y-4 border-t border-slate-100 pt-7">
          <div className="border-b border-slate-100 pb-3.5">
            <H3 className="text-base font-bold text-slate-900">Estimated Duration</H3>
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
        </div>

        {/* Section 3: Resources & Attachments Manager */}
        <div className="space-y-4 border-t border-slate-100 pt-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <H3 className="text-base font-bold text-slate-900">Resources</H3>
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

          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-12">
            <div className="sm:col-span-4">
              <Input
                type="text"
                maxLength={100}
                placeholder="Resource title (e.g. Solution Spec)"
                value={newResourceTitle}
                onChange={(e) => {
                  setNewResourceTitle(e.target.value.slice(0, 100));
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
              <SingleSelectDropdown<'LINK' | 'ATTACHMENT'>
                value={newResourceType}
                onChange={(val) => setNewResourceType(val)}
                options={RESOURCE_TYPE_OPTIONS}
                aria-label="Resource type"
                triggerClassName="h-10 rounded-xl border-slate-300 px-3 text-sm"
              />
            </div>
            <div className="flex sm:col-span-1 sm:justify-center">
              <Button
                type="button"
                onClick={handleAddResource}
                aria-label="Add resource"
                title="Add resource"
                className="flex h-10 w-full shrink-0 items-center justify-center rounded-full bg-[#0044D3] p-0 text-white shadow-xs transition-colors hover:bg-[#0039B3] focus-visible:ring-[#0044D3] active:bg-[#003199] sm:w-10"
              >
                <svg
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <Span className="ml-1.5 text-sm font-semibold sm:hidden">Add Resource</Span>
              </Button>
            </div>
          </div>
        </div>

        {/* Section 4: Visibility & Active Toggle */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-7">
          <div>
            <Span className="block text-base font-bold text-slate-900">Subtopic Active Status</Span>
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
              aria-label="Subtopic active status"
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

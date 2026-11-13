'use client';

import React, { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { H2, H3, P, Span } from '@/components/ui/Typography';
import { useDurationInput } from '@/hooks/useDurationInput';
import { formatErrorMessage, isConflictError } from '@/lib/errors';
import {
  Assignment,
  AssignmentScope,
  ResourceItem,
  SubmissionMode,
  Topic,
  UpdateAssignmentInput,
} from '@/types/courses';

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

interface AssignmentEditorProps {
  assignment: Assignment;
  existingTopics?: Topic[] | undefined;
  existingCourseAssignments?: Assignment[] | undefined;
  onSaveAssignment: (payload: UpdateAssignmentInput) => Promise<Assignment>;
  onConflict: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

export function AssignmentEditor({
  assignment,
  existingTopics,
  existingCourseAssignments,
  onSaveAssignment,
  onConflict,
  onDirtyChange,
}: Readonly<AssignmentEditorProps>) {
  const [title, setTitle] = useState(assignment.title);
  const [instructions, setInstructions] = useState(assignment.instructions || '');

  const {
    durationHours,
    durationMinutes,
    handleHoursChange,
    handleMinutesChange,
    totalMinutes: totalDurationMinutes,
  } = useDurationInput({
    initialMinutes: assignment.estimatedMinutes,
  });
  const [maxMarks, setMaxMarks] = useState<number>(Number(assignment.maxMarks) || 0);
  const [passMarks, setPassMarks] = useState<number>(Number(assignment.passMarks) || 0);
  const [allowLate, setAllowLate] = useState<boolean>(assignment.allowLate);

  const [pdfMode, setPdfMode] = useState<SubmissionMode>(assignment.pdfMode);
  const [zipMode, setZipMode] = useState<SubmissionMode>(assignment.zipMode);
  const [urlMode, setUrlMode] = useState<SubmissionMode>(assignment.urlMode);

  const [resources, setResources] = useState<ResourceItem[]>(assignment.resources || []);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceType, setNewResourceType] = useState<'LINK' | 'ATTACHMENT'>('LINK');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const handleRemoveResource = (index: number) => {
    const updated = resources.filter((_, i) => i !== index);
    setResources(updated);
    onDirtyChange(true);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMsg('Assignment title cannot be empty.');
      return;
    }

    const normalizedTitle = trimmedTitle.toLowerCase();
    if (assignment.scope === AssignmentScope.COURSE) {
      const duplicateCourseAssign = existingCourseAssignments?.find(
        (a) => a.id !== assignment.id && a.title.trim().toLowerCase() === normalizedTitle,
      );
      if (duplicateCourseAssign) {
        setErrorMsg(
          `A course assignment with the title "${trimmedTitle}" already exists in this course.`,
        );
        return;
      }
    } else if (assignment.scope === AssignmentScope.TOPIC && assignment.topicId) {
      const currentTopic = existingTopics?.find((t) => t.id === assignment.topicId);
      const duplicateTopicAssign = currentTopic?.assignments?.find(
        (a) => a.id !== assignment.id && a.title.trim().toLowerCase() === normalizedTitle,
      );
      if (duplicateTopicAssign) {
        setErrorMsg(`A task with the title "${trimmedTitle}" already exists in this topic.`);
        return;
      }
    }

    if (totalDurationMinutes <= 0) {
      setErrorMsg('Estimated duration must be greater than 0 minutes.');
      return;
    }

    if (durationMinutes !== '') {
      const parsedMins = Number.parseInt(durationMinutes, 10);
      if (Number.isNaN(parsedMins) || parsedMins < 0 || parsedMins > 59) {
        setErrorMsg('Minutes must be between 0 and 59.');
        return;
      }
    }

    const numMaxMarks = Number(maxMarks);
    const numPassMarks = Number(passMarks);

    if (Number.isNaN(numMaxMarks) || numMaxMarks <= 0) {
      setErrorMsg('Max marks must be greater than 0.');
      return;
    }
    if (Number.isNaN(numPassMarks) || numPassMarks <= 0) {
      setErrorMsg('Pass marks must be greater than 0.');
      return;
    }
    if (numPassMarks > numMaxMarks) {
      setErrorMsg('Pass marks cannot be greater than max marks.');
      return;
    }

    if (
      pdfMode === SubmissionMode.OFF &&
      zipMode === SubmissionMode.OFF &&
      urlMode === SubmissionMode.OFF
    ) {
      setErrorMsg(
        'Validation error: At least one submission mode (PDF, ZIP, or URL) must not be Off.',
      );
      return;
    }

    // Validate pending resource inputs if user typed in title or URL
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
      await onSaveAssignment({
        title: title.trim(),
        instructions: instructions.trim() || null,
        estimatedMinutes: totalDurationMinutes,
        maxMarks: numMaxMarks,
        passMarks: numPassMarks,
        allowLate,
        pdfMode,
        zipMode,
        urlMode,
        resources: updatedResources.length > 0 ? updatedResources : null,
        expectedUpdatedAt: assignment.updatedAt,
      });

      onDirtyChange(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      if (isConflictError(err)) {
        onConflict();
      } else {
        setErrorMsg(formatErrorMessage(err, 'Failed to save assignment changes'));
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

  return (
    <div className="flex h-full [scrollbar-gutter:stable] flex-col overflow-y-auto bg-slate-50/50 p-4 sm:p-8">
      {/* Top Header Command Bar */}
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold tracking-wide text-purple-800 uppercase">
              {assignment.scope} Task • Evaluation
            </Span>
            <Span className="font-mono text-xs text-slate-400">#{assignment.id.slice(0, 8)}</Span>
          </div>
          <H2 className="mt-1.5 text-2xl font-bold tracking-tight break-words text-slate-900 sm:text-3xl">
            {title || assignment.title}
          </H2>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <Span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Span className="h-2 w-2 rounded-full bg-emerald-500" />
              <Span>Saved Live</Span>
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

      {errorMsg && (
        <FieldError
          error={errorMsg}
          className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-xs"
        />
      )}

      {/* Main Form Fields */}
      <form
        noValidate
        onSubmit={(e) => {
          void handleSave(e);
        }}
        className="mt-6 w-full max-w-4xl space-y-6"
      >
        {/* Card 1: Core Specifications */}
        <div className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
          <div className="border-b border-slate-100 pb-3.5">
            <H3 className="text-base font-bold text-slate-900">Task Information & Prompt</H3>
            <P className="mt-0.5 text-xs text-slate-500">
              Deliverable title and comprehensive instructions presented to cadets.
            </P>
          </div>

          <div>
            <Label
              required={true}
              className="block text-sm font-semibold tracking-wide text-slate-800"
            >
              Assignment Title
            </Label>
            <Input
              type="text"
              value={title}
              hasError={Boolean(errorMsg && !title.trim())}
              onChange={(e) => handleChange(() => setTitle(e.target.value))}
              placeholder="e.g. Build a Raft Distributed Consensus Node"
              className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-[#0044D3] focus:outline-hidden"
            />
          </div>

          <div>
            <Label className="block text-sm font-semibold tracking-wide text-slate-800">
              Instructions & Problem Statement (Rich Text)
            </Label>
            <textarea
              rows={6}
              value={instructions}
              onChange={(e) => handleChange(() => setInstructions(e.target.value))}
              placeholder="State the technical specifications, requirements, and constraints for cadets..."
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-4 font-mono text-sm leading-relaxed text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-[#0044D3] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Card 2: Time, Marks & Late Submissions */}
        <div className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
          <div className="border-b border-slate-100 pb-3.5">
            <H3 className="text-base font-bold text-slate-900">Grading & Duration Calibration</H3>
            <P className="mt-0.5 text-xs text-slate-500">
              Configure evaluation pass thresholds, maximum marks, and duration benchmark.
            </P>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label
                required={true}
                className="block text-xs font-semibold tracking-wider text-slate-600 uppercase"
              >
                Est. Duration
              </Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    value={durationHours}
                    onChange={(e) => handleChange(() => handleHoursChange(e.target.value))}
                    placeholder="0"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden sm:text-base"
                  />
                  <Span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-400">
                    hrs
                  </Span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={durationMinutes}
                    onChange={(e) => handleChange(() => handleMinutesChange(e.target.value))}
                    placeholder="0"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-11 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden sm:text-base"
                  />
                  <Span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-400">
                    mins
                  </Span>
                </div>
              </div>
              <Span className="mt-1.5 block text-xs text-slate-500">
                {totalDurationMinutes > 0
                  ? `${totalDurationMinutes} minutes total`
                  : 'Required (hrs/mins)'}
              </Span>
            </div>

            <div>
              <Label
                required={true}
                className="block text-xs font-semibold tracking-wider text-slate-600 uppercase"
              >
                Max Marks
              </Label>
              <div className="mt-1.5">
                <Input
                  type="number"
                  value={maxMarks || ''}
                  onChange={(e) => handleChange(() => setMaxMarks(Number(e.target.value)))}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base text-slate-900 shadow-xs focus:border-blue-600 focus:outline-hidden"
                />
              </div>
              <Span className="mt-1.5 block text-xs text-slate-500">Max score (e.g. 100)</Span>
            </div>

            <div>
              <Label
                required={true}
                className="block text-xs font-semibold tracking-wider text-slate-600 uppercase"
              >
                Pass Marks
              </Label>
              <div className="mt-1.5">
                <Input
                  type="number"
                  value={passMarks || ''}
                  onChange={(e) => handleChange(() => setPassMarks(Number(e.target.value)))}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base text-slate-900 shadow-xs focus:border-blue-600 focus:outline-hidden"
                />
              </div>
              <Span className="mt-1.5 block text-xs text-slate-500">Must be &le; Max Marks</Span>
            </div>
          </div>

          {/* Late Submission Flag */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-4">
            <div>
              <Span className="block text-sm font-semibold text-slate-900">
                Late Submissions Allowed
              </Span>
              <Span className="mt-0.5 block text-xs text-slate-500">
                Allow cadets to turn in assignments after the scheduled allocation due date.
              </Span>
            </div>

            <div className="flex items-center gap-3">
              <Span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  allowLate
                    ? 'border border-purple-200 bg-purple-50 text-purple-700'
                    : 'border border-slate-200 bg-slate-100 text-slate-600'
                }`}
              >
                {allowLate ? 'Allowed' : 'Blocked'}
              </Span>
              <button
                type="button"
                role="switch"
                aria-checked={allowLate}
                aria-label="Allow late submissions"
                onClick={() => handleChange(() => setAllowLate(!allowLate))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-start rounded-full border-2 border-transparent p-0 transition-colors duration-200 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 ${
                  allowLate
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
              >
                <Span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    allowLate ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Submission Modes Chooser */}
        <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
          <div className="border-b border-slate-100 pb-3.5">
            <H3 className="text-base font-bold text-slate-900">Mentee Submission Deliverables</H3>
            <P className="mt-0.5 text-xs text-slate-500">
              Configure accepted deliverable formats. At least one deliverable must not be
              &apos;OFF&apos;.
            </P>
          </div>

          <div className="space-y-3">
            {/* PDF Mode */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Span className="block text-sm font-semibold text-slate-900">PDF Document</Span>
                <Span className="text-xs text-slate-500">
                  Design reports, architectural writeups, and diagrams
                </Span>
              </div>
              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-xs">
                {(['OFF', 'OPTIONAL', 'REQUIRED'] as SubmissionMode[]).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleChange(() => setPdfMode(mode))}
                    className={`h-auto rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      pdfMode === mode
                        ? 'bg-[#0044D3] text-white shadow-xs hover:bg-[#0039B3] hover:text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>

            {/* ZIP Mode */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Span className="block text-sm font-semibold text-slate-900">ZIP Archive</Span>
                <Span className="text-xs text-slate-500">
                  Source code bundles, compressed repositories, binaries
                </Span>
              </div>
              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-xs">
                {(['OFF', 'OPTIONAL', 'REQUIRED'] as SubmissionMode[]).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleChange(() => setZipMode(mode))}
                    className={`h-auto rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      zipMode === mode
                        ? 'bg-[#0044D3] text-white shadow-xs hover:bg-[#0039B3] hover:text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>

            {/* URL Mode */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Span className="block text-sm font-semibold text-slate-900">
                  Repository / Demo URL
                </Span>
                <Span className="text-xs text-slate-500">
                  GitHub / GitLab pull request link or deployed site
                </Span>
              </div>
              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-xs">
                {(['OFF', 'OPTIONAL', 'REQUIRED'] as SubmissionMode[]).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleChange(() => setUrlMode(mode))}
                    className={`h-auto rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      urlMode === mode
                        ? 'bg-[#0044D3] text-white shadow-xs hover:bg-[#0039B3] hover:text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Resources Manager */}
        <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <H3 className="text-base font-bold text-slate-900">Task Resources & References</H3>
              <P className="mt-0.5 text-xs text-slate-500">
                Starter code repositories, rubrics, and reference assets.
              </P>
            </div>
            <Span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              {resources.length} {resources.length === 1 ? 'Resource' : 'Resources'}
            </Span>
          </div>

          <div className="space-y-2.5">
            {resources.map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-sm transition-all hover:bg-slate-50"
              >
                <div className="flex items-center gap-3 truncate">
                  <Span className="rounded-lg bg-purple-100 px-2 py-0.5 text-xs font-bold tracking-wide text-purple-800 uppercase">
                    {item.type}
                  </Span>
                  <Span className="truncate font-semibold text-slate-900">{item.title}</Span>
                  {isValidWebUrl(item.url) ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-xs text-slate-400 hover:text-blue-600 hover:underline"
                    >
                      {item.url}
                    </a>
                  ) : (
                    <Span
                      className="truncate text-xs text-slate-400 italic"
                      title="Invalid or unverified URL"
                    >
                      {item.url}
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
                No task resources attached yet. Add one below.
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
                placeholder="Resource title"
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
                placeholder="https://github.com/..."
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
                className="h-10 w-full rounded-full bg-purple-600 px-3 text-sm font-semibold text-white shadow-xs hover:bg-purple-700 focus-visible:ring-purple-500 active:bg-purple-800"
              >
                <Span className="sm:hidden">+ Add</Span>
                <Span className="hidden sm:inline">+</Span>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

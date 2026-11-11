'use client';

import React, { useId, useMemo, useRef, useState } from 'react';

import { Modal } from '@/components/patterns/Modal';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { P, Span } from '@/components/ui/Typography';
import {
  useGradeSubmissionMutation,
  useRequestResubmissionMutation,
  useReviewDetails,
} from '@/hooks/useGrading';
import { cn } from '@/lib/cn';
import { formatDateIST } from '@/lib/date';
import { ApiError } from '@/lib/errors';
import { isSafeHttpUrl } from '@/lib/url';
import {
  calculateGradeLabel,
  type SubmissionReviewDetails,
  SubmissionStatus,
} from '@/types/grading';

import { SubmissionStatusBadge } from './SubmissionStatusBadge';

interface SubmissionReviewContentProps {
  readonly reviewDetails: SubmissionReviewDetails;
  readonly onRefetch?: () => void;
  readonly onClose: () => void;
}

function SubmissionReviewContent({
  reviewDetails,
  onRefetch,
  onClose,
}: SubmissionReviewContentProps) {
  const marksInputId = useId();
  const feedbackInputId = useId();
  const resubmitInputId = useId();
  const gradeTabId = useId();
  const resubmitTabId = useId();
  const gradePanelId = useId();
  const resubmitPanelId = useId();

  const isSubmittingGradeRef = useRef(false);
  const isSubmittingResubmitRef = useRef(false);

  const gradeMutation = useGradeSubmissionMutation();
  const resubmitMutation = useRequestResubmissionMutation();

  const [activeTab, setActiveTab] = useState<'grade' | 'resubmit'>('grade');
  const [marks, setMarks] = useState<string>(
    reviewDetails.grading.marks !== null ? String(reviewDetails.grading.marks) : '',
  );
  const [feedback, setFeedback] = useState<string>(reviewDetails.grading.feedback ?? '');
  const [resubmitFeedback, setResubmitFeedback] = useState<string>('');
  const [isEditingExisting, setIsEditingExisting] = useState<boolean>(
    reviewDetails.grading.marks === null,
  );
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const maxMarks = reviewDetails.maxMarks;
  const numMarks = marks.trim() === '' ? null : Number(marks);
  const isMarksOutOfRange =
    numMarks !== null && !isNaN(numMarks) && (numMarks < 0 || numMarks > maxMarks);
  const marksError = isMarksOutOfRange ? `Marks must be between 0 and ${maxMarks}` : undefined;

  const previewGradeLabel = useMemo(() => {
    if (numMarks === null || isNaN(numMarks) || numMarks < 0 || numMarks > maxMarks) return null;
    return calculateGradeLabel(numMarks, maxMarks);
  }, [numMarks, maxMarks]);

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingGradeRef.current) return;
    if (numMarks === null || isNaN(numMarks) || numMarks < 0 || numMarks > maxMarks) return;

    isSubmittingGradeRef.current = true;
    try {
      await gradeMutation.mutateAsync({
        submissionId: reviewDetails.id,
        payload: {
          marks: numMarks,
          feedback: feedback.trim() || null,
        },
      });
      setActionSuccess('Grade saved successfully');
      setIsEditingExisting(false);
    } catch {
      // Handled by mutation error state
    } finally {
      isSubmittingGradeRef.current = false;
    }
  };

  const handleResubmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingResubmitRef.current) return;
    if (!resubmitFeedback.trim()) return;

    isSubmittingResubmitRef.current = true;
    try {
      await resubmitMutation.mutateAsync({
        submissionId: reviewDetails.id,
        payload: {
          feedback: resubmitFeedback.trim(),
        },
      });
      setActionSuccess('Resubmission requested successfully');
    } catch {
      // Handled by mutation error state
    } finally {
      isSubmittingResubmitRef.current = false;
    }
  };

  const isGradeConflict =
    (gradeMutation.error instanceof ApiError &&
      (gradeMutation.error.status === 422 || gradeMutation.error.status === 409)) ||
    gradeMutation.error?.message?.toLowerCase().includes('version') ||
    gradeMutation.error?.message?.toLowerCase().includes('stale');

  const hasLink = Boolean(reviewDetails.submissionData.linkUrl);
  const hasPdf = Boolean(reviewDetails.submissionData.pdfUrl);
  const hasZip = Boolean(reviewDetails.submissionData.zipUrl);
  const hasAttachments = hasLink || hasPdf || hasZip;

  return (
    <div className="space-y-4">
      {/* Status & Timing Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2.5">
          <SubmissionStatusBadge status={reviewDetails.status} isLate={reviewDetails.isLate} />
          {reviewDetails.topicTitle && (
            <Span className="text-slate-600">
              <Span className="text-slate-400">Topic: </Span>
              <Span className="font-medium text-slate-800">{reviewDetails.topicTitle}</Span>
            </Span>
          )}
        </div>
        <Span className="text-[11px] font-medium text-slate-500">
          Submitted {formatDateIST(reviewDetails.submittedAt)}
        </Span>
      </div>

      {/* Instructions (if provided) */}
      {reviewDetails.instructions && (
        <div className="rounded-xl border border-slate-200/70 bg-white p-3 text-xs text-slate-600 shadow-2xs">
          <Span className="font-semibold text-slate-700">Instructions: </Span>
          <span>{reviewDetails.instructions}</span>
        </div>
      )}

      {/* Attachments */}
      <div className="space-y-1.5">
        <Span className="text-xs font-semibold text-slate-700">Attachments</Span>
        <div className="flex flex-wrap gap-2">
          {hasAttachments ? (
            <>
              {reviewDetails.submissionData.linkUrl && (
                <a
                  href={
                    isSafeHttpUrl(reviewDetails.submissionData.linkUrl)
                      ? reviewDetails.submissionData.linkUrl
                      : undefined
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition-all hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-700"
                >
                  <svg
                    className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  <span>Project Link</span>
                </a>
              )}
              {reviewDetails.submissionData.pdfUrl && (
                <a
                  href={
                    isSafeHttpUrl(reviewDetails.submissionData.pdfUrl)
                      ? reviewDetails.submissionData.pdfUrl
                      : undefined
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition-all hover:border-rose-300 hover:bg-rose-50/40 hover:text-rose-700"
                >
                  <svg
                    className="h-3.5 w-3.5 text-rose-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>Document (PDF)</span>
                </a>
              )}
              {reviewDetails.submissionData.zipUrl && (
                <a
                  href={
                    isSafeHttpUrl(reviewDetails.submissionData.zipUrl)
                      ? reviewDetails.submissionData.zipUrl
                      : undefined
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition-all hover:border-amber-300 hover:bg-amber-50/40 hover:text-amber-700"
                >
                  <svg
                    className="h-3.5 w-3.5 text-amber-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                  <span>Archive (ZIP)</span>
                </a>
              )}
            </>
          ) : (
            <Span className="text-xs text-slate-400 italic">No attachments submitted</Span>
          )}
        </div>
      </div>

      {/* Action Success / Error Alerts */}
      {actionSuccess && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800"
        >
          <Span className="text-emerald-600">✓</Span>
          <Span>{actionSuccess}</Span>
        </div>
      )}

      {gradeMutation.isError && (
        <ErrorMessage
          title={isGradeConflict ? 'New Version Available' : 'Grading failed'}
          error={
            isGradeConflict
              ? 'A newer version of this submission exists — reload to review and grade the latest version.'
              : gradeMutation.error
          }
          onRetry={isGradeConflict && onRefetch ? onRefetch : undefined}
          className="mt-2"
        />
      )}

      {resubmitMutation.isError && (
        <ErrorMessage
          title="Resubmission request failed"
          error={resubmitMutation.error}
          className="mt-2"
        />
      )}

      {/* Existing Grade Card */}
      {reviewDetails.status === SubmissionStatus.GRADED && !isEditingExisting && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <Span className="text-2xl font-bold text-slate-900">
                {reviewDetails.grading.marks}
                <Span className="text-sm font-normal text-slate-500">
                  {' '}
                  / {reviewDetails.maxMarks}
                </Span>
              </Span>
              <Span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                {reviewDetails.grading.gradeLabel}
              </Span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditingExisting(true)}
              className="text-xs"
            >
              Edit Score
            </Button>
          </div>
          {reviewDetails.grading.feedback && (
            <P className="mt-2 text-xs whitespace-pre-wrap text-slate-600">
              {reviewDetails.grading.feedback}
            </P>
          )}
          {reviewDetails.grading.gradedAt && (
            <Span className="mt-2 block text-[11px] text-slate-400">
              Graded {formatDateIST(reviewDetails.grading.gradedAt)}
            </Span>
          )}
        </div>
      )}

      {/* Grading & Resubmission Controls */}
      {(reviewDetails.status !== SubmissionStatus.GRADED || isEditingExisting) && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          {/* Tab Selector */}
          <div
            role="tablist"
            aria-label="Review actions"
            className="mb-4 flex rounded-lg bg-slate-100 p-0.5"
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const next = activeTab === 'grade' ? 'resubmit' : 'grade';
                setActiveTab(next);
                document.getElementById(next === 'grade' ? gradeTabId : resubmitTabId)?.focus();
              }
            }}
          >
            <button
              id={gradeTabId}
              role="tab"
              aria-selected={activeTab === 'grade'}
              aria-controls={gradePanelId}
              type="button"
              onClick={() => setActiveTab('grade')}
              className={cn(
                'flex-1 cursor-pointer rounded-md py-1.5 text-xs font-semibold transition-all',
                activeTab === 'grade'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800',
              )}
            >
              Grade
            </button>
            <button
              id={resubmitTabId}
              role="tab"
              aria-selected={activeTab === 'resubmit'}
              aria-controls={resubmitPanelId}
              type="button"
              onClick={() => setActiveTab('resubmit')}
              className={cn(
                'flex-1 cursor-pointer rounded-md py-1.5 text-xs font-semibold transition-all',
                activeTab === 'resubmit'
                  ? 'bg-white text-amber-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800',
              )}
            >
              Request Resubmission
            </button>
          </div>

          {/* Grade Tab Panel */}
          {activeTab === 'grade' && (
            <form
              id={gradePanelId}
              role="tabpanel"
              aria-labelledby={gradeTabId}
              onSubmit={(e) => void handleGradeSubmit(e)}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label
                    htmlFor={marksInputId}
                    required
                    className="text-xs font-medium text-slate-700"
                  >
                    Marks (out of {reviewDetails.maxMarks})
                  </Label>
                  <Input
                    id={marksInputId}
                    type="number"
                    min={0}
                    max={reviewDetails.maxMarks}
                    step="0.5"
                    required
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    placeholder={`0 to ${reviewDetails.maxMarks}`}
                    hasError={Boolean(marksError)}
                    {...(marksError ? { errorId: `${marksInputId}-error` } : {})}
                    className="h-9 text-xs"
                  />
                  {marksError && <FieldError id={`${marksInputId}-error`} error={marksError} />}
                </div>
                <div className="flex flex-col gap-1">
                  <Span className="text-xs font-medium text-slate-700">Grade</Span>
                  <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800">
                    {previewGradeLabel ?? '—'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor={feedbackInputId} className="text-xs font-medium text-slate-700">
                  Feedback <Span className="font-normal text-slate-400">(optional)</Span>
                </Label>
                <Textarea
                  id={feedbackInputId}
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Guidance or review points for the mentee..."
                  className="text-xs"
                  maxLength={5000}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (isEditingExisting && reviewDetails.status === SubmissionStatus.GRADED) {
                      setIsEditingExisting(false);
                    } else {
                      onClose();
                    }
                  }}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={
                    gradeMutation.isPending ||
                    numMarks === null ||
                    isNaN(numMarks) ||
                    numMarks < 0 ||
                    numMarks > maxMarks
                  }
                  className="cursor-pointer border border-blue-200 bg-blue-50 font-semibold text-blue-700 shadow-2xs hover:border-blue-300 hover:bg-blue-100 hover:text-blue-800"
                >
                  {gradeMutation.isPending ? 'Saving...' : 'Save Grade'}
                </Button>
              </div>
            </form>
          )}

          {/* Resubmit Tab Panel */}
          {activeTab === 'resubmit' && (
            <form
              id={resubmitPanelId}
              role="tabpanel"
              aria-labelledby={resubmitTabId}
              onSubmit={(e) => void handleResubmitSubmit(e)}
              className="space-y-3"
            >
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor={resubmitInputId}
                  required
                  className="text-xs font-medium text-slate-700"
                >
                  Reason for Resubmission
                </Label>
                <Textarea
                  id={resubmitInputId}
                  rows={3}
                  required
                  value={resubmitFeedback}
                  onChange={(e) => setResubmitFeedback(e.target.value)}
                  placeholder="Explain what changes are required before re-grading..."
                  className="text-xs"
                  maxLength={5000}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={resubmitMutation.isPending || !resubmitFeedback.trim()}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {resubmitMutation.isPending ? 'Submitting...' : 'Request Resubmission'}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export interface SubmissionReviewModalProps {
  readonly submissionId: string | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function SubmissionReviewModal({
  submissionId,
  isOpen,
  onClose,
}: SubmissionReviewModalProps) {
  const {
    reviewDetails,
    isLoading,
    error: reviewError,
    refetch,
  } = useReviewDetails(submissionId, isOpen);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={reviewDetails?.assignmentTitle ?? 'Review Submission'}
      description={
        reviewDetails ? (
          <Span className="mt-1 inline-flex flex-wrap items-center gap-2 text-xs">
            <Span className="font-semibold text-slate-800">{reviewDetails.mentee.name}</Span>
            <Span className="text-slate-300">•</Span>
            <Span className="text-slate-600">{reviewDetails.courseTitle}</Span>
            <Span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#0044D3]">
              v{reviewDetails.version}
            </Span>
            {reviewDetails.batchName && (
              <>
                <Span className="text-slate-300">•</Span>
                <Span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                  {reviewDetails.batchName}
                </Span>
              </>
            )}
          </Span>
        ) : undefined
      }
      size="lg"
    >
      {isLoading && (
        <div className="flex h-48 items-center justify-center">
          <P className="text-sm text-slate-500">Loading submission details...</P>
        </div>
      )}

      {reviewError && !reviewDetails && (
        <ErrorMessage
          title="Could not load submission details"
          error={reviewError}
          onRetry={() => void refetch()}
          className="my-4"
        />
      )}

      {reviewDetails && (
        <SubmissionReviewContent
          key={`${reviewDetails.id}-${reviewDetails.version}-${reviewDetails.status}-${reviewDetails.grading.gradedAt ?? 'ungraded'}`}
          reviewDetails={reviewDetails}
          onRefetch={() => void refetch()}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

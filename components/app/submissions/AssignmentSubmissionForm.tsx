'use client';

import React, { useEffect, useState } from 'react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { H3, P, Span } from '@/components/ui/Typography';
import { useSubmitAssignment } from '@/hooks/useSubmissions';
import { formatDateTimeIST, isDatePast } from '@/lib/date';
import { isSafeHttpUrl } from '@/lib/url';
import type { BatchStatus } from '@/lib/validation/batch.schemas';
import type { Assignment } from '@/types/courses';
import { SubmissionMode } from '@/types/courses';
import type { SubmissionData, SubmissionVersion } from '@/types/submissions';

interface AssignmentSubmissionFormProps {
  assignment: Assignment;
  dueDate: string;
  isBatchActive: boolean;
  batchStatus: BatchStatus;
  latestVersion?: SubmissionVersion | null | undefined;
  onSuccess?: ((submission: SubmissionVersion) => void) | undefined;
}

interface SubmissionFieldDefinition {
  readonly key: 'pdfUrl' | 'zipUrl' | 'url';
  readonly id: string;
  readonly label: string;
  readonly placeholder: string;
  readonly getMode: (a: Assignment) => SubmissionMode;
  readonly requiredMessage: string;
  readonly invalidMessage: string;
}

const SUBMISSION_LINK_FIELDS: readonly SubmissionFieldDefinition[] = [
  {
    key: 'pdfUrl',
    id: 'pdf_url',
    label: 'PDF Document URL',
    placeholder: 'https://example.com/my-document.pdf',
    getMode: (a) => a.pdfMode,
    requiredMessage: 'PDF document link is required.',
    invalidMessage: 'Please enter a valid HTTP or HTTPS URL for the PDF document.',
  },
  {
    key: 'zipUrl',
    id: 'zip_url',
    label: 'ZIP Archive URL',
    placeholder: 'https://example.com/project-files.zip',
    getMode: (a) => a.zipMode,
    requiredMessage: 'ZIP archive link is required.',
    invalidMessage: 'Please enter a valid HTTP or HTTPS URL for the ZIP archive.',
  },
  {
    key: 'url',
    id: 'url',
    label: 'Project / Repository URL',
    placeholder: 'https://github.com/my-repo or https://my-app.vercel.app',
    getMode: (a) => a.urlMode,
    requiredMessage: 'Project / repository URL is required.',
    invalidMessage: 'Please enter a valid HTTP or HTTPS URL for the project repository.',
  },
] as const;

export function AssignmentSubmissionForm({
  assignment,
  dueDate,
  isBatchActive,
  batchStatus,
  latestVersion,
  onSuccess,
}: Readonly<AssignmentSubmissionFormProps>) {
  const [pdfUrl, setPdfUrl] = useState('');
  const [zipUrl, setZipUrl] = useState('');
  const [url, setUrl] = useState('');
  const [confirmedComplete, setConfirmedComplete] = useState(false);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [clientErrorMsg, setClientErrorMsg] = useState<string | null>(null);

  const submitMutation = useSubmitAssignment();

  // Auto-dismiss success notification after 5 seconds
  useEffect(() => {
    if (submitMutation.isSuccess) {
      const timer = setTimeout(() => {
        submitMutation.reset();
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [submitMutation.isSuccess, submitMutation]);

  const isPastDue = isDatePast(dueDate);
  const isLateBlocked = isPastDue && !assignment.allowLate;
  const isReadOnlyBatch =
    !isBatchActive ||
    batchStatus === 'ON_HOLD' ||
    batchStatus === 'COMPLETED' ||
    batchStatus === 'ARCHIVED';

  const nextVersion = latestVersion ? latestVersion.version + 1 : 1;
  const isResubmission = Boolean(latestVersion);

  const fieldValues: Record<'pdfUrl' | 'zipUrl' | 'url', string> = {
    pdfUrl,
    zipUrl,
    url,
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    let firstError: string | null = null;

    for (const field of SUBMISSION_LINK_FIELDS) {
      const mode = field.getMode(assignment);
      const val = fieldValues[field.key].trim();

      if (mode === SubmissionMode.REQUIRED && !val) {
        errors[field.key] = field.requiredMessage;
        if (!firstError) firstError = field.requiredMessage;
      } else if (val && !isSafeHttpUrl(val)) {
        errors[field.key] = field.invalidMessage;
        if (!firstError) firstError = field.invalidMessage;
      }
    }

    const isAnyFieldEnabled = SUBMISSION_LINK_FIELDS.some(
      (f) => f.getMode(assignment) !== SubmissionMode.OFF,
    );
    const hasAnyContent = SUBMISSION_LINK_FIELDS.some((f) => Boolean(fieldValues[f.key].trim()));

    if (isAnyFieldEnabled && !hasAnyContent) {
      errors.general = 'At least one submission field (PDF, ZIP, or Project URL) must be provided.';
      if (!firstError) firstError = errors.general;
    }

    if (!confirmedComplete) {
      errors.confirmedComplete =
        'You must confirm that you have completed this assignment before submitting.';
      if (!firstError) firstError = errors.confirmedComplete;
    }

    setClientErrorMsg(firstError);
    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientErrorMsg(null);
    if (!validate()) return;

    const submissionData: SubmissionData = {
      pdfUrl: pdfUrl.trim() || undefined,
      zipUrl: zipUrl.trim() || undefined,
      linkUrl: url.trim() || undefined,
    };

    try {
      const result = await submitMutation.mutateAsync({
        assignmentId: assignment.id,
        submissionData,
        confirmedComplete,
      });

      // Clear form on success
      setPdfUrl('');
      setZipUrl('');
      setUrl('');
      setConfirmedComplete(false);
      setClientErrors({});
      setClientErrorMsg(null);

      onSuccess?.(result);
    } catch {
      // Handled by TanStack mutation state
    }
  };

  if (isReadOnlyBatch) {
    return null;
  }

  if (isLateBlocked) {
    return (
      <Alert
        variant="error"
        title="Assignment Deadline Expired"
        message={`The due date for this assignment was ${formatDateTimeIST(dueDate)}. Late submissions are not accepted.`}
      />
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
        <H3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {isResubmission ? `Submit Revision (Version ${nextVersion})` : 'Submit Assignment'}
        </H3>
        <P className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Due Date:{' '}
          <strong className="text-slate-700 dark:text-slate-300">
            {formatDateTimeIST(dueDate)}
          </strong>
        </P>
      </div>

      {/* Due date and Late submission warnings */}
      {isPastDue && assignment.allowLate ? (
        <Alert
          variant="warning"
          title="Late Submission Warning"
          message={`The due date was ${formatDateTimeIST(dueDate)}. Because late submissions are permitted, you can still submit, but your work will be flagged as Late.`}
        />
      ) : null}

      {/* Consistent design-system error banner (matching Photo 2) */}
      {clientErrorMsg && (
        <FieldError
          error={clientErrorMsg}
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-xs"
        />
      )}

      {submitMutation.error && (
        <FieldError
          error={
            submitMutation.error.message || 'An error occurred while submitting your assignment.'
          }
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-xs"
        />
      )}

      {submitMutation.isSuccess ? (
        <div className="relative">
          <Alert
            variant="success"
            title="Submission Successful!"
            message={`Your submission (Version ${nextVersion}) was successfully recorded. Your mentor has been notified.`}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => submitMutation.reset()}
            aria-label="Dismiss success message"
            className="absolute top-2.5 right-2.5 h-6 w-6 p-0 text-emerald-800 hover:bg-emerald-100 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
          >
            ✕
          </Button>
        </div>
      ) : null}

      <div className="space-y-4">
        {SUBMISSION_LINK_FIELDS.map((field) => {
          const mode = field.getMode(assignment);
          if (mode === SubmissionMode.OFF) return null;

          const isRequired = mode === SubmissionMode.REQUIRED;
          const val = fieldValues[field.key];
          const fieldError = clientErrors[field.key];

          const handleChange = (newVal: string) => {
            if (field.key === 'pdfUrl') setPdfUrl(newVal);
            else if (field.key === 'zipUrl') setZipUrl(newVal);
            else setUrl(newVal);
            setClientErrorMsg(null);
            setClientErrors((prev) => ({ ...prev, [field.key]: '', general: '' }));
          };

          return (
            <div key={field.id}>
              <div className="mb-1.5 flex items-center justify-between">
                <Label htmlFor={field.id}>{field.label}</Label>
                <Span
                  className={
                    isRequired
                      ? 'text-xs font-semibold text-rose-600 dark:text-rose-400'
                      : 'text-xs text-slate-500 dark:text-slate-400'
                  }
                >
                  {isRequired ? 'Required' : 'Optional'}
                </Span>
              </div>
              <Input
                id={field.id}
                type="text"
                inputMode="url"
                placeholder={field.placeholder}
                value={val}
                onChange={(e) => handleChange(e.target.value)}
                hasError={Boolean(fieldError)}
                disabled={submitMutation.isPending}
              />
              {fieldError ? (
                <FieldError error={fieldError} className="mt-1.5 text-xs text-rose-600" />
              ) : null}
            </div>
          );
        })}

        {/* Mandatory Completion Confirmation Checkbox */}
        <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-start gap-3">
            <Checkbox
              id="confirmed_complete"
              checked={confirmedComplete}
              onChange={(e) => {
                setConfirmedComplete(e.target.checked);
                setClientErrorMsg(null);
                setClientErrors((prev) => ({ ...prev, confirmedComplete: '' }));
              }}
              disabled={submitMutation.isPending}
              aria-invalid={Boolean(clientErrors.confirmedComplete)}
              aria-describedby={
                clientErrors.confirmedComplete ? 'confirmed-complete-error' : undefined
              }
              className="mt-0.5"
            />
            <Label
              htmlFor="confirmed_complete"
              className="cursor-pointer text-xs leading-relaxed font-medium text-slate-700 select-none dark:text-slate-300"
            >
              <strong className="text-slate-900 dark:text-slate-100">
                I confirm that I have completed this assignment
              </strong>{' '}
              and that all submitted work and resources represent my own original effort.
            </Label>
          </div>
          {clientErrors.confirmedComplete ? (
            <FieldError
              id="confirmed-complete-error"
              error={clientErrors.confirmedComplete}
              className="mt-1 text-xs text-rose-600"
            />
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <Button
          type="submit"
          variant="primary"
          isLoading={submitMutation.isPending}
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending
            ? 'Submitting...'
            : isResubmission
              ? `Submit Revision (v${nextVersion})`
              : 'Submit Assignment'}
        </Button>
      </div>
    </form>
  );
}

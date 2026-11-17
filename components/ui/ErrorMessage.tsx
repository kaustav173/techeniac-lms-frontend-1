import React from 'react';

import { Button } from '@/components/ui/Button';
import { H4, P, Span } from '@/components/ui/Typography';
import { cn } from '@/lib/cn';
import { ApiError } from '@/lib/errors';

export interface ErrorDetailItem {
  field?: string | undefined;
  message?: string | undefined;
}

export interface ErrorMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly error?: unknown;
  readonly title?: string | undefined;
  readonly onDismiss?: (() => void) | undefined;
  readonly onRetry?: (() => void) | undefined;
  readonly className?: string | undefined;
}

/**
 * Parses and formats any incoming backend API error, ApiError instance, standard Error,
 * or custom error object into human-understandable title, message, code, and details.
 */
export function parseApiError(err: unknown): {
  title: string;
  message: string;
  code?: string | undefined;
  status?: number | undefined;
  details?: ErrorDetailItem[] | undefined;
} {
  if (!err) {
    return { title: 'Error', message: 'An unknown error occurred.' };
  }

  // Handle simple string errors
  if (typeof err === 'string') {
    return { title: 'Operation Failed', message: err };
  }

  // Handle ApiError instance
  if (err instanceof ApiError) {
    const details = parseDetails(err.details);
    let title = 'Operation Failed';
    if (err.status === 400) title = 'Invalid Request';
    else if (err.status === 401) title = 'Authentication Required';
    else if (err.status === 403) title = 'Access Denied';
    else if (err.status === 404) title = 'Not Found';
    else if (err.status === 409) title = 'Conflict';
    else if (err.status === 422) title = 'Validation Failed';
    else if (err.status === 429) title = 'Too Many Requests';
    else if (err.status >= 500) title = 'Server Error';

    return {
      title,
      message: err.message || 'The server encountered an error processing your request.',
      code: err.code,
      status: err.status,
      details,
    };
  }

  // Handle generic object with error / message structure
  if (typeof err === 'object' && err !== null) {
    const anyErr = err as {
      message?: string;
      code?: string;
      status?: number;
      error?: { message?: string; code?: string; details?: unknown };
      details?: unknown;
    };

    const code = anyErr.error?.code || anyErr.code;
    const status = anyErr.status;
    const rawDetails = anyErr.error?.details || anyErr.details;
    const details = parseDetails(rawDetails);

    const message =
      anyErr.error?.message ||
      anyErr.message ||
      (err instanceof Error ? err.message : 'An unexpected error occurred.');

    let title = 'Operation Failed';
    if (code === 'VALIDATION_ERROR' || code === 'BAD_REQUEST') title = 'Validation Failed';
    else if (code === 'CONFLICT') title = 'Action Conflict';
    else if (code === 'NOT_FOUND') title = 'Resource Not Found';
    else if (code === 'UNAUTHORIZED' || code === 'UNAUTHENTICATED')
      title = 'Authentication Required';
    else if (code === 'FORBIDDEN') title = 'Access Denied';
    else if (code === 'INTERNAL_ERROR' || (status && status >= 500)) title = 'Server Error';

    return {
      title,
      message,
      code,
      status,
      details,
    };
  }

  return { title: 'Error', message: 'An unexpected error occurred.' };
}

function parseDetails(raw: unknown): ErrorDetailItem[] | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) {
    const items: ErrorDetailItem[] = [];
    for (const item of raw) {
      if (typeof item === 'string') {
        items.push({ message: item });
      } else if (typeof item === 'object' && item !== null) {
        const d = item as { field?: unknown; message?: unknown; issue?: unknown };
        const msg =
          typeof d.message === 'string' ? d.message : typeof d.issue === 'string' ? d.issue : '';
        const field = typeof d.field === 'string' ? d.field : undefined;
        if (msg) items.push({ field, message: msg });
      }
    }
    return items.length > 0 ? items : undefined;
  }
  return undefined;
}

/**
 * Global high-contrast, accessible error banner component designed to clearly
 * present backend error messages, validation details, and error codes across all portals.
 */
export function ErrorMessage({
  error,
  title: customTitle,
  onDismiss,
  onRetry,
  className,
  ...props
}: Readonly<ErrorMessageProps>) {
  if (!error) return null;

  const parsed = parseApiError(error);
  const title = customTitle || parsed.title;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'relative rounded-xl border border-red-300 bg-red-50/95 p-4 text-red-950 shadow-xs transition-all',
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        {/* Warning Icon */}
        <div className="mt-0.5 shrink-0 rounded-full bg-red-100 p-1.5 text-red-700">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Content Area */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <H4 className="text-sm leading-tight font-semibold text-red-950">{title}</H4>
          </div>

          {/* Main Error Message (high-contrast dark text) */}
          <P className="mt-1.5 text-xs leading-relaxed font-normal text-red-800">
            {parsed.message}
          </P>

          {/* Field-level validation or itemized details */}
          {parsed.details && parsed.details.length > 0 ? (
            <ul className="mt-2.5 space-y-1 rounded-lg border border-red-200/80 bg-white/70 p-2.5 text-xs text-red-900">
              {parsed.details.map((item, idx) => (
                <li
                  key={`${item.field || idx}-${item.message}`}
                  className="flex items-start gap-1.5"
                >
                  <Span className="font-bold text-red-500">•</Span>
                  <Span>
                    {item.field ? (
                      <Span className="font-semibold text-red-950">{item.field}: </Span>
                    ) : null}
                    <Span className="text-red-800">{item.message}</Span>
                  </Span>
                </li>
              ))}
            </ul>
          ) : null}

          {/* Action Area: Retry Button */}
          {onRetry ? (
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-auto border-red-300 bg-white px-2.5 py-1 text-xs font-medium text-red-800 shadow-2xs hover:border-red-400 hover:bg-red-50 focus-visible:ring-red-500"
              >
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.451a.75.75 0 000-1.5H4.5a.75.75 0 00-.75.75v3.75a.75.75 0 001.5 0v-2.138l.43.43a7 7 0 101.996-8.232.75.75 0 00-.976 1.14 5.5 5.5 0 018.612 3.645z"
                    clipRule="evenodd"
                  />
                </svg>
                Retry
              </Button>
            </div>
          ) : null}
        </div>

        {/* Dismiss Button */}
        {onDismiss ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="-mt-1 -mr-1 h-auto shrink-0 p-1.5 text-red-500 hover:bg-red-100 hover:text-red-800"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

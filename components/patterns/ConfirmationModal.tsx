'use client';

import React, { useId, useRef } from 'react';

import { Button, type ButtonVariant } from '@/components/ui/Button';
import { H3, P, Span } from '@/components/ui/Typography';
import { useDialogAccessibility } from '@/hooks/useDialogAccessibility';
import { cn } from '@/lib/cn';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string | undefined;
  cancelLabel?: string | undefined;
  confirmVariant?: ButtonVariant | undefined;
  isLoading?: boolean | undefined;
  errorMessage?: string | null | undefined;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
  errorMessage,
}: Readonly<ConfirmationModalProps>) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useDialogAccessibility({
    isOpen,
    onClose,
    dialogRef,
  });

  if (!isOpen) return null;

  const isDanger = confirmVariant === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="animate-in fade-in zoom-in-95 w-full max-w-sm rounded-3xl border border-[#E1E6EC] bg-white p-6 text-center shadow-xl duration-150 focus:outline-none sm:p-7"
      >
        {/* Semantic Icon Circle */}
        <div
          className={cn(
            'mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xs',
            isDanger ? 'bg-[#D92D20]' : 'bg-[#F79009]',
          )}
        >
          {isDanger ? (
            <svg
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          ) : (
            <svg
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
        </div>

        {/* Title */}
        <H3 id={titleId} className="mt-4 text-xl font-bold text-slate-900">
          {title}
        </H3>

        {/* Description */}
        <P
          id={descId}
          className="mx-auto mt-2 max-w-xs text-sm leading-relaxed font-medium text-slate-600"
        >
          {description}
        </P>

        {/* Optional Error Alert */}
        {errorMessage ? (
          <div
            role="alert"
            className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-sm font-semibold text-[#D92D20]"
          >
            {errorMessage}
          </div>
        ) : null}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isLoading}
            className="h-11 rounded-full border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Span>{cancelLabel}</Span>
          </Button>

          <Button
            type="button"
            variant={confirmVariant}
            size="md"
            onClick={() => {
              void onConfirm();
            }}
            isLoading={isLoading}
            className={cn(
              'h-11 rounded-full px-6 text-sm font-semibold text-white',
              isDanger ? 'bg-[#D92D20] hover:bg-[#B42318]' : 'bg-[#0044D3] hover:bg-[#0036AB]',
            )}
          >
            <Span>{confirmLabel}</Span>
          </Button>
        </div>
      </div>
    </div>
  );
}

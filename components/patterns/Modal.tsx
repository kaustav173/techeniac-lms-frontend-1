'use client';

import React, { useRef } from 'react';

import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { useDialogAccessibility } from '@/hooks/useDialogAccessibility';
import { cn } from '@/lib/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl' | undefined;
  footer?: React.ReactNode | undefined;
  children: React.ReactNode;
  initialFocusRef?: React.RefObject<HTMLElement | null> | undefined;
  className?: string | undefined;
  titleClassName?: string | undefined;
  ariaLabelledBy?: string | undefined;
  isSubmitting?: boolean | undefined;
  preventClose?: boolean | undefined;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  children,
  initialFocusRef,
  className,
  titleClassName,
  ariaLabelledBy,
  isSubmitting = false,
  preventClose = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const isLocked = Boolean(isSubmitting || preventClose);

  useDialogAccessibility({
    isOpen,
    onClose,
    dialogRef,
    initialFocusRef,
    preventClose: isLocked,
  });

  if (!isOpen) return null;

  const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
  };

  const generatedTitleId =
    typeof title === 'string'
      ? `modal-title-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
      : 'modal-dialog-title';

  const resolvedTitleId = ariaLabelledBy ?? generatedTitleId;

  return (
    <div
      onClick={() => {
        if (!isLocked) {
          onClose();
        }
      }}
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm duration-150"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={resolvedTitleId}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl',
          sizeClasses[size],
          className,
        )}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <Typography
              id={resolvedTitleId}
              as="h3"
              variant="h3"
              className={cn('text-lg font-bold text-slate-900 sm:text-xl', titleClassName)}
            >
              {title}
            </Typography>
            {description ? (
              <Typography as="p" variant="muted" className="mt-0.5 text-xs text-slate-500">
                {description}
              </Typography>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLocked}
            aria-label="Close dialog"
            className="flex h-10 w-10 items-center justify-center rounded-full p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Modal Body */}
        <div className="space-y-5 overflow-y-auto p-6">{children}</div>

        {/* Modal Footer */}
        {footer ? (
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 p-4 sm:p-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

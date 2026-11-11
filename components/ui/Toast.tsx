'use client';

import React, { useEffect, useState } from 'react';

import { Span } from '@/components/ui/Typography';
import { cn } from '@/lib/cn';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  readonly id: string;
  readonly message: string;
  readonly variant: ToastVariant;
  readonly duration: number;
  readonly onDismiss: (id: string) => void;
}

const variantStyles: Record<ToastVariant, string> = {
  success: 'bg-slate-900 text-white border-slate-700',
  error: 'bg-red-900 text-white border-red-700',
  warning: 'bg-amber-800 text-white border-amber-600',
  info: 'bg-blue-900 text-white border-blue-700',
};

const iconPaths: Record<ToastVariant, React.ReactElement> = {
  success: <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />,
  error: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  ),
  warning: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  ),
  info: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
};

const iconColors: Record<ToastVariant, string> = {
  success: 'text-emerald-400',
  error: 'text-red-300',
  warning: 'text-amber-300',
  info: 'text-blue-300',
};

export function Toast({ id, message, variant, duration, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation on mount
    const enterTimer = setTimeout(() => setVisible(true), 10);

    // Begin exit animation before removal
    const exitTimer = setTimeout(() => setVisible(false), duration - 300);

    // Notify parent to remove after animation completes
    const removeTimer = setTimeout(() => onDismiss(id), duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [id, duration, onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(id), 300);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex w-full max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg',
        'transition-all duration-300 ease-in-out',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
        variantStyles[variant],
      )}
    >
      {/* Icon */}
      <svg
        className={cn('h-4 w-4 shrink-0', iconColors[variant])}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        {iconPaths[variant]}
      </svg>

      {/* Message */}
      <Span className="flex-1 text-sm leading-snug text-white">{message}</Span>

      {/* Close button */}
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={handleDismiss}
        className="ml-auto shrink-0 cursor-pointer rounded p-0.5 opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-white/50 focus:outline-none"
      >
        <svg
          className="h-3.5 w-3.5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

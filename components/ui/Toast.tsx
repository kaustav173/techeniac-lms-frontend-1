'use client';

import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Span } from '@/components/ui/Typography';
import { cn } from '@/lib/cn';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  readonly id: string;
  readonly message: string;
  readonly title?: string | undefined;
  readonly variant: ToastVariant;
  readonly duration: number;
  readonly onDismiss: (id: string) => void;
}

const variantStyles: Record<ToastVariant, string> = {
  success: 'bg-slate-900 text-white border-slate-700/80',
  error: 'bg-red-950 text-white border-red-800/80',
  warning: 'bg-amber-950 text-white border-amber-800/80',
  info: 'bg-blue-950 text-white border-blue-800/80',
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

export function Toast({ id, message, title, variant, duration, onDismiss }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setIsExiting(true), Math.max(0, duration - 250));
    const removeTimer = setTimeout(() => onDismiss(id), duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [id, duration, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(id), 200);
  };

  const isAlert = variant === 'error';

  return (
    <div
      role={isAlert ? 'alert' : 'status'}
      aria-live={isAlert ? 'assertive' : 'polite'}
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-3.5 text-sm shadow-xl backdrop-blur-xs',
        'animate-in fade-in slide-in-from-top-2 duration-200',
        isExiting && '-translate-y-2 opacity-0 transition-all duration-200 ease-in',
        variantStyles[variant],
      )}
    >
      {/* Icon */}
      <svg
        className={cn('mt-0.5 h-4 w-4 shrink-0', iconColors[variant])}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        {iconPaths[variant]}
      </svg>

      {/* Message and optional title */}
      <div className="min-w-0 flex-1">
        {title ? (
          <Span className="block text-xs font-semibold tracking-wide text-white">{title}</Span>
        ) : null}
        <Span
          className={cn(
            'block text-xs leading-snug',
            title ? 'mt-0.5 text-slate-300' : 'font-medium text-white',
          )}
        >
          {message}
        </Span>
      </div>

      {/* Close button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Dismiss notification"
        onClick={handleDismiss}
        className="ml-auto h-auto w-auto shrink-0 rounded p-0.5 text-white opacity-70 hover:bg-white/10 hover:text-white hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white/50"
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
      </Button>
    </div>
  );
}

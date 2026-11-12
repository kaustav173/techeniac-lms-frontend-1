'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import type { ToastVariant } from '@/components/ui/Toast';

export type { ToastVariant };

export interface ToastItem {
  readonly id: string;
  readonly message: string;
  readonly title?: string | undefined;
  readonly variant: ToastVariant;
  readonly duration: number;
}

export const DEFAULT_TOAST_DURATIONS: Record<ToastVariant, number> = {
  success: 4000,
  info: 4000,
  warning: 5000,
  error: 7000,
};

const MAX_ACTIVE_TOASTS = 4;
const DEDUPE_WINDOW_MS = 1000;

export interface ToastContextValue {
  readonly toasts: ToastItem[];
  readonly addToast: (
    message: string,
    variant?: ToastVariant,
    duration?: number,
    title?: string,
  ) => void;
  readonly removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
  readonly children: React.ReactNode;
}

function generateToastId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const lastToastRef = useRef<{ key: string; time: number } | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'success', duration?: number, title?: string) => {
      const now = Date.now();
      const dedupeKey = `${variant}:${title ?? ''}:${message}`;
      if (
        lastToastRef.current &&
        lastToastRef.current.key === dedupeKey &&
        now - lastToastRef.current.time < DEDUPE_WINDOW_MS
      ) {
        return;
      }
      lastToastRef.current = { key: dedupeKey, time: now };

      const effectiveDuration = duration ?? DEFAULT_TOAST_DURATIONS[variant] ?? 4000;
      const id = generateToastId();

      setToasts((prev) => {
        const next = [...prev, { id, message, title, variant, duration: effectiveDuration }];
        if (next.length > MAX_ACTIVE_TOASTS) {
          return next.slice(next.length - MAX_ACTIVE_TOASTS);
        }
        return next;
      });
    },
    [],
  );

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, addToast, removeToast }),
    [toasts, addToast, removeToast],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToastContext must be used within a <ToastProvider>');
  }
  return ctx;
}

'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { ToastVariant } from '@/components/ui/Toast';

export type { ToastVariant };

export interface ToastItem {
  readonly id: string;
  readonly message: string;
  readonly variant: ToastVariant;
  readonly duration: number;
}

export interface ToastContextValue {
  readonly toasts: ToastItem[];
  readonly addToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  readonly removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
  readonly children: React.ReactNode;
}

const DEFAULT_DURATION = 4000;

function generateToastId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'success', duration: number = DEFAULT_DURATION) => {
      const id = generateToastId();
      setToasts((prev) => [...prev, { id, message, variant, duration }]);
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

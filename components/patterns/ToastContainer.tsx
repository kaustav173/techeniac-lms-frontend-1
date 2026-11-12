'use client';

import React from 'react';

import { Toast } from '@/components/ui/Toast';
import { useToastContext } from '@/context/ToastContext';

export function ToastContainer() {
  const { toasts, removeToast } = useToastContext();

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed top-5 right-5 z-[999999] flex w-full max-w-sm flex-col gap-2.5"
    >
      {toasts.map((t) => (
        <Toast
          key={t.id}
          id={t.id}
          title={t.title}
          message={t.message}
          variant={t.variant}
          duration={t.duration}
          onDismiss={removeToast}
        />
      ))}
    </aside>
  );
}

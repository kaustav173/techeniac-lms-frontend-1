'use client';

import React from 'react';

import { Toast } from '@/components/ui/Toast';
import { useToastContext } from '@/context/ToastContext';

export function ToastContainer() {
  const { toasts, removeToast } = useToastContext();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed right-4 bottom-4 z-[9999] flex flex-col-reverse items-end gap-2 sm:right-6 sm:bottom-6"
    >
      {toasts.map((t) => (
        <Toast
          key={t.id}
          id={t.id}
          message={t.message}
          variant={t.variant}
          duration={t.duration}
          onDismiss={removeToast}
        />
      ))}
    </div>
  );
}

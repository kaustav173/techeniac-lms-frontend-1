'use client';

import { useEffect, useRef } from 'react';

export interface UseDialogAccessibilityOptions {
  isOpen: boolean;
  onClose: () => void;
  dialogRef: React.RefObject<HTMLElement | null>;
  initialFocusRef?: React.RefObject<HTMLElement | null> | undefined;
  preventClose?: boolean | undefined;
}

export function useDialogAccessibility({
  isOpen,
  onClose,
  dialogRef,
  initialFocusRef,
  preventClose = false,
}: UseDialogAccessibilityOptions) {
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const preventCloseRef = useRef(preventClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    preventCloseRef.current = preventClose;
  }, [preventClose]);

  useEffect(() => {
    if (!isOpen) return;

    // Preserve previously focused element to return focus upon dialog dismissal
    previousActiveElement.current = document.activeElement as HTMLElement | null;

    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    // Shift focus into dialog (initialFocusRef target or first focusable node)
    const focusTimer = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        const focusable = dialogEl.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length > 0) {
          focusable[0]?.focus();
        } else {
          dialogEl.focus();
        }
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!preventCloseRef.current) {
          onCloseRef.current();
        }
        return;
      }

      if (e.key === 'Tab') {
        const focusable = dialogEl.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElement.current?.focus();
    };
  }, [isOpen, dialogRef, initialFocusRef]);
}

'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook providing debounced hover/focus prefetch handlers (hover-intent).
 * Mitigates rapid unnecessary network requests when users sweep a mouse over cards/rows
 * or tab through focusable list items.
 *
 * @param fn Optional default callback to execute on hover/focus dwell
 * @param delayMs Dwell delay before executing the prefetch (default: 150ms)
 */
export function useHoverPrefetch(fn?: () => void, delayMs = 150) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const trigger = useCallback(
    (callback?: () => void) => {
      cancel();
      const targetFn = callback ?? fn;
      if (!targetFn) return;
      timerRef.current = setTimeout(() => {
        targetFn();
        timerRef.current = null;
      }, delayMs);
    },
    [cancel, delayMs, fn],
  );

  const getHoverHandlers = useCallback(
    (customFn?: () => void) => ({
      onMouseEnter: () => trigger(customFn),
      onMouseLeave: cancel,
      onFocus: () => trigger(customFn),
      onBlur: cancel,
    }),
    [cancel, trigger],
  );

  return {
    onMouseEnter: () => trigger(fn),
    onMouseLeave: cancel,
    onFocus: () => trigger(fn),
    onBlur: cancel,
    getHoverHandlers,
    cancel,
    trigger,
  };
}

'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { ToastVariant } from '@/components/ui/Toast';

export type { ToastVariant };

export interface ToastItem {
  readonly id: string;
  readonly message: string;
  readonly title?: string | undefined;
  readonly variant: ToastVariant;
  readonly duration: number;
}

export interface SavedNotification {
  readonly id: string;
  readonly message: string;
  readonly title?: string | undefined;
  readonly variant: ToastVariant;
  readonly timestamp: number;
  readonly read: boolean;
}

export const DEFAULT_TOAST_DURATIONS: Record<ToastVariant, number> = {
  success: 4000,
  info: 4000,
  warning: 5000,
  error: 7000,
};

const MAX_ACTIVE_TOASTS = 4;
const MAX_SAVED_NOTIFICATIONS = 50;
const STORAGE_KEY = 'techeniac_saved_notifications';

export interface ToastContextValue {
  readonly toasts: ToastItem[];
  readonly notifications: readonly SavedNotification[];
  readonly unreadCount: number;
  readonly addToast: (
    message: string,
    variant?: ToastVariant,
    duration?: number,
    title?: string,
  ) => void;
  readonly removeToast: (id: string) => void;
  readonly clearAllNotifications: () => void;
  readonly markAllAsRead: () => void;
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

function getInitialSavedNotifications(): SavedNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedNotification[]) : [];
  } catch {
    return [];
  }
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [notifications, setNotifications] = useState<SavedNotification[]>(() =>
    getInitialSavedNotifications(),
  );
  const activeDedupeKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (notifications.length === 0) {
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
      }
    } catch {
      // Ignore sessionStorage availability errors
    }
  }, [notifications]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      if (prev.length === 0 || prev.every((n) => n.read)) return prev;
      return prev.map((n) => ({ ...n, read: true }));
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'success', duration?: number, title?: string) => {
      const now = Date.now();
      const dedupeKey = `${variant}:${title ?? ''}:${message}`;
      if (activeDedupeKeysRef.current.has(dedupeKey)) {
        return;
      }
      activeDedupeKeysRef.current.add(dedupeKey);
      queueMicrotask(() => {
        activeDedupeKeysRef.current.delete(dedupeKey);
      });

      const effectiveDuration = duration ?? DEFAULT_TOAST_DURATIONS[variant] ?? 4000;
      const id = generateToastId();

      // Floating Toast
      setToasts((prev) => {
        const next = [...prev, { id, message, title, variant, duration: effectiveDuration }];
        if (next.length > MAX_ACTIVE_TOASTS) {
          return next.slice(next.length - MAX_ACTIVE_TOASTS);
        }
        return next;
      });

      // Notification Center History
      const newSaved: SavedNotification = {
        id,
        message,
        title,
        variant,
        timestamp: now,
        read: false,
      };

      setNotifications((prev) => [newSaved, ...prev].slice(0, MAX_SAVED_NOTIFICATIONS));
    },
    [],
  );

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      notifications,
      unreadCount,
      addToast,
      removeToast,
      clearAllNotifications,
      markAllAsRead,
    }),
    [
      toasts,
      notifications,
      unreadCount,
      addToast,
      removeToast,
      clearAllNotifications,
      markAllAsRead,
    ],
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

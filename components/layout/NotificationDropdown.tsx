'use client';

import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/Button';
import { P, Span } from '@/components/ui/Typography';
import { type ToastVariant, useToastContext } from '@/context/ToastContext';
import { cn } from '@/lib/cn';

function formatTimeAgo(timestamp: number): string {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const variantStyles: Record<ToastVariant, { badge: string; icon: React.ReactElement }> = {
  success: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: (
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    badge: 'bg-red-50 text-red-700 border-red-200',
    icon: (
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  },
  warning: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: (
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  },
  info: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: (
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
};

const emptySubscribe = () => () => {};

export function NotificationDropdown() {
  const { notifications, unreadCount, clearAllNotifications, markAllAsRead } = useToastContext();
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const displayUnreadCount = isMounted ? unreadCount : 0;

  const closeDropdown = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      markAllAsRead();
      triggerRef.current?.focus();
    }
  }, [isOpen, markAllAsRead]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, closeDropdown]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        event.preventDefault();
        closeDropdown();
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeDropdown]);

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      markAllAsRead();
      triggerRef.current?.focus();
    } else {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button */}
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        size="sm"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`Notifications${displayUnreadCount > 0 ? `, ${displayUnreadCount} unread` : ''}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E1E6EC] bg-white p-0 text-[#667085] shadow-2xs hover:border-slate-300 hover:bg-[#F6F8FC] hover:text-[#111827] focus-visible:ring-2 focus-visible:ring-[#0044D3]"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge Count */}
        {displayUnreadCount > 0 ? (
          <Span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0044D3] px-1 text-[10px] font-bold text-white shadow-xs">
            {displayUnreadCount > 9 ? '9+' : displayUnreadCount}
          </Span>
        ) : null}
      </Button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notification center"
          className="animate-in fade-in slide-in-from-top-2 absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-[#E1E6EC] bg-white shadow-2xl duration-150 sm:w-96"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E1E6EC] px-4 py-3">
            <div className="flex items-center gap-2">
              <Span className="text-sm font-bold text-[#111827]">Notifications</Span>
              {notifications.length > 0 ? (
                <Span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {notifications.length}
                </Span>
              ) : null}
            </div>

            {/* Clear All Button */}
            {notifications.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAllNotifications}
                className="h-7 px-2 text-xs font-semibold text-[#0044D3] hover:bg-blue-50 hover:text-blue-800"
              >
                Clear all
              </Button>
            ) : null}
          </div>

          {/* List of Saved Notifications */}
          <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <P className="mt-2 text-xs font-bold text-slate-800">No notifications yet</P>
              </div>
            ) : (
              notifications.map((item) => {
                const style = variantStyles[item.variant];
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3.5 transition-colors hover:bg-slate-50/80"
                  >
                    {/* Variant Icon Badge */}
                    <div
                      className={cn(
                        'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                        style.badge,
                      )}
                    >
                      {style.icon}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      {item.title ? (
                        <Span className="block truncate text-xs font-bold text-[#111827]">
                          {item.title}
                        </Span>
                      ) : null}
                      <Span className="mt-0.5 block text-xs leading-snug text-slate-600">
                        {item.message}
                      </Span>
                      <Span className="mt-1 block text-[10px] font-medium text-slate-400">
                        {formatTimeAgo(item.timestamp)}
                      </Span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

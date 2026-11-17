'use client';

import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/cn';

export interface TooltipProps {
  readonly content?: React.ReactNode;
  readonly children: React.ReactNode;
  readonly side?: 'top' | 'bottom' | 'left' | 'right';
  readonly delayDuration?: number;
  readonly className?: string;
  readonly containerClassName?: string;
  readonly disabled?: boolean;
}

interface Coords {
  readonly top: number;
  readonly left: number;
  readonly transform: string;
}

const emptySubscribe = () => () => {};

export function Tooltip({
  content,
  children,
  side = 'top',
  delayDuration = 100,
  className,
  containerClassName,
  disabled = false,
}: Readonly<TooltipProps>) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const updateCoords = useCallback(() => {
    if (!triggerRef.current || typeof window === 'undefined') return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 7;

    const tooltipEl = tooltipRef.current;
    const tooltipWidth = tooltipEl ? tooltipEl.offsetWidth : 160;
    const tooltipHeight = tooltipEl ? tooltipEl.offsetHeight : 28;

    const isTooCloseToTop = rect.top < tooltipHeight + gap + 8;
    const effectiveSide = side === 'top' && isTooCloseToTop ? 'bottom' : side;

    let top = 0;
    let left = 0;
    let transform = '';

    if (effectiveSide === 'top') {
      top = rect.top - gap;
      left = rect.left + rect.width / 2;
      const halfWidth = tooltipWidth / 2;
      if (left - halfWidth < 12) {
        left = 12;
        transform = 'translate(0, -100%)';
      } else if (left + halfWidth > window.innerWidth - 12) {
        left = window.innerWidth - 12;
        transform = 'translate(-100%, -100%)';
      } else {
        transform = 'translate(-50%, -100%)';
      }
    } else if (effectiveSide === 'bottom') {
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2;
      const halfWidth = tooltipWidth / 2;
      if (left - halfWidth < 12) {
        left = 12;
        transform = 'translate(0, 0)';
      } else if (left + halfWidth > window.innerWidth - 12) {
        left = window.innerWidth - 12;
        transform = 'translate(-100%, 0)';
      } else {
        transform = 'translate(-50%, 0)';
      }
    } else if (effectiveSide === 'left') {
      top = rect.top + rect.height / 2;
      left = rect.left - gap;
      transform = 'translate(-100%, -50%)';
    } else {
      top = rect.top + rect.height / 2;
      left = rect.right + gap;
      transform = 'translate(0, -50%)';
    }

    setCoords({ top, left, transform });
  }, [side]);

  const showTooltip = useCallback(() => {
    if (disabled || !content) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateCoords();
      setIsVisible(true);
    }, delayDuration);
  }, [disabled, content, delayDuration, updateCoords]);

  const hideTooltip = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsVisible(false);
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    updateCoords();
    const handleScrollOrResize = () => {
      updateCoords();
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isVisible, updateCoords]);

  if (!content || disabled) {
    return <>{children}</>;
  }

  const tooltipElement =
    mounted && isVisible && coords && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            aria-hidden={!isVisible}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: coords.transform,
              zIndex: 9999,
            }}
            className={cn(
              'pointer-events-none rounded-lg border border-slate-200/90 bg-white px-2.5 py-1 text-xs font-medium whitespace-nowrap text-slate-900 shadow-md select-none',
              'animate-in fade-in zoom-in-95 duration-150',
              className,
            )}
          >
            {content}
          </div>,
          document.body,
        )
      : null;

  return (
    <span
      ref={triggerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      className={cn('inline-flex max-w-full min-w-0 items-center', containerClassName)}
    >
      {children}
      {tooltipElement}
    </span>
  );
}

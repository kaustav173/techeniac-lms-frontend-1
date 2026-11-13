'use client';

import { type RefObject, useCallback, useEffect, useState, useSyncExternalStore } from 'react';

export interface UseFloatingMenuPositionOptions {
  readonly isOpen: boolean;
  readonly triggerRef: RefObject<HTMLElement | null>;
  readonly align?: 'left' | 'right' | undefined;
  readonly direction?: 'up' | 'down' | undefined;
  readonly minSpaceBelow?: number | undefined;
  readonly enabled?: boolean | undefined;
}

export interface FloatingMenuCoords {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly openUpwards: boolean;
}

export function useFloatingMenuPosition({
  isOpen,
  triggerRef,
  align = 'left',
  direction = 'down',
  minSpaceBelow = 220,
  enabled = true,
}: UseFloatingMenuPositionOptions) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const [menuCoords, setMenuCoords] = useState<FloatingMenuCoords | null>(null);

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpwards =
      direction === 'up' || (spaceBelow < minSpaceBelow && spaceAbove > spaceBelow);

    setMenuCoords({
      top: openUpwards ? rect.top - 6 : rect.bottom + 6,
      left: align === 'right' ? rect.right : rect.left,
      width: rect.width,
      openUpwards,
    });
  }, [align, direction, minSpaceBelow, triggerRef]);

  useEffect(() => {
    if (!isOpen || !enabled) return;
    updateMenuPosition();

    const handleScrollOrResize = () => {
      updateMenuPosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, enabled, updateMenuPosition]);

  return {
    mounted,
    menuCoords,
    updateMenuPosition,
  };
}

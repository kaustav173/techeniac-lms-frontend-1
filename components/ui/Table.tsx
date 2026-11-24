'use client';

import './Table.css';

import React, { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/cn';
import { useFloatingMenuPosition } from '@/lib/useFloatingMenuPosition';

export interface TableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly children: React.ReactNode;
  readonly scrollRegionLabel?: string;
  readonly fitToViewport?: boolean;
  readonly footer?: React.ReactNode;
}

export const TableContainer = React.forwardRef<HTMLDivElement, TableContainerProps>(
  ({ className, children, scrollRegionLabel, fitToViewport = false, footer, ...props }, ref) => {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const footerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
      const scrollArea = scrollAreaRef.current;
      if (!fitToViewport || !scrollArea) return;

      const main = scrollArea.closest('main') ?? document.body;
      const footerElement = footerRef.current;
      const resize = () => {
        let top = 0;
        for (
          let element: HTMLElement | null = scrollArea;
          element;
          element = element.offsetParent as HTMLElement | null
        ) {
          top += element.offsetTop;
        }
        const bottomPadding = Number.parseFloat(getComputedStyle(main).paddingBottom) || 0;
        const available =
          window.innerHeight - top - (footerElement?.offsetHeight ?? 0) - bottomPadding - 4;
        scrollArea.style.maxHeight = `${Math.max(160, available)}px`;
      };

      const observer = new ResizeObserver(resize);
      observer.observe(main);
      if (footerElement) observer.observe(footerElement);
      for (
        let element: HTMLElement | null = scrollArea;
        element && element !== main;
        element = element.parentElement
      ) {
        for (
          let sibling = element.previousElementSibling;
          sibling;
          sibling = sibling.previousElementSibling
        ) {
          observer.observe(sibling);
        }
      }
      resize();
      window.addEventListener('resize', resize);
      return () => {
        observer.disconnect();
        window.removeEventListener('resize', resize);
        scrollArea.style.removeProperty('max-height');
      };
    }, [fitToViewport]);

    return (
      <div
        ref={ref}
        className={cn(
          'w-full overflow-hidden rounded-3xl border border-[#E1E6EC] bg-white shadow-xs',
          className,
        )}
        {...props}
      >
        <div
          ref={scrollAreaRef}
          className={cn(
            'table-scrollbar w-full overflow-x-auto',
            scrollRegionLabel &&
              'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600',
            fitToViewport && 'max-h-[65dvh] overflow-y-auto overscroll-y-contain',
          )}
          role={scrollRegionLabel ? 'region' : undefined}
          aria-label={scrollRegionLabel}
          tabIndex={scrollRegionLabel ? 0 : undefined}
        >
          {children}
        </div>
        {fitToViewport ? <div ref={footerRef}>{footer}</div> : footer}
      </div>
    );
  },
);
TableContainer.displayName = 'TableContainer';

export function TableRowMenu({
  anchorRef,
  popupRef,
  className,
  children,
}: {
  readonly anchorRef: React.RefObject<HTMLElement | null>;
  readonly popupRef: React.RefObject<HTMLDivElement | null>;
  readonly className?: string;
  readonly children: React.ReactNode;
}) {
  const { mounted, menuCoords } = useFloatingMenuPosition({
    isOpen: true,
    triggerRef: anchorRef,
    align: 'right',
  });
  if (!mounted || !menuCoords) return null;

  const { left, top, openUpwards } = menuCoords;
  return createPortal(
    <div
      ref={popupRef}
      role="menu"
      style={{
        left: `clamp(8px, ${left}px - 11rem, 100vw - 11rem - 8px)`,
        top,
        maxHeight: openUpwards ? top - 8 : `calc(100dvh - ${top}px - 8px)`,
      }}
      className={cn(
        'fixed z-50 w-44 overflow-y-auto',
        openUpwards && '-translate-y-full',
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
}

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  readonly children: React.ReactNode;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, children, ...props }, ref) => (
    <table
      ref={ref}
      className={cn('w-full border-collapse text-left text-sm sm:text-base', className)}
      {...props}
    >
      {children}
    </table>
  ),
);
Table.displayName = 'Table';

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  readonly children: React.ReactNode;
}

export const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn(
        'sticky top-0 z-10 border-b border-[#E1E6EC] bg-[#F6F8FC] text-sm font-semibold text-slate-700',
        className,
      )}
      {...props}
    >
      {children}
    </thead>
  ),
);
TableHeader.displayName = 'TableHeader';

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  readonly children: React.ReactNode;
}

export const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, children, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn('table-body-animated divide-y divide-[#F2F4F7]', className)}
      {...props}
    >
      {children}
    </tbody>
  ),
);
TableBody.displayName = 'TableBody';

export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  readonly children: React.ReactNode;
}

export const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, children, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn(
        'border-t border-[#E1E6EC] bg-white text-xs font-medium text-[#667085] sm:text-sm',
        className,
      )}
      {...props}
    >
      {children}
    </tfoot>
  ),
);
TableFooter.displayName = 'TableFooter';

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  readonly children: React.ReactNode;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, children, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('animate-row-enter transition-colors hover:bg-[#F9FAFB]/80', className)}
      {...props}
    >
      {children}
    </tr>
  ),
);
TableRow.displayName = 'TableRow';

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  readonly children?: React.ReactNode;
}

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, scope = 'col', children, ...props }, ref) => (
    <th
      ref={ref}
      scope={scope}
      className={cn(
        'px-4 py-2.5 text-sm font-semibold text-slate-700 sm:px-5 sm:py-3 sm:text-base',
        className,
      )}
      {...props}
    >
      {children}
    </th>
  ),
);
TableHead.displayName = 'TableHead';

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  readonly children?: React.ReactNode;
}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, children, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        'px-4 py-2.5 align-middle text-sm text-[#111827] sm:px-5 sm:py-3 sm:text-base',
        className,
      )}
      {...props}
    >
      {children}
    </td>
  ),
);
TableCell.displayName = 'TableCell';

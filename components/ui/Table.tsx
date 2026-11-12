import React from 'react';

import { cn } from '@/lib/cn';

export interface TableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly children: React.ReactNode;
}

export const TableContainer = React.forwardRef<HTMLDivElement, TableContainerProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'w-full overflow-hidden rounded-3xl border border-[#E1E6EC] bg-white shadow-xs',
        className,
      )}
      {...props}
    >
      <div className="w-full overflow-x-auto">{children}</div>
    </div>
  ),
);
TableContainer.displayName = 'TableContainer';

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

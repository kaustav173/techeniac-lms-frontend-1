'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Span } from '@/components/ui/Typography';
import { cn } from '@/lib/cn';
import { useClickOutside } from '@/lib/useClickOutside';
import { useFloatingMenuPosition } from '@/lib/useFloatingMenuPosition';

export interface SingleSelectOption<T extends string | number = string> {
  readonly value: T;
  readonly label: string;
}

export interface SingleSelectDropdownProps<T extends string | number = string> {
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly options: readonly SingleSelectOption<T>[];
  readonly label?: string | undefined;
  readonly placeholder?: string | undefined;
  readonly triggerLabel?: string | undefined;
  readonly disabled?: boolean | undefined;
  readonly className?: string | undefined;
  readonly triggerClassName?: string | undefined;
  readonly menuClassName?: string | undefined;
  readonly direction?: 'down' | 'up' | undefined;
  readonly size?: 'sm' | 'md' | undefined;
  readonly id?: string | undefined;
  readonly 'aria-label'?: string | undefined;
  readonly align?: 'left' | 'right' | undefined;
}

export function SingleSelectDropdown<T extends string | number = string>({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select an option',
  triggerLabel,
  disabled = false,
  className,
  triggerClassName,
  menuClassName,
  direction = 'down',
  size = 'md',
  id,
  'aria-label': ariaLabel,
  align = 'left',
}: Readonly<SingleSelectDropdownProps<T>>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const generatedId = useId();
  const selectId = id ?? generatedId;

  const { mounted, menuCoords } = useFloatingMenuPosition({
    isOpen,
    triggerRef,
    align,
    direction,
    minSpaceBelow: 220,
  });

  // Close when clicking outside both container and floating menu
  useClickOutside([containerRef, menuRef], () => setIsOpen(false), isOpen);

  // Escape to close and refocus trigger
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  const displayLabel = triggerLabel ?? (selectedOption ? selectedOption.label : placeholder);
  const isDefaultOrAll =
    value === '' ||
    value === undefined ||
    value === null ||
    value === 'ALL' ||
    selectedOption?.value === '' ||
    selectedOption?.value === 'ALL';

  const handleSelect = (optionValue: T) => {
    onChange(optionValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn('relative inline-block w-full text-left', className)}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-xl border border-[#E1E6EC] bg-white text-slate-800 shadow-xs transition-all',
          'hover:border-slate-300 hover:bg-slate-50/70',
          'focus:border-[#0044D3] focus:ring-2 focus:ring-[#0044D3]/15 focus:outline-none',
          'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:opacity-70',
          isOpen && 'border-[#0044D3] ring-2 ring-[#0044D3]/15',
          size === 'sm' && 'h-9 px-3 text-xs font-semibold',
          size === 'md' && 'h-11 px-4 text-sm font-semibold',
          triggerClassName,
        )}
      >
        <Span className="truncate">
          {label ? (
            isDefaultOrAll ? (
              <Span className="font-semibold text-slate-700">{label}</Span>
            ) : (
              <>
                <Span className="font-normal text-slate-500">{label}: </Span>
                <Span className="font-semibold text-slate-900">{displayLabel}</Span>
              </>
            )
          ) : (
            displayLabel
          )}
        </Span>
        <svg
          className={cn(
            'shrink-0 text-slate-400 transition-transform duration-200',
            size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
            isOpen && 'rotate-180 text-[#0044D3]',
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Floating Menu Popover via Portal */}
      {isOpen && mounted && menuCoords && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              role="listbox"
              tabIndex={-1}
              aria-labelledby={selectId}
              style={{
                position: 'fixed',
                top: menuCoords.openUpwards ? undefined : `${menuCoords.top}px`,
                bottom: menuCoords.openUpwards
                  ? `${window.innerHeight - menuCoords.top}px`
                  : undefined,
                left: align === 'right' ? undefined : `${menuCoords.left}px`,
                right: align === 'right' ? `${window.innerWidth - menuCoords.left}px` : undefined,
                width: `${menuCoords.width}px`,
                zIndex: 9999,
              }}
              className={cn(
                'animate-in fade-in zoom-in-95 rounded-xl border border-[#E1E6EC] bg-white p-1 shadow-lg duration-100',
                menuClassName,
              )}
            >
              <div className="max-h-60 space-y-0.5 overflow-y-auto">
                {options.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <div
                      key={String(opt.value)}
                      role="option"
                      tabIndex={0}
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelect(opt.value);
                        }
                      }}
                      className={cn(
                        'flex cursor-pointer items-center justify-between gap-3 rounded-lg text-left transition-colors',
                        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm',
                        isSelected
                          ? 'bg-blue-50 font-bold text-[#0044D3]'
                          : 'font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900',
                        'focus-visible:bg-slate-100 focus-visible:outline-none',
                      )}
                    >
                      <Span className="truncate">{opt.label}</Span>
                      {isSelected ? (
                        <svg
                          className={cn(
                            'shrink-0 text-[#0044D3]',
                            size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
                          )}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

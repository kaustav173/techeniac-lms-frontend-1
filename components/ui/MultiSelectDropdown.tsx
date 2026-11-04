'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Checkbox } from '@/components/ui/Checkbox';
import { Span } from '@/components/ui/Typography';
import { cn } from '@/lib/cn';
import { useClickOutside } from '@/lib/useClickOutside';

export interface MultiSelectOption<T extends string = string> {
  readonly value: T;
  readonly label: string;
}

export interface MultiSelectDropdownProps<T extends string = string> {
  readonly label: string;
  readonly options: readonly MultiSelectOption<T>[];
  readonly selectedValues: readonly T[];
  readonly onChange: (values: T[]) => void;
  readonly singleSelect?: boolean | undefined;
  readonly placeholder?: string | undefined;
  readonly className?: string | undefined;
  readonly align?: 'left' | 'right' | undefined;
  readonly onScrollEnd?: (() => void) | undefined;
  readonly isLoadingMore?: boolean | undefined;
  readonly onSearch?: ((query: string) => void) | undefined;
  readonly isSearching?: boolean | undefined;
}

export function MultiSelectDropdown<T extends string = string>({
  label,
  options,
  selectedValues,
  onChange,
  singleSelect = false,
  className,
  align = 'right',
  onScrollEnd,
  isLoadingMore = false,
  onSearch,
  isSearching = false,
}: Readonly<MultiSelectDropdownProps<T>>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useClickOutside(
    containerRef,
    () => {
      setIsOpen(false);
      setSearchQuery('');
    },
    isOpen,
  );

  // Focus search input when popover opens
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Escape to close and refocus trigger
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleOption = (val: T) => {
    if (singleSelect) {
      if (selectedValues.includes(val)) {
        onChange([]);
      } else {
        onChange([val]);
      }
      setIsOpen(false);
      setSearchQuery('');
      triggerRef.current?.focus();
      return;
    }

    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange([]);
  };

  const triggerLabel = useMemo(() => {
    if (selectedValues.length === 0) return label;
    if (selectedValues.length === 1) {
      const match = options.find((o) => o.value === selectedValues[0]);
      return match ? match.label : label;
    }
    return `${label} (${selectedValues.length})`;
  }, [label, options, selectedValues]);

  useEffect(() => {
    if (!onSearch) return;
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  const filteredOptions = useMemo(() => {
    if (onSearch) return options;
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, searchQuery, onSearch]);

  return (
    <div
      className={cn('relative inline-block min-w-[130px] sm:min-w-[140px]', className)}
      ref={containerRef}
    >
      {/* Trigger Button with Rounded Border & Hover Effect */}
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((prev) => {
            if (prev) setSearchQuery('');
            return !prev;
          });
        }}
        className={cn(
          'flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-[#E1E6EC] bg-white px-3.5 text-left text-sm font-semibold text-slate-700 shadow-xs transition-all hover:border-slate-300 hover:bg-slate-50/70 focus:outline-none',
          selectedValues.length > 0 && 'border-blue-300 bg-blue-50/40 text-[#0044D3]',
          isOpen && 'border-[#0044D3] ring-2 ring-[#0044D3]/15',
        )}
      >
        <Span className="truncate">{triggerLabel}</Span>
        <svg
          className={cn(
            'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200',
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

      {/* Popover Dropdown matching trigger with high z-index */}
      {isOpen ? (
        <div
          role="listbox"
          className={cn(
            'animate-in fade-in zoom-in-95 absolute z-50 mt-1.5 min-w-[200px] rounded-xl border border-[#E1E6EC] bg-white p-2 shadow-lg duration-100',
            align === 'left' ? 'left-0' : 'right-0',
          )}
        >
          {/* Header Row: Optional Clear only (Title removed per specification) */}
          {selectedValues.length > 0 ? (
            <div className="flex items-center justify-end border-b border-slate-100 px-2 pb-1.5">
              <button
                type="button"
                onClick={handleClear}
                className="cursor-pointer text-xs font-semibold text-[#0044D3] hover:underline"
              >
                <Span>Clear</Span>
              </button>
            </div>
          ) : null}

          {/* Search Box inside Dropdown (for larger option lists or when onSearch is provided) */}
          {options.length > 5 || onSearch ? (
            <div className="pt-2 pb-1">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-7 pl-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#0044D3] focus:bg-white focus:outline-none"
                />
                {isSearching ? (
                  <div className="absolute inset-y-0 right-2 flex items-center">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0044D3] border-t-transparent" />
                  </div>
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-2 flex items-center text-sm text-slate-400 hover:text-slate-600"
                  >
                    ×
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Option List */}
          <div
            className="mt-1 max-h-52 space-y-0.5 overflow-y-auto"
            onScroll={(e) => {
              if (!onScrollEnd) return;
              const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
              if (scrollHeight - scrollTop - clientHeight < 25) {
                onScrollEnd();
              }
            }}
          >
            {filteredOptions.length === 0 ? (
              <Span className="block px-2.5 py-3 text-center text-sm text-slate-400">
                No matching options
              </Span>
            ) : (
              filteredOptions.map((opt) => {
                const isChecked = selectedValues.includes(opt.value);
                if (singleSelect) {
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isChecked}
                      onClick={() => toggleOption(opt.value)}
                      className={cn(
                        'flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-sm font-medium transition-colors hover:bg-slate-50',
                        isChecked ? 'bg-blue-50 font-semibold text-[#0044D3]' : 'text-slate-700',
                      )}
                    >
                      <Span className="truncate">{opt.label}</Span>
                    </button>
                  );
                }

                return (
                  <div
                    key={opt.value}
                    role="option"
                    tabIndex={0}
                    aria-selected={isChecked}
                    onClick={() => toggleOption(opt.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleOption(opt.value);
                      }
                    }}
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors hover:bg-slate-50 focus-visible:bg-slate-100 focus-visible:outline-none',
                      isChecked ? 'bg-blue-50/50 font-semibold text-[#0044D3]' : 'text-slate-700',
                    )}
                  >
                    <Checkbox
                      checked={isChecked}
                      onChange={() => {}} // handled by parent container click
                      className="pointer-events-none"
                    />
                    <Span className="truncate">{opt.label}</Span>
                  </div>
                );
              })
            )}
            {isLoadingMore ? (
              <div className="flex items-center justify-center py-2 text-xs text-slate-400">
                <Span>Loading more...</Span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

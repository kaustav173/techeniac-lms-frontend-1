'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';

export interface DebouncedSearchInputProps {
  readonly value: string;
  readonly onSearchChange: (val: string) => void;
  readonly placeholder?: string;
  readonly className?: string;
  readonly delayMs?: number;
}

export function DebouncedSearchInput({
  value,
  onSearchChange,
  placeholder = 'Search...',
  className,
  delayMs = 300,
}: Readonly<DebouncedSearchInputProps>) {
  const [localValue, setLocalValue] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onSearchChangeRef = useRef(onSearchChange);

  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  });

  if (prevValue !== value) {
    setPrevValue(value);
    setLocalValue(value);
  }

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setLocalValue(nextVal);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onSearchChangeRef.current(nextVal);
    }, delayMs);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div className={cn('relative w-full', className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <Input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl pl-10 text-sm font-medium placeholder:font-medium placeholder:text-slate-400"
      />
    </div>
  );
}

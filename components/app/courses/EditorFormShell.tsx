import React from 'react';

import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { H2, Span } from '@/components/ui/Typography';

export interface EditorFormShellProps {
  category: string;
  title: string;
  isDirty: boolean;
  isSaving: boolean;
  saveSuccess: boolean;
  onSave: () => void;
  errorMsg?: string | null;
  notice?: React.ReactNode;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
}

export function EditorFormShell({
  category,
  title,
  isDirty,
  isSaving,
  saveSuccess,
  onSave,
  errorMsg,
  notice,
  children,
  onSubmit,
}: Readonly<EditorFormShellProps>) {
  return (
    <div className="w-full">
      {/* Top Action Bar */}
      <div className="mx-auto flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-center">
        <div>
          <Span className="block text-xs font-semibold tracking-wider text-slate-400 uppercase">
            {category}
          </Span>
          <H2 className="mt-1 text-2xl font-bold tracking-tight break-words text-slate-900 sm:text-3xl">
            {title}
          </H2>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <Span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Span className="h-2 w-2 rounded-full bg-emerald-500" />
              Saved Live
            </Span>
          )}

          <Button
            type="button"
            disabled={!isDirty || isSaving}
            isLoading={isSaving}
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded-full bg-[#0044D3] px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#0039B3] focus-visible:ring-[#0044D3] active:bg-[#003199] disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {notice}

      {errorMsg && (
        <FieldError
          error={errorMsg}
          className="mx-auto mt-5 w-full max-w-5xl rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-xs"
        />
      )}

      {/* Main Form Area */}
      <form
        noValidate
        onSubmit={(e) => {
          if (onSubmit) {
            onSubmit(e);
          } else {
            e.preventDefault();
            onSave();
          }
        }}
        className="mx-auto mt-6 w-full max-w-5xl"
      >
        <div className="space-y-7 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
          {children}
        </div>
      </form>
    </div>
  );
}

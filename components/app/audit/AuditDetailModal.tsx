'use client';

import React, { useState } from 'react';

import { Modal } from '@/components/patterns/Modal';
import { Code, H4, Span } from '@/components/ui/Typography';
import { resolveAuditTargetEntity } from '@/lib/audit';
import { formatDateTimeISTWithSeconds } from '@/lib/date';
import type { ApiAuditItem, AuditType } from '@/lib/validation';

export interface AuditDetailModalProps {
  entry: ApiAuditItem | null;
  isOpen: boolean;
  onClose: () => void;
}

function getAuditTypeBadge(type: AuditType): string {
  switch (type) {
    case 'AUTH':
      return 'bg-blue-50 text-[#0044D3] border-blue-200';
    case 'USER':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'COURSE':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'BATCH':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'MENTOR_MAPPING':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'COURSE_ALLOCATION':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'SUBMISSION':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'GRADING':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function AuditDetailModal({ entry, isOpen, onClose }: AuditDetailModalProps) {
  const [copiedOld, setCopiedOld] = useState(false);
  const [copiedNew, setCopiedNew] = useState(false);

  if (!isOpen || !entry) return null;

  const actorName = entry.actor?.name || 'System / Automated Process';
  const actorRole = entry.actor?.role;
  const actorEmail = entry.actor?.email;
  const formattedDate = formatDateTimeISTWithSeconds(entry.createdAt);
  const target = resolveAuditTargetEntity(entry);

  const handleCopy = (text: string, type: 'old' | 'new') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      if (type === 'old') {
        setCopiedOld(true);
        setTimeout(() => setCopiedOld(false), 2000);
      } else if (type === 'new') {
        setCopiedNew(true);
        setTimeout(() => setCopiedNew(false), 2000);
      }
    }
  };

  const oldJsonString = entry.oldValue ? JSON.stringify(entry.oldValue, null, 2) : '';
  const newJsonString = entry.newValue ? JSON.stringify(entry.newValue, null, 2) : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      className="max-w-4xl"
      title="Audit Event Details"
      titleClassName="text-xl font-bold text-slate-900 sm:text-2xl"
    >
      <div className="space-y-6">
        {/* Event Header Hero Card */}
        <div className="flex items-center gap-3 rounded-2xl border border-[#E1E6EC] bg-gradient-to-r from-blue-50/50 via-slate-50/60 to-white px-4 py-3 shadow-xs">
          <Span
            className={`inline-flex items-center rounded-xl border px-3 py-1 text-xs font-bold tracking-wide uppercase ${getAuditTypeBadge(
              entry.type,
            )}`}
          >
            {entry.type}
          </Span>
          <Span className="text-base font-bold text-slate-900">{entry.action}</Span>
        </div>

        {/* Structured Metadata Grid (2x2) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Card 1: Timestamp */}
          <div className="rounded-2xl border border-[#E1E6EC] bg-white p-4.5 shadow-xs transition-colors hover:border-slate-300">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0044D3]">
                <svg
                  className="h-4.5 w-4.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <Span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Timestamp (IST)
                </Span>
                <Span className="mt-0.5 block truncate font-mono text-sm font-bold text-slate-900">
                  {formattedDate}
                </Span>
                <Span className="mt-0.5 block text-xs text-slate-500">
                  Recorded instantly on event commit
                </Span>
              </div>
            </div>
          </div>

          {/* Card 2: Actor */}
          <div className="rounded-2xl border border-[#E1E6EC] bg-white p-4.5 shadow-xs transition-colors hover:border-slate-300">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <svg
                  className="h-4.5 w-4.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <Span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Initiated By
                </Span>
                <div className="mt-0.5 flex items-center gap-2">
                  <Span className="truncate text-sm font-bold text-slate-900">{actorName}</Span>
                  {actorRole ? (
                    <Span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                      {actorRole}
                    </Span>
                  ) : null}
                </div>
                <Span className="mt-0.5 block truncate text-xs text-slate-500">
                  {actorEmail ?? (entry.actorId ? `User ID: ${entry.actorId}` : 'Internal System')}
                </Span>
              </div>
            </div>
          </div>

          {/* Card 3: Target Entity */}
          <div className="rounded-2xl border border-[#E1E6EC] bg-white p-4.5 shadow-xs transition-colors hover:border-slate-300">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <svg
                  className="h-4.5 w-4.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <Span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Target Entity
                </Span>
                <Span className="mt-0.5 block truncate text-sm font-bold text-slate-900">
                  {target.name || entry.entity}
                </Span>
                <Span className="mt-0.5 block truncate text-xs text-slate-500">
                  {target.type ? `Category: ${target.type}` : `Entity: ${entry.entity}`}
                </Span>
              </div>
            </div>
          </div>

          {/* Card 4: Integrity Status */}
          <div className="rounded-2xl border border-[#E1E6EC] bg-white p-4.5 shadow-xs transition-colors hover:border-slate-300">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <svg
                  className="h-4.5 w-4.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <Span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Integrity Status
                </Span>
                <Span className="mt-0.5 block text-sm font-bold text-emerald-700">
                  Verifiable Audit Record
                </Span>
                <Span className="mt-0.5 block text-xs text-slate-500">
                  Strict append-only record
                </Span>
              </div>
            </div>
          </div>
        </div>

        {/* State Payload Comparison (Light, Brand-Synced Theme — Zero Black Color) */}
        <div className="space-y-3 pt-2">
          <div>
            <H4 className="text-base font-bold text-slate-900">State Payload Comparison</H4>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Previous State Card */}
            <div className="overflow-hidden rounded-2xl border border-[#E1E6EC] bg-white shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4 py-3">
                <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold tracking-wider text-amber-800 uppercase">
                  Previous State (oldValue)
                </span>
                {oldJsonString ? (
                  <button
                    type="button"
                    onClick={() => handleCopy(oldJsonString, 'old')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    {copiedOld ? (
                      <span className="font-semibold text-emerald-600">Copied!</span>
                    ) : (
                      'Copy JSON'
                    )}
                  </button>
                ) : null}
              </div>

              {entry.oldValue ? (
                <div className="max-h-72 overflow-auto bg-[#F8FAFC] p-4 text-slate-800">
                  <Code className="block font-mono text-xs leading-relaxed whitespace-pre text-slate-800">
                    {oldJsonString}
                  </Code>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center bg-slate-50/30 p-10 text-center">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <Span className="text-sm font-bold text-slate-700">No Previous State</Span>
                  <Span className="mt-0.5 text-xs text-slate-400">
                    Record was newly created in this action
                  </Span>
                </div>
              )}
            </div>

            {/* New State Card */}
            <div className="overflow-hidden rounded-2xl border border-[#E1E6EC] bg-white shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4 py-3">
                <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold tracking-wider text-emerald-800 uppercase">
                  New State (newValue)
                </span>
                {newJsonString ? (
                  <button
                    type="button"
                    onClick={() => handleCopy(newJsonString, 'new')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    {copiedNew ? (
                      <span className="font-semibold text-emerald-600">Copied!</span>
                    ) : (
                      'Copy JSON'
                    )}
                  </button>
                ) : null}
              </div>

              {entry.newValue ? (
                <div className="max-h-72 overflow-auto bg-[#F8FAFC] p-4 text-slate-800">
                  <Code className="block font-mono text-xs leading-relaxed whitespace-pre text-slate-800">
                    {newJsonString}
                  </Code>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center bg-slate-50/30 p-10 text-center">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </div>
                  <Span className="text-sm font-bold text-slate-700">No New State</Span>
                  <Span className="mt-0.5 text-xs text-slate-400">
                    Record was deleted or purged in this action
                  </Span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

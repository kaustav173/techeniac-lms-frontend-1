'use client';

import React, { useState } from 'react';

import { Modal } from '@/components/patterns/Modal';
import { Button } from '@/components/ui/Button';
import { Code, H4, P, Span } from '@/components/ui/Typography';
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
      return 'bg-blue-50 text-blue-700 border-blue-200';
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
  const [copiedId, setCopiedId] = useState(false);
  const [copiedOld, setCopiedOld] = useState(false);
  const [copiedNew, setCopiedNew] = useState(false);

  if (!isOpen || !entry) return null;

  const actorName = entry.actor?.name || 'System / Automated Process';
  const actorRole = entry.actor?.role;
  const actorEmail = entry.actor?.email;
  const formattedDate = formatDateTimeISTWithSeconds(entry.createdAt);
  const target = resolveAuditTargetEntity(entry);

  const handleCopy = (text: string, type: 'id' | 'old' | 'new') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      if (type === 'id') {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      } else if (type === 'old') {
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
      className="max-w-3xl"
      title="Audit Event Details"
      description="Cryptographically verifiable, immutable record of state modification."
      footer={
        <div className="flex w-full items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <Span className="font-semibold text-slate-700">Immutable Audit Record</Span>
            <Span className="text-slate-400">· Append-only ledger</Span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl px-4 text-xs font-semibold"
          >
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Event Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase ${getAuditTypeBadge(
                entry.type,
              )}`}
            >
              {entry.type}
            </Span>
            <Span className="text-base font-bold text-slate-900">{entry.action}</Span>
          </div>

          <button
            type="button"
            onClick={() => handleCopy(entry.id, 'id')}
            title="Click to copy full event UUID"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <span className="font-mono text-[11px] text-slate-400">
              ID: {entry.id.slice(0, 8)}...
            </span>
            {copiedId ? (
              <span className="font-semibold text-emerald-600">Copied!</span>
            ) : (
              <svg
                className="h-3.5 w-3.5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Structured Metadata Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Card 1: Timestamp */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-400">
              <svg
                className="h-4 w-4 text-slate-500"
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
              <Span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Timestamp (IST)
              </Span>
            </div>
            <div className="mt-1 font-mono text-xs font-semibold text-slate-800">
              {formattedDate}
            </div>
            <Span className="mt-0.5 block text-[10px] text-slate-400">
              Recorded instantly on commit
            </Span>
          </div>

          {/* Card 2: Actor */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-400">
              <svg
                className="h-4 w-4 text-slate-500"
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
              <Span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Initiated By
              </Span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <Span className="text-xs font-semibold text-slate-900">{actorName}</Span>
              {actorRole ? (
                <Span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                  {actorRole}
                </Span>
              ) : null}
            </div>
            <Span className="mt-0.5 block truncate text-[10px] text-slate-400">
              {actorEmail ?? (entry.actorId ? `ID: ${entry.actorId}` : 'Internal System')}
            </Span>
          </div>

          {/* Card 3: Target Entity */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-400">
              <svg
                className="h-4 w-4 text-slate-500"
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
              <Span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Target Entity
              </Span>
            </div>
            <div className="mt-1 text-xs font-semibold text-slate-900">
              {target.name || entry.entity}
            </div>
            <Span className="mt-0.5 block text-[10px] text-slate-400">
              {target.type ? `Category: ${target.type}` : `Entity: ${entry.entity}`}
            </Span>
          </div>

          {/* Card 4: Integrity Status */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-400">
              <svg
                className="h-4 w-4 text-emerald-600"
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
              <Span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Integrity Status
              </Span>
            </div>
            <div className="mt-1 text-xs font-semibold text-emerald-700">
              Verifiable Audit Record
            </div>
            <Span className="mt-0.5 block text-[10px] text-slate-400">
              Strict append-only record
            </Span>
          </div>
        </div>

        {/* State Payload Comparison */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <H4 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                State Payload Comparison
              </H4>
              <P className="text-[11px] text-slate-500">
                Inspect state changes before and after this event execution.
              </P>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Previous State */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-3.5 py-2">
                <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-rose-700 uppercase">
                  Previous State (oldValue)
                </span>
                {oldJsonString ? (
                  <button
                    type="button"
                    onClick={() => handleCopy(oldJsonString, 'old')}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-800"
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
                <div className="max-h-60 overflow-auto bg-slate-950 p-3 text-slate-100">
                  <Code className="block font-mono text-[11px] leading-relaxed whitespace-pre text-rose-300/90">
                    {oldJsonString}
                  </Code>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <svg
                    className="mb-1.5 h-6 w-6 text-slate-300"
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
                  <Span className="text-xs font-semibold text-slate-600">No Previous State</Span>
                  <Span className="text-[11px] text-slate-400">
                    Record was newly created in this action
                  </Span>
                </div>
              )}
            </div>

            {/* New State */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-3.5 py-2">
                <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-700 uppercase">
                  New State (newValue)
                </span>
                {newJsonString ? (
                  <button
                    type="button"
                    onClick={() => handleCopy(newJsonString, 'new')}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-800"
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
                <div className="max-h-60 overflow-auto bg-slate-950 p-3 text-slate-100">
                  <Code className="block font-mono text-[11px] leading-relaxed whitespace-pre text-emerald-300/90">
                    {newJsonString}
                  </Code>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <svg
                    className="mb-1.5 h-6 w-6 text-slate-300"
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
                  <Span className="text-xs font-semibold text-slate-600">No New State</Span>
                  <Span className="text-[11px] text-slate-400">
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

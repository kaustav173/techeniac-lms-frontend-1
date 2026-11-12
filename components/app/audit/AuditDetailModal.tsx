'use client';

import React from 'react';

import { Modal } from '@/components/patterns/Modal';
import { H4, Span } from '@/components/ui/Typography';
import {
  formatAuditAction,
  formatAuditType,
  getAuditTypeBadge,
  resolveAuditTargetEntity,
} from '@/lib/audit';
import { formatDateTimeISTWithSeconds } from '@/lib/date';
import { formatRoleLabel } from '@/lib/roles';
import type { ApiAuditItem } from '@/lib/validation';

export interface AuditDetailModalProps {
  entry: ApiAuditItem | null;
  isOpen: boolean;
  onClose: () => void;
}

function renderPayloadDetails(data: Record<string, unknown> | null) {
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    return (
      <div className="p-4 text-center">
        <Span className="text-xs text-slate-400">No properties recorded</Span>
      </div>
    );
  }

  const entries = Object.entries(data);

  return (
    <div className="divide-y divide-slate-100 p-4">
      {entries.map(([key, val]) => {
        const formattedKey = key
          .replace(/_/g, ' ')
          .replace(/([A-Z])/g, ' $1')
          .trim()
          .replace(/^./, (str) => str.toUpperCase());

        let displayValue = '—';
        if (val === null || val === undefined) {
          displayValue = '—';
        } else if (typeof val === 'boolean') {
          displayValue = val ? 'Yes' : 'No';
        } else if (typeof val === 'string') {
          displayValue = val;
        } else if (typeof val === 'number' || typeof val === 'bigint') {
          displayValue = String(val);
        } else if (typeof val === 'object') {
          displayValue = JSON.stringify(val);
        }

        return (
          <div
            key={key}
            className="flex items-start justify-between gap-4 py-2 text-xs first:pt-0 last:pb-0"
          >
            <Span className="shrink-0 font-semibold text-slate-600 capitalize">{formattedKey}</Span>
            <Span className="text-right font-medium break-all text-slate-900">{displayValue}</Span>
          </div>
        );
      })}
    </div>
  );
}

export function AuditDetailModal({ entry, isOpen, onClose }: AuditDetailModalProps) {
  if (!isOpen || !entry) return null;

  const actorName = entry.actor?.name || 'System / Automated Process';
  const actorRole = entry.actor?.role ? formatRoleLabel(entry.actor.role) : null;
  const actorEmail = entry.actor?.email;
  const formattedDate = formatDateTimeISTWithSeconds(entry.createdAt);
  const target = resolveAuditTargetEntity(entry);

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
            className={`inline-flex items-center rounded-xl border px-3 py-1 text-xs font-bold tracking-wide ${getAuditTypeBadge(
              entry.type,
            )}`}
          >
            {formatAuditType(entry.type)}
          </Span>
          <Span className="text-base font-bold text-slate-900">
            {formatAuditAction(entry.action)}
          </Span>
        </div>

        {/* Structured Metadata Grid (2x2): 1. Timestamp, 2. IP & Country, 3. Initiated By, 4. Target Entity */}
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
                <Span className="mt-0.5 block truncate text-sm font-bold text-slate-900">
                  {formattedDate}
                </Span>
              </div>
            </div>
          </div>

          {/* Card 2: Client IP & Country */}
          <div className="rounded-2xl border border-[#E1E6EC] bg-white p-4.5 shadow-xs transition-colors hover:border-slate-300">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
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
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <Span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Client IP & Country
                </Span>
                <Span className="mt-0.5 block truncate text-sm font-bold text-slate-900">
                  {entry.ipAddress || 'Not recorded (historical)'}
                </Span>
                <Span className="mt-0.5 block truncate text-xs text-slate-500">
                  {entry.country || 'Location unavailable'}
                </Span>
              </div>
            </div>
          </div>

          {/* Card 3: Initiated By (Actor) */}
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

          {/* Card 4: Target Entity */}
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
                {target.isGrading ? (
                  <>
                    <Span className="mt-0.5 block truncate text-sm font-bold text-slate-900">
                      {target.studentName || target.type}
                    </Span>
                    <Span className="mt-0.5 block truncate text-xs text-slate-500">
                      {target.assignmentTitle ? `Assignment: ${target.assignmentTitle}` : ''}
                      {target.grade ? ` • ${target.grade}` : ''}
                    </Span>
                  </>
                ) : (
                  <>
                    <Span className="mt-0.5 block truncate text-sm font-bold text-slate-900">
                      {target.name || entry.entity}
                    </Span>
                    <Span className="mt-0.5 block truncate text-xs text-slate-500">
                      {target.type ? `Details: ${target.type}` : `Entity: ${entry.entity}`}
                    </Span>
                  </>
                )}
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
              <div className="border-b border-slate-200 bg-slate-50/90 px-4 py-3">
                <Span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold tracking-wider text-amber-800 uppercase">
                  Previous State
                </Span>
              </div>

              {entry.oldValue ? (
                <div className="max-h-72 overflow-auto bg-[#F8FAFC]">
                  {renderPayloadDetails(entry.oldValue)}
                </div>
              ) : (
                <div className="flex items-center justify-center p-6 text-center">
                  <Span className="text-xs font-medium text-slate-400">No previous state</Span>
                </div>
              )}
            </div>

            {/* New State Card */}
            <div className="overflow-hidden rounded-2xl border border-[#E1E6EC] bg-white shadow-2xs">
              <div className="border-b border-slate-200 bg-slate-50/90 px-4 py-3">
                <Span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold tracking-wider text-emerald-800 uppercase">
                  New State
                </Span>
              </div>

              {entry.newValue ? (
                <div className="max-h-72 overflow-auto bg-[#F8FAFC]">
                  {renderPayloadDetails(entry.newValue)}
                </div>
              ) : (
                <div className="flex items-center justify-center p-6 text-center">
                  <Span className="text-xs font-medium text-slate-400">No new state</Span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

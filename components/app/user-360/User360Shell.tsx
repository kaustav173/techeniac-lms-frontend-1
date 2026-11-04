'use client';

import Link from 'next/link';
import React, { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { Label } from '@/components/ui/Label';
import {
  SingleSelectDropdown,
  type SingleSelectOption,
} from '@/components/ui/SingleSelectDropdown';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { H1, H2, H3, P, Small, Span } from '@/components/ui/Typography';
import { useUser360 } from '@/hooks/useUser360';
import { cn } from '@/lib/cn';
import { formatDateIST, formatDateTimeIST } from '@/lib/date';
import type { User360FilterState } from '@/types/user-360';

const ROLE_PERIOD_OPTIONS: readonly SingleSelectOption<string>[] = [
  { value: '', label: 'All Role Periods' },
  { value: 'MENTEE', label: 'As Mentee' },
  { value: 'MENTOR', label: 'As Mentor' },
  { value: 'SUPER_ADMIN', label: 'As Super Admin' },
];

const AUDIT_TYPE_OPTIONS: readonly SingleSelectOption<string>[] = [
  { value: '', label: 'All Audit Types' },
  { value: 'GRADING', label: 'Grading' },
  { value: 'USER_ROLE', label: 'Role Changes' },
  { value: 'BATCH', label: 'Batch Membership' },
];

interface User360ShellProps {
  userId: string;
}

type TabKey =
  | 'profile'
  | 'role-history'
  | 'batch-history'
  | 'mentor-mapping-history'
  | 'course-history'
  | 'assignment-grade-history'
  | 'performance-summary'
  | 'audit';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'role-history', label: 'Role History' },
  { key: 'batch-history', label: 'Batch History' },
  { key: 'mentor-mapping-history', label: 'Mentor Mapping History' },
  { key: 'course-history', label: 'Course History' },
  { key: 'assignment-grade-history', label: 'Assignment & Grade History' },
  { key: 'performance-summary', label: 'Performance Summary' },
  { key: 'audit', label: 'Audit Log' },
];

const EM_DASH = '—';

function getActiveStatusBadgeClass(isActive: boolean): string {
  return isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600';
}

export function User360Skeleton() {
  return (
    <div className="space-y-6">
      {/* Banner Skeleton */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 shadow-xs">
              <Skeleton className="h-3.5 w-3.5 rounded-full" />
              <Skeleton className="h-3.5 w-24 rounded-md" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-48 rounded-xl" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-56 rounded-md" />
          </div>
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
        {/* Filters Skeleton */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-9 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Pills Skeleton */}
      <div className="flex gap-1 overflow-x-auto rounded-full border border-slate-200/80 bg-slate-100/90 p-1">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-8 w-28 rounded-full sm:h-9" />
        ))}
      </div>

      {/* Content Card Skeleton */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="space-y-4">
          <Skeleton className="h-6 w-44 rounded-md" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
              >
                <Skeleton className="h-3.5 w-20 rounded-md" />
                <Skeleton className="h-5 w-32 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function User360Shell({ userId }: User360ShellProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [filters, setFilters] = useState<User360FilterState>({});
  const [isExporting, setIsExporting] = useState(false);

  const { profile, isLoading, isFetching, isError, error, downloadCsv } = useUser360(
    userId,
    filters,
  );

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      await downloadCsv();
    } catch {
      alert('Failed to download CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilterChange = (key: keyof User360FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
  };

  const handleTabChange = (nextTab: TabKey) => {
    if (nextTab !== 'audit' && filters.auditType) {
      setFilters((prev) => {
        const next = { ...prev };
        delete next.auditType;
        return next;
      });
    }
    setActiveTab(nextTab);
  };

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let targetIndex = -1;
    if (e.key === 'ArrowRight') {
      targetIndex = (currentIndex + 1) % TABS.length;
    } else if (e.key === 'ArrowLeft') {
      targetIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    } else if (e.key === 'Home') {
      targetIndex = 0;
    } else if (e.key === 'End') {
      targetIndex = TABS.length - 1;
    }

    if (targetIndex >= 0) {
      e.preventDefault();
      const nextTab = TABS[targetIndex];
      if (nextTab) {
        handleTabChange(nextTab.key);
        const nextBtn = document.getElementById(`tab-${nextTab.key}`);
        nextBtn?.focus();
      }
    }
  };

  if (isLoading && !profile) {
    return <User360Skeleton />;
  }

  if ((isError && !profile) || !profile) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/70 p-6 text-center text-red-800 shadow-xs">
        <H2 className="text-lg font-semibold text-red-800">Error Loading User 360 Profile</H2>
        <P className="mt-1 text-sm text-red-700">{error ?? 'User not found or access denied.'}</P>
        <div className="mt-4">
          <Link
            href="/admin/users"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-4 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <svg
              className="h-3.5 w-3.5 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <Span>Back to Users</Span>
          </Link>
        </div>
      </div>
    );
  }

  const { user, tabs } = profile;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Identity Banner */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3">
              <Link
                href="/admin/users"
                className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <svg
                  className="h-3.5 w-3.5 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <Span>Back to Users</Span>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <H1 className="text-2xl font-bold tracking-tight text-slate-900">{user.name}</H1>
              <Span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  user.role === 'SUPER_ADMIN'
                    ? 'bg-purple-100 text-purple-800'
                    : user.role === 'MENTOR'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {user.role}
              </Span>
              <Span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getActiveStatusBadgeClass(
                  user.isActive,
                )}`}
              >
                {user.isActive ? 'Active' : 'Inactive'}
              </Span>
            </div>
            <P className="mt-1 text-sm text-slate-500">{user.email}</P>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void handleExportCsv();
              }}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <svg
                className="h-3.5 w-3.5 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              <Span>{isExporting ? 'Exporting...' : 'Export as CSV'}</Span>
            </Button>
          </div>
        </div>

        {/* Global Filter Bar (FR-3.1) */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <Label
                htmlFor="filter-role-period"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Filter by Role Period
              </Label>
              <SingleSelectDropdown
                id="filter-role-period"
                size="sm"
                value={filters.rolePeriod ?? ''}
                onChange={(val) => handleFilterChange('rolePeriod', val)}
                options={ROLE_PERIOD_OPTIONS}
                aria-label="Filter by Role Period"
              />
            </div>

            <div>
              <Label
                htmlFor="filter-start-date"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                From Date
              </Label>
              <DatePicker
                id="filter-start-date"
                value={filters.startDate ?? ''}
                onChange={(val) => handleFilterChange('startDate', val)}
                placeholder="Select start date"
                maxDate={filters.endDate || undefined}
                className="h-10 border-slate-200/80 bg-white/90 text-xs opacity-90 transition-opacity hover:opacity-100"
              />
            </div>

            <div>
              <Label
                htmlFor="filter-end-date"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                To Date
              </Label>
              <DatePicker
                id="filter-end-date"
                value={filters.endDate ?? ''}
                onChange={(val) => handleFilterChange('endDate', val)}
                placeholder="Select end date"
                minDate={filters.startDate || undefined}
                className="h-10 border-slate-200/80 bg-white/90 text-xs opacity-90 transition-opacity hover:opacity-100"
              />
            </div>

            {activeTab === 'audit' && (
              <div>
                <Label
                  htmlFor="filter-audit-type"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Audit Type
                </Label>
                <SingleSelectDropdown
                  id="filter-audit-type"
                  size="sm"
                  value={filters.auditType ?? ''}
                  onChange={(val) => handleFilterChange('auditType', val)}
                  options={AUDIT_TYPE_OPTIONS}
                  aria-label="Filter by Audit Type"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex [scrollbar-width:none] items-center gap-1 overflow-x-auto rounded-full border border-slate-200/80 bg-slate-100/90 p-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <nav
          role="tablist"
          aria-label="User 360 Sections"
          className="flex items-center gap-1 overflow-x-auto"
        >
          {TABS.map((tab, index) => {
            const isActive = activeTab === tab.key;
            return (
              <Button
                key={tab.key}
                id={`tab-${tab.key}`}
                type="button"
                variant="ghost"
                size="sm"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.key}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleTabChange(tab.key)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                className={cn(
                  'h-8 rounded-full px-3.5 text-xs font-semibold whitespace-nowrap transition-all sm:h-9 sm:text-sm',
                  isActive
                    ? 'bg-[#0044D3] text-white shadow-xs hover:bg-[#0039B3] hover:text-white'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900',
                )}
              >
                <Span>{tab.label}</Span>
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="relative rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs"
      >
        {isFetching && (
          <div className="absolute top-4 right-6 flex items-center gap-1.5 text-xs text-slate-400">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
            <Span>Updating...</Span>
          </div>
        )}
        {/* 1. Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <H2 className="text-base font-semibold text-slate-900">User Identity & Profile</H2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-colors hover:bg-slate-50">
                <Span className="text-sm font-semibold text-slate-600">User ID</Span>
                <P className="mt-1 text-sm font-bold break-all text-slate-900">{user.id}</P>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-colors hover:bg-slate-50">
                <Span className="text-sm font-semibold text-slate-600">Full Name</Span>
                <P className="mt-1 text-base font-bold text-slate-900">{user.name}</P>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-colors hover:bg-slate-50">
                <Span className="text-sm font-semibold text-slate-600">Email Address</Span>
                <P className="mt-1 text-base font-bold break-all text-slate-900">{user.email}</P>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-colors hover:bg-slate-50">
                <Span className="text-sm font-semibold text-slate-600">Current Role</Span>
                <P className="mt-1 text-base font-bold text-slate-900">{user.role}</P>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-colors hover:bg-slate-50">
                <Span className="text-sm font-semibold text-slate-600">Account Created</Span>
                <P className="mt-1 text-base font-bold text-slate-900">
                  {formatDateIST(user.createdAt)}
                </P>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-colors hover:bg-slate-50">
                <Span className="text-sm font-semibold text-slate-600">Last Login</Span>
                <P className="mt-1 text-base font-bold text-slate-900">
                  {user.lastLoginAt ? formatDateIST(user.lastLoginAt) : 'Never'}
                </P>
              </div>
            </div>
          </div>
        )}

        {/* 2. Role History Tab */}
        {activeTab === 'role-history' && (
          <div className="space-y-4">
            <H2 className="text-base font-semibold text-slate-900">Role History Timeline</H2>
            {tabs.roleHistory.length === 0 ? (
              <P className="py-8 text-center text-sm text-slate-500">
                No role history records found.
              </P>
            ) : (
              <TableContainer>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Period Context</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tabs.roleHistory.map((rh) => (
                      <TableRow key={rh.id} className="transition-colors hover:bg-slate-50/60">
                        <TableCell className="font-semibold text-slate-900">{rh.role}</TableCell>
                        <TableCell className="text-slate-600">
                          {formatDateIST(rh.fromAt)} &ndash;{' '}
                          {rh.toAt ? formatDateIST(rh.toAt) : 'Present'}
                        </TableCell>
                        <TableCell className="text-slate-700">{rh.reason}</TableCell>
                        <TableCell className="font-medium text-blue-700">
                          {rh.periodLabel}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
        )}

        {/* 3. Batch History Tab */}
        {activeTab === 'batch-history' && (
          <div className="space-y-4">
            <H2 className="text-base font-semibold text-slate-900">Batch Participation History</H2>
            {tabs.batchHistory.length === 0 ? (
              <P className="py-8 text-center text-sm text-slate-500">No batch history found.</P>
            ) : (
              <TableContainer>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined At</TableHead>
                      <TableHead>Left At</TableHead>
                      <TableHead>Reason To Leave</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Period Context</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tabs.batchHistory.map((b) => (
                      <TableRow key={b.id} className="transition-colors hover:bg-slate-50/60">
                        <TableCell className="font-semibold text-slate-900">
                          {b.batchName} ({b.batchCode})
                        </TableCell>
                        <TableCell className="text-slate-700">{b.role}</TableCell>
                        <TableCell className="text-slate-600">
                          {formatDateIST(b.joinedAt)}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {b.leftAt ? formatDateIST(b.leftAt) : EM_DASH}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {b.reasonToLeave ?? EM_DASH}
                        </TableCell>
                        <TableCell>
                          <Span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getActiveStatusBadgeClass(
                              b.isActive,
                            )}`}
                          >
                            {b.isActive ? 'Active' : 'Left'}
                          </Span>
                        </TableCell>
                        <TableCell className="font-medium text-blue-700">{b.periodLabel}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
        )}

        {/* 4. Mentor Mapping History Tab */}
        {activeTab === 'mentor-mapping-history' && (
          <div className="space-y-4">
            <H2 className="text-base font-semibold text-slate-900">
              Mentor & Mentee Mapping History
            </H2>
            {tabs.mentorMappingHistory.length === 0 ? (
              <P className="py-8 text-center text-sm text-slate-500">No mentor mappings found.</P>
            ) : (
              <TableContainer>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch</TableHead>
                      <TableHead>Role in Mapping</TableHead>
                      <TableHead>Mapped Peer</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Period Context</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tabs.mentorMappingHistory.map((m) => (
                      <TableRow key={m.id} className="transition-colors hover:bg-slate-50/60">
                        <TableCell className="font-semibold text-slate-900">
                          {m.batchCode}
                        </TableCell>
                        <TableCell className="text-slate-700">{m.mappedRole}</TableCell>
                        <TableCell className="text-slate-800">
                          {m.peerName} <Span className="text-slate-500">({m.peerEmail})</Span>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {formatDateIST(m.startDate)} &ndash;{' '}
                          {m.endDate ? formatDateIST(m.endDate) : 'Active'}
                        </TableCell>
                        <TableCell>
                          <Span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getActiveStatusBadgeClass(
                              m.isActive,
                            )}`}
                          >
                            {m.isActive ? 'Active' : 'Ended'}
                          </Span>
                        </TableCell>
                        <TableCell className="font-medium text-blue-700">{m.periodLabel}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
        )}

        {/* 5. Course History Tab */}
        {activeTab === 'course-history' && (
          <div className="space-y-4">
            <H2 className="text-base font-semibold text-slate-900">
              Allocated Courses & Curriculum
            </H2>
            {tabs.courseHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
                <P className="text-sm font-medium text-slate-500">
                  No course allocations recorded.
                </P>
                <P className="mt-1 text-xs text-slate-500">
                  {user.role === 'MENTOR'
                    ? 'This user has only mentor history and was never enrolled in courses as a mentee.'
                    : 'No courses have been allocated yet.'}
                </P>
              </div>
            ) : (
              <TableContainer>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Title</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Timeline</TableHead>
                      <TableHead>Period Context</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tabs.courseHistory.map((c) => (
                      <TableRow key={c.id} className="transition-colors hover:bg-slate-50/60">
                        <TableCell className="font-semibold text-slate-900">
                          {c.courseTitle}
                        </TableCell>
                        <TableCell className="text-slate-600">{c.batchCode ?? 'N/A'}</TableCell>
                        <TableCell>
                          <Span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              c.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {c.status}
                          </Span>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">
                          {c.progressPercent}%
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {formatDateIST(c.startDate)} &ndash; {formatDateIST(c.dueDate)}
                        </TableCell>
                        <TableCell className="font-medium text-blue-700">{c.periodLabel}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
        )}

        {/* 6. Assignment & Grade History Tab */}
        {activeTab === 'assignment-grade-history' && (
          <div className="space-y-4">
            <H2 className="text-base font-semibold text-slate-900">
              Assignments, Submissions & Grading
            </H2>
            {tabs.assignmentGradeHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
                <P className="text-sm font-medium text-slate-500">
                  No submissions or grades recorded.
                </P>
                <P className="mt-1 text-xs text-slate-500">
                  {user.role === 'MENTOR'
                    ? 'This user has only mentor history and has never submitted assignments as a mentee.'
                    : 'No assignments submitted yet.'}
                </P>
              </div>
            ) : (
              <TableContainer>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Marks & Grade</TableHead>
                      <TableHead>Graded By</TableHead>
                      <TableHead>Feedback</TableHead>
                      <TableHead>Period Context</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tabs.assignmentGradeHistory.map((s) => (
                      <TableRow key={s.id} className="transition-colors hover:bg-slate-50/60">
                        <TableCell className="font-semibold text-slate-900">
                          {s.assignmentTitle}
                        </TableCell>
                        <TableCell className="text-slate-600">v{s.version}</TableCell>
                        <TableCell>
                          <Span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              s.status === 'GRADED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {s.status}
                          </Span>
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">
                          {s.marks !== null ? `${s.marks} (${s.gradeLabel ?? 'N/A'})` : EM_DASH}
                        </TableCell>
                        <TableCell className="text-slate-600">{s.graderName ?? EM_DASH}</TableCell>
                        <TableCell
                          className="max-w-xs truncate text-slate-600"
                          title={s.feedback ?? ''}
                        >
                          {s.feedback ?? EM_DASH}
                        </TableCell>
                        <TableCell className="font-medium text-blue-700">{s.periodLabel}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
        )}

        {/* 7. Performance Summary Tab */}
        {activeTab === 'performance-summary' && (
          <div className="space-y-6">
            <H2 className="text-base font-semibold text-slate-900">Learning Performance Summary</H2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-colors hover:bg-slate-50">
                <Span className="text-xs text-slate-500">Allocated Courses</Span>
                <P className="mt-1 text-2xl font-bold text-slate-900">
                  {tabs.performanceSummary.totalAllocations}
                </P>
                <Small className="text-[11px] text-slate-500">
                  {tabs.performanceSummary.completedAllocations} completed
                </Small>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-colors hover:bg-slate-50">
                <Span className="text-xs text-slate-500">Average Progress</Span>
                <P className="mt-1 text-2xl font-bold text-blue-600">
                  {tabs.performanceSummary.averageProgressPercent.toFixed(1)}%
                </P>
                <Small className="text-[11px] text-slate-500">across allocations</Small>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-colors hover:bg-slate-50">
                <Span className="text-xs text-slate-500">Total Submissions</Span>
                <P className="mt-1 text-2xl font-bold text-slate-900">
                  {tabs.performanceSummary.totalSubmissions}
                </P>
                <Small className="text-[11px] text-slate-500">
                  {tabs.performanceSummary.gradedSubmissions} graded
                </Small>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-colors hover:bg-slate-50">
                <Span className="text-xs text-slate-500">Average Marks</Span>
                <P className="mt-1 text-2xl font-bold text-emerald-600">
                  {tabs.performanceSummary.averageMarks !== null
                    ? tabs.performanceSummary.averageMarks.toFixed(1)
                    : EM_DASH}
                </P>
                <Small className="text-[11px] text-slate-500">
                  {tabs.performanceSummary.onTimeRatePercent.toFixed(0)}% on-time
                </Small>
              </div>
            </div>

            {/* Grade Distribution */}
            <div>
              <H3 className="text-sm font-semibold text-slate-800">Grade Distribution</H3>
              <div className="mt-2 flex flex-wrap gap-3">
                {Object.keys(tabs.performanceSummary.gradeDistribution).length === 0 ? (
                  <P className="text-xs text-slate-500">No grades recorded.</P>
                ) : (
                  Object.entries(tabs.performanceSummary.gradeDistribution).map(
                    ([grade, count]) => (
                      <div
                        key={grade}
                        className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs shadow-xs"
                      >
                        <Span className="font-bold text-slate-900">Grade {grade}:</Span>
                        <Span className="font-semibold text-blue-600">{count}</Span>
                      </div>
                    ),
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* 8. Audit Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <H2 className="text-base font-semibold text-slate-900">User Audit Log Trail</H2>
            {tabs.audit.length === 0 ? (
              <P className="py-8 text-center text-sm text-slate-500">
                No audit events match current filters.
              </P>
            ) : (
              <TableContainer>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Audit Type</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Period Context</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tabs.audit.map((a) => (
                      <TableRow key={a.id} className="transition-colors hover:bg-slate-50/60">
                        <TableCell className="text-slate-600">
                          {formatDateTimeIST(a.timestamp)}
                        </TableCell>
                        <TableCell>
                          <Span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              a.type === 'GRADING'
                                ? 'bg-purple-100 text-purple-800'
                                : a.type === 'USER_ROLE'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {a.type}
                          </Span>
                        </TableCell>
                        <TableCell className="text-[11px] font-semibold text-slate-800">
                          {a.action}
                        </TableCell>
                        <TableCell
                          className="max-w-xs truncate text-[11px] text-slate-600"
                          title={JSON.stringify(a.details, null, 2)}
                        >
                          {JSON.stringify(a.details)}
                        </TableCell>
                        <TableCell className="font-medium text-blue-700">{a.periodLabel}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

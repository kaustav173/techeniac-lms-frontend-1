'use client';

import React from 'react';

import { DashboardContent } from '@/components/layout/DashboardContent';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { H2, P } from '@/components/ui/Typography';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/hooks/useAuth';

export interface PortalSessionStateProps {
  readonly sessionError: string | null;
  readonly loadingMessage?: string;
  readonly spinnerColor?: string;
  readonly retryButtonColor?: string;
  readonly variant?: 'admin' | 'mentor' | 'mentee';
}

function AdminDashboardSkeleton() {
  return (
    <>
      {/* Welcome Section Skeleton */}
      <div className="mb-8 rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-10 w-72 sm:w-96" />
            <Skeleton className="h-4 w-60 sm:w-80" />
          </div>
          <Skeleton className="h-20 w-full rounded-2xl sm:w-64" />
        </div>
      </div>

      {/* Section Title Skeleton */}
      <div className="mb-6 space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* 4-Card Grid Skeleton */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-11 w-11 rounded-xl" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <Skeleton className="mt-5 h-6 w-36" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function MentorDashboardSkeleton() {
  return (
    <>
      {/* Welcome Section Skeleton */}
      <div className="mb-8 rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-10 w-64 sm:w-80" />
            <Skeleton className="h-4 w-60 sm:w-72" />
          </div>
          <Skeleton className="h-20 w-full rounded-2xl sm:w-64" />
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`rounded-2xl border border-[#E1E6EC] bg-white p-5 shadow-xs ${
              i === 3 ? 'col-span-2 lg:col-span-1' : ''
            }`}
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-9 w-16" />
          </div>
        ))}
      </div>

      {/* Section 1: Assigned Batches Table Skeleton */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-[#E1E6EC] bg-white shadow-xs">
        <div className="space-y-2 border-b border-[#E1E6EC] p-5">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4 p-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
            >
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Mentee Roster Table Skeleton */}
      <div className="overflow-hidden rounded-2xl border border-[#E1E6EC] bg-white shadow-xs">
        <div className="space-y-2 border-b border-[#E1E6EC] p-5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
        <div className="space-y-4 p-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function MenteeDashboardSkeleton() {
  return (
    <>
      {/* Welcome Section Skeleton */}
      <div className="mb-8 rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-10 w-64 sm:w-80" />
            <Skeleton className="h-4 w-60 sm:w-72" />
          </div>
          <Skeleton className="h-20 w-full rounded-2xl sm:w-64" />
        </div>
      </div>

      {/* Learning Progress Card Skeleton */}
      <div className="mb-8 rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="mt-4 h-3 w-full rounded-full" />
        <div className="mt-4 flex gap-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      {/* Course & Assignment Cards Skeleton */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <Skeleton className="h-5 w-5 rounded-md" />
          </div>
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-4 rounded-2xl border border-[#E1E6EC] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <Skeleton className="h-5 w-5 rounded-md" />
          </div>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </>
  );
}

export function PortalSessionState({
  sessionError,
  loadingMessage = 'Loading workspace...',
  variant = 'admin',
}: Readonly<PortalSessionStateProps>) {
  const { refreshUser } = useAuth();
  const { isDrawerOpen, isMobileNavOpen, contentMarginClass } = useSidebar();

  if (sessionError) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-[#F6F8FC] p-6 text-center">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-xs">
          <H2 className="text-lg font-bold text-[#111827]">Session Verification Issue</H2>
          <P className="mt-2 text-sm text-[#667085]">{sessionError}</P>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              void refreshUser();
            }}
            className="mt-4 rounded-full bg-[#0044D3] px-6 text-sm font-medium"
          >
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col bg-[#F6F8FC]"
      role="status"
      aria-label={loadingMessage}
    >
      {/* Collapsed Side Navigation Rail Skeleton (Desktop md:flex) */}
      <aside
        aria-label="Collapsed Navigation Rail Skeleton"
        className={`fixed inset-y-0 left-0 z-40 hidden w-20 flex-col items-center justify-between border-r border-[#E1E6EC] bg-white py-5 transition-all duration-300 md:flex ${
          isDrawerOpen
            ? 'lg:pointer-events-none lg:-translate-x-full lg:opacity-0'
            : 'pointer-events-auto translate-x-0 opacity-100 shadow-sm'
        }`}
      >
        <div className="flex w-full flex-col items-center gap-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0044D3] text-base font-black text-white shadow-xs">
            TL
          </div>
          <nav
            className="flex flex-col items-center space-y-3"
            aria-label="Rail Loading Placeholders"
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={`rail-skel-${i}`} className="h-11 w-11 rounded-full" />
            ))}
          </nav>
        </div>
        <div className="flex flex-col items-center gap-3 pb-2">
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </aside>

      {/* Side Navigation Drawer Skeleton (Persistent Sidebar on lg, Mobile drawer) */}
      <aside
        aria-label="Site Navigation Drawer Skeleton"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#E1E6EC] bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:shadow-md ${
          isMobileNavOpen ? 'translate-x-0' : 'pointer-events-none -translate-x-full'
        } ${
          isDrawerOpen
            ? 'lg:pointer-events-auto lg:translate-x-0'
            : 'lg:pointer-events-none lg:-translate-x-full'
        }`}
      >
        {/* Drawer Header Skeleton */}
        <div className="flex h-20 items-center justify-between border-b border-[#E1E6EC] px-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0044D3] text-base font-black text-white shadow-xs">
              TL
            </div>
            <div className="h-6 w-36 animate-pulse rounded-md bg-slate-200/80" />
          </div>
        </div>

        {/* Panel Title Skeleton */}
        <div className="px-5 pt-5 pb-2">
          <Skeleton className="h-3.5 w-24 rounded-md" />
        </div>

        {/* Nav Links Skeleton */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <nav className="flex flex-col space-y-2" aria-label="Drawer Loading Placeholders">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={`drawer-skel-${i}`}
                className="flex items-center gap-3.5 rounded-full px-4 py-3.5"
              >
                <Skeleton className="h-5 w-5 shrink-0 rounded-md" />
                <Skeleton className="h-4 flex-1 rounded-md" />
              </div>
            ))}
          </nav>
        </div>

        {/* Drawer Footer Skeleton */}
        <div className="flex items-center justify-between border-t border-[#E1E6EC] px-6 py-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-3 w-40 rounded-md" />
          </div>
        </div>
      </aside>

      {/* Top Navbar Skeleton (Synchronized with Header) */}
      <div
        className={`sticky top-0 z-30 border-b border-[#E1E6EC] bg-white/95 backdrop-blur-md transition-all duration-300 ${contentMarginClass}`}
      >
        <div className="flex h-20 w-full items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-6 w-32 rounded-md" />
          </div>
          <div className="relative ml-auto flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </div>

      {/* Role-Specific Workspace Skeleton Matching Real Dashboard Structure */}
      <DashboardContent>
        {variant === 'mentor' ? (
          <MentorDashboardSkeleton />
        ) : variant === 'mentee' ? (
          <MenteeDashboardSkeleton />
        ) : (
          <AdminDashboardSkeleton />
        )}
      </DashboardContent>
    </div>
  );
}

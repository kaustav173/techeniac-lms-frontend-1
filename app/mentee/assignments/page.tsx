'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useState } from 'react';

import { MENTEE_ASSIGNMENTS_NAV } from '@/components/app/navigation/portal-nav.config';
import { PortalSessionState } from '@/components/app/navigation/PortalSessionState';
import { MyAssignmentsTable } from '@/components/app/submissions/MyAssignmentsTable';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { PageTitle, Span, SubText } from '@/components/ui/Typography';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import { useMyAssignments } from '@/hooks/useSubmissions';
import type { AssignmentDerivedStatus } from '@/types/submissions';

function MenteeAssignmentsContent() {
  const router = useRouter();
  const { user, isAuthorized, sessionError } = useRoleRedirect({ allowedRoles: ['MENTEE'] });
  const searchParams = useSearchParams();
  const activeCourseId = searchParams.get('courseId') ?? undefined;

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedStatus, setSelectedStatus] = useState<AssignmentDerivedStatus | undefined>(
    undefined,
  );

  const { assignments, total, totalPages, isLoading, isFetching, error, refetch } =
    useMyAssignments({
      page,
      limit,
      status: selectedStatus,
      courseId: activeCourseId,
    });

  const handleStatusChange = (status?: AssignmentDerivedStatus) => {
    setSelectedStatus(status);
    setPage(1);
  };

  const handleClearCourseFilter = () => {
    setPage(1);
    router.replace('/mentee/assignments', { scroll: false });
  };

  if (!isAuthorized || !user) {
    return (
      <PortalSessionState
        sessionError={sessionError}
        loadingMessage="Loading student assignments..."
        variant="mentee"
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header {...MENTEE_ASSIGNMENTS_NAV} />

      <DashboardContent>
        {/* Page Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <PageTitle>My Course Assignments</PageTitle>
            <SubText className="mt-1">
              Submit assignment deliverables, review mentor grades, and inspect revision history in
              Indian Standard Time (IST).
            </SubText>
          </div>

          {activeCourseId ? (
            <div className="flex items-center gap-2">
              <Span className="text-xs text-slate-500">Filtered by course:</Span>
              <Span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {assignments[0]?.courseTitle ?? activeCourseId}
              </Span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCourseFilter}
                className="h-8 px-3 text-xs"
              >
                Clear Filter
              </Button>
            </div>
          ) : null}
        </div>

        {/* Assignments Table & Filters */}
        <MyAssignmentsTable
          assignments={assignments}
          isLoading={isLoading}
          isFetching={isFetching}
          error={error}
          onRetry={() => {
            void refetch();
          }}
          selectedStatus={selectedStatus}
          onStatusChange={handleStatusChange}
          pagination={{
            page,
            limit,
            total,
            totalPages,
            onPageChange: setPage,
            onLimitChange: (newLimit) => {
              setLimit(newLimit);
              setPage(1);
            },
          }}
        />
      </DashboardContent>
    </div>
  );
}

export default function MenteeAssignmentsPage() {
  return (
    <Suspense
      fallback={
        <PortalSessionState
          sessionError={null}
          loadingMessage="Loading student assignments..."
          variant="mentee"
        />
      }
    >
      <MenteeAssignmentsContent />
    </Suspense>
  );
}

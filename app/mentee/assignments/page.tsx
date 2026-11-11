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

  const { assignments, isLoading, isFetching, error, refetch } = useMyAssignments({
    page: 1,
    limit: 100,
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
    <div className="flex min-h-screen flex-col bg-[#F6F8FC] text-[#111827]">
      <Header {...MENTEE_ASSIGNMENTS_NAV} />

      <DashboardContent className="animate-slide-up space-y-6">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <PageTitle className="text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">
              My Course Assignments
            </PageTitle>
            <SubText className="mt-1 text-[#667085]">
              Submit assignment deliverables, review mentor grades, and inspect revision history in
              Indian Standard Time (IST).
            </SubText>
          </div>

          {activeCourseId ? (
            <div className="flex items-center gap-2">
              <Span className="text-xs text-[#667085]">Filtered by course:</Span>
              <Span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#0044D3]">
                {assignments[0]?.courseTitle ?? activeCourseId}
              </Span>
              <Button variant="outline" size="sm" onClick={handleClearCourseFilter}>
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

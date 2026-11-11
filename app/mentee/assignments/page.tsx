'use client';

import { useSearchParams } from 'next/navigation';
import React, { Suspense, useState } from 'react';

import { MENTEE_ASSIGNMENTS_NAV } from '@/components/app/navigation/portal-nav.config';
import { PortalSessionState } from '@/components/app/navigation/PortalSessionState';
import { MyAssignmentsTable } from '@/components/app/submissions/MyAssignmentsTable';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import { useMyAssignments } from '@/hooks/useSubmissions';
import type { AssignmentDerivedStatus } from '@/types/submissions';

function MenteeAssignmentsContent() {
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

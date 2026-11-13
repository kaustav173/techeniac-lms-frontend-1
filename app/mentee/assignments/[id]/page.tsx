'use client';

import Link from 'next/link';
import React, { Suspense, use } from 'react';

import { MENTEE_ASSIGNMENTS_NAV } from '@/components/app/navigation/portal-nav.config';
import { PortalSessionState } from '@/components/app/navigation/PortalSessionState';
import { AssignmentDetailView } from '@/components/app/submissions/AssignmentDetailView';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import { useAssignmentSubmissionDetails } from '@/hooks/useSubmissions';

interface PageProps {
  params: Promise<{ id: string }>;
}

function MenteeAssignmentDetailContent({ params }: Readonly<PageProps>) {
  const { id } = use(params);
  const { user, isAuthorized, sessionError } = useRoleRedirect({ allowedRoles: ['MENTEE'] });

  const { assignment, allocation, versions, isLoading, error, refetch } =
    useAssignmentSubmissionDetails(id);

  if (!isAuthorized || !user) {
    return (
      <PortalSessionState
        sessionError={sessionError}
        loadingMessage="Loading assignment workspace..."
        variant="mentee"
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F8FC] text-[#111827]">
      <Header {...MENTEE_ASSIGNMENTS_NAV} />

      <DashboardContent className="space-y-6">
        <div>
          <Link
            href="/mentee/assignments"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#111827] transition-colors hover:text-[#0044D3]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Assignments
          </Link>
        </div>

        <AssignmentDetailView
          assignment={assignment}
          allocation={allocation}
          versions={versions}
          isLoading={isLoading}
          error={error}
          onRetry={() => {
            void refetch();
          }}
          onSuccess={() => {
            void refetch();
          }}
        />
      </DashboardContent>
    </div>
  );
}

export default function MenteeAssignmentDetailPage({ params }: Readonly<PageProps>) {
  return (
    <Suspense
      fallback={
        <PortalSessionState
          sessionError={null}
          loadingMessage="Loading assignment workspace..."
          variant="mentee"
        />
      }
    >
      <MenteeAssignmentDetailContent params={params} />
    </Suspense>
  );
}

import type { Metadata } from 'next';

import { MENTOR_REVIEWS_NAV } from '@/components/app/navigation/portal-nav.config';
import { SubmissionQueueTable } from '@/components/app/submissions/SubmissionQueueTable';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';
import { PageTitle, SubText } from '@/components/ui/Typography';

export const metadata: Metadata = {
  title: 'Submission Queue & Reviews | Mentor Portal',
  description: 'Review and grade coursework submitted by your assigned mentees.',
};

export default function MentorSubmissionsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header {...MENTOR_REVIEWS_NAV} />
      <DashboardContent>
        <div className="mb-6">
          <PageTitle className="text-2xl font-bold tracking-tight sm:text-3xl">
            Submission Queue & Reviews
          </PageTitle>
          <SubText className="mt-1">
            Review submitted coursework, give marks and feedback, or request revisions.
          </SubText>
        </div>

        <SubmissionQueueTable />
      </DashboardContent>
    </div>
  );
}

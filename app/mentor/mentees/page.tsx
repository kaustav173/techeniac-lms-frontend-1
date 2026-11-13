import type { Metadata } from 'next';

import { MentorMenteesView } from '@/components/app/mentees/MentorMenteesView';
import { MENTOR_MENTEES_NAV } from '@/components/app/navigation/portal-nav.config';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'Mentees | Mentor Portal',
  description: 'View and manage mentees actively mapped to you across your assigned courses.',
};

export default function MentorMenteesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F6F8FC] text-[#111827]">
      <Header {...MENTOR_MENTEES_NAV} />
      <DashboardContent>
        <MentorMenteesView />
      </DashboardContent>
    </div>
  );
}

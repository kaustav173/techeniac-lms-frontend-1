export interface AdminDashboardData {
  users: {
    totalUsers: number;
    menteesCount: number;
    mentorsCount: number;
    adminsCount: number;
  };
  batches: {
    totalBatches: number;
    liveBatches: number;
    draftBatches: number;
    completedBatches: number;
    onHoldBatches: number;
    archivedBatches: number;
  };
  courses: {
    totalCourses: number;
    publishedCourses: number;
  };
  allocations: {
    activeAllocations: number;
    completedAllocations: number;
  };
  submissions: {
    pendingReviewCount: number;
    gradedCount: number;
    resubmitRequestedCount: number;
  };
}

export interface LatestSubmissionItem {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseName: string;
  menteeId: string;
  menteeName: string;
  menteeEmail: string;
  batchId: string | null;
  batchName: string | null;
  version: number;
  status: string;
  isLate: boolean;
  submittedAt: string;
}

export interface MentorDashboardData {
  assignedBatchesCount: number;
  activeMenteesCount: number;
  pendingReviewCount: number;
  gradedCount: number;
  isZeroState: boolean;
  latestSubmissions: LatestSubmissionItem[];
}

export interface MenteeRecentSubmissionItem {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  courseName: string;
  status: string;
  marks: number | null;
  gradeLabel: string | null;
  isLate: boolean;
  submittedAt: string;
}

export interface MenteeUpcomingDeadlineItem {
  allocationId: string;
  courseName: string;
  dueDate: string;
  progressPercent: number;
  isOverdue: boolean;
}

export interface MenteeDashboardData {
  activeCoursesCount: number;
  completedCoursesCount: number;
  overallProgressPercent: number;
  pendingAssignmentsCount: number;
  recentSubmissions: MenteeRecentSubmissionItem[];
  upcomingDeadlines: MenteeUpcomingDeadlineItem[];
}

import { type SubmissionData, SubmissionStatus } from './submissions';

export { SubmissionStatus };
export type { SubmissionData };

export interface SubmissionQueueMentee {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export interface SubmissionQueueItem {
  readonly id: string;
  readonly courseAllocationId: string;
  readonly assignmentId: string;
  readonly assignmentTitle: string;
  readonly maxMarks: number;
  readonly passMarks: number;
  readonly courseId: string;
  readonly courseTitle: string;
  readonly topicId: string | null;
  readonly topicTitle: string | null;
  readonly batchId: string | null;
  readonly batchName: string | null;
  readonly version: number;
  readonly submittedAt: string;
  readonly isLate: boolean;
  readonly status: SubmissionStatus;
  readonly marks: number | null;
  readonly gradeLabel: string | null;
  readonly feedback: string | null;
  readonly gradedBy: string | null;
  readonly gradedAt: string | null;
  readonly mentee: SubmissionQueueMentee;
}

export interface SubmissionReviewDetails {
  readonly id: string;
  readonly courseAllocationId: string;
  readonly assignmentId: string;
  readonly assignmentTitle: string;
  readonly instructions: string | null;
  readonly maxMarks: number;
  readonly passMarks: number;
  readonly courseId: string;
  readonly courseTitle: string;
  readonly topicId: string | null;
  readonly topicTitle: string | null;
  readonly batchId: string | null;
  readonly batchName: string | null;
  readonly version: number;
  readonly submittedAt: string;
  readonly isLate: boolean;
  readonly status: SubmissionStatus;
  readonly submissionData: SubmissionData;
  readonly mentee: SubmissionQueueMentee;
  readonly grading: {
    readonly marks: number | null;
    readonly gradeLabel: string | null;
    readonly feedback: string | null;
    readonly gradedBy: string | null;
    readonly gradedAt: string | null;
  };
}

export interface SubmissionQueueQuery {
  readonly status?: SubmissionStatus | 'ALL' | undefined;
  readonly batchId?: string | undefined;
  readonly menteeId?: string | undefined;
  readonly courseId?: string | undefined;
  readonly topicId?: string | undefined;
  readonly isLate?: boolean | undefined;
  readonly search?: string | undefined;
  readonly fromDate?: string | undefined;
  readonly toDate?: string | undefined;
  readonly sort?: 'latest' | 'oldest' | undefined;
  readonly sortBy?: 'submittedAt' | 'mentee' | undefined;
  readonly sortOrder?: 'asc' | 'desc' | 'ASC' | 'DESC' | undefined;
  readonly page?: number | undefined;
  readonly limit?: number | undefined;
}

export interface PaginatedSubmissionQueueResponse {
  readonly items: SubmissionQueueItem[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

export interface GradeSubmissionInput {
  readonly marks: number;
  readonly feedback?: string | null;
}

export interface RequestResubmissionInput {
  readonly feedback: string;
}

export interface GradeThreshold {
  readonly minPercentage: number;
  readonly label: string;
}

export const GRADE_SCALE: readonly GradeThreshold[] = [
  { minPercentage: 90, label: 'A+' },
  { minPercentage: 80, label: 'A' },
  { minPercentage: 70, label: 'B' },
  { minPercentage: 60, label: 'C' },
  { minPercentage: 50, label: 'D' },
  { minPercentage: 0, label: 'F' },
] as const;

export function calculateGradeLabel(marks: number, maxMarks: number): string {
  if (maxMarks <= 0) return 'F';
  const percentage = (marks / maxMarks) * 100;
  for (const threshold of GRADE_SCALE) {
    if (percentage >= threshold.minPercentage) {
      return threshold.label;
    }
  }
  return 'F';
}

import type { BatchStatus } from '@/lib/validation/batch.schemas';

import { Assignment, SubmissionMode } from './courses';

export { SubmissionMode };

export enum AssignmentDerivedStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  RESUBMIT_REQUESTED = 'RESUBMIT_REQUESTED',
  GRADED = 'GRADED',
  OVERDUE = 'OVERDUE',
  CLOSED = 'CLOSED',
}

export enum SubmissionStatus {
  SUBMITTED = 'SUBMITTED',
  RESUBMIT_REQUESTED = 'RESUBMIT_REQUESTED',
  GRADED = 'GRADED',
}

export interface SubmissionData {
  pdfUrl?: string | null | undefined;
  zipUrl?: string | null | undefined;
  linkUrl?: string | null | undefined;
}

export interface SubmissionVersion {
  id: string;
  courseAllocationId: string;
  assignmentId: string;
  version: number;
  submissionData: SubmissionData;
  confirmedCompleteAt: string;
  submittedAt: string;
  isLate: boolean;
  status: SubmissionStatus;
  marks: number | null;
  gradeLabel: string | null;
  feedback: string | null;
  gradedBy: string | null;
  gradedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentWithSubmissionStatus {
  id: string;
  courseId: string;
  allocationId?: string;
  courseTitle: string;
  topicId: string | null;
  topicTitle: string | null;
  scope: string;
  title: string;
  instructions: string | null;
  estimatedMinutes: number;
  maxMarks: number;
  passMarks: number;
  allowLate: boolean;
  pdfMode: SubmissionMode;
  zipMode: SubmissionMode;
  urlMode: SubmissionMode;
  resources: unknown;
  dueDate: string;
  status: AssignmentDerivedStatus;
  latestSubmission?: {
    id: string;
    version: number;
    submittedAt: string;
    isLate: boolean;
    status: SubmissionStatus;
    marks: number | null;
    gradeLabel: string | null;
    feedback: string | null;
  } | null;
}

export interface ListMyAssignmentsQuery {
  page?: number | undefined;
  limit?: number | undefined;
  status?: AssignmentDerivedStatus | undefined;
  courseId?: string | undefined;
}

export interface PaginatedAssignmentsResponse {
  items: AssignmentWithSubmissionStatus[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AssignmentSubmissionDetails {
  assignment: Assignment;
  allocation: {
    allocationId: string;
    dueDate: string;
    batchId: string | null;
    batchStatus: BatchStatus;
    isBatchActive: boolean;
  };
  versions: SubmissionVersion[];
}

export interface CreateSubmissionInput {
  assignmentId: string;
  submissionData: SubmissionData;
  confirmedComplete: boolean;
}

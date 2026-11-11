export enum AssignmentScope {
  COURSE = 'COURSE',
  TOPIC = 'TOPIC',
}

export enum SubmissionMode {
  OFF = 'OFF',
  OPTIONAL = 'OPTIONAL',
  REQUIRED = 'REQUIRED',
}

export interface ResourceItem {
  id?: string | undefined;
  title: string;
  url: string;
  type: 'LINK' | 'ATTACHMENT';
}

export interface Assignment {
  id: string;
  courseId: string;
  topicId?: string | null | undefined;
  scope: AssignmentScope;
  title: string;
  instructions?: string | null | undefined;
  estimatedMinutes: number;
  maxMarks: number;
  passMarks: number;
  allowLate: boolean;
  pdfMode: SubmissionMode;
  zipMode: SubmissionMode;
  urlMode: SubmissionMode;
  resources?: ResourceItem[] | null | undefined;
  course?: { id: string; title: string } | undefined;
  topic?: { id: string; title: string } | null | undefined;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subtopic {
  id: string;
  topicId: string;
  title: string;
  content?: string | null | undefined;
  resources?: ResourceItem[] | null | undefined;
  displayOrder: number;
  estimatedMinutes?: number | null | undefined;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  id: string;
  courseId: string;
  title: string;
  description?: string | null | undefined;
  resources?: ResourceItem[] | null | undefined;
  displayOrder: number;
  estimatedMinutes?: number | null | undefined;
  isActive: boolean;
  subtopics?: Subtopic[] | undefined;
  assignments?: Assignment[] | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string | null | undefined;
  estimatedMinutes?: number | null | undefined;
  isActive: boolean;
  createdById: string;
  topics?: Topic[] | undefined;
  assignments?: Assignment[] | undefined;
  courseAssignments?: Assignment[] | undefined;
  topicCount?: number | undefined;
  assignmentCount?: number | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface CoursePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListCoursesQuery {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  isActive?: boolean | 'all' | undefined;
  sortBy?: 'createdAt' | 'title' | 'updatedAt' | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
}

export interface CreateCourseInput {
  title: string;
  description?: string | undefined;
  estimatedMinutes?: number | undefined;
  isActive?: boolean | undefined;
}

export interface UpdateCourseInput {
  title?: string | undefined;
  description?: string | null | undefined;
  estimatedMinutes?: number | null | undefined;
  isActive?: boolean | undefined;
  expectedUpdatedAt?: string | undefined;
}

export interface CreateTopicInput {
  title: string;
  description?: string | undefined;
  resources?: ResourceItem[] | undefined;
  displayOrder?: number | undefined;
  estimatedMinutes?: number | undefined;
  isActive?: boolean | undefined;
}

export interface UpdateTopicInput {
  title?: string | undefined;
  description?: string | null | undefined;
  resources?: ResourceItem[] | null | undefined;
  displayOrder?: number | undefined;
  estimatedMinutes?: number | null | undefined;
  isActive?: boolean | undefined;
  expectedUpdatedAt?: string | undefined;
}

export interface CreateSubtopicInput {
  title: string;
  content?: string | undefined;
  resources?: ResourceItem[] | undefined;
  displayOrder?: number | undefined;
  estimatedMinutes?: number | undefined;
  isActive?: boolean | undefined;
}

export interface UpdateSubtopicInput {
  title?: string | undefined;
  content?: string | null | undefined;
  resources?: ResourceItem[] | null | undefined;
  displayOrder?: number | undefined;
  estimatedMinutes?: number | null | undefined;
  isActive?: boolean | undefined;
  expectedUpdatedAt?: string | undefined;
}

export interface CreateAssignmentInput {
  scope: AssignmentScope;
  topicId?: string | null | undefined;
  title: string;
  instructions?: string | undefined;
  estimatedMinutes: number;
  maxMarks: number;
  passMarks: number;
  allowLate?: boolean | undefined;
  pdfMode?: SubmissionMode | undefined;
  zipMode?: SubmissionMode | undefined;
  urlMode?: SubmissionMode | undefined;
  resources?: ResourceItem[] | undefined;
  displayOrder?: number | undefined;
}

export interface UpdateAssignmentInput {
  title?: string | undefined;
  instructions?: string | null | undefined;
  estimatedMinutes?: number | undefined;
  maxMarks?: number | undefined;
  passMarks?: number | undefined;
  allowLate?: boolean | undefined;
  pdfMode?: SubmissionMode | undefined;
  zipMode?: SubmissionMode | undefined;
  urlMode?: SubmissionMode | undefined;
  resources?: ResourceItem[] | null | undefined;
  displayOrder?: number | undefined;
  expectedUpdatedAt?: string | undefined;
}

export interface ReorderItemInput {
  id: string;
  displayOrder: number;
}

export interface CourseImpact {
  courseId: string;
  openAllocationsCount: number;
  affectedMenteesCount: number;
}

import type { ApiAuditItem } from '@/lib/validation';

/**
 * Formats raw SNAKE_CASE or UPPER_CASE audit action strings into clean Title Case
 * (e.g., 'LOGIN' -> 'Login', 'FAILED_LOGIN' -> 'Failed Login', 'ROLE_CHANGE' -> 'Role Change').
 */
export function formatAuditAction(action: string | null | undefined): string {
  if (!action) return '-';

  return action
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Formats raw SNAKE_CASE audit type strings into clean Title Case
 * (e.g., 'COURSE_ALLOCATION' -> 'Course Allocation', 'MENTOR_MAPPING' -> 'Mentor Mapping').
 */
export function formatAuditType(type: string | null | undefined): string {
  if (!type) return '-';

  return type
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export interface ResolvedAuditTarget {
  name: string;
  type: string;
  tooltip?: string;
  isGrading?: boolean;
  studentName?: string;
  assignmentTitle?: string;
  grade?: string;
  courseTitle?: string;
}

/**
 * Resolves a human-friendly name and subtitle for an audit target entity
 * strictly tailored to PRD M14 requirements:
 * 1. Auth: Identifier / User
 * 2. User: Name or Email / User
 * 3. Course: Title / Course
 * 4. Batch: Name / Batch
 * 5. Submission: 'Submission' / Assignment Title (with tooltip on hover)
 * 6. Grading: Grade / Student Name (table), Student Name & Assignment (detail modal)
 * 7. Course Allocation: Course Title / Allocated User Names
 * 8. Mentor Mapping: 'Mentor Mapping' / Mentee -> Mentor
 */
export function resolveAuditTargetEntity(item: ApiAuditItem): ResolvedAuditTarget {
  const val = item.newValue ?? item.oldValue ?? {};
  const friendlyType = item.entity ? item.entity.replace(/([a-z])([A-Z])/g, '$1 $2') : 'Entity';

  // 1. AUTH
  if (item.type === 'AUTH') {
    const identifier =
      (typeof val.email === 'string' && val.email.trim()) ||
      (typeof val.name === 'string' && val.name.trim()) ||
      item.actor?.email ||
      'User';
    return {
      name: identifier,
      type: 'User',
    };
  }

  // 2. USER
  if (item.type === 'USER' || item.entity === 'User') {
    const identifier =
      (typeof val.name === 'string' && val.name.trim()) ||
      (typeof val.email === 'string' && val.email.trim()) ||
      (typeof val.title === 'string' && val.title.trim()) ||
      'User';
    return {
      name: identifier,
      type: 'User',
    };
  }

  // 3. COURSE
  if (item.type === 'COURSE' || item.entity === 'Course') {
    const courseTitle =
      (typeof val.title === 'string' && val.title.trim()) ||
      (typeof val.courseTitle === 'string' && val.courseTitle.trim()) ||
      'Course';
    return {
      name: courseTitle,
      type: 'Course',
      courseTitle,
    };
  }

  // 4. BATCH
  if (item.type === 'BATCH' || item.entity === 'Batch') {
    const batchName =
      (typeof val.name === 'string' && val.name.trim()) ||
      (typeof val.batchName === 'string' && val.batchName.trim()) ||
      'Batch';
    return {
      name: batchName,
      type: 'Batch',
    };
  }

  // 5. SUBMISSION
  if (item.type === 'SUBMISSION' || item.entity === 'Submission') {
    const assignmentTitle =
      (typeof val.assignmentTitle === 'string' && val.assignmentTitle.trim()) ||
      (typeof val.title === 'string' && val.title.trim()) ||
      'Assignment Submission';
    return {
      name: 'Submission',
      type: assignmentTitle,
      tooltip: assignmentTitle,
      assignmentTitle,
    };
  }

  // 6. GRADING
  if (item.type === 'GRADING' || item.action === 'GRADE_SUBMISSION') {
    let gradeLabel = typeof val.gradeLabel === 'string' ? val.gradeLabel.trim() : '';
    if (!gradeLabel && (typeof val.marks === 'number' || typeof val.marks === 'string')) {
      gradeLabel = `${String(val.marks)}/100`;
    }
    const gradeDisplay = gradeLabel ? `Grade: ${gradeLabel}` : 'Grade';

    const studentName =
      (typeof val.studentName === 'string' && val.studentName.trim()) ||
      (typeof val.userName === 'string' && val.userName.trim()) ||
      (typeof val.menteeName === 'string' && val.menteeName.trim()) ||
      'Student';

    const assignmentTitle =
      (typeof val.assignmentTitle === 'string' && val.assignmentTitle.trim()) ||
      (typeof val.title === 'string' && val.title.trim()) ||
      'Assignment';

    return {
      name: gradeDisplay,
      type: studentName,
      tooltip: `${studentName} — ${assignmentTitle} (${gradeDisplay})`,
      isGrading: true,
      studentName,
      assignmentTitle,
      grade: gradeDisplay,
    };
  }

  // 7. COURSE ALLOCATION
  if (item.type === 'COURSE_ALLOCATION' || item.entity === 'CourseAllocation') {
    const courseTitle =
      (typeof val.courseTitle === 'string' && val.courseTitle.trim()) ||
      (typeof val.title === 'string' && val.title.trim()) ||
      'Course Allocation';

    let userNames =
      (typeof val.userName === 'string' && val.userName.trim()) ||
      (typeof val.studentName === 'string' && val.studentName.trim()) ||
      (typeof val.menteeName === 'string' && val.menteeName.trim()) ||
      '';

    if (!userNames && Array.isArray(val.userNames) && val.userNames.length > 0) {
      userNames = val.userNames.join(', ');
    }

    if (!userNames) {
      userNames = 'Allocated Mentees';
    }

    return {
      name: courseTitle,
      type: userNames,
      tooltip: userNames,
      courseTitle,
    };
  }

  // 8. MENTOR MAPPING
  if (item.type === 'MENTOR_MAPPING' || item.entity === 'MentorMentee') {
    const mentee = typeof val.menteeName === 'string' ? val.menteeName.trim() : 'Mentee';
    const mentor = typeof val.mentorName === 'string' ? val.mentorName.trim() : 'Mentor';
    const mappingDisplay = `${mentee} -> ${mentor}`;

    return {
      name: 'Mentor Mapping',
      type: mappingDisplay,
      tooltip: mappingDisplay,
    };
  }

  // Generic fallback
  let resolvedName: string | null = null;
  if (typeof val.name === 'string' && val.name.trim()) resolvedName = val.name.trim();
  else if (typeof val.title === 'string' && val.title.trim()) resolvedName = val.title.trim();
  else if (typeof val.email === 'string' && val.email.trim()) resolvedName = val.email.trim();

  return {
    name: resolvedName || friendlyType,
    type: resolvedName ? friendlyType : '',
  };
}

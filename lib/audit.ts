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
 * Resolves a human-friendly name and type for an audit target entity
 * using a priority cascade across known payload fields.
 */
export function resolveAuditTargetEntity(item: ApiAuditItem): {
  name: string;
  type: string;
} {
  const val = item.newValue ?? item.oldValue;
  const friendlyType = item.entity.replace(/([a-z])([A-Z])/g, '$1 $2');

  let resolvedName: string | null = null;
  if (val && typeof val === 'object') {
    if (typeof val.name === 'string' && val.name.trim()) resolvedName = val.name.trim();
    else if (typeof val.title === 'string' && val.title.trim()) resolvedName = val.title.trim();
    else if (typeof val.email === 'string' && val.email.trim()) resolvedName = val.email.trim();
    else if (typeof val.batchName === 'string' && val.batchName.trim())
      resolvedName = val.batchName.trim();
    else if (typeof val.courseTitle === 'string' && val.courseTitle.trim())
      resolvedName = val.courseTitle.trim();
    else if (typeof val.assignmentTitle === 'string' && val.assignmentTitle.trim())
      resolvedName = val.assignmentTitle.trim();
    else if (typeof val.menteeName === 'string' && val.menteeName.trim())
      resolvedName = val.menteeName.trim();
  }

  if (resolvedName) {
    return {
      name: resolvedName,
      type: friendlyType,
    };
  }

  return {
    name: friendlyType,
    type: '',
  };
}

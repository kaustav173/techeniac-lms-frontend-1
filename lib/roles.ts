import type { UserRole } from '@/lib/validation';

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  MENTOR: 'Mentor',
  MENTEE: 'Mentee',
};

export const ALLOWED_ROLE_TRANSITIONS: Record<UserRole, UserRole[]> = {
  MENTEE: ['MENTOR'],
  MENTOR: ['SUPER_ADMIN'],
  SUPER_ADMIN: [],
};

export function formatRoleLabel(role?: string): string {
  if (!role) return 'Member';
  const clean = role.trim().toUpperCase();
  if (clean === 'SUPER_ADMIN' || clean === 'SUPERADMIN' || clean === 'ADMIN') {
    return 'Super Admin';
  }
  if (clean === 'MENTOR') {
    return 'Mentor';
  }
  if (clean === 'MENTEE') {
    return 'Mentee';
  }
  return role;
}

import type { HeaderNavItem, HeaderProps } from '@/components/layout/Header';

export interface PortalNavConfig extends HeaderProps {
  readonly subtitle: string;
  readonly homeUrl: string;
  readonly badgeColor: string;
  readonly nav: readonly HeaderNavItem[];
}

export const ADMIN_PORTAL_NAV: PortalNavConfig = {
  subtitle: 'Admin Console',
  homeUrl: '/admin',
  badgeColor: 'bg-purple-100 text-purple-800',
  nav: [
    { label: 'Dashboard', href: '/admin', active: true },
    { label: 'Users', href: '/admin/users', active: false },
    { label: 'Batches', href: '/admin/batches', active: false },
    { label: 'Courses', href: '/admin/courses', active: false },
    { label: 'Allocations', href: '/admin/allocations', active: false },
    { label: 'Progress', href: '/admin/progress', active: false },
    { label: 'Performance', href: '/admin/performance', active: false },
    { label: 'Audit Log', href: '/admin/audit-logs', active: false },
  ],
};

export const ADMIN_USERS_NAV: PortalNavConfig = {
  subtitle: 'Admin Console',
  homeUrl: '/admin',
  badgeColor: 'bg-purple-100 text-purple-800',
  nav: [
    { label: 'Dashboard', href: '/admin', active: false },
    { label: 'Users', href: '/admin/users', active: true },
    { label: 'Batches', href: '/admin/batches', active: false },
    { label: 'Courses', href: '/admin/courses', active: false },
    { label: 'Allocations', href: '/admin/allocations', active: false },
    { label: 'Progress', href: '/admin/progress', active: false },
    { label: 'Performance', href: '/admin/performance', active: false },
    { label: 'Audit Log', href: '/admin/audit-logs', active: false },
  ],
};

export const ADMIN_BATCHES_NAV: PortalNavConfig = {
  subtitle: 'Admin Console',
  homeUrl: '/admin',
  badgeColor: 'bg-purple-100 text-purple-800',
  nav: [
    { label: 'Dashboard', href: '/admin', active: false },
    { label: 'Users', href: '/admin/users', active: false },
    { label: 'Batches', href: '/admin/batches', active: true },
    { label: 'Courses', href: '/admin/courses', active: false },
    { label: 'Allocations', href: '/admin/allocations', active: false },
    { label: 'Progress', href: '/admin/progress', active: false },
    { label: 'Performance', href: '/admin/performance', active: false },
    { label: 'Audit Log', href: '/admin/audit-logs', active: false },
  ],
};

export const ADMIN_COURSES_NAV: PortalNavConfig = {
  subtitle: 'Admin Console',
  homeUrl: '/admin',
  badgeColor: 'bg-purple-100 text-purple-800',
  nav: [
    { label: 'Dashboard', href: '/admin', active: false },
    { label: 'Users', href: '/admin/users', active: false },
    { label: 'Batches', href: '/admin/batches', active: false },
    { label: 'Courses', href: '/admin/courses', active: true },
    { label: 'Allocations', href: '/admin/allocations', active: false },
    { label: 'Progress', href: '/admin/progress', active: false },
    { label: 'Performance', href: '/admin/performance', active: false },
    { label: 'Audit Log', href: '/admin/audit-logs', active: false },
  ],
};

export const ADMIN_ALLOCATIONS_NAV: PortalNavConfig = {
  subtitle: 'Admin Console',
  homeUrl: '/admin',
  badgeColor: 'bg-purple-100 text-purple-800',
  nav: [
    { label: 'Dashboard', href: '/admin', active: false },
    { label: 'Users', href: '/admin/users', active: false },
    { label: 'Batches', href: '/admin/batches', active: false },
    { label: 'Courses', href: '/admin/courses', active: false },
    { label: 'Allocations', href: '/admin/allocations', active: true },
    { label: 'Progress', href: '/admin/progress', active: false },
    { label: 'Performance', href: '/admin/performance', active: false },
    { label: 'Audit Log', href: '/admin/audit-logs', active: false },
  ],
};

export const ADMIN_PROGRESS_NAV: PortalNavConfig = {
  subtitle: 'Admin Console',
  homeUrl: '/admin',
  badgeColor: 'bg-purple-100 text-purple-800',
  nav: [
    { label: 'Dashboard', href: '/admin', active: false },
    { label: 'Users', href: '/admin/users', active: false },
    { label: 'Batches', href: '/admin/batches', active: false },
    { label: 'Courses', href: '/admin/courses', active: false },
    { label: 'Allocations', href: '/admin/allocations', active: false },
    { label: 'Progress', href: '/admin/progress', active: true },
    { label: 'Performance', href: '/admin/performance', active: false },
    { label: 'Audit Log', href: '/admin/audit-logs', active: false },
  ],
};

export const ADMIN_PERFORMANCE_NAV: PortalNavConfig = {
  subtitle: 'Admin Console',
  homeUrl: '/admin',
  badgeColor: 'bg-purple-100 text-purple-800',
  nav: [
    { label: 'Dashboard', href: '/admin', active: false },
    { label: 'Users', href: '/admin/users', active: false },
    { label: 'Batches', href: '/admin/batches', active: false },
    { label: 'Courses', href: '/admin/courses', active: false },
    { label: 'Allocations', href: '/admin/allocations', active: false },
    { label: 'Progress', href: '/admin/progress', active: false },
    { label: 'Performance', href: '/admin/performance', active: true },
    { label: 'Audit Log', href: '/admin/audit-logs', active: false },
  ],
};

export const ADMIN_AUDIT_LOGS_NAV: PortalNavConfig = {
  subtitle: 'Admin Console',
  homeUrl: '/admin',
  badgeColor: 'bg-purple-100 text-purple-800',
  nav: [
    { label: 'Dashboard', href: '/admin', active: false },
    { label: 'Users', href: '/admin/users', active: false },
    { label: 'Batches', href: '/admin/batches', active: false },
    { label: 'Curriculum', href: '/admin/courses', active: false },
    { label: 'Allocations', href: '/admin/allocations', active: false },
    { label: 'Progress', href: '/admin/progress', active: false },
    { label: 'Performance', href: '/admin/performance', active: false },
    { label: 'Audit Log', href: '/admin/audit-logs', active: true },
  ],
};

export const ADMIN_NAV_CONFIG = ADMIN_PROGRESS_NAV;

export const MENTOR_PORTAL_NAV: PortalNavConfig = {
  subtitle: 'Mentor Portal',
  homeUrl: '/mentor',
  badgeColor: 'bg-emerald-100 text-emerald-800',
  nav: [
    { label: 'Dashboard', href: '/mentor', active: true },
    { label: 'My Mentees', href: '/mentor/mentees', active: false },
    { label: 'Reviews', href: '/mentor/submissions', active: false },
    { label: 'Courses', href: '/mentor/courses', active: false },
    { label: 'Allocations', href: '/mentor/allocations', active: false },
    { label: 'Progress Tracker', href: '/mentor/progress', active: false },
    { label: "Mentees' Performance", href: '/mentor/performance', active: false },
    { label: 'My Performance', href: '/mentor/my-performance', active: false },
  ],
};

export const MENTOR_MENTEES_NAV: PortalNavConfig = {
  subtitle: 'Mentor Portal',
  homeUrl: '/mentor',
  badgeColor: 'bg-emerald-100 text-emerald-800',
  nav: [
    { label: 'Dashboard', href: '/mentor', active: false },
    { label: 'My Mentees', href: '/mentor/mentees', active: true },
    { label: 'Reviews', href: '/mentor/submissions', active: false },
    { label: 'Courses', href: '/mentor/courses', active: false },
    { label: 'Allocations', href: '/mentor/allocations', active: false },
    { label: 'Progress Tracker', href: '/mentor/progress', active: false },
    { label: "Mentees' Performance", href: '/mentor/performance', active: false },
    { label: 'My Performance', href: '/mentor/my-performance', active: false },
  ],
};

export const MENTOR_COURSES_NAV: PortalNavConfig = {
  subtitle: 'Mentor Portal',
  homeUrl: '/mentor',
  badgeColor: 'bg-emerald-100 text-emerald-800',
  nav: [
    { label: 'Dashboard', href: '/mentor', active: false },
    { label: 'My Mentees', href: '/mentor/mentees', active: false },
    { label: 'Reviews', href: '/mentor/submissions', active: false },
    { label: 'Courses', href: '/mentor/courses', active: true },
    { label: 'Allocations', href: '/mentor/allocations', active: false },
    { label: 'Progress Tracker', href: '/mentor/progress', active: false },
    { label: "Mentees' Performance", href: '/mentor/performance', active: false },
    { label: 'My Performance', href: '/mentor/my-performance', active: false },
  ],
};

export const MENTOR_ALLOCATIONS_NAV: PortalNavConfig = {
  subtitle: 'Mentor Portal',
  homeUrl: '/mentor',
  badgeColor: 'bg-emerald-100 text-emerald-800',
  nav: [
    { label: 'Dashboard', href: '/mentor', active: false },
    { label: 'My Mentees', href: '/mentor/mentees', active: false },
    { label: 'Reviews', href: '/mentor/submissions', active: false },
    { label: 'Courses', href: '/mentor/courses', active: false },
    { label: 'Allocations', href: '/mentor/allocations', active: true },
    { label: 'Progress Tracker', href: '/mentor/progress', active: false },
    { label: "Mentees' Performance", href: '/mentor/performance', active: false },
    { label: 'My Performance', href: '/mentor/my-performance', active: false },
  ],
};

export const MENTOR_REVIEWS_NAV: PortalNavConfig = {
  subtitle: 'Mentor Portal',
  homeUrl: '/mentor',
  badgeColor: 'bg-emerald-100 text-emerald-800',
  nav: [
    { label: 'Dashboard', href: '/mentor', active: false },
    { label: 'My Mentees', href: '/mentor/mentees', active: false },
    { label: 'Reviews', href: '/mentor/submissions', active: true },
    { label: 'Courses', href: '/mentor/courses', active: false },
    { label: 'Allocations', href: '/mentor/allocations', active: false },
    { label: 'Progress Tracker', href: '/mentor/progress', active: false },
    { label: "Mentees' Performance", href: '/mentor/performance', active: false },
    { label: 'My Performance', href: '/mentor/my-performance', active: false },
  ],
};

export const MENTOR_PROGRESS_NAV: PortalNavConfig = {
  subtitle: 'Mentor Portal',
  homeUrl: '/mentor',
  badgeColor: 'bg-emerald-100 text-emerald-800',
  nav: [
    { label: 'Dashboard', href: '/mentor', active: false },
    { label: 'My Mentees', href: '/mentor/mentees', active: false },
    { label: 'Reviews', href: '/mentor/submissions', active: false },
    { label: 'Courses', href: '/mentor/courses', active: false },
    { label: 'Allocations', href: '/mentor/allocations', active: false },
    { label: 'Progress Tracker', href: '/mentor/progress', active: true },
    { label: "Mentees' Performance", href: '/mentor/performance', active: false },
    { label: 'My Performance', href: '/mentor/my-performance', active: false },
  ],
};

export const MENTOR_PERFORMANCE_NAV: PortalNavConfig = {
  subtitle: 'Mentor Portal',
  homeUrl: '/mentor',
  badgeColor: 'bg-emerald-100 text-emerald-800',
  nav: [
    { label: 'Dashboard', href: '/mentor', active: false },
    { label: 'My Mentees', href: '/mentor/mentees', active: false },
    { label: 'Reviews', href: '/mentor/submissions', active: false },
    { label: 'Courses', href: '/mentor/courses', active: false },
    { label: 'Allocations', href: '/mentor/allocations', active: false },
    { label: 'Progress Tracker', href: '/mentor/progress', active: false },
    { label: "Mentees' Performance", href: '/mentor/performance', active: true },
    { label: 'My Performance', href: '/mentor/my-performance', active: false },
  ],
};

export const MENTOR_MY_PERFORMANCE_NAV: PortalNavConfig = {
  subtitle: 'Mentor Portal',
  homeUrl: '/mentor',
  badgeColor: 'bg-emerald-100 text-emerald-800',
  nav: [
    { label: 'Dashboard', href: '/mentor', active: false },
    { label: 'My Mentees', href: '/mentor/mentees', active: false },
    { label: 'Reviews', href: '/mentor/submissions', active: false },
    { label: 'Courses', href: '/mentor/courses', active: false },
    { label: 'Allocations', href: '/mentor/allocations', active: false },
    { label: 'Progress Tracker', href: '/mentor/progress', active: false },
    { label: "Mentees' Performance", href: '/mentor/performance', active: false },
    { label: 'My Performance', href: '/mentor/my-performance', active: true },
  ],
};

export const MENTOR_NAV_CONFIG = MENTOR_PROGRESS_NAV;

export const MENTEE_PORTAL_NAV: PortalNavConfig = {
  subtitle: 'Learning Portal',
  homeUrl: '/mentee',
  badgeColor: 'bg-blue-100 text-blue-800',
  nav: [
    { label: 'My Learning', href: '/mentee', active: true },
    { label: 'Courses', href: '/mentee/courses', active: false },
    { label: 'Assignments', href: '/mentee/assignments', active: false },
    { label: 'Progress', href: '/mentee/progress', active: false },
    { label: 'My Performance', href: '/mentee/performance', active: false },
  ],
};

export const MENTEE_COURSES_NAV: PortalNavConfig = {
  subtitle: 'Learning Portal',
  homeUrl: '/mentee',
  badgeColor: 'bg-blue-100 text-blue-800',
  nav: [
    { label: 'My Learning', href: '/mentee', active: false },
    { label: 'Courses', href: '/mentee/courses', active: true },
    { label: 'Assignments', href: '/mentee/assignments', active: false },
    { label: 'Progress', href: '/mentee/progress', active: false },
    { label: 'My Performance', href: '/mentee/performance', active: false },
  ],
};

export const MENTEE_ASSIGNMENTS_NAV: PortalNavConfig = {
  subtitle: 'Learning Portal',
  homeUrl: '/mentee',
  badgeColor: 'bg-blue-100 text-blue-800',
  nav: [
    { label: 'My Learning', href: '/mentee', active: false },
    { label: 'Courses', href: '/mentee/courses', active: false },
    { label: 'Assignments', href: '/mentee/assignments', active: true },
    { label: 'Progress', href: '/mentee/progress', active: false },
    { label: 'My Performance', href: '/mentee/performance', active: false },
  ],
};

export const MENTEE_PROGRESS_NAV: PortalNavConfig = {
  subtitle: 'Learning Portal',
  homeUrl: '/mentee',
  badgeColor: 'bg-blue-100 text-blue-800',
  nav: [
    { label: 'My Learning', href: '/mentee', active: false },
    { label: 'Courses', href: '/mentee/courses', active: false },
    { label: 'Assignments', href: '/mentee/assignments', active: false },
    { label: 'Progress', href: '/mentee/progress', active: true },
    { label: 'My Performance', href: '/mentee/performance', active: false },
  ],
};

export const MENTEE_PERFORMANCE_NAV: PortalNavConfig = {
  subtitle: 'Learning Portal',
  homeUrl: '/mentee',
  badgeColor: 'bg-blue-100 text-blue-800',
  nav: [
    { label: 'My Learning', href: '/mentee', active: false },
    { label: 'Courses', href: '/mentee/courses', active: false },
    { label: 'Assignments', href: '/mentee/assignments', active: false },
    { label: 'Progress', href: '/mentee/progress', active: false },
    { label: 'My Performance', href: '/mentee/performance', active: true },
  ],
};

export const ADMIN_PROFILE_NAV: PortalNavConfig = {
  subtitle: 'Admin Console',
  homeUrl: '/admin',
  badgeColor: 'bg-purple-100 text-purple-800',
  nav: [
    { label: 'Dashboard', href: '/admin', active: false },
    { label: 'Users', href: '/admin/users', active: false },
    { label: 'Batches', href: '/admin/batches', active: false },
    { label: 'Curriculum', href: '/admin/courses', active: false },
    { label: 'Allocations', href: '/admin/allocations', active: false },
    { label: 'Progress', href: '/admin/progress', active: false },
    { label: 'Performance', href: '/admin/performance', active: false },
  ],
};

export const MENTOR_PROFILE_NAV: PortalNavConfig = {
  subtitle: 'Mentor Portal',
  homeUrl: '/mentor',
  badgeColor: 'bg-emerald-100 text-emerald-800',
  nav: [
    { label: 'Dashboard', href: '/mentor', active: false },
    { label: 'My Mentees', href: '#', active: false },
    { label: 'Reviews', href: '/mentor/submissions', active: false },
    { label: 'Courses', href: '/mentor/courses', active: false },
    { label: 'Allocations', href: '/mentor/allocations', active: false },
    { label: 'Progress Tracker', href: '/mentor/progress', active: false },
    { label: "Mentees' Performance", href: '/mentor/performance', active: false },
    { label: 'My Performance', href: '/mentor/my-performance', active: false },
  ],
};

export const MENTEE_PROFILE_NAV: PortalNavConfig = {
  subtitle: 'Learning Portal',
  homeUrl: '/mentee',
  badgeColor: 'bg-blue-100 text-blue-800',
  nav: [
    { label: 'My Learning', href: '/mentee', active: false },
    { label: 'Courses', href: '/mentee/courses', active: false },
    { label: 'Assignments', href: '/mentee/assignments', active: false },
    { label: 'Progress', href: '/mentee/progress', active: false },
    { label: 'My Performance', href: '/mentee/performance', active: false },
  ],
};

export function getPortalNavConfig(role?: string): PortalNavConfig {
  switch (role) {
    case 'SUPER_ADMIN':
      return ADMIN_PORTAL_NAV;
    case 'MENTOR':
      return MENTOR_PORTAL_NAV;
    case 'MENTEE':
    default:
      return MENTEE_PORTAL_NAV;
  }
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/hooks/useAuth';
import type { AuthUser, UserRole } from '@/services/auth.service';

export type { UserRole };

export function getRolePortalPath(role: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin/dashboard';
    case 'MENTOR':
      return '/mentor/dashboard';
    case 'MENTEE':
      return '/mentee/dashboard';
  }
}

export function getRoleProfilePath(role: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin/profile';
    case 'MENTOR':
      return '/mentor/profile';
    case 'MENTEE':
      return '/mentee/profile';
  }
}

export function redirectUserByRole(
  router: { push: (url: string) => void; replace: (url: string) => void },
  user: AuthUser,
  method: 'push' | 'replace' = 'replace',
): void {
  const target = user.mustChangePassword ? '/change-password' : getRolePortalPath(user.role);
  if (method === 'push') {
    router.push(target);
  } else {
    router.replace(target);
  }
}

export interface UseRoleRedirectOptions {
  /** If provided, only users with one of these roles can access the page. Others are redirected to their own portal. */
  allowedRoles?: UserRole[] | undefined;
  /** If true, authenticated visitors are automatically redirected to their role portal (or /change-password). Used on `/` and `/login`. */
  redirectAuthenticatedToPortal?: boolean | undefined;
  /** Whether unauthenticated visitors should be redirected to /login. Defaults to true (set false for /login page). */
  requireAuth?: boolean | undefined;
  /** If true, users with mustChangePassword: true will NOT be redirected to /change-password. Used on /change-password page. */
  allowMustChangePassword?: boolean | undefined;
}

export interface UseRoleRedirectReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthorized: boolean;
  sessionError: string | null;
}

export function useRoleRedirect(options: UseRoleRedirectOptions = {}): UseRoleRedirectReturn {
  const {
    allowedRoles,
    redirectAuthenticatedToPortal = false,
    requireAuth = true,
    allowMustChangePassword = false,
  } = options;

  const router = useRouter();
  const { user, isAuthenticated, isLoading, sessionError } = useAuth();

  const isRoleAuthorized = Boolean(user && (!allowedRoles || allowedRoles.includes(user.role)));

  const isAuthorized =
    !isLoading &&
    !sessionError &&
    (requireAuth ? isAuthenticated && Boolean(user) : true) &&
    (allowMustChangePassword || !user?.mustChangePassword) &&
    isRoleAuthorized &&
    !redirectAuthenticatedToPortal;

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      if (requireAuth) {
        // Do not redirect to /login if there is an active transient session error (e.g. 5xx/network issue)
        if (sessionError) {
          return;
        }
        router.replace('/login');
      }
      return;
    }

    if (!allowMustChangePassword && user.mustChangePassword) {
      router.replace('/change-password');
      return;
    }

    if (redirectAuthenticatedToPortal) {
      router.replace(getRolePortalPath(user.role));
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(getRolePortalPath(user.role));
    }
  }, [
    isLoading,
    sessionError,
    isAuthenticated,
    user,
    requireAuth,
    allowMustChangePassword,
    redirectAuthenticatedToPortal,
    allowedRoles,
    router,
  ]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isAuthorized,
    sessionError,
  };
}

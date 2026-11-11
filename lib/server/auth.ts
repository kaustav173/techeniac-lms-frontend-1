import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ApiError, formatErrorMessage } from '@/lib/errors';
import { authService, type AuthUser, type UserRole } from '@/services/auth.service';

export interface ServerSessionResult {
  user: AuthUser | null;
  accessToken: string | null;
}

export type PortalServerSessionResolution =
  { status: 'ready'; user: AuthUser; accessToken: string } | { status: 'error'; message: string };

function isUnauthorizedApiError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}

async function resolveSessionWithRefresh(refreshToken: string): Promise<ServerSessionResult> {
  const refreshedToken = await authService.refreshTokenOnServer(refreshToken);
  if (!refreshedToken) {
    return { user: null, accessToken: null };
  }

  try {
    const user = await authService.getMe(refreshedToken);
    return { user, accessToken: refreshedToken };
  } catch (err) {
    if (isUnauthorizedApiError(err)) {
      return { user: null, accessToken: null };
    }
    throw err;
  }
}

export async function verifyServerSession(
  initialAccessToken?: string,
  refreshToken?: string,
): Promise<ServerSessionResult> {
  const accessToken = initialAccessToken ?? null;

  if (accessToken) {
    try {
      const user = await authService.getMe(accessToken);
      return { user, accessToken };
    } catch (err) {
      if (!isUnauthorizedApiError(err)) {
        // Propagate 5xx/403/network/timeout errors instead of falsely treating them as expired sessions.
        throw err;
      }
      if (refreshToken) {
        return resolveSessionWithRefresh(refreshToken);
      }
      return { user: null, accessToken: null };
    }
  }

  if (refreshToken) {
    return resolveSessionWithRefresh(refreshToken);
  }

  return { user: null, accessToken: null };
}

/**
 * Shared SSR portal session gate for Server Components.
 * Redirects unauthenticated or unauthorized users cleanly outside try/catch so transient
 * server/network errors surface as recoverable error state rather than forced logouts.
 */
export async function requirePortalServerSession(
  allowedRoles: readonly UserRole[],
): Promise<PortalServerSessionResolution> {
  const cookieStore = await cookies();
  const rawAccessToken = cookieStore.get('accessToken')?.value;
  const rawRefreshToken = cookieStore.get('refreshToken')?.value;

  if (!rawAccessToken && !rawRefreshToken) {
    redirect('/login');
  }

  let sessionResult: ServerSessionResult | null = null;
  let errorMessage: string | null = null;

  try {
    sessionResult = await verifyServerSession(rawAccessToken, rawRefreshToken);
  } catch (err) {
    errorMessage = formatErrorMessage(
      err,
      'Unable to verify your session right now. Please retry.',
    );
  }

  if (errorMessage) {
    return { status: 'error', message: errorMessage };
  }

  const user = sessionResult?.user ?? null;
  const accessToken = sessionResult?.accessToken ?? null;

  if (!user || !accessToken || !allowedRoles.includes(user.role)) {
    redirect('/login');
  }

  if (user.mustChangePassword) {
    redirect('/change-password');
  }

  return { status: 'ready', user, accessToken };
}

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

export async function verifyServerSession(accessToken?: string): Promise<ServerSessionResult> {
  if (!accessToken) {
    return { user: null, accessToken: null };
  }

  try {
    const user = await authService.getMe(accessToken);
    return { user, accessToken };
  } catch (err) {
    if (isUnauthorizedApiError(err)) {
      return { user: null, accessToken: null };
    }
    throw err;
  }
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

  // The login page checks the session in the browser, where a refresh can persist both cookies.
  if (!rawAccessToken) {
    redirect('/login');
  }

  let sessionResult: ServerSessionResult | null = null;
  let errorMessage: string | null = null;

  try {
    sessionResult = await verifyServerSession(rawAccessToken);
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

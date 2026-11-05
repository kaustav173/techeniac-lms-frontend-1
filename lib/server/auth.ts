import { ApiError } from '@/lib/errors';
import { authService, type AuthUser } from '@/services/auth.service';

export interface ServerSessionResult {
  user: AuthUser | null;
  accessToken: string | null;
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
      if (err instanceof ApiError && err.status === 401 && refreshToken) {
        const refreshedToken = await authService.refreshTokenOnServer(refreshToken);
        if (refreshedToken) {
          try {
            const user = await authService.getMe(refreshedToken);
            return { user, accessToken: refreshedToken };
          } catch {
            return { user: null, accessToken: null };
          }
        }
      }
      return { user: null, accessToken: null };
    }
  }

  if (refreshToken) {
    const refreshedToken = await authService.refreshTokenOnServer(refreshToken);
    if (refreshedToken) {
      try {
        const user = await authService.getMe(refreshedToken);
        return { user, accessToken: refreshedToken };
      } catch {
        return { user: null, accessToken: null };
      }
    }
  }

  return { user: null, accessToken: null };
}

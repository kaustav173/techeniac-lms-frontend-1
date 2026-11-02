'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { AuthContextValue } from '@/context/AuthContext';
import { ApiError } from '@/lib/errors';
import { authService, type AuthUser } from '@/services/auth.service';

export function useAuthProvider(): AuthContextValue {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/reset-password')) {
      return false;
    }
    return true;
  });
  const [sessionError, setSessionError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getMe();
      setUser(currentUser);
      setSessionError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
        setSessionError(null);
      } else {
        const msg =
          err instanceof Error
            ? err.message
            : 'Could not verify your session. Please check your connection and retry.';
        setSessionError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // On password reset page, the user is intentionally unauthenticated and using an email token.
    // Do not attempt session verification or token refresh.
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/reset-password')) {
      return;
    }

    let isMounted = true;
    void Promise.resolve().then(async () => {
      if (isMounted) {
        await refreshUser();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [refreshUser]);

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      setIsLoading(true);
      try {
        // Reset in-memory query cache for current tab session upon login
        queryClient.clear();
        const data = await authService.login(credentials);
        setUser(data.user);
        setSessionError(null);
        return data.user;
      } finally {
        setIsLoading(false);
      }
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    // Note: Do NOT set shared isLoading(true) to avoid page spinner flash
    await authService.logout();
    // Reset in-memory query cache for current tab session upon logout
    queryClient.clear();
    setUser(null);
    setSessionError(null);
  }, [queryClient]);

  return useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      sessionError,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, sessionError, login, logout, refreshUser],
  );
}

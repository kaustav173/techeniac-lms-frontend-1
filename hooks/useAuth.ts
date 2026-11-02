'use client';

import { useContext, useMemo } from 'react';

import { AuthContext, type AuthContextValue } from '@/context/AuthContext';
import { authService } from '@/services/auth.service';

export interface UseAuthReturn extends AuthContextValue {
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (token: string, newPassword: string) => Promise<string>;
  verifyResetToken: (token: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<string>;
}

const forgotPassword = (email: string): Promise<string> => authService.forgotPassword(email);
const resetPassword = (token: string, newPassword: string): Promise<string> =>
  authService.resetPassword(token, newPassword);
const verifyResetToken = (token: string): Promise<boolean> => authService.verifyResetToken(token);
const changePassword = (currentPassword: string, newPassword: string): Promise<string> =>
  authService.changePassword(currentPassword, newPassword);

export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return useMemo(
    () => ({
      ...context,
      forgotPassword,
      resetPassword,
      verifyResetToken,
      changePassword,
    }),
    [context],
  );
}

'use client';

import React, { createContext } from 'react';

import { useAuthProvider } from '@/hooks/useAuthProvider';
import type { AuthUser } from '@/services/auth.service';

export interface AuthContextValue {
  readonly user: AuthUser | null;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly sessionError: string | null;
  readonly login: (credentials: { email: string; password: string }) => Promise<AuthUser>;
  readonly logout: () => Promise<void>;
  readonly refreshUser: () => Promise<void>;
  readonly updateProfile: (name: string) => Promise<AuthUser>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  readonly children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const value = useAuthProvider();

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

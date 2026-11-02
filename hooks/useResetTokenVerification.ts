'use client';

import { useQuery } from '@tanstack/react-query';

import { authService } from '@/services/auth.service';

export type TokenVerificationStatus = 'valid' | 'invalid' | 'unverifiable';

export interface UseResetTokenVerificationReturn {
  status: TokenVerificationStatus | null;
  isVerifying: boolean;
  retry: () => void;
}

export function useResetTokenVerification(token: string | null): UseResetTokenVerificationReturn {
  const trimmed = token?.trim() ?? '';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['auth', 'reset-token', trimmed],
    queryFn: async (): Promise<TokenVerificationStatus> => {
      if (!trimmed) return 'invalid';
      try {
        const isValid = await authService.verifyResetToken(trimmed);
        return isValid ? 'valid' : 'invalid';
      } catch {
        return 'unverifiable';
      }
    },
    enabled: Boolean(trimmed),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (!trimmed) {
    return { status: 'invalid', isVerifying: false, retry: () => {} };
  }

  const status: TokenVerificationStatus | null = isError ? 'unverifiable' : (data ?? null);

  return {
    status,
    isVerifying: isLoading,
    retry: () => {
      void refetch();
    },
  };
}

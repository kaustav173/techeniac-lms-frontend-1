'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

import { getQueryClient } from '@/lib/query-client';

export { getQueryClient };

export interface QueryProviderProps {
  readonly children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => getQueryClient());

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

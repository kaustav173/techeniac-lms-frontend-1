import type { QueryClient } from '@tanstack/react-query';

import { dashboardService } from '@/services/dashboard.service';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  admin: () => [...dashboardKeys.all, 'admin'] as const,
  mentor: () => [...dashboardKeys.all, 'mentor'] as const,
  mentee: () => [...dashboardKeys.all, 'mentee'] as const,
};

export async function prefetchAdminDashboard(
  queryClient: QueryClient,
  authToken?: string,
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: dashboardKeys.admin(),
    queryFn: () => dashboardService.getAdminDashboard(authToken),
    staleTime: 60 * 1000,
  });
}

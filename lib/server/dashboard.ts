import type { QueryClient } from '@tanstack/react-query';

import { dashboardKeys } from '@/lib/dashboard-keys';
import { dashboardService } from '@/services/dashboard.service';

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

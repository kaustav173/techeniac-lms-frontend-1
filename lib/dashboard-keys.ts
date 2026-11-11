/**
 * Shared TanStack Query keys for role dashboard aggregation endpoints.
 * Kept client/server agnostic so both Server Component prefetchers and client hooks share one source of truth.
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  admin: () => [...dashboardKeys.all, 'admin'] as const,
  mentor: () => [...dashboardKeys.all, 'mentor'] as const,
  mentee: () => [...dashboardKeys.all, 'mentee'] as const,
};

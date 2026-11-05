import { apiClient } from '@/services/api.client';
import type {
  AdminDashboardData,
  MenteeDashboardData,
  MentorDashboardData,
} from '@/types/dashboard';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const dashboardService = {
  async getAdminDashboard(authToken?: string): Promise<AdminDashboardData> {
    const res = await apiClient<ApiResponse<AdminDashboardData>>(
      '/dashboard/admin',
      authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {},
    );
    return res.data;
  },

  async getMentorDashboard(authToken?: string): Promise<MentorDashboardData> {
    const res = await apiClient<ApiResponse<MentorDashboardData>>(
      '/dashboard/mentor',
      authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {},
    );
    return res.data;
  },

  async getMenteeDashboard(authToken?: string): Promise<MenteeDashboardData> {
    const res = await apiClient<ApiResponse<MenteeDashboardData>>(
      '/dashboard/mentee',
      authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {},
    );
    return res.data;
  },
};

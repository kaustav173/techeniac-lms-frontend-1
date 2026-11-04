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
  async getAdminDashboard(): Promise<AdminDashboardData> {
    const res = await apiClient<ApiResponse<AdminDashboardData>>('/dashboard/admin');
    return res.data;
  },

  async getMentorDashboard(): Promise<MentorDashboardData> {
    const res = await apiClient<ApiResponse<MentorDashboardData>>('/dashboard/mentor');
    return res.data;
  },

  async getMenteeDashboard(): Promise<MenteeDashboardData> {
    const res = await apiClient<ApiResponse<MenteeDashboardData>>('/dashboard/mentee');
    return res.data;
  },
};

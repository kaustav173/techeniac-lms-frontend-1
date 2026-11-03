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
    const res = await apiClient<ApiResponse<AdminDashboardData>>('/admin/dashboard');
    return res.data;
  },

  async getMentorDashboard(): Promise<MentorDashboardData> {
    const res = await apiClient<ApiResponse<MentorDashboardData>>('/mentor/dashboard');
    return res.data;
  },

  async getMenteeDashboard(): Promise<MenteeDashboardData> {
    const res = await apiClient<ApiResponse<MenteeDashboardData>>('/mentee/dashboard');
    return res.data;
  },
};

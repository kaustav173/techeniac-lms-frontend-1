import type { UserRole } from '@/lib/validation';

import { apiClient, ApiError } from './api.client';

export type { UserRole };

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: AuthUser;
  };
}

export interface GetMeResponse {
  success: boolean;
  data: {
    user: AuthUser;
  };
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
  };
}

export interface VerifyResetTokenResponse {
  success: boolean;
  data: {
    valid: boolean;
  };
}

export const authService = {
  async login(credentials: { email: string; password: string }): Promise<LoginResponse['data']> {
    const response = await apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (!response?.success || !response?.data?.user) {
      throw new ApiError(500, 'Invalid login response from server', 'INVALID_RESPONSE');
    }
    return response.data;
  },

  async logout(): Promise<void> {
    const response = await apiClient<MessageResponse>('/auth/logout', {
      method: 'POST',
    });
    if (!response?.success) {
      throw new ApiError(500, 'Failed to complete logout on server', 'LOGOUT_FAILED');
    }
  },

  async getMe(): Promise<AuthUser> {
    const response = await apiClient<GetMeResponse>('/auth/me');
    if (!response?.success || !response?.data?.user) {
      throw new ApiError(500, 'Invalid session response from server', 'INVALID_RESPONSE');
    }
    return response.data.user;
  },

  async refreshToken(): Promise<AuthUser> {
    const response = await apiClient<GetMeResponse>('/auth/refresh', {
      method: 'POST',
    });
    if (!response?.success || !response?.data?.user) {
      throw new ApiError(500, 'Invalid refresh response from server', 'INVALID_RESPONSE');
    }
    return response.data.user;
  },

  async forgotPassword(email: string): Promise<string> {
    const response = await apiClient<MessageResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    if (!response?.success || !response?.message) {
      throw new ApiError(500, 'Invalid response from server', 'INVALID_RESPONSE');
    }
    return response.message;
  },

  async resetPassword(token: string, newPassword: string): Promise<string> {
    const response = await apiClient<MessageResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
    if (!response?.success || !response?.message) {
      throw new ApiError(500, 'Invalid response from server', 'INVALID_RESPONSE');
    }
    return response.message;
  },

  async verifyResetToken(token: string): Promise<boolean> {
    const response = await apiClient<VerifyResetTokenResponse>('/auth/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    if (!response?.success || typeof response?.data?.valid !== 'boolean') {
      throw new ApiError(
        500,
        'Invalid token verification response from server',
        'INVALID_RESPONSE',
      );
    }
    return response.data.valid;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<string> {
    const response = await apiClient<MessageResponse>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!response?.success || !response?.message) {
      throw new ApiError(500, 'Invalid response from server', 'INVALID_RESPONSE');
    }
    return response.message;
  },

  async updateProfile(name: string): Promise<AuthUser> {
    const response = await apiClient<UpdateProfileResponse>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
    if (!response?.success || !response?.data?.user) {
      throw new ApiError(500, 'Invalid response from server', 'INVALID_RESPONSE');
    }
    return response.data.user;
  },
};

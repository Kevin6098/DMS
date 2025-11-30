import { apiService, ApiResponse, PaginationResponse } from './api';
import { User } from './authService';

// Types
export interface UserCreateRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId: number;
  role?: string;
  status?: string;
}

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  status?: string;
  organizationId?: number;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserFilters {
  search?: string;
  organizationId?: number;
  role?: string;
  status?: string;
}

export interface UserStats {
  totalUsers: number;
  statusStats: Array<{ status: string; count: number }>;
  roleStats: Array<{ role: string; count: number }>;
  recentRegistrations: number;
}

// User Service
export const userService = {
  // Create user
  createUser: async (userData: UserCreateRequest): Promise<ApiResponse<{ userId: number; email: string; firstName: string; lastName: string; organizationId: number; role: string }>> => {
    return apiService.post<{ userId: number; email: string; firstName: string; lastName: string; organizationId: number; role: string }>('/users', userData);
  },

  // Get all users with pagination and filters
  getUsers: async (
    page: number = 1,
    limit: number = 10,
    filters?: UserFilters
  ): Promise<ApiResponse<PaginationResponse<User>>> => {
    const params = {
      page,
      limit,
      ...filters,
    };
    return apiService.get<PaginationResponse<User>>('/users', params);
  },

  // Get user by ID
  getUser: async (userId: number): Promise<ApiResponse<User>> => {
    return apiService.get<User>(`/users/${userId}`);
  },

  // Update user
  updateUser: async (userId: number, userData: UserUpdateRequest): Promise<ApiResponse<void>> => {
    return apiService.put<void>(`/users/${userId}`, userData);
  },

  // Change user password
  changePassword: async (userId: number, passwordData: PasswordChangeRequest): Promise<ApiResponse<void>> => {
    return apiService.put<void>(`/users/${userId}/password`, passwordData);
  },

  // Delete user (soft delete)
  deleteUser: async (userId: number): Promise<ApiResponse<void>> => {
    return apiService.delete<void>(`/users/${userId}`);
  },

  // Get user statistics
  getUserStats: async (organizationId?: number): Promise<ApiResponse<UserStats>> => {
    const params = organizationId ? { organizationId } : {};
    return apiService.get<UserStats>('/users/stats/overview', params);
  },
};

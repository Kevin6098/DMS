import { apiService, ApiResponse, PaginationResponse } from './api';
import { User } from './authService';

// Types
export interface Organization {
  id: number;
  name: string;
  description?: string;
  storageQuota: number;
  storageUsed: number;
  status: string;
  userCount: number;
  created_at: string;
  updated_at?: string;
}

export interface OrganizationCreateRequest {
  name: string;
  description?: string;
  storageQuota?: number;
}

export interface OrganizationUpdateRequest {
  name?: string;
  description?: string;
  storageQuota?: number;
  status?: string;
}

export interface OrganizationFilters {
  search?: string;
  status?: string;
}

export interface OrganizationStats {
  totalOrganizations: number;
  statusStats: Array<{ status: string; count: number }>;
  recentOrganizations: number;
  storageStats: {
    total_quota: number;
    active_quota: number;
    total_organizations: number;
    active_organizations: number;
  };
}

// Organization Service
export const organizationService = {
  // Get all organizations with pagination and filters
  getOrganizations: async (
    page: number = 1,
    limit: number = 10,
    filters?: OrganizationFilters
  ): Promise<ApiResponse<PaginationResponse<Organization>>> => {
    const params = {
      page,
      limit,
      ...filters,
    };
    return apiService.get<PaginationResponse<Organization>>('/organizations', params);
  },

  // Get organization by ID
  getOrganization: async (organizationId: number): Promise<ApiResponse<Organization>> => {
    return apiService.get<Organization>(`/organizations/${organizationId}`);
  },

  // Create organization
  createOrganization: async (organizationData: OrganizationCreateRequest): Promise<ApiResponse<{ organizationId: number; name: string; description?: string; storageQuota: number }>> => {
    return apiService.post<{ organizationId: number; name: string; description?: string; storageQuota: number }>('/organizations', organizationData);
  },

  // Update organization
  updateOrganization: async (organizationId: number, organizationData: OrganizationUpdateRequest): Promise<ApiResponse<void>> => {
    return apiService.put<void>(`/organizations/${organizationId}`, organizationData);
  },

  // Delete organization
  deleteOrganization: async (organizationId: number): Promise<ApiResponse<void>> => {
    return apiService.delete<void>(`/organizations/${organizationId}`);
  },

  // Get organization users
  getOrganizationUsers: async (
    organizationId: number,
    page: number = 1,
    limit: number = 10,
    filters?: { search?: string; role?: string; status?: string }
  ): Promise<ApiResponse<PaginationResponse<User>>> => {
    const params = {
      page,
      limit,
      ...filters,
    };
    return apiService.get<PaginationResponse<User>>(`/organizations/${organizationId}/users`, params);
  },

  // Get organization statistics
  getOrganizationStats: async (): Promise<ApiResponse<OrganizationStats>> => {
    return apiService.get<OrganizationStats>('/organizations/stats/overview');
  },
};

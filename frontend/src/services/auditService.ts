import { apiService, ApiResponse, PaginationResponse } from './api';

// Types
export interface AuditLog {
  id: number;
  created_at: string;
  action: string;
  resource_type: string;
  resource_id: number;
  details: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  organization_name?: string;
}

export interface AuditFilters {
  search?: string;
  action?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
  userId?: number;
  organizationId?: number;
}

export interface AuditStats {
  totalActivity: number;
  actionStats: Array<{
    action: string;
    count: number;
  }>;
  resourceTypeStats: Array<{
    resource_type: string;
    count: number;
  }>;
  dailyActivity: Array<{
    date: string;
    count: number;
  }>;
  topActiveUsers: Array<{
    first_name: string;
    last_name: string;
    email: string;
    activity_count: number;
  }>;
}

export interface FilterOptions {
  actions: string[];
  resourceTypes: string[];
  users: Array<{
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    organization_name?: string;
  }>;
  organizations: Array<{
    id: number;
    name: string;
  }>;
}

// Audit Service
export const auditService = {
  // Get audit logs with pagination and filters
  getAuditLogs: async (
    page: number = 1,
    limit: number = 20,
    filters?: AuditFilters
  ): Promise<ApiResponse<PaginationResponse<AuditLog>>> => {
    const params = {
      page,
      limit,
      ...filters,
    };
    return apiService.get<PaginationResponse<AuditLog>>('/audit', params);
  },

  // Get audit log by ID
  getAuditLog: async (auditLogId: number): Promise<ApiResponse<AuditLog>> => {
    return apiService.get<AuditLog>(`/audit/${auditLogId}`);
  },

  // Get audit statistics
  getAuditStats: async (organizationId?: number, startDate?: string, endDate?: string): Promise<ApiResponse<AuditStats>> => {
    const params: any = {};
    if (organizationId) params.organizationId = organizationId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    return apiService.get<AuditStats>('/audit/stats/overview', params);
  },

  // Export audit logs to CSV
  exportAuditLogs: async (startDate?: string, endDate?: string, organizationId?: number): Promise<void> => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (organizationId) params.organizationId = organizationId;

    const response = await apiService.get('/audit/export/csv', params);
    
    // Create and download CSV file
    const blob = new Blob([response as any], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Get filter options
  getFilterOptions: async (): Promise<ApiResponse<FilterOptions>> => {
    return apiService.get<FilterOptions>('/audit/filters/options');
  },

  // Format audit action for display
  formatAction: (action: string): string => {
    const actionMap: { [key: string]: string } = {
      'CREATE': 'Created',
      'UPDATE': 'Updated',
      'DELETE': 'Deleted',
      'LOGIN': 'Logged In',
      'LOGOUT': 'Logged Out',
      'DOWNLOAD': 'Downloaded',
      'UPLOAD': 'Uploaded',
      'SHARE': 'Shared',
      'EXPORT': 'Exported',
      'VIEW': 'Viewed',
    };
    
    return actionMap[action] || action;
  },

  // Format resource type for display
  formatResourceType: (resourceType: string): string => {
    const typeMap: { [key: string]: string } = {
      'USER': 'User',
      'ORGANIZATION': 'Organization',
      'FILE': 'File',
      'FOLDER': 'Folder',
      'INVITATION': 'Invitation',
      'SYSTEM_SETTINGS': 'System Settings',
      'AUDIT_LOGS': 'Audit Logs',
    };
    
    return typeMap[resourceType] || resourceType;
  },

  // Get action icon
  getActionIcon: (action: string): string => {
    const iconMap: { [key: string]: string } = {
      'CREATE': 'fas fa-plus-circle text-success',
      'UPDATE': 'fas fa-edit text-warning',
      'DELETE': 'fas fa-trash text-danger',
      'LOGIN': 'fas fa-sign-in-alt text-primary',
      'LOGOUT': 'fas fa-sign-out-alt text-secondary',
      'DOWNLOAD': 'fas fa-download text-info',
      'UPLOAD': 'fas fa-upload text-success',
      'SHARE': 'fas fa-share text-primary',
      'EXPORT': 'fas fa-file-export text-warning',
      'VIEW': 'fas fa-eye text-info',
    };
    
    return iconMap[action] || 'fas fa-circle text-muted';
  },

  // Parse audit details
  parseDetails: (details: string): any => {
    try {
      return JSON.parse(details);
    } catch {
      return { raw: details };
    }
  },

  // Format date for display
  formatDate: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  },

  // Get relative time
  getRelativeTime: (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  },
};

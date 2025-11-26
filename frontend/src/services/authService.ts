import { apiService, ApiResponse } from './api';

// Types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId?: number;
  organizationName?: string;
  status: string;
  last_login?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  adminLogin?: boolean;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: number;
  invitationCode?: string;
}

export interface RegisterResponse {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
}

// Auth Service
export const authService = {
  // Login user
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    return apiService.post<LoginResponse>('/auth/login', credentials);
  },

  // Register user
  register: async (userData: RegisterRequest): Promise<ApiResponse<RegisterResponse>> => {
    return apiService.post<RegisterResponse>('/auth/register', userData);
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> => {
    return apiService.post<RefreshTokenResponse>('/auth/refresh', { refreshToken });
  },

  // Logout user
  logout: async (): Promise<ApiResponse<void>> => {
    return apiService.post<void>('/auth/logout');
  },

  // Get user profile
  getProfile: async (): Promise<ApiResponse<User>> => {
    return apiService.get<User>('/auth/profile');
  },

  // Verify token
  verifyToken: async (): Promise<ApiResponse<{ user: User }>> => {
    return apiService.get<{ user: User }>('/auth/verify');
  },

  // Store auth data in localStorage
  setAuthData: (token: string, user: User, refreshToken?: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  },

  // Get auth data from localStorage
  getAuthData: (): { token: string | null; user: User | null; refreshToken: string | null } => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const refreshToken = localStorage.getItem('refreshToken');
    
    return {
      token,
      user: userStr ? JSON.parse(userStr) : null,
      refreshToken,
    };
  },

  // Clear auth data from localStorage
  clearAuthData: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Check if user has specific role
  hasRole: (role: string): boolean => {
    const { user } = authService.getAuthData();
    return user?.role === role;
  },

  // Check if user is platform owner
  isPlatformOwner: (): boolean => {
    return authService.hasRole('platform_owner');
  },

  // Check if user is organization admin
  isOrganizationAdmin: (): boolean => {
    return authService.hasRole('organization_admin');
  },

  // Check if user is member
  isMember: (): boolean => {
    return authService.hasRole('member');
  },
};

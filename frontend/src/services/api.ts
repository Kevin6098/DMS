import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT || '30000');
const OFFLINE_MODE = process.env.REACT_APP_OFFLINE_MODE === 'true' || process.env.REACT_APP_DISABLE_API_CALLS === 'true' || false;

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ [API SERVICE] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses for login
    if (response.config.url?.includes('/auth/login')) {
      console.log('✅ [API SERVICE] Login response successful');
    }
    return response;
  },
  (error: AxiosError) => {
    const { response, config } = error;
    
    // Don't redirect on 401 for login/register endpoints
    const isAuthEndpoint = config?.url?.includes('/auth/login') || 
                           config?.url?.includes('/auth/register') ||
                           config?.url?.includes('/auth/refresh');
    
    if (response) {
      const { status, data } = response;
      const errorMessage = (data as any)?.message || 'An error occurred';
      
      switch (status) {
        case 401:
          // Unauthorized - only redirect if not an auth endpoint
          if (!isAuthEndpoint) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
            // Only redirect if not already on login page
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
              toast.error('Session expired. Please login again.');
            }
          }
          // For auth endpoints, let the component handle the error
          break;
        case 403:
          toast.error('Access denied. You do not have permission to perform this action.');
          break;
        case 404:
          toast.error('Resource not found.');
          break;
        case 422:
          // Validation errors
          const errors = (data as any)?.errors;
          if (errors && Array.isArray(errors)) {
            errors.forEach((err: any) => {
              toast.error(err.msg || err.message || 'Validation error');
            });
          } else {
            toast.error(errorMessage);
          }
          break;
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(errorMessage);
      }
    } else if (error.request) {
      // Network error - don't show toast for initial auth check
      if (!error.config?.url?.includes('/auth/verify')) {
        console.warn('Network error. Backend may not be running.');
        // Don't show toast for network errors during login
        if (!error.config?.url?.includes('/auth/login')) {
          toast.error('Network error. Please check your connection.');
        }
      }
    } else {
      // Other error
      console.error('An unexpected error occurred:', error);
      // Suppress the browser extension error message
      if (error.message && error.message.includes('message channel closed')) {
        console.warn('Browser extension interference detected. This is usually harmless.');
        // Don't show toast for this specific error
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface FilesPaginationResponse<T> {
  files: T[];  // Files endpoint uses 'files' instead of 'data'
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Generic API methods
export const apiService = {
  // GET request
  get: async <T>(url: string, params?: any): Promise<ApiResponse<T>> => {
    if (OFFLINE_MODE) {
      console.warn('Offline mode: API call blocked', url);
      return { success: false, message: 'Offline mode - backend not available' };
    }
    const response = await api.get(url, { params });
    return response.data;
  },

  // POST request
  post: async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
    if (OFFLINE_MODE) {
      console.warn('Offline mode: API call blocked', url);
      return { success: false, message: 'Offline mode - backend not available' };
    }
    console.log('🌐 [API SERVICE] Making POST request:', {
      url: `${API_BASE_URL}${url}`,
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : []
    });
    try {
      const response = await api.post(url, data);
      console.log('🌐 [API SERVICE] POST response received:', {
        url,
        status: response.status,
        hasData: !!response.data,
        success: response.data?.success
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ [API SERVICE] POST request failed:', {
        url,
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
      throw error;
    }
  },

  // PUT request
  put: async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
    if (OFFLINE_MODE) {
      console.warn('Offline mode: API call blocked', url);
      return { success: false, message: 'Offline mode - backend not available' };
    }
    const response = await api.put(url, data);
    return response.data;
  },

  // DELETE request
  delete: async <T>(url: string): Promise<ApiResponse<T>> => {
    if (OFFLINE_MODE) {
      console.warn('Offline mode: API call blocked', url);
      return { success: false, message: 'Offline mode - backend not available' };
    }
    const response = await api.delete(url);
    return response.data;
  },

  // PATCH request
  patch: async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
    if (OFFLINE_MODE) {
      console.warn('Offline mode: API call blocked', url);
      return { success: false, message: 'Offline mode - backend not available' };
    }
    const response = await api.patch(url, data);
    return response.data;
  },

  // File upload
  upload: async <T>(url: string, formData: FormData, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> => {
    if (OFFLINE_MODE) {
      console.warn('Offline mode: API call blocked', url);
      return { success: false, message: 'Offline mode - backend not available' };
    }
    const response = await api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  // File download
  download: async (url: string, filename?: string): Promise<void> => {
    if (OFFLINE_MODE) {
      console.warn('Offline mode: API call blocked', url);
      return;
    }
    const response = await api.get(url, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};

export default api;

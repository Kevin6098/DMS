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
  // DO NOT use transformRequest - it interferes with axios's automatic JSON serialization
  // FormData handling is done in the request interceptor instead
});

// Request interceptor to add auth token and handle FormData
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Handle FormData - delete Content-Type to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    // Log and validate requests for debugging
    if (config.url?.includes('/folders') || config.url?.includes('/auth/login')) {
      console.log('📤 [API REQUEST INTERCEPTOR]', {
        url: config.url,
        method: config.method,
        data: config.data,
        dataType: typeof config.data,
        isObject: typeof config.data === 'object' && config.data !== null,
        isFormData: config.data instanceof FormData,
        contentType: config.headers['Content-Type'],
        dataString: typeof config.data === 'object' && !(config.data instanceof FormData) 
          ? JSON.stringify(config.data) 
          : config.data
      });
      
      // Prevent "[object Object]" string from being sent
      if (config.data && typeof config.data === 'string' && config.data === '[object Object]') {
        console.error('❌ [API REQUEST] Detected "[object Object]" string! This should not happen.');
        throw new Error('Data was incorrectly converted to "[object Object]" string');
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const { response } = error;
    
    if (response) {
      const { status, data } = response;
      const errorMessage = (data as any)?.message || 'An error occurred';
      
      switch (status) {
        case 401:
          // Unauthorized - clear token
          // Don't use window.location.href as it causes hard refresh
          // Let React Router handle the redirect
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('refreshToken');
          // Only show toast if not already on login page
          if (!window.location.pathname.includes('/login')) {
            toast.error('Session expired. Please login again.');
            // Use setTimeout to allow React Router to handle navigation
            setTimeout(() => {
          window.location.href = '/login';
            }, 100);
          }
          break;
        case 400:
          // Bad Request - show validation errors or error message (skip for auth so AuthContext can show the right message)
          const isAuthRequest = (error.config?.url || '').includes('/auth/login') || (error.config?.url || '').includes('/auth/register');
          if (!isAuthRequest) {
            const validationErrors = (data as any)?.errors;
            if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
              validationErrors.forEach((err: any) => {
                toast.error(err.msg || err.message || 'Validation error');
              });
            } else {
              toast.error(errorMessage);
            }
          }
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
          // Show backend message when available so users see the real reason (e.g. validation)
          toast.error(errorMessage);
          break;
        default:
          toast.error(errorMessage);
      }
    } else if (error.request) {
      // No response received (backend down, CORS, timeout, or real network failure)
      // Show a clear message so users don't only see the browser's vague "Network Error"
      if (!error.config?.url?.includes('/auth/verify')) {
        toast.error('Cannot reach server. Check your connection or try again later.');
        console.warn('Request failed (no response). Backend may be down or unreachable.', error.config?.url);
      }
    } else {
      // Other error
      console.error('An unexpected error occurred:', error);
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
    
    // Log the data being sent for debugging
    if (url.includes('/folders') || url.includes('/auth/login')) {
      console.log('📤 [API POST] Request details:', {
        url,
        data,
        dataType: typeof data,
        isObject: typeof data === 'object' && data !== null,
        isFormData: data instanceof FormData,
        stringified: typeof data === 'object' ? JSON.stringify(data) : data
      });
    }
    
    // Ensure data is a plain object, not a stringified object
    // For JSON requests (non-FormData), ensure it's an object
    let requestData = data;
    if (data && typeof data === 'string' && data === '[object Object]') {
      console.error('❌ [API POST] Detected "[object Object]" string - this should not happen!');
      throw new Error('Invalid data format: object was converted to "[object Object]" string');
    }
    
    // Explicitly ensure JSON serialization for non-FormData requests
    // Axios should handle this automatically, but we'll be explicit
    const config: any = {};
    if (data && typeof data === 'object' && !(data instanceof FormData)) {
      // Ensure Content-Type is set for JSON
      config.headers = {
        'Content-Type': 'application/json'
      };
    }
    
    const response = await api.post(url, requestData, config);
    return response.data;
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
    // For large file uploads, use a much longer timeout (2 hours = 7200000ms)
    // This allows for 2GB+ files even on slow connections
    const uploadTimeout = parseInt(process.env.REACT_APP_UPLOAD_TIMEOUT || '7200000'); // 2 hours default
    
    // Log FormData contents for debugging
    console.log('📤 [UPLOAD] Sending file upload:', {
      url,
      formDataKeys: Array.from(formData.keys()),
      hasFile: formData.has('file'),
      file: formData.get('file') ? {
        name: (formData.get('file') as File)?.name,
        size: (formData.get('file') as File)?.size,
        type: (formData.get('file') as File)?.type
      } : 'no file'
    });
    
    const response = await api.post(url, formData, {
      timeout: uploadTimeout, // Override default timeout for uploads
      onUploadProgress: (progressEvent: any) => {
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

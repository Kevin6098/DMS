import { apiService, ApiResponse, PaginationResponse } from './api';

// Types
export interface FileItem {
  id: number;
  name: string;
  original_name: string;
  path: string;
  size: number;
  type: string;
  description?: string;
  organization_id: number;
  uploaded_by: number;
  folder_id?: number;
  status: string;
  created_at: string;
  updated_at?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  folder_name?: string;
  organization_name?: string;
}

export interface FileUploadRequest {
  name?: string;
  description?: string;
  folderId?: number;
}

export interface FileUpdateRequest {
  name?: string;
  description?: string;
  folderId?: number;
}

export interface FileFilters {
  search?: string;
  folderId?: number;
  type?: string;
  organizationId?: number;
}

export interface Folder {
  id: number;
  name: string;
  description?: string;
  organization_id: number;
  created_by: number;
  parent_id?: number;
  status: string;
  created_at: string;
  file_count: number;
  total_size: number;
  first_name?: string;
  last_name?: string;
}

export interface FolderCreateRequest {
  name: string;
  description?: string;
  parentId?: number;
}

export interface FileStats {
  totalFiles: number;
  totalSize: number;
  typeStats: Array<{
    type: string;
    count: number;
    total_size: number;
    avg_size: number;
  }>;
  recentUploads: number;
}

// File Service
export const fileService = {
  // Get all files with pagination and filters
  getFiles: async (
    page: number = 1,
    limit: number = 10,
    filters?: FileFilters
  ): Promise<ApiResponse<PaginationResponse<FileItem>>> => {
    const params = {
      page,
      limit,
      ...filters,
    };
    return apiService.get<PaginationResponse<FileItem>>('/files', params);
  },

  // Upload file
  uploadFile: async (
    file: File,
    fileData: FileUploadRequest,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ fileId: number; name: string; size: number; type: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (fileData.name) formData.append('name', fileData.name);
    if (fileData.description) formData.append('description', fileData.description);
    if (fileData.folderId) formData.append('folderId', fileData.folderId.toString());

    return apiService.upload<{ fileId: number; name: string; size: number; type: string }>(
      '/files/upload',
      formData,
      onProgress
    );
  },

  // Get file by ID
  getFile: async (fileId: number): Promise<ApiResponse<FileItem>> => {
    return apiService.get<FileItem>(`/files/${fileId}`);
  },

  // Download file
  downloadFile: async (fileId: number, filename?: string): Promise<void> => {
    return apiService.download(`/files/${fileId}/download`, filename);
  },

  // Update file
  updateFile: async (fileId: number, fileData: FileUpdateRequest): Promise<ApiResponse<void>> => {
    return apiService.put<void>(`/files/${fileId}`, fileData);
  },

  // Delete file
  deleteFile: async (fileId: number): Promise<ApiResponse<void>> => {
    return apiService.delete<void>(`/files/${fileId}`);
  },

  // Get folders
  getFolders: async (organizationId?: number): Promise<ApiResponse<Folder[]>> => {
    const params = organizationId ? { organizationId } : {};
    return apiService.get<Folder[]>('/files/folders/list', params);
  },

  // Create folder
  createFolder: async (folderData: FolderCreateRequest): Promise<ApiResponse<{ folderId: number; name: string; description?: string; parentId?: number }>> => {
    return apiService.post<{ folderId: number; name: string; description?: string; parentId?: number }>('/files/folders', folderData);
  },

  // Get file statistics
  getFileStats: async (organizationId?: number): Promise<ApiResponse<FileStats>> => {
    const params = organizationId ? { organizationId } : {};
    return apiService.get<FileStats>('/files/stats/overview', params);
  },

  // Format file size
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Get file icon based on type
  getFileIcon: (fileType: string): string => {
    const type = fileType.toLowerCase();
    
    if (type.includes('pdf')) return 'fas fa-file-pdf';
    if (type.includes('doc') || type.includes('docx')) return 'fas fa-file-word';
    if (type.includes('xls') || type.includes('xlsx')) return 'fas fa-file-excel';
    if (type.includes('ppt') || type.includes('pptx')) return 'fas fa-file-powerpoint';
    if (type.includes('txt')) return 'fas fa-file-alt';
    if (type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif')) return 'fas fa-file-image';
    if (type.includes('mp4') || type.includes('avi') || type.includes('mov')) return 'fas fa-file-video';
    if (type.includes('mp3') || type.includes('wav')) return 'fas fa-file-audio';
    if (type.includes('zip') || type.includes('rar')) return 'fas fa-file-archive';
    
    return 'fas fa-file';
  },
};

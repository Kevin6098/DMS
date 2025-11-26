import { apiService, ApiResponse, FilesPaginationResponse } from './api';

// Types
export interface FileItem {
  id: number;
  name: string;
  original_name: string;
  storage_path: string; // Changed from 'path' to match database
  file_size: number;    // Changed from 'size' to match database
  file_type: string;    // Changed from 'type' to match database
  description?: string;
  organization_id: number;
  uploaded_by: number;
  folder_id?: number;
  status: string;
  created_at: string;
  updated_at?: string;
  last_accessed_at?: string;
  last_accessed_by?: number;
  last_modified_at?: string;
  last_modified_by?: number;
  deleted_at?: string;
  deleted_by?: number;
  current_version?: number;
  checksum?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  folder_name?: string;
  organization_name?: string;
  is_starred?: boolean;
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
  is_starred?: boolean;
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
  ): Promise<ApiResponse<FilesPaginationResponse<FileItem>>> => {
    const params = {
      page,
      limit,
      ...filters,
    };
    return apiService.get<FilesPaginationResponse<FileItem>>('/files', params);
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

  // Delete file (soft delete - move to trash)
  deleteFile: async (fileId: number): Promise<ApiResponse<void>> => {
    return apiService.delete<void>(`/files/${fileId}`);
  },

  // Restore file from trash
  restoreFile: async (fileId: number): Promise<ApiResponse<void>> => {
    return apiService.post<void>(`/files/${fileId}/restore`, {});
  },

  // Permanently delete file
  permanentlyDeleteFile: async (fileId: number): Promise<ApiResponse<void>> => {
    return apiService.delete<void>(`/files/${fileId}/permanent`);
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

  // Get deleted files (trash)
  getDeletedFiles: async (
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<FilesPaginationResponse<FileItem>>> => {
    const params = { page, limit };
    return apiService.get<FilesPaginationResponse<FileItem>>('/files/trash/list', params);
  },

  // Toggle star/favorite
  toggleStar: async (itemType: 'file' | 'folder', itemId: number): Promise<ApiResponse<{ starred: boolean }>> => {
    return apiService.post<{ starred: boolean }>(`/files/star/${itemType}/${itemId}`, {});
  },

  // Get starred items
  getStarredItems: async (): Promise<ApiResponse<{ files: FileItem[], folders: Folder[] }>> => {
    return apiService.get<{ files: FileItem[], folders: Folder[] }>('/files/starred/list');
  },

  // Format file size
  formatFileSize: (bytes: number | undefined | null): string => {
    // Handle null, undefined, NaN, or invalid numbers
    if (!bytes || isNaN(bytes) || bytes < 0) {
      return '0 Bytes';
    }
    
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

  // File Sharing
  shareFile: async (fileId: number, shareData: {
    email?: string;
    permission: 'view' | 'edit' | 'comment';
    expiresAt?: string;
    password?: string;
  }): Promise<ApiResponse<{ shareLink: string; shareId: number }>> => {
    return apiService.post<{ shareLink: string; shareId: number }>(`/files/${fileId}/share`, shareData);
  },

  // Get file shares
  getFileShares: async (fileId: number): Promise<ApiResponse<Array<{
    id: number;
    email: string;
    permission: string;
    expiresAt: string;
    createdAt: string;
  }>>> => {
    return apiService.get<Array<any>>(`/files/${fileId}/shares`);
  },

  // Revoke file share
  revokeShare: async (fileId: number, shareId: number): Promise<ApiResponse<void>> => {
    return apiService.delete<void>(`/files/${fileId}/shares/${shareId}`);
  },

  // Get shared with me files
  getSharedWithMe: async (page: number = 1, limit: number = 10): Promise<ApiResponse<FilesPaginationResponse<FileItem>>> => {
    return apiService.get<FilesPaginationResponse<FileItem>>('/files/shared-with-me', { page, limit });
  },

  // File Version History
  getFileVersions: async (fileId: number): Promise<ApiResponse<Array<{
    id: number;
    version: number;
    fileName: string;
    fileSize: number;
    uploadedBy: string;
    uploadedAt: string;
    description?: string;
  }>>> => {
    return apiService.get<Array<any>>(`/files/${fileId}/versions`);
  },

  // Download specific version
  downloadFileVersion: async (fileId: number, versionId: number, filename?: string): Promise<void> => {
    return apiService.download(`/files/${fileId}/versions/${versionId}/download`, filename);
  },

  // Restore file version
  restoreFileVersion: async (fileId: number, versionId: number): Promise<ApiResponse<void>> => {
    return apiService.post<void>(`/files/${fileId}/versions/${versionId}/restore`, {});
  },

  // File Preview
  getFilePreviewUrl: (fileId: number): string => {
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
    const token = localStorage.getItem('token');
    return `${baseUrl}/files/${fileId}/preview?token=${token}`;
  },

  // Check if file can be previewed
  canPreview: (fileType: string): boolean => {
    const type = fileType.toLowerCase();
    return type.includes('pdf') || 
           type.includes('jpg') || type.includes('jpeg') || 
           type.includes('png') || type.includes('gif') ||
           type.includes('mp4') || type.includes('avi') || type.includes('mov') ||
           type.includes('txt') || type.includes('doc') || type.includes('docx');
  },

  // Zip files
  zipFiles: async (fileIds: number[], zipName?: string): Promise<void> => {
    const token = localStorage.getItem('token');
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
    
    const response = await fetch(`${baseUrl}/files/zip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ fileIds, zipName: zipName || 'archive.zip' })
    });

    if (!response.ok) {
      throw new Error('Failed to create zip file');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = zipName || 'archive.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Unzip file
  unzipFile: async (fileId: number, targetFolderId?: number): Promise<ApiResponse<{ extractedFiles: number }>> => {
    return apiService.post<{ extractedFiles: number }>(`/files/${fileId}/unzip`, {
      targetFolderId
    });
  },
};

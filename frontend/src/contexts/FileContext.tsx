import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fileService, FileItem, Folder, FileFilters, FileStats } from '../services/fileService';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

// File Context Types
interface FileContextType {
  files: FileItem[];
  folders: Folder[];
  currentFolder: number | null;
  isLoading: boolean;
  fileStats: FileStats | null;
  filters: FileFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  loadFiles: (page?: number, newFilters?: FileFilters) => Promise<void>;
  loadFolders: () => Promise<void>;
  uploadFile: (file: File, fileData: {
    name?: string;
    description?: string;
    folderId?: number;
  }, onProgress?: (progress: number) => void) => Promise<boolean>;
  downloadFile: (fileId: number, filename?: string) => Promise<void>;
  updateFile: (fileId: number, fileData: {
    name?: string;
    description?: string;
    folderId?: number;
  }) => Promise<boolean>;
  deleteFile: (fileId: number) => Promise<boolean>;
  createFolder: (folderData: {
    name: string;
    description?: string;
    parentId?: number;
  }) => Promise<boolean>;
  setCurrentFolder: (folderId: number | null) => void;
  setFilters: (filters: FileFilters) => void;
  refreshFiles: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

// Create File Context
const FileContext = createContext<FileContextType | undefined>(undefined);

// File Provider Props
interface FileProviderProps {
  children: ReactNode;
}

// File Provider Component
export const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileStats, setFileStats] = useState<FileStats | null>(null);
  const [filters, setFilters] = useState<FileFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Load files
  const loadFiles = async (page: number = 1, newFilters: FileFilters = {}): Promise<void> => {
    if (!isAuthenticated || !user) return;

    try {
      setIsLoading(true);
      const currentFilters = { ...filters, ...newFilters };
      if (currentFolder) {
        currentFilters.folderId = currentFolder;
      }
      
      const response = await fileService.getFiles(page, pagination.limit, currentFilters);
      
      if (response.success && response.data) {
        setFiles(response.data.data);
        setPagination(response.data.pagination);
        setFilters(currentFilters);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load folders
  const loadFolders = async (): Promise<void> => {
    if (!isAuthenticated || !user) return;

    try {
      const organizationId = user.organizationId;
      const response = await fileService.getFolders(organizationId);
      
      if (response.success && response.data) {
        setFolders(response.data);
      }
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  // Upload file
  const uploadFile = async (
    file: File,
    fileData: { name?: string; description?: string; folderId?: number },
    onProgress?: (progress: number) => void
  ): Promise<boolean> => {
    if (!isAuthenticated || !user) return false;

    try {
      const response = await fileService.uploadFile(file, fileData, onProgress);
      
      if (response.success) {
        toast.success('File uploaded successfully!');
        await refreshFiles();
        await refreshStats();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error uploading file:', error);
      return false;
    }
  };

  // Download file
  const downloadFile = async (fileId: number, filename?: string): Promise<void> => {
    if (!isAuthenticated || !user) return;

    try {
      await fileService.downloadFile(fileId, filename);
      toast.success('File download started');
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // Update file
  const updateFile = async (
    fileId: number,
    fileData: { name?: string; description?: string; folderId?: number }
  ): Promise<boolean> => {
    if (!isAuthenticated || !user) return false;

    try {
      const response = await fileService.updateFile(fileId, fileData);
      
      if (response.success) {
        toast.success('File updated successfully!');
        await refreshFiles();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating file:', error);
      return false;
    }
  };

  // Delete file
  const deleteFile = async (fileId: number): Promise<boolean> => {
    if (!isAuthenticated || !user) return false;

    try {
      const response = await fileService.deleteFile(fileId);
      
      if (response.success) {
        toast.success('File deleted successfully!');
        await refreshFiles();
        await refreshStats();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  };

  // Create folder
  const createFolder = async (folderData: {
    name: string;
    description?: string;
    parentId?: number;
  }): Promise<boolean> => {
    if (!isAuthenticated || !user) return false;

    try {
      const response = await fileService.createFolder(folderData);
      
      if (response.success) {
        toast.success('Folder created successfully!');
        await loadFolders();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error creating folder:', error);
      return false;
    }
  };

  // Refresh files
  const refreshFiles = async (): Promise<void> => {
    await loadFiles(pagination.page);
  };

  // Refresh stats
  const refreshStats = async (): Promise<void> => {
    if (!isAuthenticated || !user) return;

    try {
      const organizationId = user.organizationId;
      const response = await fileService.getFileStats(organizationId);
      
      if (response.success && response.data) {
        setFileStats(response.data);
      }
    } catch (error) {
      console.error('Error loading file stats:', error);
    }
  };

  // Set current folder
  const handleSetCurrentFolder = (folderId: number | null): void => {
    setCurrentFolder(folderId);
    loadFiles(1); // Reset to page 1 when changing folder
  };

  // Set filters
  const handleSetFilters = (newFilters: FileFilters): void => {
    setFilters(newFilters);
    loadFiles(1, newFilters); // Reset to page 1 when changing filters
  };

  // Load initial data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadFiles();
      loadFolders();
      refreshStats();
    }
  }, [isAuthenticated, user]);

  // Context value
  const contextValue: FileContextType = {
    files,
    folders,
    currentFolder,
    isLoading,
    fileStats,
    filters,
    pagination,
    loadFiles,
    loadFolders,
    uploadFile,
    downloadFile,
    updateFile,
    deleteFile,
    createFolder,
    setCurrentFolder: handleSetCurrentFolder,
    setFilters: handleSetFilters,
    refreshFiles,
    refreshStats,
  };

  return (
    <FileContext.Provider value={contextValue}>
      {children}
    </FileContext.Provider>
  );
};

// Custom hook to use File Context
export const useFiles = (): FileContextType => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFiles must be used within a FileProvider');
  }
  return context;
};

export default FileContext;

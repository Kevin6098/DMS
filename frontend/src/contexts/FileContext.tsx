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
  loadFiles: (page?: number, newFilters?: FileFilters, overrideFolderId?: number | null) => Promise<void>;
  loadFolders: (overrideParentId?: number | null, searchQuery?: string) => Promise<void>;
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
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

  // Load files
  const loadFiles = async (page: number = 1, newFilters: FileFilters = {}, overrideFolderId?: number | null): Promise<void> => {
    if (!isAuthenticated || !user) return;

    try {
      setIsLoading(true);
      // Start with newFilters to ensure search query is included
      const currentFilters: FileFilters = { ...newFilters };
      
      // If there's a search query, don't filter by folderId (search globally)
      // Otherwise, use overrideFolderId if provided, or currentFolder state
      if (currentFilters.search) {
        // When searching, remove folderId filter to search all folders
        delete currentFilters.folderId;
      } else {
        // No search - use folder filter
        const folderIdToUse = overrideFolderId !== undefined ? overrideFolderId : currentFolder;
        if (folderIdToUse !== undefined) {
          currentFilters.folderId = folderIdToUse;
        } else {
          // If folderIdToUse is undefined, remove the filter to show all files
          delete currentFilters.folderId;
        }
      }
      
      // Merge with existing filters but prioritize newFilters
      // If searching, don't merge old filters that might interfere
      const finalFilters = currentFilters.search 
        ? currentFilters // When searching, use only the new filters
        : { ...filters, ...currentFilters }; // Otherwise, merge with existing filters
      
      const response = await fileService.getFiles(page, pagination.limit, finalFilters);
      
      if (response.success && response.data) {
        setFiles(response.data.files || []);
        setPagination(response.data.pagination);
        setFilters(finalFilters);
      } else {
        console.error('Failed to load files:', response.message);
        setFiles([]);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load folders
  const loadFolders = async (overrideParentId?: number | null, searchQuery?: string): Promise<void> => {
    if (!isAuthenticated || !user) return;

    try {
      const organizationId = user.organizationId;
      // Use overrideParentId if provided, otherwise use currentFolder state
      // When searching, pass undefined for parentId to search all folders
      const parentIdToUse = searchQuery ? undefined : (overrideParentId !== undefined ? overrideParentId : currentFolder);
      const response = await fileService.getFolders(organizationId, parentIdToUse, searchQuery);
      
      if (response.success && response.data) {
        setFolders(response.data || []);
      } else {
        console.error('Failed to load folders:', response.message);
        setFolders([]);
      }
    } catch (error) {
      console.error('Error loading folders:', error);
      setFolders([]);
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
      
      // Show error message from response
      const errorMessage = response.message || 'Failed to upload file';
      toast.error(errorMessage);
      return false;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      // Extract error message from API response
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to upload file';
      toast.error(errorMessage);
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
        // Ensure totalSize is a number
        const stats = {
          ...response.data,
          totalSize: response.data.totalSize ? Number(response.data.totalSize) : 0
        };
        setFileStats(stats);
      } else {
        // Set default stats if API fails
        setFileStats({
          totalFiles: 0,
          totalSize: 0,
          typeStats: [],
          recentUploads: 0
        });
      }
    } catch (error) {
      console.error('Error loading file stats:', error);
      // Set default stats on error
      setFileStats({
        totalFiles: 0,
        totalSize: 0,
        typeStats: [],
        recentUploads: 0
      });
    }
  };

  // Set current folder
  const handleSetCurrentFolder = (folderId: number | null): void => {
    setCurrentFolder(folderId);
    // Pass folderId directly to loadFiles and loadFolders to avoid stale state issue
    loadFiles(1, {}, folderId); // Reset to page 1 when changing folder
    loadFolders(folderId); // Load folders for the current folder
  };

  // Set filters
  const handleSetFilters = (newFilters: FileFilters): void => {
    setFilters(newFilters);
    loadFiles(1, newFilters); // Reset to page 1 when changing filters
  };

  // Load initial data when user is authenticated - run only once
  useEffect(() => {
    if (isAuthenticated && user && !hasLoadedInitialData) {
      // Only load data if we have a valid user with organizationId and not in offline mode
      if (user.organizationId && 
          process.env.REACT_APP_OFFLINE_MODE !== 'true' && 
          process.env.REACT_APP_DISABLE_API_CALLS !== 'true') {
        setHasLoadedInitialData(true);
        loadFiles();
        loadFolders();
        refreshStats();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, hasLoadedInitialData]); // Functions are stable, user is checked within

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

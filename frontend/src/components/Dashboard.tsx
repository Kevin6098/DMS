import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFiles } from '../contexts/FileContext';
import { fileService, FileItem, Folder } from '../services/fileService';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { 
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
    setCurrentFolder, 
    setFilters, 
    refreshFiles, 
    refreshStats 
  } = useFiles();

  const [currentView, setCurrentView] = useState('my-drive');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFileDetails, setShowFileDetails] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Load initial data
  useEffect(() => {
    if (isAuthenticated) {
      loadFiles();
      loadFolders();
      refreshStats();
    }
  }, [isAuthenticated]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters({ search: query });
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (const file of files) {
        await uploadFile(file, {
          name: file.name,
          folderId: currentFolder || undefined,
        }, (progress) => {
          setUploadProgress(progress);
        });
      }
      setShowUploadModal(false);
      toast.success(`${files.length} file(s) uploaded successfully!`);
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle folder creation
  const handleCreateFolder = async () => {
    const folderName = (document.getElementById('folder-name') as HTMLInputElement)?.value;
    const folderDescription = (document.getElementById('folder-description') as HTMLInputElement)?.value;
    
    if (!folderName) {
      toast.error('Please enter a folder name');
      return;
    }

    try {
      await createFolder({
        name: folderName,
        description: folderDescription || undefined,
        parentId: currentFolder || undefined,
      });
      setShowCreateFolderModal(false);
      toast.success('Folder created successfully!');
    } catch (error) {
      toast.error('Failed to create folder');
    }
  };

  // Handle file download
  const handleDownload = async (file: FileItem) => {
    try {
      await downloadFile(file.id, file.name);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  // Handle file deletion
  const handleDeleteFile = async (file: FileItem) => {
    if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      try {
        await deleteFile(file.id);
        toast.success('File deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete file');
      }
    }
  };

  // Handle folder navigation
  const handleFolderClick = (folder: Folder) => {
    setCurrentFolder(folder.id);
  };

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = (folderId: number | null) => {
    setCurrentFolder(folderId);
  };

  // Get breadcrumb path
  const getBreadcrumbPath = () => {
    const path = [];
    if (currentFolder) {
      // Find current folder and build path
      const current = folders.find(f => f.id === currentFolder);
      if (current) {
        path.push({ id: current.id, name: current.name });
      }
    }
    return [{ id: null, name: 'My Drive' }, ...path];
  };

  // Handle view change
  const showView = (view: string) => {
    setCurrentView(view);
    // Filter files based on view
    switch (view) {
      case 'recent':
        setFilters({ search: '', folderId: undefined });
        break;
      case 'starred':
        setFilters({ search: '', folderId: undefined });
        break;
      case 'shared':
        setFilters({ search: '', folderId: undefined });
        break;
      default:
        setFilters({ search: searchQuery, folderId: currentFolder || undefined });
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    loadFiles(page);
  };

  if (!isAuthenticated || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <i className="fas fa-folder-open"></i>
            <span>Task Insight</span>
          </div>
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="header-right">
          <button className="btn-icon" onClick={() => setShowUploadModal(true)}>
            <i className="fas fa-upload"></i>
          </button>
          <button className="btn-icon" onClick={() => setShowCreateFolderModal(true)}>
            <i className="fas fa-folder-plus"></i>
          </button>
          <div className="user-menu">
            <button className="user-avatar" onClick={() => setShowUserMenu(!showUserMenu)}>
              <img src="/api/placeholder/40/40" alt="User" />
            </button>
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-info">
                  <h4>{user.firstName} {user.lastName}</h4>
                  <p>{user.email}</p>
                </div>
                <button onClick={() => setShowUserSettings(true)}>
                  <i className="fas fa-cog"></i> Settings
                </button>
                <button onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${currentView === 'my-drive' ? 'active' : ''}`}
            onClick={() => showView('my-drive')}
          >
            <i className="fas fa-home"></i>
            <span>My Drive</span>
          </button>
          <button 
            className={`nav-item ${currentView === 'recent' ? 'active' : ''}`}
            onClick={() => showView('recent')}
          >
            <i className="fas fa-clock"></i>
            <span>Recent</span>
          </button>
          <button 
            className={`nav-item ${currentView === 'starred' ? 'active' : ''}`}
            onClick={() => showView('starred')}
          >
            <i className="fas fa-star"></i>
            <span>Starred</span>
          </button>
          <button 
            className={`nav-item ${currentView === 'shared' ? 'active' : ''}`}
            onClick={() => showView('shared')}
          >
            <i className="fas fa-share-alt"></i>
            <span>Shared with me</span>
          </button>
          <button 
            className={`nav-item ${currentView === 'trash' ? 'active' : ''}`}
            onClick={() => showView('trash')}
          >
            <i className="fas fa-trash"></i>
            <span>Trash</span>
          </button>
        </nav>

        {/* Storage Info */}
        <div className="storage-info">
          <div className="storage-header">
            <span>Storage</span>
            <span>{fileStats ? fileService.formatFileSize(fileStats.totalSize) : '0 Bytes'} of {fileStats ? fileService.formatFileSize(fileStats.totalSize * 10) : '0 Bytes'}</span>
          </div>
          <div className="storage-bar">
            <div className="storage-used" style={{ width: '10%' }}></div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          {getBreadcrumbPath().map((item, index) => (
            <React.Fragment key={item.id || 'root'}>
              <button 
                className="breadcrumb-item"
                onClick={() => handleBreadcrumbClick(item.id)}
              >
                {item.name}
              </button>
              {index < getBreadcrumbPath().length - 1 && <i className="fas fa-chevron-right"></i>}
            </React.Fragment>
          ))}
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="toolbar-left">
            <button className="btn-icon" onClick={() => setViewMode('grid')}>
              <i className={`fas fa-th ${viewMode === 'grid' ? 'active' : ''}`}></i>
            </button>
            <button className="btn-icon" onClick={() => setViewMode('list')}>
              <i className={`fas fa-list ${viewMode === 'list' ? 'active' : ''}`}></i>
            </button>
          </div>
          <div className="toolbar-right">
            <button className="btn-icon" onClick={refreshFiles}>
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>

        {/* Files Grid/List */}
        <div className={`files-container ${viewMode}`}>
          {isLoading ? (
            <div className="loading">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading files...</p>
            </div>
          ) : (
            <>
              {/* Folders */}
              {folders.map((folder) => (
                <div key={folder.id} className="file-item" onClick={() => handleFolderClick(folder)}>
                  <div className="file-icon">
                    <i className="fas fa-folder"></i>
                  </div>
                  <div className="file-info">
                    <h4>{folder.name}</h4>
                    <p>{folder.file_count} items</p>
                  </div>
                  <div className="file-actions">
                    <button onClick={(e) => { e.stopPropagation(); setShowShareModal(true); setSelectedFile(folder as any); }}>
                      <i className="fas fa-share"></i>
                    </button>
                  </div>
                </div>
              ))}

              {/* Files */}
              {files.map((file) => (
                <div key={file.id} className="file-item">
                  <div className="file-icon">
                    <i className={fileService.getFileIcon(file.type)}></i>
                  </div>
                  <div className="file-info">
                    <h4>{file.name}</h4>
                    <p>{fileService.formatFileSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="file-actions">
                    <button onClick={() => handleDownload(file)}>
                      <i className="fas fa-download"></i>
                    </button>
                    <button onClick={() => { setShowShareModal(true); setSelectedFile(file); }}>
                      <i className="fas fa-share"></i>
                    </button>
                    <button onClick={() => handleDeleteFile(file)}>
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}

              {files.length === 0 && folders.length === 0 && (
                <div className="empty-state">
                  <i className="fas fa-folder-open"></i>
                  <h3>No files or folders</h3>
                  <p>Upload files or create folders to get started</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="pagination">
            <button 
              disabled={pagination.page === 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Previous
            </button>
            <span>Page {pagination.page} of {pagination.pages}</span>
            <button 
              disabled={pagination.page === pagination.pages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Upload Files</h3>
              <button onClick={() => setShowUploadModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="upload-area">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  id="file-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="file-upload" className="upload-button">
                  <i className="fas fa-cloud-upload-alt"></i>
                  <span>Choose files to upload</span>
                </label>
                {isUploading && (
                  <div className="upload-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <span>{uploadProgress}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create Folder</h3>
              <button onClick={() => setShowCreateFolderModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="folder-name">Folder Name</label>
                <input type="text" id="folder-name" required />
              </div>
              <div className="form-group">
                <label htmlFor="folder-description">Description (Optional)</label>
                <textarea id="folder-description" rows={3}></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCreateFolderModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleCreateFolder}>
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedFile && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Share "{selectedFile.name}"</h3>
              <button onClick={() => setShowShareModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Share Link</label>
                <div className="input-group">
                  <input type="text" value={`https://dms.com/share/${selectedFile.id}`} readOnly />
                  <button className="btn-secondary">
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Permission Level</label>
                <select>
                  <option value="view">View only</option>
                  <option value="comment">View and comment</option>
                  <option value="edit">View, comment, and edit</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowShareModal(false)}>
                Close
              </button>
              <button className="btn-primary">
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
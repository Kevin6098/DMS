import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFiles } from '../contexts/FileContext';
import { fileService, FileItem, Folder } from '../services/fileService';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { 
    files = [], 
    folders = [], 
    currentFolder, 
    isLoading, 
    fileStats, 
    pagination,
    loadFiles, 
    loadFolders, 
    uploadFile, 
    downloadFile, 
    deleteFile, 
    createFolder, 
    setCurrentFolder, 
    refreshFiles, 
    refreshStats 
  } = useFiles();

  const [currentView, setCurrentView] = useState('my-drive');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ search: '', folderId: undefined as number | undefined });
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [deletedFiles, setDeletedFiles] = useState<FileItem[]>([]);
  const [starredFiles, setStarredFiles] = useState<FileItem[]>([]);
  const [starredFolders, setStarredFolders] = useState<Folder[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Load initial data - run only once
  useEffect(() => {
    if (isAuthenticated && !hasLoadedInitialData &&
        process.env.REACT_APP_OFFLINE_MODE !== 'true' && 
        process.env.REACT_APP_DISABLE_API_CALLS !== 'true') {
      setHasLoadedInitialData(true);
      loadFiles();
      loadFolders();
      refreshStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, hasLoadedInitialData]); // Functions are stable from context

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const newFilters = { ...filters, search: query };
    setFilters(newFilters);
    // Trigger file reload with search filter
    loadFiles();
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
      const success = await createFolder({
        name: folderName,
        description: folderDescription || undefined,
        parentId: currentFolder || undefined,
      });
      
      if (success) {
        setShowCreateFolderModal(false);
        // Toast is already shown in FileContext, so we don't need to show it again
      } else {
        toast.error('Failed to create folder');
      }
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
    if (window.confirm(`Are you sure you want to move "${file.name}" to trash?`)) {
      try {
        await deleteFile(file.id);
        toast.success('File moved to trash!');
      } catch (error) {
        toast.error('Failed to delete file');
      }
    }
  };

  // Handle file restoration from trash
  const handleRestoreFile = async (file: FileItem) => {
    try {
      const response = await fileService.restoreFile(file.id);
      if (response.success) {
        toast.success('File restored successfully!');
        // Refresh trash view
        await loadDeletedFiles();
        // Reload main files to show the restored file
        await loadFiles();
        await loadFolders();
        await refreshStats();
      } else {
        toast.error('Failed to restore file');
      }
    } catch (error) {
      toast.error('Failed to restore file');
    }
  };

  // Handle permanent deletion
  const handlePermanentDelete = async (file: FileItem) => {
    if (window.confirm(`Are you sure you want to PERMANENTLY delete "${file.name}"? This action cannot be undone!`)) {
      try {
        const response = await fileService.permanentlyDeleteFile(file.id);
        if (response.success) {
          toast.success('File permanently deleted!');
          await loadDeletedFiles(); // Refresh trash
        } else {
          toast.error('Failed to permanently delete file');
        }
      } catch (error) {
        toast.error('Failed to permanently delete file');
      }
    }
  };

  // Handle star/unstar toggle
  const handleToggleStar = async (itemType: 'file' | 'folder', itemId: number) => {
    try {
      const response = await fileService.toggleStar(itemType, itemId);
      if (response.success) {
        const action = response.data?.starred ? 'starred' : 'unstarred';
        toast.success(`Item ${action}!`);
        
        // Refresh the current view
        if (currentView === 'starred') {
          await loadStarredItems();
        } else {
          await refreshFiles();
        }
      }
    } catch (error) {
      toast.error('Failed to toggle star');
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
  const showView = async (view: string) => {
    setCurrentView(view);
    setIsMobileSidebarOpen(false); // Close mobile sidebar
    
    // Filter files based on view
    switch (view) {
      case 'starred':
        // Load starred items
        await loadStarredItems();
        break;
      case 'shared':
        // Load shared items
        await loadSharedItems();
        break;
      case 'trash':
        // Load deleted files
        await loadDeletedFiles();
        break;
      default:
        // My Drive - load regular files
        setFilters({ search: searchQuery, folderId: currentFolder || undefined });
        loadFiles();
    }
  };

  // Load starred items
  const loadStarredItems = async () => {
    try {
      const response = await fileService.getStarredItems();
      if (response.success && response.data) {
        setStarredFiles(response.data.files || []);
        setStarredFolders(response.data.folders || []);
      }
    } catch (error) {
      console.error('Error loading starred items:', error);
      toast.error('Failed to load starred items');
    }
  };

  // Load shared items (items shared by others to me)
  const loadSharedItems = async () => {
    try {
      const response = await fileService.getSharedWithMe(1, 50);
      if (response.success && response.data) {
        setStarredFiles(response.data.files || []);
        setStarredFolders([]);
      }
    } catch (error) {
      console.error('Error loading shared items:', error);
      toast.error('Failed to load shared items');
    }
  };

  // Load deleted files for trash view
  const loadDeletedFiles = async () => {
    try {
      const response = await fileService.getDeletedFiles(1, 10);
      if (response.success && response.data) {
        setDeletedFiles(response.data.files || []);
      }
    } catch (error) {
      console.error('Error loading trash:', error);
      toast.error('Failed to load trash');
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
      {/* Sidebar Overlay for Mobile */}
      <div 
        className={`sidebar-overlay ${isMobileSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      ></div>

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button className="mobile-menu-toggle" onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}>
            <i className="fas fa-bars"></i>
          </button>
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
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
            </button>
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-info">
                  <h4>{user.firstName} {user.lastName}</h4>
                  <p>{user.email}</p>
                </div>
                <button onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${currentView === 'my-drive' ? 'active' : ''}`}
            onClick={() => showView('my-drive')}
          >
            <i className="fas fa-home"></i>
            <span>My Drive</span>
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
            <span>
              {fileStats?.totalSize ? fileService.formatFileSize(fileStats.totalSize) : '0 Bytes'} of{' '}
              {user?.organizationId ? fileService.formatFileSize(107374182400) : '100 GB'}
            </span>
          </div>
          <div className="storage-bar">
            <div 
              className="storage-used" 
              style={{ 
                width: `${fileStats?.totalSize ? Math.min((fileStats.totalSize / 107374182400) * 100, 100) : 0}%` 
              }}
            ></div>
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
              {/* Folders - Hide in trash view */}
              {currentView !== 'trash' && (currentView === 'starred' ? starredFolders : folders).map((folder) => (
                <div key={folder.id} className="file-item" onClick={() => handleFolderClick(folder)}>
                  <div className="file-icon">
                    <i className="fas fa-folder"></i>
                  </div>
                  <div className="file-info">
                    <h4>{folder.name}</h4>
                    <p>{folder.file_count} items</p>
                  </div>
                  <div className="file-actions">
                    <button onClick={(e) => { e.stopPropagation(); handleToggleStar('folder', folder.id); }} title="Star">
                      <i className="fas fa-star"></i>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); /* Delete folder */ }} title="Delete">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}

              {/* Files */}
              {(currentView === 'trash' ? deletedFiles : currentView === 'starred' ? starredFiles : files).map((file) => (
                <div key={file.id} className="file-item">
                  <div className="file-icon">
                    <i className={fileService.getFileIcon(file.file_type)}></i>
                  </div>
                  <div className="file-info">
                    <h4>{file.name}</h4>
                    <p>{fileService.formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="file-actions">
                    {currentView === 'trash' ? (
                      <>
                        <button onClick={() => handleRestoreFile(file)} title="Restore">
                          <i className="fas fa-undo"></i>
                        </button>
                        <button onClick={() => handlePermanentDelete(file)} title="Delete Forever">
                          <i className="fas fa-times"></i>
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); handleToggleStar('file', file.id); }} title="Star">
                          <i className="fas fa-star"></i>
                        </button>
                        <button onClick={() => handleDownload(file)} title="Download">
                          <i className="fas fa-download"></i>
                        </button>
                        <button onClick={() => handleDeleteFile(file)} title="Move to Trash">
                          <i className="fas fa-trash"></i>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {(() => {
                const displayFiles = currentView === 'trash' ? deletedFiles : currentView === 'starred' ? starredFiles : files;
                const displayFolders = currentView === 'starred' ? starredFolders : folders;
                const isEmpty = displayFiles.length === 0 && (currentView === 'trash' || displayFolders.length === 0);
                
                return isEmpty && (
                  <div className="empty-state">
                    <i className={
                      currentView === 'trash' ? 'fas fa-trash' : 
                      currentView === 'starred' ? 'fas fa-star' : 
                      currentView === 'shared' ? 'fas fa-share-alt' :
                      'fas fa-folder-open'
                    }></i>
                    <h3>
                      {currentView === 'trash' ? 'Trash is empty' : 
                       currentView === 'starred' ? 'No starred items' :
                       currentView === 'shared' ? 'No shared items' :
                       'No files or folders'}
                    </h3>
                    <p>
                      {currentView === 'trash' ? 'Deleted files will appear here for 30 days' : 
                       currentView === 'starred' ? 'Star files and folders to see them here' :
                       currentView === 'shared' ? 'Files shared with you will appear here' :
                       'Upload files or create folders to get started'}
                    </p>
                  </div>
                );
              })()}
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
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex !important',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div className="modal-content" style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '500px',
            width: '90%',
            position: 'relative',
            display: 'block !important',
            zIndex: 10000
          }}>
            <div className="modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '10px',
              borderBottom: '1px solid #eee'
            }}>
              <h3 style={{margin: 0, color: '#333'}}>Upload Files</h3>
              <button onClick={() => setShowUploadModal(false)} style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#666'
              }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body" style={{padding: '20px 0'}}>
              <div className="upload-area" style={{
                border: '2px dashed #ccc',
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center',
                background: '#f9f9f9'
              }}>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  id="file-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="file-upload" style={{
                  display: 'block',
                  cursor: 'pointer',
                  color: '#666',
                  fontSize: '16px'
                }}>
                  <i className="fas fa-cloud-upload-alt" style={{fontSize: '24px', marginBottom: '10px', display: 'block'}}></i>
                  <span>Choose files to upload</span>
                </label>
                {isUploading && (
                  <div style={{marginTop: '20px'}}>
                    <div style={{
                      width: '100%',
                      height: '20px',
                      background: '#eee',
                      borderRadius: '10px',
                      overflow: 'hidden'
                    }}>
                      <div 
                        style={{ 
                          width: `${uploadProgress}%`,
                          height: '100%',
                          background: '#4CAF50',
                          transition: 'width 0.3s'
                        }}
                      ></div>
                    </div>
                    <span style={{marginTop: '10px', display: 'block'}}>{uploadProgress}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex !important',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div className="modal-content" style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '500px',
            width: '90%',
            position: 'relative',
            display: 'block !important',
            zIndex: 10000
          }}>
            <div className="modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '10px',
              borderBottom: '1px solid #eee'
            }}>
              <h3 style={{margin: 0, color: '#333'}}>Create Folder</h3>
              <button onClick={() => setShowCreateFolderModal(false)} style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#666'
              }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body" style={{padding: '20px 0'}}>
              <div className="form-group" style={{marginBottom: '20px'}}>
                <label htmlFor="folder-name" style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  color: '#333'
                }}>Folder Name</label>
                <input 
                  type="text" 
                  id="folder-name" 
                  required 
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div className="form-group" style={{marginBottom: '20px'}}>
                <label htmlFor="folder-description" style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  color: '#333'
                }}>Description (Optional)</label>
                <textarea 
                  id="folder-description" 
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px',
                    resize: 'vertical'
                  }}
                ></textarea>
              </div>
            </div>
            <div className="modal-footer" style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '20px',
              borderTop: '1px solid #eee'
            }}>
              <button 
                onClick={() => setShowCreateFolderModal(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  background: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateFolder}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: '#007bff',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal removed - use FileSharingModal component instead */}
    </div>
  );
};

export default Dashboard;
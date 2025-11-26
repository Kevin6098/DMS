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
  const [newFolderName, setNewFolderName] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    type: 'file' | 'folder';
    item: FileItem | Folder | null;
  }>({ show: false, x: 0, y: 0, type: 'file', item: null });
  const [activeDropdown, setActiveDropdown] = useState<{ type: 'file' | 'folder'; id: number } | null>(null);
  const [renameModal, setRenameModal] = useState<{ show: boolean; type: 'file' | 'folder'; item: FileItem | Folder | null; newName: string }>({ show: false, type: 'file', item: null, newName: '' });
  const [shareModal, setShareModal] = useState<{ show: boolean; type: 'file' | 'folder'; item: FileItem | Folder | null }>({ show: false, type: 'file', item: null });
  const [infoModal, setInfoModal] = useState<{ show: boolean; type: 'file' | 'folder'; item: FileItem | Folder | null }>({ show: false, type: 'file', item: null });
  const [showNewDropdown, setShowNewDropdown] = useState(false);

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

  // Close new dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showNewDropdown) {
        setShowNewDropdown(false);
      }
    };

    if (showNewDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showNewDropdown]);

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
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    try {
      await createFolder({
        name: newFolderName.trim(),
        parentId: currentFolder || undefined,
      });
      setNewFolderName('');
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
      toast.success('File downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  // Handle file deletion
  const handleDeleteFile = async (file: FileItem) => {
    if (!window.confirm('Are you sure you want to move this file to trash?')) {
      return;
    }

    try {
      await deleteFile(file.id);
      toast.success('File moved to trash');
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  // Handle folder click
  const handleFolderClick = (folder: Folder) => {
    setCurrentFolder(folder.id);
    loadFiles();
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    // This would be handled by the FileContext
    console.log('Page change:', page);
  };

  // Handle star toggle
  const handleToggleStar = async (type: 'file' | 'folder', id: number) => {
    try {
      await fileService.toggleStar(type, id);
      // Refresh the files/folders list to update star status
      if (type === 'file') {
        loadFiles();
      } else {
        loadFolders();
      }
      // Also refresh starred items if we're in starred view
      if (currentView === 'starred') {
        loadStarredItems();
      }
      toast.success('Star status updated');
    } catch (error) {
      toast.error('Failed to update star status');
    }
  };

  // Load starred items
  const loadStarredItems = async () => {
    try {
      const response = await fileService.getStarredItems();
      setStarredFiles(response.data?.files || []);
      setStarredFolders(response.data?.folders || []);
    } catch (error) {
      console.error('Failed to load starred items:', error);
    }
  };

  // Load shared items
  const loadSharedItems = async () => {
    try {
      const response = await fileService.getSharedWithMe();
      // Handle shared items
      console.log('Shared items:', response.data);
    } catch (error) {
      console.error('Error loading shared items:', error);
    }
  };

  // Show view based on current selection
  const showView = (view: string) => {
    setCurrentView(view);
    if (view === 'starred') {
      loadStarredItems();
    } else if (view === 'shared') {
      loadSharedItems();
    } else if (view === 'trash') {
      // Load deleted files
      setDeletedFiles([]); // This would be loaded from API
    } else {
      loadFiles();
      loadFolders();
    }
  };

  // Get breadcrumb path
  const getBreadcrumbPath = () => {
    // This would build the breadcrumb based on current folder
    return [{ name: 'My Drive', id: null }];
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent, type: 'file' | 'folder', item: FileItem | Folder) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      type,
      item
    });
    setActiveDropdown(null);
  };

  // Handle dropdown menu toggle
  const handleDropdownToggle = (e: React.MouseEvent, type: 'file' | 'folder', id: number) => {
    e.stopPropagation();
    if (activeDropdown?.type === type && activeDropdown?.id === id) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown({ type, id });
    }
    setContextMenu({ show: false, x: 0, y: 0, type: 'file', item: null });
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ show: false, x: 0, y: 0, type: 'file', item: null });
      setActiveDropdown(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle rename
  const handleRename = async () => {
    if (!renameModal.item || !renameModal.newName.trim()) return;
    try {
      if (renameModal.type === 'file') {
        await fileService.renameFile(renameModal.item.id, renameModal.newName.trim());
        loadFiles();
      } else {
        await fileService.renameFolder(renameModal.item.id, renameModal.newName.trim());
        loadFolders();
      }
      toast.success(`${renameModal.type === 'file' ? 'File' : 'Folder'} renamed successfully`);
      setRenameModal({ show: false, type: 'file', item: null, newName: '' });
    } catch (error) {
      toast.error('Failed to rename');
    }
  };

  // Handle delete folder
  const handleDeleteFolder = async (folder: Folder) => {
    if (!window.confirm('Are you sure you want to delete this folder and all its contents?')) return;
    try {
      await fileService.deleteFolder(folder.id);
      loadFolders();
      toast.success('Folder deleted');
    } catch (error) {
      toast.error('Failed to delete folder');
    }
  };

  // Render context menu / dropdown menu items
  const renderMenuItems = (type: 'file' | 'folder', item: FileItem | Folder, isDropdown: boolean = false) => {
    const menuClass = isDropdown ? 'dropdown-menu' : 'context-menu';
    
    return (
      <div className={menuClass} onClick={(e) => e.stopPropagation()}>
        {type === 'file' && (
          <button onClick={() => { handleDownload(item as FileItem); setContextMenu({ show: false, x: 0, y: 0, type: 'file', item: null }); setActiveDropdown(null); }}>
            <i className="fas fa-download"></i>
            <span>Download</span>
          </button>
        )}
        <button onClick={() => { 
          setRenameModal({ show: true, type, item, newName: item.name }); 
          setContextMenu({ show: false, x: 0, y: 0, type: 'file', item: null }); 
          setActiveDropdown(null); 
        }}>
          <i className="fas fa-pen"></i>
          <span>Rename</span>
          {!isDropdown && <span className="shortcut">Ctrl+Alt+E</span>}
        </button>
        <div className="menu-divider"></div>
        <button onClick={() => { 
          setShareModal({ show: true, type, item }); 
          setContextMenu({ show: false, x: 0, y: 0, type: 'file', item: null }); 
          setActiveDropdown(null); 
        }}>
          <i className="fas fa-user-plus"></i>
          <span>Share</span>
          <i className="fas fa-chevron-right submenu-arrow"></i>
        </button>
        <button onClick={() => toast('Organize feature coming soon')}>
          <i className="fas fa-folder"></i>
          <span>Organize</span>
          <i className="fas fa-chevron-right submenu-arrow"></i>
        </button>
        <button onClick={() => { 
          setInfoModal({ show: true, type, item }); 
          setContextMenu({ show: false, x: 0, y: 0, type: 'file', item: null }); 
          setActiveDropdown(null); 
        }}>
          <i className="fas fa-info-circle"></i>
          <span>{type === 'file' ? 'File' : 'Folder'} information</span>
        </button>
        <div className="menu-divider"></div>
        <button onClick={() => { 
          if (type === 'file') {
            handleDeleteFile(item as FileItem);
          } else {
            handleDeleteFolder(item as Folder);
          }
          setContextMenu({ show: false, x: 0, y: 0, type: 'file', item: null }); 
          setActiveDropdown(null); 
        }}>
          <i className="fas fa-trash"></i>
          <span>Move to trash</span>
          {!isDropdown && <span className="shortcut">Delete</span>}
        </button>
      </div>
    );
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          >
            <i className="fas fa-bars"></i>
          </button>
          <div className="logo">
            <img src="/logo-square.png" alt="Task Insight" className="header-logo" />
            <span>Task Insight</span>
          </div>
        </div>
        
        <div className="header-center">
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
          <button className="header-action-btn" onClick={() => setShowUploadModal(true)} title="Upload">
            <i className="fas fa-cloud-upload-alt"></i>
          </button>
          <button className="header-action-btn" onClick={() => setShowCreateFolderModal(true)} title="New Folder">
            <i className="fas fa-folder-plus"></i>
          </button>
          
          <div className="user-menu">
            <button className="user-avatar" onClick={() => setShowUserMenu(!showUserMenu)}>
              {user?.firstName?.charAt(0) || user?.email?.charAt(0)}{user?.lastName?.charAt(0)}
            </button>
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-info">
                  <strong>{user?.firstName} {user?.lastName}</strong>
                  <span>{user?.email}</span>
                </div>
                <hr />
                <button onClick={() => navigate('/admin')} className="dropdown-item">
                  <i className="fas fa-cog"></i> Admin Panel
                </button>
                <button onClick={handleLogout} className="dropdown-item">
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-actions">
          <div className="new-button-container">
            <button 
              className="btn-primary new-btn" 
              onClick={(e) => { e.stopPropagation(); setShowNewDropdown(!showNewDropdown); }}
            >
              <i className="fas fa-plus"></i> New
            </button>
            {showNewDropdown && (
              <div className="new-dropdown" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => { setShowCreateFolderModal(true); setShowNewDropdown(false); }}>
                  <i className="far fa-folder"></i>
                  <span>New folder</span>
                </button>
                <div className="menu-divider"></div>
                <button onClick={() => { setShowUploadModal(true); setShowNewDropdown(false); }}>
                  <i className="fas fa-file-upload"></i>
                  <span>File upload</span>
                </button>
                <button onClick={() => { toast('Folder upload coming soon'); setShowNewDropdown(false); }}>
                  <i className="fas fa-folder-open"></i>
                  <span>Folder upload</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${currentView === 'my-drive' ? 'active' : ''}`}
            onClick={() => showView('my-drive')}
          >
            <i className="fas fa-hdd"></i> My Drive
          </button>
          <button 
            className={`nav-item ${currentView === 'shared' ? 'active' : ''}`}
            onClick={() => showView('shared')}
          >
            <i className="fas fa-users"></i> Shared with me
          </button>
          <button 
            className={`nav-item ${currentView === 'starred' ? 'active' : ''}`}
            onClick={() => showView('starred')}
          >
            <i className="fas fa-star"></i> Starred
          </button>
          <button 
            className={`nav-item ${currentView === 'trash' ? 'active' : ''}`}
            onClick={() => showView('trash')}
          >
            <i className="fas fa-trash"></i> Trash
          </button>
        </nav>
        
        {/* Storage Info at bottom */}
        <div className="sidebar-storage">
          <div className="storage-bar">
            <div 
              className="storage-used" 
              style={{ width: `${fileStats?.totalSize !== undefined && fileStats?.totalSize !== null && !isNaN(Number(fileStats.totalSize)) ? (Number(fileStats.totalSize) / 5368709120) * 100 : 0}%` }}
            ></div>
          </div>
          <span className="storage-text">
            {fileStats?.totalSize !== undefined && fileStats?.totalSize !== null && !isNaN(Number(fileStats.totalSize)) 
              ? fileService.formatFileSize(Number(fileStats.totalSize)) 
              : '0 Bytes'} of 5 GB
          </span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          {getBreadcrumbPath().map((item, index) => (
            <span key={index} className="breadcrumb-item">
              {item.name}
            </span>
          ))}
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="view-toggle">
              <button 
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <i className="fas fa-th"></i>
              </button>
              <button 
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
          </div>
          <div className="toolbar-right">
            <button 
              className="sync-btn"
              onClick={() => { loadFiles(); loadFolders(); toast.success('Synced!'); }}
              title="Sync"
            >
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>

        {/* Files and Folders */}
        <div className="files-container">
          {isLoading ? (
            <div className="loading">
              <i className="fas fa-spinner fa-spin"></i>
              <span>Loading...</span>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="files-grid">
                  {/* Folders - not shown in trash or shared view */}
                  {currentView !== 'trash' && currentView !== 'shared' && (currentView === 'starred' ? starredFolders : folders).map((folder) => (
                    <div 
                      key={folder.id} 
                      className="file-item folder" 
                      onClick={() => handleFolderClick(folder)}
                      onContextMenu={(e) => handleContextMenu(e, 'folder', folder)}
                    >
                      <div className="file-icon">
                        <i className="fas fa-folder"></i>
                      </div>
                      <div className="file-info">
                        <div className="file-name">{folder.name}</div>
                        <div className="file-meta">{folder.file_count} items</div>
                      </div>
                      <div className="file-actions">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleStar('folder', folder.id); }}
                          title={folder.is_starred ? "Unstar" : "Star"}
                          className={folder.is_starred ? "starred" : ""}
                        >
                          <i className={folder.is_starred ? "fas fa-star" : "far fa-star"}></i>
                        </button>
                        <button 
                          onClick={(e) => handleDropdownToggle(e, 'folder', folder.id)} 
                          title="More options"
                          className="more-options-btn"
                        >
                          <i className="fas fa-ellipsis-v"></i>
                        </button>
                        {activeDropdown?.type === 'folder' && activeDropdown?.id === folder.id && (
                          renderMenuItems('folder', folder, true)
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Files */}
                  {(currentView === 'trash' ? deletedFiles : currentView === 'starred' ? starredFiles : files).map((file) => (
                    <div 
                      key={file.id} 
                      className="file-item" 
                      onDoubleClick={() => handleDownload(file)}
                      onContextMenu={(e) => handleContextMenu(e, 'file', file)}
                    >
                      <div className="file-icon">
                        <i className={fileService.getFileIcon(file.file_type)}></i>
                      </div>
                      <div className="file-info">
                        <div className="file-name">{file.name}</div>
                        <div className="file-meta">
                          {fileService.formatFileSize(file.file_size)} • {file.file_type.toUpperCase()}
                        </div>
                      </div>
                      <div className="file-actions">
                        {currentView === 'trash' ? (
                          <>
                            <button onClick={() => {/* handleRestoreFile(file) */}} title="Restore">
                              <i className="fas fa-undo"></i>
                            </button>
                            <button onClick={() => {/* handlePermanentDelete(file) */}} title="Delete Forever">
                              <i className="fas fa-times"></i>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleStar('file', file.id); }}
                              title={file.is_starred ? "Unstar" : "Star"}
                              className={file.is_starred ? "starred" : ""}
                            >
                              <i className={file.is_starred ? "fas fa-star" : "far fa-star"}></i>
                            </button>
                            <button 
                              onClick={(e) => handleDropdownToggle(e, 'file', file.id)} 
                              title="More options"
                              className="more-options-btn"
                            >
                              <i className="fas fa-ellipsis-v"></i>
                            </button>
                            {activeDropdown?.type === 'file' && activeDropdown?.id === file.id && (
                              renderMenuItems('file', file, true)
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <table className="files-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Size</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Folders - not shown in trash or shared view */}
                    {currentView !== 'trash' && currentView !== 'shared' && (currentView === 'starred' ? starredFolders : folders).map((folder) => (
                      <tr key={folder.id} className="file-row folder-row" onClick={() => handleFolderClick(folder)}>
                        <td>
                          <div className="file-name-cell">
                            <i className="fas fa-folder file-icon"></i>
                            <span>{folder.name}</span>
                          </div>
                        </td>
                        <td>Folder</td>
                        <td>{folder.file_count} items</td>
                        <td className="file-actions-cell">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleStar('folder', folder.id); }}
                            title={folder.is_starred ? "Unstar" : "Star"}
                            className={folder.is_starred ? "starred" : ""}
                          >
                            <i className={folder.is_starred ? "fas fa-star" : "far fa-star"}></i>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); /* Delete folder */ }} title="Delete">
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {/* Files */}
                    {(currentView === 'trash' ? deletedFiles : currentView === 'starred' ? starredFiles : files).map((file) => (
                      <tr key={file.id} className="file-row" onDoubleClick={() => handleDownload(file)}>
                        <td>
                          <div className="file-name-cell">
                            <i className={`${fileService.getFileIcon(file.file_type)} file-icon`}></i>
                            <span>{file.name}</span>
                          </div>
                        </td>
                        <td>{file.file_type.toUpperCase()}</td>
                        <td>{fileService.formatFileSize(file.file_size)}</td>
                        <td className="file-actions-cell">
                          {currentView === 'trash' ? (
                            <>
                              <button onClick={() => {/* handleRestoreFile(file) */}} title="Restore">
                                <i className="fas fa-undo"></i>
                              </button>
                              <button onClick={() => {/* handlePermanentDelete(file) */}} title="Delete Forever">
                                <i className="fas fa-times"></i>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleStar('file', file.id); }}
                                title={file.is_starred ? "Unstar" : "Star"}
                                className={file.is_starred ? "starred" : ""}
                              >
                                <i className={file.is_starred ? "fas fa-star" : "far fa-star"}></i>
                              </button>
                              <button onClick={() => handleDownload(file)} title="Download">
                                <i className="fas fa-download"></i>
                              </button>
                              <button onClick={() => handleDeleteFile(file)} title="Move to Trash">
                                <i className="fas fa-trash"></i>
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Empty State */}
              {(() => {
                const displayFiles = currentView === 'trash' ? deletedFiles : currentView === 'starred' ? starredFiles : files;
                const displayFolders = currentView === 'starred' ? starredFolders : folders;
                // For shared view, only check files (no folders shown)
                // For trash view, only check files
                // For other views, check both files and folders
                const isEmpty = currentView === 'shared' || currentView === 'trash' 
                  ? displayFiles.length === 0 
                  : displayFiles.length === 0 && displayFolders.length === 0;
                
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
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{margin: 0, color: '#333'}}>Upload Files</h3>
              <button onClick={() => setShowUploadModal(false)} style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#666'
              }}>×</button>
            </div>
            
            <div style={{textAlign: 'center', padding: '40px 20px'}}>
              <div style={{
                border: '2px dashed #ddd',
                borderRadius: '8px',
                padding: '40px 20px',
                marginBottom: '20px'
              }}>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  id="file-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="file-upload" style={{
                  cursor: 'pointer',
                  color: '#666',
                  fontSize: '16px'
                }}>
                  <i className="fas fa-cloud-upload-alt" style={{
                    fontSize: '48px',
                    color: '#ddd',
                    marginBottom: '10px',
                    display: 'block'
                  }}></i>
                  <span>Choose files to upload</span>
                </label>
                {isUploading && (
                  <div style={{marginTop: '20px'}}>
                    <div style={{
                      width: '100%',
                      height: '4px',
                      background: '#f0f0f0',
                      borderRadius: '2px',
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
            maxWidth: '400px',
            width: '90%'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{margin: 0, color: '#333'}}>Create Folder</h3>
              <button onClick={() => setShowCreateFolderModal(false)} style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#666'
              }}>×</button>
            </div>
            
            <div>
              <input
                type="text"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  marginBottom: '20px'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder();
                  }
                }}
              />
              
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px'
              }}>
                <button
                  onClick={() => setShowCreateFolderModal(false)}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: 'white',
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
                    borderRadius: '4px',
                    background: '#141464',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu (Right-click) */}
      {contextMenu.show && contextMenu.item && (
        <div 
          className="context-menu-overlay"
          style={{ 
            position: 'fixed', 
            top: contextMenu.y, 
            left: contextMenu.x,
            zIndex: 10000 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {renderMenuItems(contextMenu.type, contextMenu.item, false)}
        </div>
      )}

      {/* Rename Modal */}
      {renameModal.show && renameModal.item && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div className="modal-content" style={{
            background: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Rename</h3>
            <input
              type="text"
              value={renameModal.newName}
              onChange={(e) => setRenameModal({ ...renameModal, newName: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                marginBottom: '20px',
                boxSizing: 'border-box'
              }}
              autoFocus
              onKeyPress={(e) => { if (e.key === 'Enter') handleRename(); }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setRenameModal({ show: false, type: 'file', item: null, newName: '' })}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  background: '#141464',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {infoModal.show && infoModal.item && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div className="modal-content" style={{
            background: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#333' }}>{infoModal.type === 'file' ? 'File' : 'Folder'} Information</h3>
              <button 
                onClick={() => setInfoModal({ show: false, type: 'file', item: null })}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}
              >×</button>
            </div>
            <div style={{ fontSize: '14px', color: '#555' }}>
              <div style={{ display: 'flex', marginBottom: '12px' }}>
                <span style={{ width: '100px', color: '#888' }}>Name:</span>
                <span style={{ flex: 1, fontWeight: 500 }}>{infoModal.item.name}</span>
              </div>
              {infoModal.type === 'file' && (
                <>
                  <div style={{ display: 'flex', marginBottom: '12px' }}>
                    <span style={{ width: '100px', color: '#888' }}>Type:</span>
                    <span>{(infoModal.item as FileItem).file_type?.toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'flex', marginBottom: '12px' }}>
                    <span style={{ width: '100px', color: '#888' }}>Size:</span>
                    <span>{fileService.formatFileSize((infoModal.item as FileItem).file_size)}</span>
                  </div>
                </>
              )}
              {infoModal.type === 'folder' && (
                <div style={{ display: 'flex', marginBottom: '12px' }}>
                  <span style={{ width: '100px', color: '#888' }}>Items:</span>
                  <span>{(infoModal.item as Folder).file_count} items</span>
                </div>
              )}
              <div style={{ display: 'flex', marginBottom: '12px' }}>
                <span style={{ width: '100px', color: '#888' }}>Created:</span>
                <span>{new Date(infoModal.item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModal.show && shareModal.item && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div className="modal-content" style={{
            background: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#333' }}>Share "{shareModal.item.name}"</h3>
              <button 
                onClick={() => setShareModal({ show: false, type: 'file', item: null })}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}
              >×</button>
            </div>
            <div>
              <input
                type="email"
                placeholder="Add people or groups"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  marginBottom: '20px',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#555' }}>General access</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                  <i className="fas fa-lock" style={{ color: '#666' }}></i>
                  <div>
                    <div style={{ fontWeight: 500 }}>Restricted</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>Only people with access can open with the link</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer'
                }}>
                  <i className="fas fa-link"></i>
                  Copy link
                </button>
                <button
                  onClick={() => setShareModal({ show: false, type: 'file', item: null })}
                  style={{
                    padding: '10px 24px',
                    border: 'none',
                    borderRadius: '4px',
                    background: '#141464',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: string;
  modified: string;
  icon: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('my-drive');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: '1',
      name: 'Project Documents',
      type: 'folder',
      modified: '2 hours ago',
      icon: 'fas fa-folder'
    },
    {
      id: '2',
      name: 'Meeting Notes.pdf',
      type: 'file',
      size: '2.3 MB',
      modified: '1 day ago',
      icon: 'fas fa-file-pdf'
    },
    {
      id: '3',
      name: 'Presentation.pptx',
      type: 'file',
      size: '5.1 MB',
      modified: '3 days ago',
      icon: 'fas fa-file-powerpoint'
    }
  ]);

  useEffect(() => {
    // Check authentication
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
    }
  }, [navigate]);

  const showView = (view: string) => {
    setCurrentView(view);
  };

  const setViewModeHandler = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const logout = () => {
    localStorage.removeItem('user');
    navigate('/');
    toast.success('Logged out successfully');
  };

  const showUploadModalHandler = () => {
    setShowUploadModal(true);
  };

  const hideUploadModal = () => {
    setShowUploadModal(false);
  };

  const showCreateFolderModalHandler = () => {
    setShowCreateFolderModal(true);
  };

  const hideCreateFolderModal = () => {
    setShowCreateFolderModal(false);
  };

  const createFolder = () => {
    const folderName = (document.getElementById('folder-name') as HTMLInputElement)?.value;
    if (folderName) {
      const newFolder: FileItem = {
        id: Date.now().toString(),
        name: folderName,
        type: 'folder',
        modified: 'Just now',
        icon: 'fas fa-folder'
      };
      setFiles(prev => [newFolder, ...prev]);
      hideCreateFolderModal();
      toast.success('Folder created successfully');
    }
  };

  const uploadFiles = () => {
    hideUploadModal();
    toast.success('Files uploaded successfully');
  };

  const showShareModalHandler = () => {
    setShowShareModal(true);
  };

  const hideShareModal = () => {
    setShowShareModal(false);
  };

  const showUserSettingsHandler = () => {
    setShowUserSettings(true);
  };

  const hideUserSettings = () => {
    setShowUserSettings(false);
  };

  const getCurrentPath = () => {
    switch (currentView) {
      case 'my-drive': return 'My Drive';
      case 'shared': return 'Shared with me';
      case 'recent': return 'Recent';
      case 'starred': return 'Starred';
      case 'trash': return 'Trash';
      default: return 'My Drive';
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <button className="mobile-menu-toggle" onClick={() => {}}>
            <i className="fas fa-bars"></i>
          </button>
          <i className="fas fa-folder-open"></i>
          <h1>Task Insight</h1>
        </div>
        <div className="header-center">
          <div className="search-container">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search documents..." id="search-input" />
          </div>
        </div>
        <div className="header-right">
          <div className="user-menu">
            <button className="user-avatar" onClick={toggleUserMenu}>
              <i className="fas fa-user"></i>
            </button>
            <div className={`user-dropdown ${showUserMenu ? 'active' : ''}`} id="user-dropdown">
              <a href="#" onClick={showUserSettingsHandler}>
                <i className="fas fa-user"></i>
                User Profile
              </a>
              <a href="#" onClick={logout}>
                <i className="fas fa-sign-out-alt"></i>
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* App Body */}
      <div className="app-body">
        {/* Sidebar */}
        <aside className="sidebar" id="sidebar">
          <nav className="sidebar-nav">
            <button 
              className={`nav-item ${currentView === 'my-drive' ? 'active' : ''}`} 
              onClick={() => showView('my-drive')}
            >
              <i className="fas fa-home"></i>
              <span>My Drive</span>
            </button>
            <button 
              className={`nav-item ${currentView === 'shared' ? 'active' : ''}`} 
              onClick={() => showView('shared')}
            >
              <i className="fas fa-share-alt"></i>
              <span>Shared with me</span>
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
              className={`nav-item ${currentView === 'trash' ? 'active' : ''}`} 
              onClick={() => showView('trash')}
            >
              <i className="fas fa-trash"></i>
              <span>Trash</span>
            </button>
          </nav>
          <div className="sidebar-footer">
            <button className="nav-item logout-btn" onClick={logout}>
              <i className="fas fa-sign-out-alt"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <div className="content-header">
            <div className="breadcrumb">
              <span id="current-path">{getCurrentPath()}</span>
            </div>
            <div className="content-actions">
              <button className="btn-secondary" onClick={showCreateFolderModalHandler}>
                <i className="fas fa-folder-plus"></i>
                New Folder
              </button>
              <button className="btn-primary" onClick={showUploadModalHandler}>
                <i className="fas fa-upload"></i>
                Upload
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <div className="view-controls">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} 
                onClick={() => setViewModeHandler('grid')}
              >
                <i className="fas fa-th"></i>
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} 
                onClick={() => setViewModeHandler('list')}
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
            <div className="sort-controls">
              <select id="sort-select">
                <option value="name">Name</option>
                <option value="date">Date modified</option>
                <option value="size">Size</option>
              </select>
            </div>
          </div>

          {/* File Grid */}
          <div className={`file-grid ${viewMode === 'list' ? 'list-view' : ''}`} id="file-grid">
            {files.map((file) => (
              <div key={file.id} className="file-item" onContextMenu={(e) => e.preventDefault()}>
                <div className="file-icon">
                  <i className={file.icon}></i>
                </div>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-meta">
                    {file.size && <span className="file-size">{file.size}</span>}
                    <span className="file-date">{file.modified}</span>
                  </div>
                </div>
                <div className="file-actions">
                  <button className="action-btn" onClick={showShareModalHandler}>
                    <i className="fas fa-share-alt"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {files.length === 0 && (
            <div className="empty-state" id="empty-state">
              <i className="fas fa-folder-open"></i>
              <h3>No files yet</h3>
              <p>Upload your first file or create a folder to get started</p>
              <button className="btn-primary" onClick={showUploadModalHandler}>Upload files</button>
            </div>
          )}
        </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Upload Files</h3>
              <button className="modal-close" onClick={hideUploadModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="upload-area" id="upload-area">
                <i className="fas fa-cloud-upload-alt"></i>
                <p>Drag and drop files here or click to browse</p>
                <input type="file" id="file-input" multiple style={{ display: 'none' }} />
              </div>
              <div className="upload-list" id="upload-list"></div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={hideUploadModal}>Cancel</button>
              <button className="btn-primary" onClick={uploadFiles}>Upload</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Folder</h3>
              <button className="modal-close" onClick={hideCreateFolderModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="folder-name">Folder Name</label>
                <input type="text" id="folder-name" placeholder="Enter folder name" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={hideCreateFolderModal}>Cancel</button>
              <button className="btn-primary" onClick={createFolder}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal active">
          <div className="modal-content share-modal-content">
            <div className="modal-header">
              <h3 id="share-file-title">Share File</h3>
              <div className="share-header-actions">
                <button className="btn-icon" title="Help">
                  <i className="fas fa-question-circle"></i>
                </button>
                <button className="btn-icon" title="Settings">
                  <i className="fas fa-cog"></i>
                </button>
                <button className="modal-close" onClick={hideShareModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            <div className="modal-body">
              <div className="share-section">
                <label htmlFor="add-people-input">Add people, groups, spaces, and calendar events</label>
                <div className="add-people-container">
                  <input type="text" id="add-people-input" placeholder="Add people, groups, spaces, and calendar events" />
                  <button className="btn-primary">Add</button>
                </div>
              </div>
              <div className="share-section">
                <h4>People with access</h4>
                <div className="people-list" id="people-list">
                  {/* People will be dynamically added here */}
                </div>
              </div>
              <div className="share-section">
                <h4>General access</h4>
                <div className="general-access">
                  <div className="access-option">
                    <i className="fas fa-lock"></i>
                    <select id="general-access">
                      <option value="restricted">Restricted</option>
                      <option value="anyone">Anyone with the link</option>
                      <option value="organization">Anyone in your organization</option>
                    </select>
                  </div>
                  <p className="access-description" id="access-description">
                    Only people with access can open with the link
                  </p>
                </div>
              </div>
              <div className="share-section">
                <label htmlFor="share-link">Share Link</label>
                <div className="input-group">
                  <input type="text" id="share-link" readOnly />
                  <button className="btn-secondary">
                    <i className="fas fa-link"></i>
                    Copy link
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={hideShareModal}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* User Settings Modal */}
      {showUserSettings && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h3>User Settings</h3>
              <button className="modal-close" onClick={hideUserSettings}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="settings-section">
                <h4>Organization Information</h4>
                <div className="org-info">
                  <p><strong>Organization:</strong> <span id="org-name-display">Acme Corporation</span></p>
                  <p><strong>Role:</strong> <span id="user-role-display">Member</span></p>
                  <p><strong>Email:</strong> <span id="user-email-display">john@acme.com</span></p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={hideUserSettings}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

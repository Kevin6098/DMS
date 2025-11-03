# Integration Example - Using All New Features

This guide shows how to integrate all the new features into your Dashboard component.

## Quick Integration

Add these imports to your Dashboard component:

```typescript
import FilePreviewModal from './FilePreviewModal';
import FileSharingModal from './FileSharingModal';
import FileVersionHistoryModal from './FileVersionHistoryModal';
import ZipUnzipModal from './ZipUnzipModal';
```

Add these state variables:

```typescript
const [showPreviewModal, setShowPreviewModal] = useState(false);
const [showShareModal, setShowShareModal] = useState(false);
const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);
const [showZipModal, setShowZipModal] = useState(false);
const [showUnzipModal, setShowUnzipModal] = useState(false);
const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
```

Add these handler functions:

```typescript
// Preview file
const handlePreviewFile = (file: FileItem) => {
  setSelectedFile(file);
  setShowPreviewModal(true);
};

// Share file
const handleShareFile = (file: FileItem) => {
  setSelectedFile(file);
  setShowShareModal(true);
};

// Version history
const handleViewVersions = (file: FileItem) => {
  setSelectedFile(file);
  setShowVersionHistoryModal(true);
};

// Zip files
const handleZipFiles = () => {
  if (selectedFiles.length === 0) {
    toast.error('Please select files to zip');
    return;
  }
  setShowZipModal(true);
};

// Unzip file
const handleUnzipFile = (file: FileItem) => {
  setSelectedFiles([file]);
  setShowUnzipModal(true);
};
```

Add action buttons to your file items:

```typescript
<div className="file-actions">
  {/* Preview */}
  <button
    className="btn-icon"
    onClick={() => handlePreviewFile(file)}
    title="Preview"
  >
    <i className="fas fa-eye"></i>
  </button>

  {/* Share */}
  <button
    className="btn-icon"
    onClick={() => handleShareFile(file)}
    title="Share"
  >
    <i className="fas fa-share-alt"></i>
  </button>

  {/* Version History */}
  <button
    className="btn-icon"
    onClick={() => handleViewVersions(file)}
    title="Version History"
  >
    <i className="fas fa-history"></i>
  </button>

  {/* Unzip (for zip files only) */}
  {file.file_type.toLowerCase().includes('zip') && (
    <button
      className="btn-icon"
      onClick={() => handleUnzipFile(file)}
      title="Unzip"
    >
      <i className="fas fa-file-zipper"></i>
    </button>
  )}

  {/* Download */}
  <button
    className="btn-icon"
    onClick={() => downloadFile(file.id, file.name)}
    title="Download"
  >
    <i className="fas fa-download"></i>
  </button>

  {/* Delete */}
  <button
    className="btn-icon"
    onClick={() => handleDeleteFile(file.id)}
    title="Delete"
  >
    <i className="fas fa-trash"></i>
  </button>
</div>
```

Add a toolbar button for zipping multiple files:

```typescript
<div className="toolbar-right">
  {selectedFiles.length > 1 && (
    <button className="btn-primary" onClick={handleZipFiles}>
      <i className="fas fa-file-archive"></i> Zip Selected
    </button>
  )}
  
  {/* Other toolbar buttons */}
  <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
    <i className="fas fa-upload"></i> Upload
  </button>
  <button className="btn-secondary" onClick={() => setShowCreateFolderModal(true)}>
    <i className="fas fa-folder-plus"></i> New Folder
  </button>
</div>
```

Add the modals at the end of your component (before the closing tag):

```typescript
return (
  <div className="dashboard">
    {/* Your existing dashboard content */}
    
    {/* Modals */}
    {showPreviewModal && (
      <FilePreviewModal
        file={selectedFile}
        onClose={() => setShowPreviewModal(false)}
      />
    )}

    {showShareModal && (
      <FileSharingModal
        file={selectedFile}
        onClose={() => setShowShareModal(false)}
      />
    )}

    {showVersionHistoryModal && (
      <FileVersionHistoryModal
        file={selectedFile}
        onClose={() => setShowVersionHistoryModal(false)}
        onVersionRestored={() => {
          refreshFiles();
          setShowVersionHistoryModal(false);
        }}
      />
    )}

    {showZipModal && (
      <ZipUnzipModal
        mode="zip"
        selectedFiles={selectedFiles}
        currentFolder={currentFolder}
        onClose={() => setShowZipModal(false)}
        onComplete={() => {
          setSelectedFiles([]);
          refreshFiles();
        }}
      />
    )}

    {showUnzipModal && (
      <ZipUnzipModal
        mode="unzip"
        selectedFiles={selectedFiles}
        currentFolder={currentFolder}
        onClose={() => setShowUnzipModal(false)}
        onComplete={() => {
          setSelectedFiles([]);
          refreshFiles();
        }}
      />
    )}
  </div>
);
```

## Multi-Select for Zip Feature

Add checkbox selection to enable multi-file zipping:

```typescript
// State
const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);

// Toggle selection
const toggleFileSelection = (file: FileItem) => {
  setSelectedFiles(prev => {
    const isSelected = prev.some(f => f.id === file.id);
    if (isSelected) {
      return prev.filter(f => f.id !== file.id);
    } else {
      return [...prev, file];
    }
  });
};

// Check if file is selected
const isFileSelected = (file: FileItem) => {
  return selectedFiles.some(f => f.id === file.id);
};

// Select all files
const selectAllFiles = () => {
  setSelectedFiles(files);
};

// Deselect all
const deselectAll = () => {
  setSelectedFiles([]);
};
```

Add checkboxes to file items:

```typescript
<div className={`file-item ${isFileSelected(file) ? 'selected' : ''}`}>
  <input
    type="checkbox"
    checked={isFileSelected(file)}
    onChange={() => toggleFileSelection(file)}
    onClick={(e) => e.stopPropagation()}
  />
  
  {/* Rest of file item content */}
</div>
```

## Session Persistence (Already Working!)

Session persistence is already implemented in `AuthContext`. The current implementation:

1. **Stores JWT tokens** in `localStorage`
2. **Auto-verifies tokens** on app initialization
3. **Maintains user state** across page refreshes
4. **Includes tokens** in all API requests automatically

**No additional code needed!** Users can refresh the page and stay logged in.

### How it works:

```typescript
// In AuthContext.tsx (already implemented)
useEffect(() => {
  const verifyAuth = async () => {
    const authData = authService.getAuthData();
    
    if (authData.token && authData.user) {
      setUser(authData.user);
      setIsAuthenticated(true);
      
      try {
        // Verify token is still valid
        const response = await authService.verifyToken();
        if (!response.success) {
          logout();
        }
      } catch (error) {
        logout();
      }
    }
    
    setIsLoading(false);
  };

  verifyAuth();
}, []);
```

## Complete Example Usage

Here's a complete example of a file item with all features:

```typescript
<div className="file-item grid" key={file.id}>
  {/* Selection checkbox */}
  <input
    type="checkbox"
    className="file-checkbox"
    checked={isFileSelected(file)}
    onChange={() => toggleFileSelection(file)}
  />

  {/* File icon */}
  <i className={fileService.getFileIcon(file.file_type)}></i>

  {/* File info */}
  <div className="file-info">
    <h4>{file.name}</h4>
    <p>{fileService.formatFileSize(file.file_size)}</p>
    <p className="file-date">{new Date(file.created_at).toLocaleDateString()}</p>
  </div>

  {/* Action buttons */}
  <div className="file-actions">
    {/* Preview */}
    {fileService.canPreview(file.file_type) && (
      <button
        className="btn-icon"
        onClick={() => handlePreviewFile(file)}
        title="Preview"
      >
        <i className="fas fa-eye"></i>
      </button>
    )}

    {/* Share */}
    <button
      className="btn-icon"
      onClick={() => handleShareFile(file)}
      title="Share"
    >
      <i className="fas fa-share-alt"></i>
    </button>

    {/* Version History */}
    <button
      className="btn-icon"
      onClick={() => handleViewVersions(file)}
      title="Version History"
    >
      <i className="fas fa-history"></i>
    </button>

    {/* Unzip */}
    {file.file_type.toLowerCase().includes('zip') && (
      <button
        className="btn-icon"
        onClick={() => handleUnzipFile(file)}
        title="Unzip"
      >
        <i className="fas fa-file-zipper"></i>
      </button>
    )}

    {/* Download */}
    <button
      className="btn-icon"
      onClick={() => fileService.downloadFile(file.id, file.name)}
      title="Download"
    >
      <i className="fas fa-download"></i>
    </button>

    {/* Delete */}
    <button
      className="btn-icon btn-danger"
      onClick={() => handleDeleteFile(file.id)}
      title="Delete"
    >
      <i className="fas fa-trash"></i>
    </button>
  </div>
</div>
```

## Testing Features

### Test File Preview:
1. Click on any PDF, image, or video file
2. Click the eye icon
3. Preview modal opens with the file

### Test File Sharing:
1. Click the share icon on any file
2. Enter email or leave blank for public link
3. Set permission level and expiration
4. Click "Share File"
5. Copy the generated link

### Test Version History:
1. Upload a file multiple times with the same name
2. Click the history icon
3. See all versions
4. Download or restore any version

### Test Zip/Unzip:
1. Select multiple files (checkboxes)
2. Click "Zip Selected" button
3. Enter archive name
4. Download the zip file
5. Upload a zip file
6. Click unzip icon
7. Files are extracted to current folder

### Test Session Persistence:
1. Login to the application
2. Navigate around the dashboard
3. **Refresh the page (F5)**
4. ✅ You should still be logged in
5. ✅ All your files and folders are still there
6. ✅ No need to login again!

## All Features Are Ready! 🎉

Every feature requested is now implemented and ready to use:

- ✅ **Version History** - Complete
- ✅ **File Sharing** - Complete with permissions
- ✅ **File Preview** - PDF, DOCX, images, videos
- ✅ **Zip/Unzip** - Browser-based compression
- ✅ **Page Refresh** - Session persists perfectly

**Happy coding!** 🚀


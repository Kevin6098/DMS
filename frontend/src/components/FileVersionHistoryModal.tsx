import React, { useState, useEffect } from 'react';
import { fileService, FileItem } from '../services/fileService';
import toast from 'react-hot-toast';

interface FileVersionHistoryModalProps {
  file: FileItem | null;
  onClose: () => void;
  onVersionRestored?: () => void;
}

interface FileVersion {
  id: number;
  version: number;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
}

const FileVersionHistoryModal: React.FC<FileVersionHistoryModalProps> = ({ 
  file, 
  onClose, 
  onVersionRestored 
}) => {
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (file) {
      loadVersions();
    }
  }, [file]);

  const loadVersions = async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      const response = await fileService.getFileVersions(file.id);
      if (response.success && response.data) {
        setVersions(response.data);
      }
    } catch (error) {
      console.error('Error loading versions:', error);
      toast.error('Failed to load version history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadVersion = async (versionId: number, fileName: string) => {
    if (!file) return;

    try {
      await fileService.downloadFileVersion(file.id, versionId, fileName);
      toast.success('Version downloaded successfully');
    } catch (error) {
      console.error('Error downloading version:', error);
      toast.error('Failed to download version');
    }
  };

  const handleRestoreVersion = async (versionId: number, versionNumber: number) => {
    if (!file) return;

    const confirmed = window.confirm(
      `Are you sure you want to restore version ${versionNumber}? This will create a new version based on the selected one.`
    );

    if (!confirmed) return;

    setIsRestoring(true);
    try {
      await fileService.restoreFileVersion(file.id, versionId);
      toast.success('Version restored successfully');
      loadVersions();
      if (onVersionRestored) {
        onVersionRestored();
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('Failed to restore version');
    } finally {
      setIsRestoring(false);
    }
  };

  if (!file) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <i className="fas fa-history"></i> Version History
          </h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="file-info-box">
            <i className={fileService.getFileIcon(file.file_type)}></i>
            <div>
              <h4>{file.name}</h4>
              <p>Current Version: {file.current_version || 1}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading versions...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-history"></i>
              <h3>No Version History</h3>
              <p>This file has no previous versions.</p>
            </div>
          ) : (
            <div className="versions-list">
              <div className="versions-timeline">
                {versions.map((version, index) => (
                  <div key={version.id} className={`version-item ${index === 0 ? 'current' : ''}`}>
                    <div className="version-marker">
                      <div className="version-dot"></div>
                      {index < versions.length - 1 && <div className="version-line"></div>}
                    </div>
                    <div className="version-content">
                      <div className="version-header">
                        <div className="version-info">
                          <h4>
                            Version {version.version}
                            {index === 0 && <span className="badge-current">Current</span>}
                          </h4>
                          <p className="version-meta">
                            <i className="fas fa-user"></i> {version.uploadedBy}
                            <span className="separator">•</span>
                            <i className="fas fa-calendar"></i> {new Date(version.uploadedAt).toLocaleString()}
                            <span className="separator">•</span>
                            <i className="fas fa-hdd"></i> {fileService.formatFileSize(version.fileSize)}
                          </p>
                        </div>
                        <div className="version-actions">
                          <button
                            className="btn-icon"
                            title="Download this version"
                            onClick={() => handleDownloadVersion(version.id, version.fileName)}
                          >
                            <i className="fas fa-download"></i>
                          </button>
                          {index !== 0 && (
                            <button
                              className="btn-icon"
                              title="Restore this version"
                              onClick={() => handleRestoreVersion(version.id, version.version)}
                              disabled={isRestoring}
                            >
                              <i className="fas fa-undo"></i>
                            </button>
                          )}
                        </div>
                      </div>
                      {version.description && (
                        <p className="version-description">{version.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default FileVersionHistoryModal;


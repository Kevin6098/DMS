import React, { useState, useEffect } from 'react';
import { fileService, FileItem } from '../services/fileService';
import toast from 'react-hot-toast';

interface FilePreviewModalProps {
  file: FileItem | null;
  onClose: () => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [previewContent, setPreviewContent] = useState<string>('');

  useEffect(() => {
    if (file) {
      loadPreview();
    }
  }, [file]);

  const loadPreview = async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      const fileType = file.file_type.toLowerCase();
      
      // For images
      if (fileType.includes('jpg') || fileType.includes('jpeg') || fileType.includes('png') || fileType.includes('gif')) {
        const previewUrl = fileService.getFilePreviewUrl(file.id);
        setPreviewContent(previewUrl);
      }
      // For PDF
      else if (fileType.includes('pdf')) {
        const previewUrl = fileService.getFilePreviewUrl(file.id);
        setPreviewContent(previewUrl);
      }
      // For videos
      else if (fileType.includes('mp4') || fileType.includes('avi') || fileType.includes('mov')) {
        const previewUrl = fileService.getFilePreviewUrl(file.id);
        setPreviewContent(previewUrl);
      }
      // For text files
      else if (fileType.includes('txt')) {
        // Would need to fetch text content from API
        setPreviewContent('');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading preview:', error);
      toast.error('Failed to load preview');
      setIsLoading(false);
    }
  };

  if (!file) return null;

  const fileType = file.file_type.toLowerCase();
  const canPreview = fileService.canPreview(file.file_type);

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="preview-loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading preview...</p>
        </div>
      );
    }

    if (!canPreview) {
      return (
        <div className="preview-not-available">
          <i className="fas fa-eye-slash"></i>
          <h3>Preview Not Available</h3>
          <p>Preview is not available for this file type.</p>
          <button className="btn-primary" onClick={() => fileService.downloadFile(file.id, file.name)}>
            <i className="fas fa-download"></i> Download File
          </button>
        </div>
      );
    }

    // Image preview
    if (fileType.includes('jpg') || fileType.includes('jpeg') || fileType.includes('png') || fileType.includes('gif')) {
      return (
        <div className="preview-image">
          <img src={previewContent} alt={file.name} />
        </div>
      );
    }

    // PDF preview
    if (fileType.includes('pdf')) {
      return (
        <div className="preview-pdf">
          <iframe 
            src={`${previewContent}#toolbar=0`} 
            title={file.name}
            width="100%" 
            height="600px"
          />
        </div>
      );
    }

    // Video preview
    if (fileType.includes('mp4') || fileType.includes('avi') || fileType.includes('mov')) {
      return (
        <div className="preview-video">
          <video controls width="100%">
            <source src={previewContent} type={`video/${fileType}`} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Document preview (DOCX, etc.) - Using Office Online Viewer
    if (fileType.includes('doc') || fileType.includes('docx')) {
      const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewContent)}`;
      return (
        <div className="preview-document">
          <iframe 
            src={viewerUrl} 
            title={file.name}
            width="100%" 
            height="600px"
          />
        </div>
      );
    }

    return (
      <div className="preview-not-available">
        <i className="fas fa-file"></i>
        <h3>Preview Not Supported</h3>
        <p>This file type cannot be previewed in the browser.</p>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <i className={fileService.getFileIcon(file.file_type)}></i>
            <h2>{file.name}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="modal-body preview-modal-body">
          {renderPreview()}
        </div>

        <div className="modal-footer">
          <div className="file-preview-info">
            <span><i className="fas fa-hdd"></i> {fileService.formatFileSize(file.file_size)}</span>
            <span><i className="fas fa-calendar"></i> {new Date(file.created_at).toLocaleDateString()}</span>
            <span><i className="fas fa-user"></i> {file.first_name} {file.last_name}</span>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => fileService.downloadFile(file.id, file.name)}>
              <i className="fas fa-download"></i> Download
            </button>
            <button className="btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;


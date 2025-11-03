import React, { useState } from 'react';
import { fileService, FileItem, Folder } from '../services/fileService';
import toast from 'react-hot-toast';

interface ZipUnzipModalProps {
  mode: 'zip' | 'unzip';
  selectedFiles: FileItem[];
  currentFolder?: Folder | null;
  onClose: () => void;
  onComplete?: () => void;
}

const ZipUnzipModal: React.FC<ZipUnzipModalProps> = ({
  mode,
  selectedFiles,
  currentFolder,
  onClose,
  onComplete
}) => {
  const [zipName, setZipName] = useState('archive.zip');
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState<number | undefined>(
    currentFolder?.id
  );

  const handleZip = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to zip');
      return;
    }

    setIsProcessing(true);
    try {
      const fileIds = selectedFiles.map(f => f.id);
      await fileService.zipFiles(fileIds, zipName);
      toast.success('Files zipped and downloaded successfully!');
      onClose();
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error zipping files:', error);
      toast.error('Failed to zip files');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnzip = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select a zip file');
      return;
    }

    const zipFile = selectedFiles[0];
    if (!zipFile.file_type.toLowerCase().includes('zip')) {
      toast.error('Please select a valid zip file');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fileService.unzipFile(zipFile.id, targetFolderId);
      if (response.success && response.data) {
        toast.success(`Extracted ${response.data.extractedFiles} files successfully!`);
        onClose();
        if (onComplete) onComplete();
      }
    } catch (error) {
      console.error('Error unzipping file:', error);
      toast.error('Failed to unzip file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = () => {
    if (mode === 'zip') {
      handleZip();
    } else {
      handleUnzip();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <i className={mode === 'zip' ? 'fas fa-file-archive' : 'fas fa-file-zipper'}></i>{' '}
            {mode === 'zip' ? 'Zip Files' : 'Unzip File'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          {mode === 'zip' ? (
            <>
              <div className="info-box">
                <i className="fas fa-info-circle"></i>
                <p>Selected {selectedFiles.length} file(s) to compress into a zip archive.</p>
              </div>

              <div className="selected-files-preview">
                <h4>Files to be zipped:</h4>
                <ul className="files-list">
                  {selectedFiles.map(file => (
                    <li key={file.id}>
                      <i className={fileService.getFileIcon(file.file_type)}></i>
                      <span>{file.name}</span>
                      <span className="file-size">{fileService.formatFileSize(file.file_size)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="form-group">
                <label htmlFor="zipName">Archive Name</label>
                <input
                  id="zipName"
                  type="text"
                  className="form-control"
                  value={zipName}
                  onChange={(e) => setZipName(e.target.value)}
                  placeholder="archive.zip"
                />
              </div>
            </>
          ) : (
            <>
              <div className="info-box">
                <i className="fas fa-info-circle"></i>
                <p>Extract files from the selected zip archive.</p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="file-info-box">
                  <i className={fileService.getFileIcon(selectedFiles[0].file_type)}></i>
                  <div>
                    <h4>{selectedFiles[0].name}</h4>
                    <p>{fileService.formatFileSize(selectedFiles[0].file_size)}</p>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="targetFolder">Extract to:</label>
                <select
                  id="targetFolder"
                  className="form-control"
                  value={targetFolderId || ''}
                  onChange={(e) => setTargetFolderId(Number(e.target.value) || undefined)}
                >
                  <option value="">Current Folder</option>
                  {/* Add folder options here if needed */}
                </select>
                <small>Files will be extracted to the selected folder</small>
              </div>

              <div className="warning-box">
                <i className="fas fa-exclamation-triangle"></i>
                <p>Existing files with the same name will be overwritten.</p>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={isProcessing || selectedFiles.length === 0}
          >
            {isProcessing ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Processing...
              </>
            ) : mode === 'zip' ? (
              <>
                <i className="fas fa-file-archive"></i> Create Zip
              </>
            ) : (
              <>
                <i className="fas fa-file-zipper"></i> Extract Files
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ZipUnzipModal;


import React, { useState, useEffect } from 'react';
import { fileService, FileItem } from '../services/fileService';
import toast from 'react-hot-toast';

interface FileSharingModalProps {
  file: FileItem | null;
  onClose: () => void;
}

interface ShareItem {
  id: number;
  email: string;
  permission: string;
  expiresAt: string;
  createdAt: string;
}

const FileSharingModal: React.FC<FileSharingModalProps> = ({ file, onClose }) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit' | 'comment'>('view');
  const [expiresIn, setExpiresIn] = useState('30'); // days
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [existingShares, setExistingShares] = useState<ShareItem[]>([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);

  useEffect(() => {
    if (file) {
      loadExistingShares();
    }
  }, [file]);

  const loadExistingShares = async () => {
    if (!file) return;

    setIsLoadingShares(true);
    try {
      const response = await fileService.getFileShares(file.id);
      if (response.success && response.data) {
        setExistingShares(response.data);
      }
    } catch (error) {
      console.error('Error loading shares:', error);
    } finally {
      setIsLoadingShares(false);
    }
  };

  const handleShare = async () => {
    if (!file) return;

    if (!email && !shareLink) {
      toast.error('Please enter an email address');
      return;
    }

    setIsSharing(true);
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + parseInt(expiresIn));

      const response = await fileService.shareFile(file.id, {
        email: email || undefined,
        permission,
        expiresAt: expirationDate.toISOString(),
        password: usePassword ? password : undefined,
      });

      if (response.success && response.data) {
        setShareLink(response.data.shareLink);
        toast.success('File shared successfully!');
        loadExistingShares();
        
        // Reset form
        setEmail('');
        setPassword('');
        setUsePassword(false);
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      toast.error('Failed to share file');
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevokeShare = async (shareId: number) => {
    if (!file) return;

    try {
      await fileService.revokeShare(file.id, shareId);
      toast.success('Share revoked successfully');
      loadExistingShares();
    } catch (error) {
      console.error('Error revoking share:', error);
      toast.error('Failed to revoke share');
    }
  };

  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast.success('Share link copied to clipboard!');
    }
  };

  if (!file) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <i className="fas fa-share-alt"></i> Share File
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
              <p>{fileService.formatFileSize(file.file_size)}</p>
            </div>
          </div>

          {shareLink && (
            <div className="share-link-box">
              <h4>Share Link Created!</h4>
              <div className="share-link-input">
                <input type="text" value={shareLink} readOnly />
                <button className="btn-primary" onClick={copyShareLink}>
                  <i className="fas fa-copy"></i> Copy
                </button>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Share with Email (Optional)</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <small>Leave empty to create a shareable link for anyone</small>
          </div>

          <div className="form-group">
            <label htmlFor="permission">Permission Level</label>
            <select
              id="permission"
              className="form-control"
              value={permission}
              onChange={(e) => setPermission(e.target.value as 'view' | 'edit' | 'comment')}
            >
              <option value="view">View Only</option>
              <option value="comment">Can Comment</option>
              <option value="edit">Can Edit</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="expiresIn">Expires In</label>
            <select
              id="expiresIn"
              className="form-control"
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
            >
              <option value="1">1 Day</option>
              <option value="7">7 Days</option>
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
              <option value="365">1 Year</option>
            </select>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={usePassword}
                onChange={(e) => setUsePassword(e.target.checked)}
              />
              <span>Password protect this share</span>
            </label>
          </div>

          {usePassword && (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          {existingShares.length > 0 && (
            <div className="existing-shares">
              <h4>Active Shares</h4>
              <div className="shares-list">
                {existingShares.map((share) => (
                  <div key={share.id} className="share-item">
                    <div className="share-info">
                      <i className="fas fa-user"></i>
                      <div>
                        <p className="share-email">{share.email}</p>
                        <p className="share-details">
                          <span className="share-permission">{share.permission}</span>
                          <span>Expires: {new Date(share.expiresAt).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      className="btn-danger-small"
                      onClick={() => handleRevokeShare(share.id)}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleShare}
            disabled={isSharing}
          >
            {isSharing ? (
              <><i className="fas fa-spinner fa-spin"></i> Sharing...</>
            ) : (
              <><i className="fas fa-share-alt"></i> Share File</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileSharingModal;


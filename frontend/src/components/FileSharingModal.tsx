import React, { useState, useEffect } from 'react';
import { fileService, FileItem, Folder } from '../services/fileService';
import toast from 'react-hot-toast';

interface FileSharingModalProps {
  file?: FileItem | null;
  folder?: Folder | null;
  onClose: () => void;
}

interface ShareItem {
  id: number;
  email: string;
  permission: string;
  expiresAt: string;
  createdAt: string;
  shareType?: string;
  shareLink?: string;
}

const FileSharingModal: React.FC<FileSharingModalProps> = ({ file, folder, onClose }) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit' | 'comment'>('view');
  const [expiresIn, setExpiresIn] = useState('30'); // days
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [existingShares, setExistingShares] = useState<ShareItem[]>([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);

  const isFolder = !!folder;
  const item = file || folder;
  const itemName = file?.name || folder?.name || '';
  const itemId = file?.id || folder?.id;

  useEffect(() => {
    if (itemId) {
      loadExistingShares();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, isFolder]);

  const loadExistingShares = async () => {
    if (!itemId) return;

    setIsLoadingShares(true);
    try {
      const response = isFolder 
        ? await fileService.getFolderShares(itemId)
        : await fileService.getFileShares(itemId);
      
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
    if (!itemId) return;

    if (!email && !shareLink) {
      // Creating a link share without email is allowed
    }

    setIsSharing(true);
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + parseInt(expiresIn));

      const shareData = {
        email: email || undefined,
        permission,
        expiresAt: expirationDate.toISOString(),
        password: usePassword ? password : undefined,
      };

      const response = isFolder
        ? await fileService.shareFolder(itemId, shareData)
        : await fileService.shareFile(itemId, shareData);

      if (response.success && response.data) {
        setShareLink(response.data.shareLink);
        toast.success(`${isFolder ? 'Folder' : 'File'} shared successfully!`);
        loadExistingShares();
        
        // Reset form
        setEmail('');
        setPassword('');
        setUsePassword(false);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error(`Failed to share ${isFolder ? 'folder' : 'file'}`);
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevokeShare = async (shareId: number) => {
    if (!itemId) return;

    try {
      if (isFolder) {
        await fileService.revokeFolderShare(itemId, shareId);
      } else {
        await fileService.revokeShare(itemId, shareId);
      }
      toast.success('Share revoked successfully');
      loadExistingShares();
    } catch (error) {
      console.error('Error revoking share:', error);
      toast.error('Failed to revoke share');
    }
  };

  const copyShareLink = (link?: string) => {
    const linkToCopy = link || shareLink;
    if (linkToCopy) {
      navigator.clipboard.writeText(linkToCopy);
      toast.success('Share link copied to clipboard!');
    }
  };

  if (!item) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <i className={isFolder ? "fas fa-folder" : "fas fa-share-alt"}></i> 
            {' '}Share {isFolder ? 'Folder' : 'File'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="file-info-box">
            <i className={isFolder ? "fas fa-folder" : fileService.getFileIcon(file?.file_type || '')}></i>
            <div>
              <h4>{itemName}</h4>
              {file && <p>{fileService.formatFileSize(file.file_size)}</p>}
              {folder && <p>Folder</p>}
            </div>
          </div>

          {shareLink && (
            <div className="share-link-box">
              <h4><i className="fas fa-check-circle" style={{ color: '#4caf50' }}></i> Share Link Created!</h4>
              <div className="share-link-input">
                <input type="text" value={shareLink} readOnly />
                <button className="btn-primary" onClick={() => copyShareLink()}>
                  <i className="fas fa-copy"></i> Copy
                </button>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              <i className="fas fa-envelope"></i> Share with Email (Optional)
            </label>
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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="permission">
                <i className="fas fa-shield-alt"></i> Permission Level
              </label>
              <select
                id="permission"
                className="form-control"
                value={permission}
                onChange={(e) => setPermission(e.target.value as 'view' | 'edit' | 'comment')}
              >
                <option value="view">👁️ View Only</option>
                <option value="comment">💬 Can Comment</option>
                <option value="edit">✏️ Can Edit</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="expiresIn">
                <i className="fas fa-clock"></i> Expires In
              </label>
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
                <option value="3650">Never (10 years)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={usePassword}
                onChange={(e) => setUsePassword(e.target.checked)}
              />
              <span><i className="fas fa-lock"></i> Password protect this share</span>
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

          {isLoadingShares ? (
            <div className="loading-shares">
              <i className="fas fa-spinner fa-spin"></i> Loading shares...
            </div>
          ) : existingShares.length > 0 && (
            <div className="existing-shares">
              <h4><i className="fas fa-users"></i> Active Shares ({existingShares.length})</h4>
              <div className="shares-list">
                {existingShares.map((share) => (
                  <div key={share.id} className="share-item">
                    <div className="share-info">
                      <div className="share-icon">
                        {share.email === 'Anyone with link' ? (
                          <i className="fas fa-link"></i>
                        ) : (
                          <i className="fas fa-user"></i>
                        )}
                      </div>
                      <div className="share-details">
                        <p className="share-email">{share.email}</p>
                        <p className="share-meta">
                          <span className={`permission-badge ${share.permission}`}>
                            {share.permission === 'view' && '👁️'}
                            {share.permission === 'comment' && '💬'}
                            {share.permission === 'edit' && '✏️'}
                            {' '}{share.permission}
                          </span>
                          {share.expiresAt && (
                            <span className="expires-date">
                              <i className="fas fa-calendar"></i>
                              {' '}Expires: {new Date(share.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="share-actions">
                      {(share as any).shareLink && (
                        <button
                          className="btn-icon"
                          onClick={() => copyShareLink((share as any).shareLink)}
                          title="Copy link"
                        >
                          <i className="fas fa-copy"></i>
                        </button>
                      )}
                      <button
                        className="btn-danger-small"
                        onClick={() => handleRevokeShare(share.id)}
                        title="Revoke share"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            <i className="fas fa-times"></i> Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleShare}
            disabled={isSharing}
          >
            {isSharing ? (
              <><i className="fas fa-spinner fa-spin"></i> Sharing...</>
            ) : (
              <><i className="fas fa-share-alt"></i> Create Share Link</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileSharingModal;

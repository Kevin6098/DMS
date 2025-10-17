// Dashboard JavaScript

// Global state
let currentView = 'my-drive';
let viewMode = 'grid';
let files = [];
let currentFolder = null;
let contextMenuFileId = null;
let touchStartTime = 0;
let touchTimer = null;
let sharedPeople = [];
let currentSharedFile = null;

// File type icons mapping
const fileTypeIcons = {
    'pdf': 'fas fa-file-pdf',
    'doc': 'fas fa-file-word',
    'docx': 'fas fa-file-word',
    'txt': 'fas fa-file-alt',
    'jpg': 'fas fa-file-image',
    'jpeg': 'fas fa-file-image',
    'png': 'fas fa-file-image',
    'gif': 'fas fa-file-image',
    'mp4': 'fas fa-file-video',
    'avi': 'fas fa-file-video',
    'zip': 'fas fa-file-archive',
    'rar': 'fas fa-file-archive',
    'folder': 'fas fa-folder'
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const user = sessionStorage.getItem('user');
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Display user info
    const userData = JSON.parse(user);
    document.querySelector('.user-avatar i').textContent = userData.name.charAt(0).toUpperCase();
    
    // Store user data globally
    window.currentUser = userData;
    
    // Load initial data
    loadFiles();
    setupEventListeners();
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
});

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', handleSearch);
    
    // Upload area drag and drop
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    fileInput.addEventListener('change', handleFileSelect);
    
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
    
    // Close context menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.context-menu') && !e.target.closest('.file-item')) {
            hideContextMenu();
        }
    });
    
    // Prevent default context menu on file items
    document.addEventListener('contextmenu', function(e) {
        if (e.target.closest('.file-item')) {
            e.preventDefault();
        }
    });
}

// Navigation functions (moved to mobile navigation section below)

function setViewMode(mode) {
    viewMode = mode;
    const fileGrid = document.getElementById('file-grid');
    
    // Update active view button
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update grid class
    if (mode === 'list') {
        fileGrid.classList.add('list-view');
    } else {
        fileGrid.classList.remove('list-view');
    }
}

function sortFiles() {
    const sortBy = document.getElementById('sort-select').value;
    
    files.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'date':
                return new Date(b.modified) - new Date(a.modified);
            case 'size':
                return b.size - a.size;
            default:
                return 0;
        }
    });
    
    renderFiles();
}

// File operations
function loadFiles() {
    // Simulate loading files from server
    // In a real app, this would be an API call
    setTimeout(() => {
        files = generateSampleFiles();
        renderFiles();
    }, 500);
}

function renderFiles() {
    const fileGrid = document.getElementById('file-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (files.length === 0) {
        fileGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    fileGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    fileGrid.innerHTML = files.map(file => createFileItem(file)).join('');
}

function createFileItem(file) {
    const icon = getFileIcon(file.type, file.isFolder);
    const size = file.isFolder ? '' : formatFileSize(file.size);
    const modified = formatDate(file.modified);
    
    return `
        <div class="file-item" 
             onclick="openFile('${file.id}')" 
             oncontextmenu="showContextMenu(event, '${file.id}')"
             ontouchstart="handleTouchStart(event, '${file.id}')"
             ontouchend="handleTouchEnd(event, '${file.id}')">
            <div class="file-icon">
                <i class="${icon}"></i>
            </div>
            <div class="file-name" title="${file.name}">${file.name}</div>
            <div class="file-meta">
                <span>${modified}</span>
                ${size ? `<span>${size}</span>` : ''}
            </div>
            <div class="file-actions">
                <button class="file-action-btn" onclick="event.stopPropagation(); shareFile('${file.id}')" title="Share">
                    <i class="fas fa-share-alt"></i>
                </button>
                <button class="file-action-btn" onclick="event.stopPropagation(); downloadFile('${file.id}')" title="Download">
                    <i class="fas fa-download"></i>
                </button>
                <button class="file-action-btn" onclick="event.stopPropagation(); deleteFile('${file.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function getFileIcon(type, isFolder) {
    if (isFolder) return 'fas fa-folder';
    
    const extension = type.toLowerCase();
    return fileTypeIcons[extension] || 'fas fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString();
}

// Modal functions
function showUploadModal() {
    document.getElementById('upload-modal').classList.add('active');
}

function hideUploadModal() {
    document.getElementById('upload-modal').classList.remove('active');
    document.getElementById('upload-list').innerHTML = '';
}

function showCreateFolderModal() {
    document.getElementById('create-folder-modal').classList.add('active');
    document.getElementById('folder-name').value = '';
}

function hideCreateFolderModal() {
    document.getElementById('create-folder-modal').classList.remove('active');
}

function showShareModal(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    currentSharedFile = file;
    document.getElementById('share-file-title').textContent = `Share '${file.name}'`;
    document.getElementById('share-link').value = `https://taskinsight.example.com/share/${fileId}`;
    
    // Initialize with current user as owner
    sharedPeople = [{
        id: 'current-user',
        name: window.currentUser.name,
        email: window.currentUser.email,
        role: 'Owner',
        avatar: window.currentUser.name.charAt(0).toUpperCase()
    }];
    
    renderPeopleList();
    document.getElementById('share-modal').classList.add('active');
}

function hideShareModal() {
    document.getElementById('share-modal').classList.remove('active');
}

// File operations
function openFile(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    if (file.isFolder) {
        // Navigate to folder
        currentFolder = fileId;
        loadFiles();
    } else {
        // Open file preview (in real app, this would open a preview modal)
        alert(`Opening ${file.name}`);
    }
}

function shareFile(fileId) {
    showShareModal(fileId);
}

function downloadFile(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    // Simulate download
    const link = document.createElement('a');
    link.href = '#';
    link.download = file.name;
    link.click();
    
    // Show notification
    showNotification(`${file.name} download started`);
}

function deleteFile(fileId) {
    if (confirm('Are you sure you want to delete this file?')) {
        files = files.filter(f => f.id !== fileId);
        renderFiles();
        showNotification('File deleted');
    }
}

function createFolder() {
    const name = document.getElementById('folder-name').value.trim();
    if (!name) return;
    
    const newFolder = {
        id: 'folder-' + Date.now(),
        name: name,
        type: 'folder',
        isFolder: true,
        size: 0,
        modified: new Date().toISOString(),
        created: new Date().toISOString()
    };
    
    files.unshift(newFolder);
    renderFiles();
    hideCreateFolderModal();
    showNotification(`Folder "${name}" created`);
}

// Upload functions
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    handleFiles(files);
}

function handleFiles(fileList) {
    const uploadList = document.getElementById('upload-list');
    
    fileList.forEach(file => {
        const uploadItem = createUploadItem(file);
        uploadList.appendChild(uploadItem);
        
        // Simulate upload progress
        simulateUpload(file, uploadItem);
    });
}

function createUploadItem(file) {
    const item = document.createElement('div');
    item.className = 'upload-item';
    item.innerHTML = `
        <i class="fas fa-file upload-item-icon"></i>
        <div class="upload-item-info">
            <div class="upload-item-name">${file.name}</div>
            <div class="upload-item-size">${formatFileSize(file.size)}</div>
            <div class="upload-progress">
                <div class="upload-progress-bar" style="width: 0%"></div>
            </div>
        </div>
    `;
    return item;
}

function simulateUpload(file, uploadItem) {
    const progressBar = uploadItem.querySelector('.upload-progress-bar');
    let progress = 0;
    
    const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress > 100) progress = 100;
        
        progressBar.style.width = progress + '%';
        
        if (progress >= 100) {
            clearInterval(interval);
            
            // Add file to files array
            const newFile = {
                id: 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                name: file.name,
                type: file.name.split('.').pop(),
                isFolder: false,
                size: file.size,
                modified: new Date().toISOString(),
                created: new Date().toISOString()
            };
            
            files.unshift(newFile);
            renderFiles();
            showNotification(`${file.name} uploaded successfully`);
        }
    }, 200);
}

function uploadFiles() {
    // This would trigger the actual upload in a real app
    showNotification('Files uploaded successfully');
    hideUploadModal();
}

// Utility functions
function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    
    if (!query) {
        loadFiles();
        return;
    }
    
    const filteredFiles = files.filter(file => 
        file.name.toLowerCase().includes(query)
    );
    
    // Temporarily replace files array for rendering
    const originalFiles = files;
    files = filteredFiles;
    renderFiles();
    files = originalFiles;
}

function copyShareLink() {
    const shareLink = document.getElementById('share-link');
    shareLink.select();
    document.execCommand('copy');
    showNotification('Share link copied to clipboard');
}

// Enhanced Share Modal Functions
function addPeople() {
    const input = document.getElementById('add-people-input');
    const email = input.value.trim();
    
    if (!email) {
        showNotification('Please enter an email address');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address');
        return;
    }
    
    // Check if person already exists
    if (sharedPeople.some(person => person.email === email)) {
        showNotification('This person already has access');
        return;
    }
    
    // Add new person
    const newPerson = {
        id: 'person-' + Date.now(),
        name: email.split('@')[0], // Use email prefix as name
        email: email,
        role: 'Viewer',
        avatar: email.charAt(0).toUpperCase()
    };
    
    sharedPeople.push(newPerson);
    renderPeopleList();
    input.value = '';
    showNotification(`Added ${newPerson.name} to the file`);
}

function renderPeopleList() {
    const peopleList = document.getElementById('people-list');
    
    peopleList.innerHTML = sharedPeople.map(person => `
        <div class="person-item">
            <div class="person-avatar">${person.avatar}</div>
            <div class="person-info">
                <div class="person-name">${person.name} ${person.id === 'current-user' ? '(you)' : ''}</div>
                <div class="person-email">${person.email}</div>
            </div>
            <div class="person-actions">
                ${person.id !== 'current-user' ? `
                    <select class="role-select" onchange="updatePersonRole('${person.id}', this.value)">
                        <option value="Viewer" ${person.role === 'Viewer' ? 'selected' : ''}>Viewer</option>
                        <option value="Editor" ${person.role === 'Editor' ? 'selected' : ''}>Editor</option>
                        <option value="Commenter" ${person.role === 'Commenter' ? 'selected' : ''}>Commenter</option>
                    </select>
                    <button class="remove-person" onclick="removePerson('${person.id}')" title="Remove access">
                        <i class="fas fa-times"></i>
                    </button>
                ` : `
                    <span class="person-role">${person.role}</span>
                `}
            </div>
        </div>
    `).join('');
}

function updatePersonRole(personId, newRole) {
    const person = sharedPeople.find(p => p.id === personId);
    if (person) {
        person.role = newRole;
        showNotification(`Changed ${person.name}'s role to ${newRole}`);
    }
}

function removePerson(personId) {
    const person = sharedPeople.find(p => p.id === personId);
    if (person && confirm(`Remove ${person.name}'s access to this file?`)) {
        sharedPeople = sharedPeople.filter(p => p.id !== personId);
        renderPeopleList();
        showNotification(`Removed ${person.name}'s access`);
    }
}

function updateGeneralAccess() {
    const access = document.getElementById('general-access').value;
    const description = document.getElementById('access-description');
    
    switch (access) {
        case 'restricted':
            description.textContent = 'Only people with access can open with the link';
            break;
        case 'anyone':
            description.textContent = 'Anyone on the internet with the link can view';
            break;
        case 'organization':
            description.textContent = 'Anyone in your organization with the link can view';
            break;
    }
}

function showShareHelp() {
    alert('Share Help:\n\n• Add people by entering their email addresses\n• Set roles: Viewer (read-only), Editor (can edit), Commenter (can comment)\n• Use General access to control who can access the link\n• Copy the share link to send to others');
}

function showShareSettings() {
    alert('Share Settings:\n\n• Notification settings\n• Link expiration\n• Download permissions\n• Advanced sharing options\n\n(These features will be available in future updates)');
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.classList.toggle('show');
}

function showUserSettings() {
    const modal = document.getElementById('user-settings-modal');
    const userData = window.currentUser;
    
    // Populate user information
    document.getElementById('org-name-display').textContent = userData.organizationName || 'N/A';
    document.getElementById('user-role-display').textContent = userData.role || 'member';
    document.getElementById('user-email-display').textContent = userData.email;
    
    // Show admin settings if user is admin
    const adminSettings = document.getElementById('admin-settings');
    if (userData.role === 'admin') {
        adminSettings.style.display = 'block';
        loadInvitationCodes();
    } else {
        adminSettings.style.display = 'none';
    }
    
    // Close user dropdown and show modal
    document.getElementById('user-dropdown').classList.remove('show');
    modal.classList.add('active');
}

function hideUserSettings() {
    document.getElementById('user-settings-modal').classList.remove('active');
}

function generateNewInvites() {
    const count = parseInt(document.getElementById('invite-count').value);
    if (!count || count < 1) {
        showNotification('Please enter a valid number of invitations');
        return;
    }
    
    const userData = window.currentUser;
    const orgId = userData.organizationId;
    
    // Generate new invitation codes
    const newCodes = generateInvitationCodes(orgId, count);
    
    // Get current organization data
    const orgData = JSON.parse(localStorage.getItem('organization_' + orgId));
    if (orgData) {
        // Add new codes to existing ones
        orgData.invitationCodes = [...(orgData.invitationCodes || []), ...newCodes];
        localStorage.setItem('organization_' + orgId, JSON.stringify(orgData));
        
        // Reload invitation codes display
        loadInvitationCodes();
        
        showNotification(`Generated ${count} new invitation codes`);
    }
}

function loadInvitationCodes() {
    const userData = window.currentUser;
    const orgId = userData.organizationId;
    const orgData = JSON.parse(localStorage.getItem('organization_' + orgId));
    
    const codesList = document.getElementById('invitation-codes-list');
    
    if (!orgData || !orgData.invitationCodes || orgData.invitationCodes.length === 0) {
        codesList.innerHTML = '<p style="color: #5f6368; font-style: italic;">No active invitation codes</p>';
        return;
    }
    
    codesList.innerHTML = orgData.invitationCodes.map(code => `
        <div class="invitation-code-item">
            <span class="invitation-code">${code}</span>
            <button class="copy-btn" onclick="copyInvitationCode('${code}')">
                <i class="fas fa-copy"></i>
                Copy
            </button>
        </div>
    `).join('');
}

function copyInvitationCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        showNotification('Invitation code copied to clipboard');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Invitation code copied to clipboard');
    });
}

function logout() {
    sessionStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Mobile Navigation Functions
function toggleMobileNav() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-nav-overlay');
    
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('show');
    
    // Prevent body scroll when menu is open
    if (sidebar.classList.contains('mobile-open')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

function closeMobileNav() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-nav-overlay');
    
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
}

// Close mobile nav when clicking on nav items
function showView(viewName) {
    // Close mobile nav on mobile devices
    if (window.innerWidth <= 768) {
        closeMobileNav();
    }
    
    currentView = viewName;
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update breadcrumb
    document.getElementById('current-path').textContent = 
        viewName === 'my-drive' ? 'My Drive' :
        viewName === 'shared' ? 'Shared with me' :
        viewName === 'recent' ? 'Recent' :
        viewName === 'starred' ? 'Starred' :
        viewName === 'trash' ? 'Trash' : 'My Drive';
    
    loadFiles();
}

function handleResize() {
    // Close mobile nav if window is resized to desktop size
    if (window.innerWidth > 768) {
        closeMobileNav();
    }
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1a73e8;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 1001;
        font-size: 14px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Helper function for generating invitation codes (shared with auth.js)
function generateInvitationCodes(orgId, count) {
    const codes = [];
    for (let i = 0; i < count; i++) {
        const code = orgId.substring(0, 4).toUpperCase() + '-' + 
                    Math.random().toString(36).substr(2, 6).toUpperCase();
        codes.push(code);
    }
    return codes;
}

// Context Menu Functions
function showContextMenu(event, fileId) {
    event.preventDefault();
    event.stopPropagation();
    
    contextMenuFileId = fileId;
    const contextMenu = document.getElementById('context-menu');
    
    // Position the context menu
    const x = event.clientX;
    const y = event.clientY;
    
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
    contextMenu.classList.add('show');
    
    // Adjust position if menu goes off screen
    const rect = contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        contextMenu.style.left = (x - rect.width) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
        contextMenu.style.top = (y - rect.height) + 'px';
    }
}

function hideContextMenu() {
    const contextMenu = document.getElementById('context-menu');
    contextMenu.classList.remove('show');
    contextMenuFileId = null;
}

// Touch handling for mobile long press
function handleTouchStart(event, fileId) {
    touchStartTime = Date.now();
    contextMenuFileId = fileId;
    
    touchTimer = setTimeout(() => {
        showContextMenu(event, fileId);
    }, 500); // 500ms long press
}

function handleTouchEnd(event, fileId) {
    if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
    }
    
    const touchDuration = Date.now() - touchStartTime;
    if (touchDuration < 500) {
        // Short tap - open file
        openFile(fileId);
    }
}

// Context menu actions
function openWithFile() {
    if (!contextMenuFileId) return;
    
    const file = files.find(f => f.id === contextMenuFileId);
    if (file) {
        showNotification(`Opening ${file.name} with default application`);
    }
    hideContextMenu();
}

function downloadContextFile() {
    if (!contextMenuFileId) return;
    
    const file = files.find(f => f.id === contextMenuFileId);
    if (file) {
        downloadFile(contextMenuFileId);
    }
    hideContextMenu();
}

function renameContextFile() {
    if (!contextMenuFileId) return;
    
    const file = files.find(f => f.id === contextMenuFileId);
    if (file) {
        const newName = prompt('Enter new name:', file.name);
        if (newName && newName !== file.name) {
            file.name = newName;
            renderFiles();
            showNotification(`Renamed to ${newName}`);
        }
    }
    hideContextMenu();
}

function copyContextFile() {
    if (!contextMenuFileId) return;
    
    const file = files.find(f => f.id === contextMenuFileId);
    if (file) {
        const copyFile = {
            ...file,
            id: 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            name: file.name + ' (Copy)',
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        };
        
        files.unshift(copyFile);
        renderFiles();
        showNotification(`Created copy of ${file.name}`);
    }
    hideContextMenu();
}

function shareContextFile() {
    if (!contextMenuFileId) return;
    
    const file = files.find(f => f.id === contextMenuFileId);
    if (file) {
        shareFile(contextMenuFileId);
    }
    hideContextMenu();
}

function organizeContextFile() {
    if (!contextMenuFileId) return;
    
    const file = files.find(f => f.id === contextMenuFileId);
    if (file) {
        showNotification(`Organize ${file.name} - Feature coming soon`);
    }
    hideContextMenu();
}

function showFileInfo() {
    if (!contextMenuFileId) return;
    
    const file = files.find(f => f.id === contextMenuFileId);
    if (file) {
        const info = `
File Information:
Name: ${file.name}
Type: ${file.type}
Size: ${file.isFolder ? 'Folder' : formatFileSize(file.size)}
Created: ${new Date(file.created).toLocaleString()}
Modified: ${new Date(file.modified).toLocaleString()}
        `;
        alert(info);
    }
    hideContextMenu();
}

function deleteContextFile() {
    if (!contextMenuFileId) return;
    
    const file = files.find(f => f.id === contextMenuFileId);
    if (file && confirm(`Are you sure you want to move "${file.name}" to trash?`)) {
        deleteFile(contextMenuFileId);
    }
    hideContextMenu();
}

// Sample data generator
function generateSampleFiles() {
    return [
        {
            id: 'folder-1',
            name: 'Documents',
            type: 'folder',
            isFolder: true,
            size: 0,
            modified: new Date(Date.now() - 86400000).toISOString(),
            created: new Date(Date.now() - 2592000000).toISOString()
        },
        {
            id: 'file-1',
            name: 'Project Proposal.pdf',
            type: 'pdf',
            isFolder: false,
            size: 2048576,
            modified: new Date(Date.now() - 172800000).toISOString(),
            created: new Date(Date.now() - 172800000).toISOString()
        },
        {
            id: 'file-2',
            name: 'Meeting Notes.docx',
            type: 'docx',
            isFolder: false,
            size: 1536000,
            modified: new Date(Date.now() - 345600000).toISOString(),
            created: new Date(Date.now() - 345600000).toISOString()
        },
        {
            id: 'file-3',
            name: 'Budget 2024.xlsx',
            type: 'xlsx',
            isFolder: false,
            size: 3072000,
            modified: new Date(Date.now() - 432000000).toISOString(),
            created: new Date(Date.now() - 432000000).toISOString()
        },
        {
            id: 'folder-2',
            name: 'Images',
            type: 'folder',
            isFolder: true,
            size: 0,
            modified: new Date(Date.now() - 604800000).toISOString(),
            created: new Date(Date.now() - 604800000).toISOString()
        },
        {
            id: 'file-4',
            name: 'Company Logo.png',
            type: 'png',
            isFolder: false,
            size: 512000,
            modified: new Date(Date.now() - 691200000).toISOString(),
            created: new Date(Date.now() - 691200000).toISOString()
        }
    ];
}

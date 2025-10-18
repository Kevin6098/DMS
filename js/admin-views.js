// Admin Views Manager - Dynamically loads content for each section

function switchView(viewName) {
    // Hide all views
    document.querySelectorAll('.admin-view').forEach(view => {
        view.classList.remove('active');
    });

    // Show selected view
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.add('active');
        
        // Load view content if not already loaded
        if (targetView.children.length === 0 || targetView.getAttribute('data-loaded') !== 'true') {
            loadViewContent(viewName, targetView);
            targetView.setAttribute('data-loaded', 'true');
        }
    }
}

function loadViewContent(viewName, container) {
    let content = '';
    
    switch(viewName) {
        case 'overview':
            // Overview is already loaded in HTML
            break;
            
        case 'organizations':
            content = getOrganizationsContent();
            break;
            
        case 'users':
            content = getUsersContent();
            break;
            
        case 'invitations':
            content = getInvitationsContent();
            break;
            
        case 'storage':
            content = getStorageContent();
            break;
            
        case 'audit-logs':
            content = getAuditLogsContent();
            break;
    }
    
    if (content) {
        container.innerHTML = content;
    }
}

// Organizations View Content
function getOrganizationsContent() {
    return `
        <div class="admin-section">
            <div class="section-header">
                <h2>
                    <i class="fas fa-building"></i>
                    Organization Management
                </h2>
                <div class="section-actions">
                    <button class="btn-secondary" onclick="exportOrganizations()">
                        <i class="fas fa-download"></i>
                        Export
                    </button>
                    <button class="btn-primary" onclick="showAddOrganizationModal()">
                        <i class="fas fa-plus"></i>
                        Add Organization
                    </button>
                </div>
            </div>

            <div class="filters-bar">
                <div class="filter-group">
                    <label>Status:</label>
                    <select id="org-status-filter">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Sort By:</label>
                    <select id="org-sort-filter">
                        <option value="name">Name</option>
                        <option value="members">Members</option>
                        <option value="storage">Storage</option>
                        <option value="date">Date Created</option>
                    </select>
                </div>
            </div>

            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th><input type="checkbox"></th>
                            <th>Organization</th>
                            <th>Admin</th>
                            <th>Members</th>
                            <th>Storage</th>
                            <th>Created</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><input type="checkbox"></td>
                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar-small" style="background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);">AC</div>
                                    <span class="user-name">Acme Corporation</span>
                                </div>
                            </td>
                            <td>john@acme.com</td>
                            <td>45</td>
                            <td>
                                <div class="storage-progress">
                                    <span>500 GB / 1 TB</span>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 50%;"></div>
                                    </div>
                                </div>
                            </td>
                            <td>Jan 15, 2024</td>
                            <td><span class="status-badge active">Active</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-icon" onclick="viewOrganization(1)" title="View">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn-icon" onclick="editOrganization(1)" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-icon" onclick="deleteOrganization(1)" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td><input type="checkbox"></td>
                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar-small" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">TS</div>
                                    <span class="user-name">Tech Solutions Inc</span>
                                </div>
                            </td>
                            <td>bob@techsolutions.com</td>
                            <td>23</td>
                            <td>
                                <div class="storage-progress">
                                    <span>200 GB / 500 GB</span>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 40%;"></div>
                                    </div>
                                </div>
                            </td>
                            <td>Jan 10, 2024</td>
                            <td><span class="status-badge active">Active</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-icon" onclick="viewOrganization(2)" title="View">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn-icon" onclick="editOrganization(2)" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-icon" onclick="deleteOrganization(2)" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td><input type="checkbox"></td>
                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar-small" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">GI</div>
                                    <span class="user-name">Global Industries</span>
                                </div>
                            </td>
                            <td>admin@global.com</td>
                            <td>78</td>
                            <td>
                                <div class="storage-progress">
                                    <span>1.2 TB / 2 TB</span>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 60%;"></div>
                                    </div>
                                </div>
                            </td>
                            <td>Jan 12, 2024</td>
                            <td><span class="status-badge active">Active</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-icon" onclick="viewOrganization(3)" title="View">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn-icon" onclick="editOrganization(3)" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-icon" onclick="deleteOrganization(3)" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="pagination">
                <div class="pagination-info">
                    Showing 1-3 of 25 organizations
                </div>
                <div class="pagination-controls">
                    <button class="btn-secondary" disabled>
                        <i class="fas fa-chevron-left"></i>
                        Previous
                    </button>
                    <button class="btn-secondary">1</button>
                    <button class="btn-secondary">2</button>
                    <button class="btn-secondary">3</button>
                    <button class="btn-secondary">
                        Next
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Users View Content
function getUsersContent() {
    return `
        <div class="admin-section">
            <div class="section-header">
                <h2>
                    <i class="fas fa-users"></i>
                    User Management
                </h2>
                <div class="section-actions">
                    <button class="btn-secondary" onclick="exportUsers()">
                        <i class="fas fa-download"></i>
                        Export
                    </button>
                    <button class="btn-primary" onclick="showAddUserModal()">
                        <i class="fas fa-user-plus"></i>
                        Add User
                    </button>
                </div>
            </div>

            <div class="filters-bar">
                <div class="filter-group">
                    <label>Organization:</label>
                    <select id="org-filter">
                        <option value="">All Organizations</option>
                        <option value="1">Acme Corporation</option>
                        <option value="2">Tech Solutions Inc</option>
                        <option value="3">Global Industries</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Role:</label>
                    <select id="role-filter">
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Status:</label>
                    <select id="status-filter">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th><input type="checkbox" id="select-all"></th>
                            <th>User</th>
                            <th>Email</th>
                            <th>Organization</th>
                            <th>Role</th>
                            <th>Last Login</th>
                            <th>Storage Used</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><input type="checkbox" class="user-checkbox"></td>
                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar-small">JD</div>
                                    <span class="user-name">John Doe</span>
                                </div>
                            </td>
                            <td>john.doe@acme.com</td>
                            <td>Acme Corporation</td>
                            <td><span class="badge badge-admin">Admin</span></td>
                            <td>2 hours ago</td>
                            <td>1.2 GB</td>
                            <td><span class="status-badge active">Active</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-icon" onclick="viewUser(1)" title="View">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn-icon" onclick="editUser(1)" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-icon" onclick="deleteUser(1)" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td><input type="checkbox" class="user-checkbox"></td>
                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar-small">JS</div>
                                    <span class="user-name">Jane Smith</span>
                                </div>
                            </td>
                            <td>jane.smith@acme.com</td>
                            <td>Acme Corporation</td>
                            <td><span class="badge badge-member">Member</span></td>
                            <td>1 day ago</td>
                            <td>850 MB</td>
                            <td><span class="status-badge active">Active</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-icon" onclick="viewUser(2)" title="View">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn-icon" onclick="editUser(2)" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-icon" onclick="deleteUser(2)" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="pagination">
                <div class="pagination-info">
                    Showing 1-2 of 1,250 users
                </div>
                <div class="pagination-controls">
                    <button class="btn-secondary" disabled>
                        <i class="fas fa-chevron-left"></i>
                        Previous
                    </button>
                    <button class="btn-secondary">1</button>
                    <button class="btn-secondary">2</button>
                    <button class="btn-secondary">
                        Next
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Invitations View Content
function getInvitationsContent() {
    return `
        <div class="admin-section">
            <div class="section-header">
                <h2>
                    <i class="fas fa-ticket-alt"></i>
                    Invitation Management
                </h2>
                <div class="section-actions">
                    <button class="btn-secondary" onclick="exportInvitations()">
                        <i class="fas fa-download"></i>
                        Export
                    </button>
                    <button class="btn-primary" onclick="showGenerateInvitationsModal()">
                        <i class="fas fa-plus"></i>
                        Generate Codes
                    </button>
                </div>
            </div>

            <div class="filters-bar">
                <div class="filter-group">
                    <label>Organization:</label>
                    <select id="invitation-org-filter">
                        <option value="">All Organizations</option>
                        <option value="1">Acme Corporation</option>
                        <option value="2">Tech Solutions Inc</option>
                        <option value="3">Global Industries</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Status:</label>
                    <select id="invitation-status-filter">
                        <option value="">All Status</option>
                        <option value="unused">Unused</option>
                        <option value="used">Used</option>
                        <option value="expired">Expired</option>
                    </select>
                </div>
            </div>

            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th><input type="checkbox"></th>
                            <th>Invitation Code</th>
                            <th>Organization</th>
                            <th>Generated By</th>
                            <th>Created</th>
                            <th>Expires</th>
                            <th>Used By</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><input type="checkbox"></td>
                            <td>
                                <span class="code-badge">ORG-ABC123</span>
                                <button class="btn-icon" onclick="copyCode('ORG-ABC123')" title="Copy">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </td>
                            <td>Acme Corporation</td>
                            <td>Platform Owner</td>
                            <td>Jan 15, 2024</td>
                            <td>Feb 15, 2024</td>
                            <td>-</td>
                            <td><span class="status-badge active">Unused</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-icon" onclick="revokeInvitation(1)" title="Revoke">
                                        <i class="fas fa-ban"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td><input type="checkbox"></td>
                            <td>
                                <span class="code-badge">ORG-DEF456</span>
                                <button class="btn-icon" onclick="copyCode('ORG-DEF456')" title="Copy">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </td>
                            <td>Tech Solutions Inc</td>
                            <td>Platform Owner</td>
                            <td>Jan 10, 2024</td>
                            <td>Feb 10, 2024</td>
                            <td>John Doe</td>
                            <td><span class="status-badge inactive">Used</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-icon" onclick="viewInvitationDetails(2)" title="View">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td><input type="checkbox"></td>
                            <td>
                                <span class="code-badge">ORG-GHI789</span>
                                <button class="btn-icon" onclick="copyCode('ORG-GHI789')" title="Copy">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </td>
                            <td>Global Industries</td>
                            <td>Platform Owner</td>
                            <td>Dec 01, 2023</td>
                            <td>Jan 01, 2024</td>
                            <td>-</td>
                            <td><span class="status-badge" style="background: #fce8e6; color: #c5221f;">Expired</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-icon" onclick="deleteInvitation(3)" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="pagination">
                <div class="pagination-info">
                    Showing 1-3 of 150 invitation codes
                </div>
                <div class="pagination-controls">
                    <button class="btn-secondary" disabled>
                        <i class="fas fa-chevron-left"></i>
                        Previous
                    </button>
                    <button class="btn-secondary">1</button>
                    <button class="btn-secondary">2</button>
                    <button class="btn-secondary">
                        Next
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Storage View Content
function getStorageContent() {
    return `
        <div class="admin-section" style="margin-bottom: 24px;">
            <div class="section-header">
                <h2>
                    <i class="fas fa-hdd"></i>
                    Storage Overview
                </h2>
            </div>
            <div style="padding: 32px;">
                <div class="storage-overview-grid">
                    <div class="storage-card">
                        <h3>Total Storage</h3>
                        <div class="storage-chart">
                            <div class="circular-progress" style="--progress: 25;">
                                <span>25%</span>
                            </div>
                        </div>
                        <p class="storage-details">2.5 TB / 10 TB Used</p>
                    </div>
                    <div class="storage-breakdown">
                        <h3>Storage by Organization</h3>
                        <div class="storage-item">
                            <div class="storage-item-info">
                                <span class="storage-item-name">Global Industries</span>
                                <span class="storage-item-size">1.2 TB</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 60%; background: linear-gradient(90deg, #ff6b35 0%, #ff8c42 100%);"></div>
                            </div>
                        </div>
                        <div class="storage-item">
                            <div class="storage-item-info">
                                <span class="storage-item-name">Acme Corporation</span>
                                <span class="storage-item-size">800 GB</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 40%; background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);"></div>
                            </div>
                        </div>
                        <div class="storage-item">
                            <div class="storage-item-info">
                                <span class="storage-item-name">Tech Solutions Inc</span>
                                <span class="storage-item-size">500 GB</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 25%; background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="admin-section">
            <div class="section-header">
                <h2>
                    <i class="fas fa-folder"></i>
                    Storage by Organization
                </h2>
                <div class="section-actions">
                    <button class="btn-secondary" onclick="exportStorageReport()">
                        <i class="fas fa-download"></i>
                        Export Report
                    </button>
                </div>
            </div>

            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Organization</th>
                            <th>Storage Used</th>
                            <th>Storage Quota</th>
                            <th>Usage %</th>
                            <th>Files</th>
                            <th>Average File Size</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar-small" style="background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);">GI</div>
                                    <span class="user-name">Global Industries</span>
                                </div>
                            </td>
                            <td>1.2 TB</td>
                            <td>2 TB</td>
                            <td>
                                <div class="storage-progress">
                                    <span>60%</span>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 60%; background: #43e97b;"></div>
                                    </div>
                                </div>
                            </td>
                            <td>5,245</td>
                            <td>245 MB</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-icon" onclick="viewStorageDetails(1)" title="View Details">
                                        <i class="fas fa-chart-pie"></i>
                                    </button>
                                    <button class="btn-icon" onclick="adjustQuota(1)" title="Adjust Quota">
                                        <i class="fas fa-sliders-h"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar-small" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">AC</div>
                                    <span class="user-name">Acme Corporation</span>
                                </div>
                            </td>
                            <td>800 GB</td>
                            <td>1 TB</td>
                            <td>
                                <div class="storage-progress">
                                    <span>80%</span>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 80%; background: #ffa726;"></div>
                                    </div>
                                </div>
                            </td>
                            <td>3,890</td>
                            <td>210 MB</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-icon" onclick="viewStorageDetails(2)" title="View Details">
                                        <i class="fas fa-chart-pie"></i>
                                    </button>
                                    <button class="btn-icon" onclick="adjustQuota(2)" title="Adjust Quota">
                                        <i class="fas fa-sliders-h"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar-small" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">TS</div>
                                    <span class="user-name">Tech Solutions Inc</span>
                                </div>
                            </td>
                            <td>500 GB</td>
                            <td>1 TB</td>
                            <td>
                                <div class="storage-progress">
                                    <span>50%</span>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 50%; background: #43e97b;"></div>
                                    </div>
                                </div>
                            </td>
                            <td>2,156</td>
                            <td>235 MB</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-icon" onclick="viewStorageDetails(3)" title="View Details">
                                        <i class="fas fa-chart-pie"></i>
                                    </button>
                                    <button class="btn-icon" onclick="adjustQuota(3)" title="Adjust Quota">
                                        <i class="fas fa-sliders-h"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Audit Logs View Content
function getAuditLogsContent() {
    return `
        <div class="admin-section">
            <div class="section-header">
                <h2>
                    <i class="fas fa-history"></i>
                    Audit Logs
                </h2>
                <div class="section-actions">
                    <button class="btn-secondary" onclick="exportLogs()">
                        <i class="fas fa-download"></i>
                        Export Logs
                    </button>
                    <button class="btn-secondary" onclick="clearOldLogs()">
                        <i class="fas fa-trash"></i>
                        Clear Old Logs
                    </button>
                </div>
            </div>

            <div class="filters-bar">
                <div class="filter-group">
                    <label>Action Type:</label>
                    <select id="log-action-filter">
                        <option value="">All Actions</option>
                        <option value="create">Create</option>
                        <option value="update">Update</option>
                        <option value="delete">Delete</option>
                        <option value="login">Login</option>
                        <option value="upload">Upload</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Resource:</label>
                    <select id="log-resource-filter">
                        <option value="">All Resources</option>
                        <option value="user">User</option>
                        <option value="organization">Organization</option>
                        <option value="file">File</option>
                        <option value="folder">Folder</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Date Range:</label>
                    <select id="log-date-filter">
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="all">All Time</option>
                    </select>
                </div>
            </div>

            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Action</th>
                            <th>Resource</th>
                            <th>User</th>
                            <th>IP Address</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <div>
                                    <strong>Jan 20, 2024</strong><br>
                                    <small style="color: #5f6368;">14:32:15</small>
                                </div>
                            </td>
                            <td><span class="badge" style="background: #e8f0fe; color: #1a73e8;">CREATE</span></td>
                            <td>
                                <div>
                                    <strong>Organization</strong><br>
                                    <small style="color: #5f6368;">Global Industries</small>
                                </div>
                            </td>
                            <td>Platform Owner</td>
                            <td>192.168.1.1</td>
                            <td>
                                <button class="btn-icon" onclick="viewLogDetails(1)" title="View Details">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div>
                                    <strong>Jan 20, 2024</strong><br>
                                    <small style="color: #5f6368;">10:15:42</small>
                                </div>
                            </td>
                            <td><span class="badge" style="background: #e6f4ea; color: #137333;">UPDATE</span></td>
                            <td>
                                <div>
                                    <strong>User</strong><br>
                                    <small style="color: #5f6368;">john.doe@acme.com</small>
                                </div>
                            </td>
                            <td>John Doe</td>
                            <td>192.168.1.50</td>
                            <td>
                                <button class="btn-icon" onclick="viewLogDetails(2)" title="View Details">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div>
                                    <strong>Jan 19, 2024</strong><br>
                                    <small style="color: #5f6368;">16:45:30</small>
                                </div>
                            </td>
                            <td><span class="badge" style="background: #fff4e5; color: #e37400;">UPLOAD</span></td>
                            <td>
                                <div>
                                    <strong>File</strong><br>
                                    <small style="color: #5f6368;">report_2024.pdf</small>
                                </div>
                            </td>
                            <td>Jane Smith</td>
                            <td>192.168.1.75</td>
                            <td>
                                <button class="btn-icon" onclick="viewLogDetails(3)" title="View Details">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div>
                                    <strong>Jan 19, 2024</strong><br>
                                    <small style="color: #5f6368;">09:20:15</small>
                                </div>
                            </td>
                            <td><span class="badge" style="background: #43e97b; color: #fff;">LOGIN</span></td>
                            <td>
                                <div>
                                    <strong>System</strong><br>
                                    <small style="color: #5f6368;">Admin Panel</small>
                                </div>
                            </td>
                            <td>Platform Owner</td>
                            <td>192.168.1.1</td>
                            <td>
                                <button class="btn-icon" onclick="viewLogDetails(4)" title="View Details">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div>
                                    <strong>Jan 18, 2024</strong><br>
                                    <small style="color: #5f6368;">18:55:22</small>
                                </div>
                            </td>
                            <td><span class="badge" style="background: #fce8e6; color: #c5221f;">DELETE</span></td>
                            <td>
                                <div>
                                    <strong>File</strong><br>
                                    <small style="color: #5f6368;">old_document.docx</small>
                                </div>
                            </td>
                            <td>Bob Johnson</td>
                            <td>192.168.1.90</td>
                            <td>
                                <button class="btn-icon" onclick="viewLogDetails(5)" title="View Details">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="pagination">
                <div class="pagination-info">
                    Showing 1-5 of 15,750 log entries
                </div>
                <div class="pagination-controls">
                    <button class="btn-secondary" disabled>
                        <i class="fas fa-chevron-left"></i>
                        Previous
                    </button>
                    <button class="btn-secondary">1</button>
                    <button class="btn-secondary">2</button>
                    <button class="btn-secondary">3</button>
                    <button class="btn-secondary">...</button>
                    <button class="btn-secondary">
                        Next
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Placeholder functions for interactions
function showAddOrganizationModal() { alert('Add Organization modal - Coming soon!'); }
function editOrganization(id) { alert(`Edit organization ${id}`); }
function viewOrganization(id) { alert(`View organization ${id}`); }
function deleteOrganization(id) { if(confirm('Delete organization?')) alert(`Deleted organization ${id}`); }
function exportOrganizations() { alert('Exporting organizations...'); }

function showGenerateInvitationsModal() { alert('Generate Invitations modal - Coming soon!'); }
function copyCode(code) { alert(`Copied code: ${code}`); }
function revokeInvitation(id) { if(confirm('Revoke invitation?')) alert(`Revoked invitation ${id}`); }
function viewInvitationDetails(id) { alert(`View invitation ${id}`); }
function deleteInvitation(id) { if(confirm('Delete invitation?')) alert(`Deleted invitation ${id}`); }
function exportInvitations() { alert('Exporting invitations...'); }

function exportStorageReport() { alert('Exporting storage report...'); }
function viewStorageDetails(id) { alert(`View storage details for org ${id}`); }
function adjustQuota(id) { alert(`Adjust quota for org ${id}`); }

function exportLogs() { alert('Exporting audit logs...'); }
function clearOldLogs() { if(confirm('Clear logs older than 90 days?')) alert('Old logs cleared'); }
function viewLogDetails(id) { alert(`View log details ${id}`); }


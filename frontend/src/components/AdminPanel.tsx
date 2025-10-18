import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Organization {
  id: string;
  name: string;
  domain: string;
  members: number;
  storage: string;
  status: 'active' | 'inactive';
  created: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: 'admin' | 'member';
  status: 'active' | 'inactive';
  lastActive: string;
}

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('overview');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [showEditOrgModal, setShowEditOrgModal] = useState(false);
  const [showViewOrgModal, setShowViewOrgModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showGenerateInvitesModal, setShowGenerateInvitesModal] = useState(false);

  const [organizations] = useState<Organization[]>([
    {
      id: '1',
      name: 'Acme Corporation',
      domain: 'acme.com',
      members: 45,
      storage: '500 GB / 1 TB',
      status: 'active',
      created: 'Jan 15, 2024'
    },
    {
      id: '2',
      name: 'Tech Solutions Inc',
      domain: 'techsolutions.com',
      members: 23,
      storage: '200 GB / 500 GB',
      status: 'active',
      created: 'Feb 1, 2024'
    }
  ]);

  const [users] = useState<User[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john@acme.com',
      organization: 'Acme Corporation',
      role: 'admin',
      status: 'active',
      lastActive: '2 hours ago'
    },
    {
      id: '2',
      name: 'Jane Doe',
      email: 'jane@acme.com',
      organization: 'Acme Corporation',
      role: 'member',
      status: 'active',
      lastActive: '1 day ago'
    }
  ]);

  useEffect(() => {
    // Check admin authentication
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) {
      navigate('/');
    }
  }, [navigate]);

  const switchView = (view: string) => {
    setCurrentView(view);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const adminLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('adminUser');
      navigate('/');
      toast.success('Logged out successfully');
    }
  };

  const createOrganization = () => {
    const orgName = (document.getElementById('org-name') as HTMLInputElement)?.value;
    const adminName = (document.getElementById('admin-name') as HTMLInputElement)?.value;
    const adminEmail = (document.getElementById('admin-email') as HTMLInputElement)?.value;
    const adminPassword = (document.getElementById('admin-password') as HTMLInputElement)?.value;
    const adminConfirmPassword = (document.getElementById('admin-confirm-password') as HTMLInputElement)?.value;

    if (!orgName || !adminName || !adminEmail || !adminPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (adminPassword !== adminConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    toast.success(`Organization "${orgName}" created successfully!`);
    setShowAddOrgModal(false);
  };

  const updateOrganization = () => {
    const orgName = (document.getElementById('edit-org-name') as HTMLInputElement)?.value;
    const storageQuota = (document.getElementById('edit-storage-quota') as HTMLInputElement)?.value;

    if (!orgName || !storageQuota) {
      toast.error('Please fill in all required fields');
      return;
    }

    toast.success(`Organization "${orgName}" updated successfully!`);
    setShowEditOrgModal(false);
  };

  const createUser = () => {
    const userName = (document.getElementById('user-name') as HTMLInputElement)?.value;
    const userEmail = (document.getElementById('user-email') as HTMLInputElement)?.value;
    const userPassword = (document.getElementById('user-password') as HTMLInputElement)?.value;
    const userConfirmPassword = (document.getElementById('user-confirm-password') as HTMLInputElement)?.value;

    if (!userName || !userEmail || !userPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (userPassword !== userConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    toast.success(`User "${userName}" created successfully!`);
    setShowAddUserModal(false);
  };

  const generateInvitationCodes = () => {
    const organization = (document.getElementById('invitation-org') as HTMLSelectElement)?.value;
    const count = (document.getElementById('invitation-count') as HTMLInputElement)?.value;

    if (!organization || !count) {
      toast.error('Please fill in all required fields');
      return;
    }

    const codes = ['ORG-ABC123', 'ORG-DEF456', 'ORG-GHI789', 'ORG-JKL012', 'ORG-MNO345'];
    toast.success(`Generated ${count} invitation codes: ${codes.slice(0, parseInt(count)).join(', ')}`);
    setShowGenerateInvitesModal(false);
  };

  const renderOverview = () => (
    <div className="overview-content">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-building"></i>
          </div>
          <div className="stat-content">
            <h3>3</h3>
            <p>Organizations</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <h3>68</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-hdd"></i>
          </div>
          <div className="stat-content">
            <h3>1.2 TB</h3>
            <p>Storage Used</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-ticket-alt"></i>
          </div>
          <div className="stat-content">
            <h3>12</h3>
            <p>Active Invitations</p>
          </div>
        </div>
      </div>

      <div className="overview-grid">
        <div className="overview-card">
          <h3>Recent Activity</h3>
          <div className="activity-timeline">
            <div className="timeline-item">
              <div className="timeline-icon">
                <i className="fas fa-user-plus"></i>
              </div>
              <div className="timeline-content">
                <p><strong>New user joined</strong> - Jane Smith joined Acme Corporation</p>
                <small>2 hours ago</small>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-icon">
                <i className="fas fa-building"></i>
              </div>
              <div className="timeline-content">
                <p><strong>Organization created</strong> - Tech Solutions Inc</p>
                <small>1 day ago</small>
              </div>
            </div>
          </div>
        </div>

        <div className="overview-card">
          <h3>System Health</h3>
          <div className="health-grid">
            <div className="health-item">
              <div className="health-label">Server Status</div>
              <div className="health-value success">Online</div>
            </div>
            <div className="health-item">
              <div className="health-label">Database</div>
              <div className="health-value success">Healthy</div>
            </div>
            <div className="health-item">
              <div className="health-label">Storage</div>
              <div className="health-value warning">75% Used</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrganizations = () => (
    <div className="organizations-content">
      <div className="content-header">
        <h2>Organizations</h2>
        <button className="btn-primary" onClick={() => setShowAddOrgModal(true)}>
          <i className="fas fa-plus"></i>
          Add Organization
        </button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Organization</th>
              <th>Domain</th>
              <th>Members</th>
              <th>Storage</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org) => (
              <tr key={org.id}>
                <td>
                  <div className="org-info">
                    <div className="org-avatar">AC</div>
                    <div>
                      <div className="org-name">{org.name}</div>
                    </div>
                  </div>
                </td>
                <td>{org.domain}</td>
                <td>{org.members}</td>
                <td>{org.storage}</td>
                <td>
                  <span className={`status-badge ${org.status}`}>{org.status}</span>
                </td>
                <td>{org.created}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" onClick={() => setShowViewOrgModal(true)} title="View">
                      <i className="fas fa-eye"></i>
                    </button>
                    <button className="btn-icon" onClick={() => setShowEditOrgModal(true)} title="Edit">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn-icon danger" onClick={() => toast.success('Organization deleted')} title="Delete">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="users-content">
      <div className="content-header">
        <h2>Users</h2>
        <button className="btn-primary" onClick={() => setShowAddUserModal(true)}>
          <i className="fas fa-plus"></i>
          Add User
        </button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Organization</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar-small">JS</div>
                    <div className="user-name">{user.name}</div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>{user.organization}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>{user.role}</span>
                </td>
                <td>
                  <span className={`status-badge ${user.status}`}>{user.status}</span>
                </td>
                <td>{user.lastActive}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" title="Edit">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn-icon danger" title="Delete">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInvitations = () => (
    <div className="invitations-content">
      <div className="content-header">
        <h2>Invitations</h2>
        <button className="btn-primary" onClick={() => setShowGenerateInvitesModal(true)}>
          <i className="fas fa-plus"></i>
          Generate Codes
        </button>
      </div>
      <div className="invitation-cards">
        <div className="invitation-card">
          <div className="invitation-header">
            <div className="invitation-code">ORG-ABC123</div>
            <div className="invitation-status active">Active</div>
          </div>
          <div className="invitation-details">
            <p><strong>Organization:</strong> Acme Corporation</p>
            <p><strong>Generated:</strong> Jan 15, 2024</p>
            <p><strong>Expires:</strong> Feb 15, 2024</p>
            <p><strong>Used:</strong> No</p>
          </div>
          <div className="invitation-actions">
            <button className="btn-secondary" onClick={() => toast.success('Code copied')}>
              <i className="fas fa-copy"></i>
              Copy
            </button>
            <button className="btn-icon danger" onClick={() => toast.success('Invitation revoked')}>
              <i className="fas fa-ban"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStorage = () => (
    <div className="storage-content">
      <div className="storage-overview">
        <div className="storage-card">
          <h3>Total Storage Usage</h3>
          <div className="storage-stats">
            <div className="storage-used">1.2 TB</div>
            <div className="storage-total">of 2.5 TB</div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '48%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAuditLogs = () => (
    <div className="audit-content">
      <div className="content-header">
        <h2>Audit Logs</h2>
        <div className="filter-controls">
          <select>
            <option>All Events</option>
            <option>User Actions</option>
            <option>System Events</option>
          </select>
          <input type="date" />
          <button className="btn-secondary">Export</button>
        </div>
      </div>
      <div className="audit-timeline">
        <div className="audit-item">
          <div className="audit-icon">
            <i className="fas fa-user-plus"></i>
          </div>
          <div className="audit-content">
            <div className="audit-title">User Created</div>
            <div className="audit-description">New user "Jane Smith" was created in Acme Corporation</div>
            <div className="audit-meta">
              <span className="audit-user">System Admin</span>
              <span className="audit-time">2 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <i className="fas fa-shield-alt"></i>
          <h1>Task Insight Admin Panel</h1>
        </div>
        <div className="header-center">
          <div className="search-container">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search users, organizations..." id="search-input" />
          </div>
        </div>
        <div className="header-right">
          <div className="user-menu">
            <button className="user-avatar" onClick={toggleUserMenu}>
              <i className="fas fa-user-shield"></i>
            </button>
            <div className={`user-dropdown ${showUserMenu ? 'active' : ''}`}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8eaed' }}>
                <strong style={{ fontSize: '14px', color: '#202124' }}>Platform Owner</strong>
                <p style={{ fontSize: '12px', color: '#5f6368', margin: '4px 0 0 0' }}>owner@taskinsight.com</p>
              </div>
              <a href="/dashboard">
                <i className="fas fa-home"></i>
                Go to Dashboard
              </a>
              <a href="#" onClick={adminLogout}>
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
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <button 
              className={`nav-item ${currentView === 'overview' ? 'active' : ''}`} 
              onClick={() => switchView('overview')}
            >
              <i className="fas fa-chart-pie"></i>
              <span>Overview</span>
            </button>
            <button 
              className={`nav-item ${currentView === 'organizations' ? 'active' : ''}`} 
              onClick={() => switchView('organizations')}
            >
              <i className="fas fa-building"></i>
              <span>Organizations</span>
            </button>
            <button 
              className={`nav-item ${currentView === 'users' ? 'active' : ''}`} 
              onClick={() => switchView('users')}
            >
              <i className="fas fa-users"></i>
              <span>Users</span>
            </button>
            <button 
              className={`nav-item ${currentView === 'invitations' ? 'active' : ''}`} 
              onClick={() => switchView('invitations')}
            >
              <i className="fas fa-ticket-alt"></i>
              <span>Invitations</span>
            </button>
            <button 
              className={`nav-item ${currentView === 'storage' ? 'active' : ''}`} 
              onClick={() => switchView('storage')}
            >
              <i className="fas fa-hdd"></i>
              <span>Storage</span>
            </button>
            <button 
              className={`nav-item ${currentView === 'audit' ? 'active' : ''}`} 
              onClick={() => switchView('audit')}
            >
              <i className="fas fa-clipboard-list"></i>
              <span>Audit Logs</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {currentView === 'overview' && renderOverview()}
          {currentView === 'organizations' && renderOrganizations()}
          {currentView === 'users' && renderUsers()}
          {currentView === 'invitations' && renderInvitations()}
          {currentView === 'storage' && renderStorage()}
          {currentView === 'audit' && renderAuditLogs()}
        </main>
      </div>

      {/* Add Organization Modal */}
      {showAddOrgModal && (
        <div className="modal active">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h3>
                <i className="fas fa-building"></i>
                Add New Organization
              </h3>
              <button className="modal-close" onClick={() => setShowAddOrgModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <form id="add-organization-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="org-name">Organization Name *</label>
                    <input type="text" id="org-name" placeholder="Enter organization name" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="org-domain">Domain (Optional)</label>
                    <input type="text" id="org-domain" placeholder="company.com" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="admin-name">Admin Full Name *</label>
                    <input type="text" id="admin-name" placeholder="Enter admin name" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="admin-email">Admin Email *</label>
                    <input type="email" id="admin-email" placeholder="admin@company.com" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="admin-password">Admin Password *</label>
                    <input type="password" id="admin-password" placeholder="Enter password" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="admin-confirm-password">Confirm Password *</label>
                    <input type="password" id="admin-confirm-password" placeholder="Confirm password" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="storage-quota">Storage Quota (GB) *</label>
                    <input type="number" id="storage-quota" defaultValue="1000" min="1" max="10000" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="max-users">Max Users</label>
                    <input type="number" id="max-users" defaultValue="100" min="1" max="1000" />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="org-description">Description</label>
                  <textarea id="org-description" placeholder="Enter organization description" rows={3}></textarea>
                </div>
                <div className="form-group">
                  <label>
                    <input type="checkbox" id="org-active" defaultChecked />
                    Organization Active
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    <input type="checkbox" id="send-welcome-email" defaultChecked />
                    Send welcome email to admin
                  </label>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddOrgModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={createOrganization}>
                <i className="fas fa-plus"></i>
                Create Organization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="modal active">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h3>
                <i className="fas fa-user-plus"></i>
                Add New User
              </h3>
              <button className="modal-close" onClick={() => setShowAddUserModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <form id="add-user-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="user-name">Full Name *</label>
                    <input type="text" id="user-name" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="user-email">Email *</label>
                    <input type="email" id="user-email" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="user-password">Password *</label>
                    <input type="password" id="user-password" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="user-confirm-password">Confirm Password *</label>
                    <input type="password" id="user-confirm-password" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="user-organization">Organization *</label>
                    <select id="user-organization" required>
                      <option value="">Select Organization</option>
                      <option value="1">Acme Corporation</option>
                      <option value="2">Tech Solutions Inc</option>
                      <option value="3">Global Industries</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="user-role">Role *</label>
                    <select id="user-role" required>
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>
                    <input type="checkbox" id="user-active" defaultChecked />
                    Account Active
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    <input type="checkbox" id="user-send-email" />
                    Send welcome email to user
                  </label>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddUserModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={createUser}>
                <i className="fas fa-plus"></i>
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Invitations Modal */}
      {showGenerateInvitesModal && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <i className="fas fa-ticket-alt"></i>
                Generate Invitation Codes
              </h3>
              <button className="modal-close" onClick={() => setShowGenerateInvitesModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <form id="generate-invitations-form">
                <div className="form-group">
                  <label htmlFor="invitation-org">Organization *</label>
                  <select id="invitation-org" required>
                    <option value="">Select Organization</option>
                    <option value="1" selected>Acme Corporation</option>
                    <option value="2">Tech Solutions Inc</option>
                    <option value="3">Global Industries</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="invitation-count">Number of Codes *</label>
                    <input type="number" id="invitation-count" defaultValue="5" min="1" max="50" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="invitation-expiry">Expiry Days</label>
                    <input type="number" id="invitation-expiry" defaultValue="30" min="1" max="365" />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="invitation-purpose">Purpose (Optional)</label>
                  <input type="text" id="invitation-purpose" placeholder="e.g., New team members, Client access" />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowGenerateInvitesModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={generateInvitationCodes}>
                <i className="fas fa-plus"></i>
                Generate Codes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

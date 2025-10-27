import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminService, DashboardStats, ActivityItem, Invitation, StorageAnalytics } from '../services/adminService';
import { organizationService, Organization } from '../services/organizationService';
import { userService } from '../services/userService';
import { User } from '../services/authService';
import { auditService, AuditLog } from '../services/auditService';
import toast from 'react-hot-toast';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isPlatformOwner } = useAuth();
  
  const [currentView, setCurrentView] = useState('overview');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [showGenerateInvitesModal, setShowGenerateInvitesModal] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [storageAnalytics, setStorageAnalytics] = useState<StorageAnalytics | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  

  // Redirect if not platform owner
  useEffect(() => {
    if (!isPlatformOwner()) {
      navigate('/dashboard');
    }
  }, [isPlatformOwner, navigate]);

  // Load initial data - run only once
  useEffect(() => {
    if (isPlatformOwner() && !hasLoadedInitialData &&
        process.env.REACT_APP_OFFLINE_MODE !== 'true' && 
        process.env.REACT_APP_DISABLE_API_CALLS !== 'true') {
      setHasLoadedInitialData(true);
      loadDashboardData();
    }
  }, [isPlatformOwner(), hasLoadedInitialData]); // Call the function to get the boolean value

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, orgsRes, usersRes, invitesRes, activitiesRes, storageRes] = await Promise.all([
        adminService.getDashboardStats(),
        organizationService.getOrganizations(1, 10),
        userService.getUsers(1, 10),
        adminService.getInvitations(1, 10),
        adminService.getActivityTimeline(1, 20),
        adminService.getStorageAnalytics(),
      ]);

      if (statsRes.success && statsRes.data) setDashboardStats(statsRes.data);
      if (orgsRes.success && orgsRes.data) {
        setOrganizations(orgsRes.data.data);
        setTotalPages(orgsRes.data.pagination.pages);
      }
      if (usersRes.success && usersRes.data) setUsers(usersRes.data.data);
      if (invitesRes.success && invitesRes.data) setInvitations(invitesRes.data.data);
      if (activitiesRes.success && activitiesRes.data) setActivities(activitiesRes.data.data);
      if (storageRes.success && storageRes.data) setStorageAnalytics(storageRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await auditService.getAuditLogs(1, 20);
      if (response.success && response.data) {
        setAuditLogs(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load audit logs');
    }
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    if (view === 'audit-logs') {
      loadAuditLogs();
    }
  };

  const handleCreateOrganization = async () => {
    const orgName = (document.getElementById('org-name') as HTMLInputElement)?.value;
    const orgDescription = (document.getElementById('org-description') as HTMLInputElement)?.value;
    const storageQuota = parseInt((document.getElementById('storage-quota') as HTMLInputElement)?.value || '107374182400');

    if (!orgName) {
      toast.error('Please enter organization name');
      return;
    }

    try {
      const response = await organizationService.createOrganization({
        name: orgName,
        description: orgDescription,
        storageQuota,
      });

      if (response.success) {
        toast.success('Organization created successfully!');
        setShowAddOrgModal(false);
        loadDashboardData();
      }
    } catch (error) {
      toast.error('Failed to create organization');
    }
  };

  const handleGenerateInvitation = async () => {
    const orgId = parseInt((document.getElementById('invite-org') as HTMLSelectElement)?.value || '1');
    const role = (document.getElementById('invite-role') as HTMLSelectElement)?.value || 'member';
    const expiresInDays = parseInt((document.getElementById('expires-in') as HTMLInputElement)?.value || '30');

    try {
      const response = await adminService.generateInvitation({
        organizationId: orgId,
        role: role as 'organization_admin' | 'member',
        expiresInDays,
      });

      if (response.success && response.data) {
        toast.success(`Invitation code generated: ${response.data.code}`);
        setShowGenerateInvitesModal(false);
        loadDashboardData();
      }
    } catch (error) {
      toast.error('Failed to generate invitation');
    }
  };

  const handleDeleteInvitation = async (invitationId: number) => {
    if (window.confirm('Are you sure you want to delete this invitation?')) {
      try {
        await adminService.deleteInvitation(invitationId);
        toast.success('Invitation deleted successfully!');
        loadDashboardData();
      } catch (error) {
        toast.error('Failed to delete invitation');
      }
    }
  };

  const handleDeleteOrganization = async (orgId: number) => {
    if (window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      try {
        await organizationService.deleteOrganization(orgId);
        toast.success('Organization deleted successfully!');
        loadDashboardData();
      } catch (error) {
        toast.error('Failed to delete organization');
      }
    }
  };

  const handleExportAuditLogs = async () => {
    try {
      await auditService.exportAuditLogs();
      toast.success('Audit logs exported successfully!');
    } catch (error) {
      toast.error('Failed to export audit logs');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  if (!isPlatformOwner()) {
    return <div>Access denied. You must be a platform owner to access this panel.</div>;
  }

  return (
    <div className="admin-panel">
      {/* Header */}
      <header className="admin-header">
        <div className="header-left">
          <div className="logo">
            <i className="fas fa-shield-alt"></i>
            <span>Task Insight Admin</span>
          </div>
        </div>
        <div className="header-right">
          <div className="user-menu">
            <button className="user-avatar" onClick={() => setShowUserMenu(!showUserMenu)}>
              <img src="/api/placeholder/40/40" alt="Admin" />
            </button>
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-info">
                  <h4>{user?.firstName} {user?.lastName}</h4>
                  <p>{user?.email}</p>
                </div>
                <button onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="admin-content">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <nav className="admin-nav">
            <button 
              className={`nav-item ${currentView === 'overview' ? 'active' : ''}`}
              onClick={() => handleViewChange('overview')}
            >
              <i className="fas fa-tachometer-alt"></i>
              <span>Overview</span>
            </button>
            <button 
              className={`nav-item ${currentView === 'organizations' ? 'active' : ''}`}
              onClick={() => handleViewChange('organizations')}
            >
              <i className="fas fa-building"></i>
              <span>Organizations</span>
            </button>
            <button 
              className={`nav-item ${currentView === 'users' ? 'active' : ''}`}
              onClick={() => handleViewChange('users')}
            >
              <i className="fas fa-users"></i>
              <span>Users</span>
            </button>
            <button 
              className={`nav-item ${currentView === 'invitations' ? 'active' : ''}`}
              onClick={() => handleViewChange('invitations')}
            >
              <i className="fas fa-envelope"></i>
              <span>Invitations</span>
            </button>
            <button 
              className={`nav-item ${currentView === 'activity' ? 'active' : ''}`}
              onClick={() => handleViewChange('activity')}
            >
              <i className="fas fa-history"></i>
              <span>Activity</span>
            </button>
            <button 
              className={`nav-item ${currentView === 'audit-logs' ? 'active' : ''}`}
              onClick={() => handleViewChange('audit-logs')}
            >
              <i className="fas fa-clipboard-list"></i>
              <span>Audit Logs</span>
            </button>
            <button 
              className={`nav-item ${currentView === 'storage' ? 'active' : ''}`}
              onClick={() => handleViewChange('storage')}
            >
              <i className="fas fa-hdd"></i>
              <span>Storage</span>
            </button>
            <button 
              className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
              onClick={() => handleViewChange('settings')}
            >
              <i className="fas fa-cog"></i>
              <span>Settings</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="admin-main">
          {isLoading ? (
            <div className="loading">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading...</p>
            </div>
          ) : (
            <>
              {/* Overview */}
              {currentView === 'overview' && dashboardStats && (
                <div className="overview-section">
                  <h2>Platform Overview</h2>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon">
                        <i className="fas fa-building"></i>
                      </div>
                      <div className="stat-content">
                        <h3>{dashboardStats.platformStats.active_organizations}</h3>
                        <p>Active Organizations</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">
                        <i className="fas fa-users"></i>
                      </div>
                      <div className="stat-content">
                        <h3>{dashboardStats.platformStats.active_users}</h3>
                        <p>Active Users</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">
                        <i className="fas fa-file"></i>
                      </div>
                      <div className="stat-content">
                        <h3>{dashboardStats.platformStats.total_files}</h3>
                        <p>Total Files</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">
                        <i className="fas fa-hdd"></i>
                      </div>
                      <div className="stat-content">
                        <h3>{Math.round(dashboardStats.platformStats.total_storage_used / 1024 / 1024 / 1024)} GB</h3>
                        <p>Storage Used</p>
                      </div>
                    </div>
                  </div>

                  <div className="recent-activity">
                    <h3>Recent Activity</h3>
                    <div className="activity-list">
                      {activities.slice(0, 10).map((activity, index) => (
                        <div key={index} className="activity-item">
                          <div className="activity-icon">
                            <i className={auditService.getActionIcon(activity.action)}></i>
                          </div>
                          <div className="activity-content">
                            <p>
                              <strong>{activity.first_name} {activity.last_name}</strong> 
                              {' '}{auditService.formatAction(activity.action).toLowerCase()} 
                              {' '}{auditService.formatResourceType(activity.resource_type).toLowerCase()}
                            </p>
                            <span>{auditService.getRelativeTime(activity.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Organizations */}
              {currentView === 'organizations' && (
                <div className="organizations-section">
                  <div className="section-header">
                    <h2>Organizations</h2>
                    <button className="btn-primary" onClick={() => setShowAddOrgModal(true)}>
                      <i className="fas fa-plus"></i> Add Organization
                    </button>
                  </div>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
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
                                <strong>{org.name}</strong>
                                {org.description && <p>{org.description}</p>}
                              </div>
                            </td>
                            <td>{org.userCount}</td>
                            <td>
                              <div className="storage-info">
                                <span>{Math.round(org.storageUsed / 1024 / 1024)} MB</span>
                                <div className="storage-bar">
                                  <div 
                                    className="storage-used" 
                                    style={{ 
                                      width: `${(org.storageUsed / org.storageQuota) * 100}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`status-badge ${org.status}`}>
                                {org.status}
                              </span>
                            </td>
                            <td>{new Date(org.created_at).toLocaleDateString()}</td>
                            <td>
                              <button 
                                className="btn-danger btn-sm"
                                onClick={() => handleDeleteOrganization(org.id)}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Users */}
              {currentView === 'users' && (
                <div className="users-section">
                  <div className="section-header">
                    <h2>Users</h2>
                  </div>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Organization</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Last Login</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td>{user.firstName} {user.lastName}</td>
                            <td>{user.email}</td>
                            <td>{user.organizationName}</td>
                            <td>
                              <span className={`role-badge ${user.role}`}>
                                {user.role.replace('_', ' ')}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge ${user.status}`}>
                                {user.status}
                              </span>
                            </td>
                            <td>{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Invitations */}
              {currentView === 'invitations' && (
                <div className="invitations-section">
                  <div className="section-header">
                    <h2>Invitations</h2>
                    <button className="btn-primary" onClick={() => setShowGenerateInvitesModal(true)}>
                      <i className="fas fa-plus"></i> Generate Invitation
                    </button>
                  </div>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Organization</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Expires</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invitations.map((invitation) => (
                          <tr key={invitation.id}>
                            <td>
                              <code className="invitation-code">{invitation.code}</code>
                            </td>
                            <td>{invitation.organization_name}</td>
                            <td>
                              <span className={`role-badge ${invitation.role}`}>
                                {invitation.role.replace('_', ' ')}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge ${invitation.status}`}>
                                {invitation.status}
                              </span>
                            </td>
                            <td>{new Date(invitation.expires_at).toLocaleDateString()}</td>
                            <td>
                              <button 
                                className="btn-danger btn-sm"
                                onClick={() => handleDeleteInvitation(invitation.id)}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Audit Logs */}
              {currentView === 'audit-logs' && (
                <div className="audit-logs-section">
                  <div className="section-header">
                    <h2>Audit Logs</h2>
                    <button className="btn-secondary" onClick={handleExportAuditLogs}>
                      <i className="fas fa-download"></i> Export
                    </button>
                  </div>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>User</th>
                          <th>Action</th>
                          <th>Resource</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log) => (
                          <tr key={log.id}>
                            <td>{auditService.formatDate(log.created_at)}</td>
                            <td>{log.first_name} {log.last_name}</td>
                            <td>
                              <span className="action-badge">
                                <i className={auditService.getActionIcon(log.action)}></i>
                                {auditService.formatAction(log.action)}
                              </span>
                            </td>
                            <td>{auditService.formatResourceType(log.resource_type)}</td>
                            <td>{log.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Storage Analytics */}
              {currentView === 'storage' && storageAnalytics && (
                <div className="storage-section">
                  <h2>Storage Analytics</h2>
                  <div className="storage-overview">
                    <div className="storage-stats">
                      <div className="stat-item">
                        <h3>{storageAnalytics.overview.total_organizations}</h3>
                        <p>Total Organizations</p>
                      </div>
                      <div className="stat-item">
                        <h3>{Math.round(storageAnalytics.overview.total_used_bytes / 1024 / 1024 / 1024)} GB</h3>
                        <p>Total Storage Used</p>
                      </div>
                      <div className="stat-item">
                        <h3>{storageAnalytics.overview.usage_percentage.toFixed(1)}%</h3>
                        <p>Usage Percentage</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Add Organization Modal */}
      {showAddOrgModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Organization</h3>
              <button onClick={() => setShowAddOrgModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="org-name">Organization Name</label>
                <input type="text" id="org-name" required />
              </div>
              <div className="form-group">
                <label htmlFor="org-description">Description</label>
                <textarea id="org-description" rows={3}></textarea>
              </div>
              <div className="form-group">
                <label htmlFor="storage-quota">Storage Quota (bytes)</label>
                <input type="number" id="storage-quota" defaultValue="107374182400" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddOrgModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleCreateOrganization}>
                Create Organization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Invitation Modal */}
      {showGenerateInvitesModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Generate Invitation</h3>
              <button onClick={() => setShowGenerateInvitesModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="invite-org">Organization</label>
                <select id="invite-org">
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="invite-role">Role</label>
                <select id="invite-role">
                  <option value="member">Member</option>
                  <option value="organization_admin">Organization Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="expires-in">Expires in (days)</label>
                <input type="number" id="expires-in" defaultValue="30" min="1" max="365" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowGenerateInvitesModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleGenerateInvitation}>
                Generate Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
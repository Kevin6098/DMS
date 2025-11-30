import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminService, DashboardStats, ActivityItem, StorageAnalytics } from '../services/adminService';
import { organizationService, Organization } from '../services/organizationService';
import { userService } from '../services/userService';
import { User } from '../services/authService';
import { auditService, AuditLog } from '../services/auditService';
import toast from 'react-hot-toast';
import '../styles/admin.css';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ tab?: string }>();
  const { user, logout, isPlatformOwner } = useAuth();
  
  // Get current view from URL or default to 'overview'
  const getCurrentView = () => {
    if (params.tab) return params.tab;
    if (location.pathname === '/admin') return 'overview';
    return 'overview';
  };
  
  const [currentView, setCurrentView] = useState(getCurrentView());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [storageAnalytics, setStorageAnalytics] = useState<StorageAnalytics | null>(null);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  
  // User filters
  const [userFilters, setUserFilters] = useState<{
    search?: string;
    organizationId?: number;
    role?: string;
    status?: string;
  }>({});
  

  // Check if user is platform owner
  const isOwner = isPlatformOwner();

  // Redirect if not platform owner
  useEffect(() => {
    if (!isOwner) {
      navigate('/dashboard');
    }
  }, [isOwner, navigate]);

  // Load initial data - run only once
  useEffect(() => {
    if (isOwner && !hasLoadedInitialData &&
        process.env.REACT_APP_OFFLINE_MODE !== 'true' && 
        process.env.REACT_APP_DISABLE_API_CALLS !== 'true') {
      setHasLoadedInitialData(true);
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, hasLoadedInitialData]); // loadDashboardData is stable

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, orgsRes, activitiesRes, storageRes] = await Promise.all([
        adminService.getDashboardStats(),
        organizationService.getOrganizations(1, 100), // Load all for filter dropdown
        adminService.getActivityTimeline(1, 20),
        adminService.getStorageAnalytics(),
      ]);

      // Handle dashboard stats
      if (statsRes.success && statsRes.data) {
        setDashboardStats(statsRes.data);
      } else {
        console.error('Dashboard stats error:', statsRes);
      }

      // Handle organizations - PaginationResponse has 'data' property
      if (orgsRes.success && orgsRes.data) {
        const orgsData = orgsRes.data.data || [];
        setOrganizations(Array.isArray(orgsData) ? orgsData : []);
        console.log('Organizations loaded:', orgsData.length);
      } else {
        console.error('Organizations error:', orgsRes);
        setOrganizations([]);
      }

      // Handle activities - PaginationResponse has 'data' property
      if (activitiesRes.success && activitiesRes.data) {
        const activitiesData = activitiesRes.data.data || [];
        setActivities(Array.isArray(activitiesData) ? activitiesData : []);
        console.log('Activities loaded:', activitiesData.length);
      } else {
        console.error('Activities error:', activitiesRes);
        setActivities([]);
      }

      // Handle storage analytics
      if (storageRes.success && storageRes.data) {
        setStorageAnalytics(storageRes.data);
      } else {
        console.error('Storage analytics error:', storageRes);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await auditService.getAuditLogs(1, 20);
      if (response.success && response.data) {
        setAuditLogs(response.data.data || []);
      }
    } catch (error) {
      toast.error('Failed to load audit logs');
    }
  };

  // Load users when filters change
  useEffect(() => {
    if (currentView === 'users') {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFilters, currentView]);

  // Sync currentView with URL
  useEffect(() => {
    const view = getCurrentView();
    setCurrentView(view);
    if (view === 'audit-logs') {
      loadAuditLogs();
    } else if (view === 'users') {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, params.tab]);

  const handleViewChange = (view: string) => {
    navigate(`/admin/${view}`);
    setCurrentView(view);
    if (view === 'audit-logs') {
      loadAuditLogs();
    }
  };

  const handleCreateOrganization = async () => {
    const orgName = (document.getElementById('org-name') as HTMLInputElement)?.value;
    const orgDescription = (document.getElementById('org-description') as HTMLInputElement)?.value;
    const storageQuota = parseInt((document.getElementById('storage-quota') as HTMLInputElement)?.value || '5368709120');

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

  const handleGenerateInvitationForOrg = async (orgId: number) => {
    try {
      const response = await adminService.generateInvitation({
        organizationId: orgId,
        role: 'member',
        expiresInDays: 365, // 1 year expiration
      });

      if (response.success && response.data) {
        toast.success(`Invitation code generated: ${response.data.code}`);
        loadDashboardData();
      } else {
        toast.error(response.message || 'Failed to generate invitation');
      }
    } catch (error: any) {
      console.error('Generate invitation error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate invitation');
    }
  };

  const handleRegenerateInvitation = async (orgId: number, invitationId?: number) => {
    if (window.confirm('Are you sure you want to regenerate the invitation code? The old code will be cancelled.')) {
      try {
        // Delete old invitation if exists
        if (invitationId) {
          await adminService.deleteInvitation(invitationId);
        }
        // Generate new invitation
        await handleGenerateInvitationForOrg(orgId);
      } catch (error: any) {
        console.error('Regenerate invitation error:', error);
        toast.error(error.response?.data?.message || 'Failed to regenerate invitation');
      }
    }
  };

  const handleDeleteInvitation = async (invitationId: number) => {
    if (window.confirm('Are you sure you want to delete this invitation? This action cannot be undone.')) {
      try {
        const response = await adminService.deleteInvitation(invitationId);
        if (response.success) {
          toast.success('Invitation deleted successfully!');
          loadDashboardData();
        } else {
          toast.error(response.message || 'Failed to delete invitation');
        }
      } catch (error: any) {
        console.error('Delete invitation error:', error);
        toast.error(error.response?.data?.message || 'Failed to delete invitation');
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

  // Load users with filters
  const loadUsers = async () => {
    try {
      const response = await userService.getUsers(1, 100, userFilters);
      if (response.success && response.data) {
        const usersData = response.data.data || [];
        setUsers(Array.isArray(usersData) ? usersData : []);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  // Handle user filter changes
  const handleUserFilterChange = (key: string, value: string | number | undefined) => {
    setUserFilters(prev => {
      const newFilters = { ...prev };
      if (value === '' || value === undefined || value === null) {
        delete newFilters[key as keyof typeof newFilters];
      } else {
        (newFilters as any)[key] = value;
      }
      return newFilters;
    });
  };

  // Clear user filters
  const handleClearUserFilters = () => {
    setUserFilters({});
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
            <img src="/logo-square.png" alt="Task Insight Admin" className="header-logo" />
            <span>Task Insight Admin</span>
          </div>
        </div>
        <div className="header-right">
          <div className="user-menu">
            <button className="user-avatar" onClick={() => setShowUserMenu(!showUserMenu)}>
              {user?.firstName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
              {user?.lastName?.charAt(0) || (user?.email?.charAt(1) && user.email.charAt(1).toUpperCase()) || ''}
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
              {currentView === 'overview' && (
                <div className="overview-section">
                  <h2>Platform Overview</h2>
                  {dashboardStats ? (
                    <>
                      <div className="stats-grid">
                        <div className="stat-card">
                          <div className="stat-icon">
                            <i className="fas fa-building"></i>
                          </div>
                          <div className="stat-content">
                            <h3>{dashboardStats.platformStats?.active_organizations || 0}</h3>
                            <p>Active Organizations</p>
                          </div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-icon">
                            <i className="fas fa-users"></i>
                          </div>
                          <div className="stat-content">
                            <h3>{dashboardStats.platformStats?.active_users || 0}</h3>
                            <p>Active Users</p>
                          </div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-icon">
                            <i className="fas fa-file"></i>
                          </div>
                          <div className="stat-content">
                            <h3>{dashboardStats.platformStats?.total_files || 0}</h3>
                            <p>Total Files</p>
                          </div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-icon">
                            <i className="fas fa-hdd"></i>
                          </div>
                          <div className="stat-content">
                            <h3>{dashboardStats.platformStats?.total_storage_used ? Math.round(dashboardStats.platformStats.total_storage_used / 1024 / 1024 / 1024) : 0} GB</h3>
                            <p>Storage Used</p>
                          </div>
                        </div>
                      </div>

                      <div className="stats-grid-secondary">
                        <div className="stat-card">
                          <div className="stat-icon">
                            <i className="fas fa-chart-line"></i>
                          </div>
                          <div className="stat-content">
                            <h3>{dashboardStats.platformStats?.total_storage_quota ? Math.round(dashboardStats.platformStats.total_storage_quota / 1024 / 1024 / 1024) : 0} GB</h3>
                            <p>Total Storage Quota</p>
                          </div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-icon">
                            <i className="fas fa-percentage"></i>
                          </div>
                          <div className="stat-content">
                            <h3>
                              {dashboardStats.platformStats?.total_storage_quota && dashboardStats.platformStats?.total_storage_used
                                ? Math.round((dashboardStats.platformStats.total_storage_used / dashboardStats.platformStats.total_storage_quota) * 100)
                                : 0}%
                            </h3>
                            <p>Storage Usage</p>
                          </div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-icon">
                            <i className="fas fa-folder"></i>
                          </div>
                          <div className="stat-content">
                            <h3>{organizations.length}</h3>
                            <p>Total Organizations</p>
                          </div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-icon">
                            <i className="fas fa-user-friends"></i>
                          </div>
                          <div className="stat-content">
                            <h3>{users.length}</h3>
                            <p>Total Users</p>
                          </div>
                        </div>
                      </div>

                      {dashboardStats.systemHealth && (
                        <div className="system-health">
                          <h3>System Health</h3>
                          <div className="health-stats">
                            <div className="health-item">
                              <span className="health-label">Active Users (30 days)</span>
                              <span className="health-value">{dashboardStats.systemHealth.active_users_30d || 0}</span>
                            </div>
                            <div className="health-item">
                              <span className="health-label">Files Uploaded (7 days)</span>
                              <span className="health-value">{dashboardStats.systemHealth.files_uploaded_7d || 0}</span>
                            </div>
                            <div className="health-item">
                              <span className="health-label">Total Organizations</span>
                              <span className="health-value">{dashboardStats.systemHealth.total_organizations || 0}</span>
                            </div>
                            <div className="health-item">
                              <span className="health-label">Daily Activity</span>
                              <span className="health-value">{dashboardStats.systemHealth.daily_activity || 0}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {dashboardStats.topOrganizationsByStorage && dashboardStats.topOrganizationsByStorage.length > 0 && (
                        <div className="top-organizations">
                          <h3>Top Organizations by Storage</h3>
                          <div className="table-container">
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>Organization</th>
                                  <th>Storage Used</th>
                                  <th>Storage Quota</th>
                                  <th>Usage %</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dashboardStats.topOrganizationsByStorage.slice(0, 5).map((org: any) => {
                                  // Ensure usage_percentage is a number
                                  let usagePercentage = 0;
                                  if (org.usage_percentage !== null && org.usage_percentage !== undefined) {
                                    usagePercentage = typeof org.usage_percentage === 'number' 
                                      ? org.usage_percentage 
                                      : parseFloat(String(org.usage_percentage)) || 0;
                                  }
                                  // Ensure it's a valid number
                                  if (isNaN(usagePercentage)) {
                                    usagePercentage = 0;
                                  }
                                  return (
                                    <tr key={org.id}>
                                      <td><strong>{org.name}</strong></td>
                                      <td>{Math.round((org.storage_used || 0) / 1024 / 1024)} MB</td>
                                      <td>{Math.round((org.storage_quota || 0) / 1024 / 1024)} MB</td>
                                      <td>
                                        <div className="usage-bar">
                                          <div 
                                            className="usage-fill" 
                                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                          ></div>
                                          <span>{usagePercentage.toFixed(1)}%</span>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="empty-state">
                      <i className="fas fa-chart-line"></i>
                      <p>Loading dashboard statistics...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Organizations */}
              {currentView === 'organizations' && (
                <div className="organizations-section">
                  <div className="section-header">
                    <h2>Organizations & Invitations</h2>
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
                          <th>Invitation Code</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(organizations || []).map((org) => (
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
                              {org.invitation_code ? (
                                <div className="invitation-cell">
                                  <code className="invitation-code">{org.invitation_code}</code>
                                  {org.invitation_expires_at && (
                                    <small className="expiry-date">
                                      Expires: {new Date(org.invitation_expires_at).toLocaleDateString()}
                                    </small>
                                  )}
                                </div>
                              ) : (
                                <button 
                                  className="btn-secondary btn-sm"
                                  onClick={() => handleGenerateInvitationForOrg(org.id)}
                                  title="Generate Invitation Code"
                                >
                                  <i className="fas fa-key"></i> Generate Code
                                </button>
                              )}
                            </td>
                            <td>
                              <span className={`status-badge ${org.status}`}>
                                {org.status}
                              </span>
                            </td>
                            <td>{new Date(org.created_at).toLocaleDateString()}</td>
                            <td>
                              <div className="action-buttons">
                                {org.invitation_code && (
                                  <button 
                                    className="btn-secondary btn-sm"
                                    onClick={() => handleRegenerateInvitation(org.id, org.invitation_id)}
                                    title="Regenerate Invitation Code"
                                  >
                                    <i className="fas fa-sync"></i>
                                  </button>
                                )}
                                {org.invitation_id && (
                                  <button 
                                    className="btn-danger btn-sm"
                                    onClick={() => handleDeleteInvitation(org.invitation_id!)}
                                    title="Delete Invitation Code"
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                )}
                                <button 
                                  className="btn-danger btn-sm"
                                  onClick={() => handleDeleteOrganization(org.id)}
                                  title="Delete Organization"
                                >
                                  <i className="fas fa-trash-alt"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(!organizations || organizations.length === 0) && (
                      <div className="empty-state">
                        <i className="fas fa-building"></i>
                        <p>No organizations found</p>
                        <button className="btn-primary" onClick={() => setShowAddOrgModal(true)}>
                          <i className="fas fa-plus"></i> Create First Organization
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Users */}
              {currentView === 'users' && (
                <div className="users-section">
                  <div className="section-header">
                    <h2>Users</h2>
                  </div>
                  
                  {/* User Filters */}
                  <div className="filters-bar">
                    <div className="filter-group">
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="filter-input"
                        value={userFilters.search || ''}
                        onChange={(e) => handleUserFilterChange('search', e.target.value)}
                      />
                    </div>
                    <div className="filter-group">
                      <select
                        className="filter-select"
                        value={userFilters.organizationId || ''}
                        onChange={(e) => handleUserFilterChange('organizationId', e.target.value ? parseInt(e.target.value) : undefined)}
                      >
                        <option value="">All Organizations</option>
                        {(organizations || []).map((org) => (
                          <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group">
                      <select
                        className="filter-select"
                        value={userFilters.role || ''}
                        onChange={(e) => handleUserFilterChange('role', e.target.value || undefined)}
                      >
                        <option value="">All Roles</option>
                        <option value="platform_owner">Platform Owner</option>
                        <option value="organization_admin">Organization Admin</option>
                        <option value="member">Member</option>
                      </select>
                    </div>
                    <div className="filter-group">
                      <select
                        className="filter-select"
                        value={userFilters.status || ''}
                        onChange={(e) => handleUserFilterChange('status', e.target.value || undefined)}
                      >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                    {(userFilters.search || userFilters.organizationId || userFilters.role || userFilters.status) && (
                      <button 
                        className="btn-secondary btn-sm"
                        onClick={handleClearUserFilters}
                        title="Clear Filters"
                      >
                        <i className="fas fa-times"></i> Clear
                      </button>
                    )}
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
                        {(users || []).map((user) => (
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
                    {(!users || users.length === 0) && (
                      <div className="empty-state">
                        <i className="fas fa-users"></i>
                        <p>No users found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}


              {/* Activity Timeline */}
              {currentView === 'activity' && (
                <div className="activity-section">
                  <div className="section-header">
                    <h2>Activity Timeline</h2>
                  </div>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>User</th>
                          <th>Action</th>
                          <th>Resource Type</th>
                          <th>Resource ID</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(activities && activities.length > 0) ? (
                          activities.map((activity) => (
                            <tr key={activity.id}>
                              <td>{new Date(activity.created_at).toLocaleString()}</td>
                              <td>
                                {activity.first_name || 'Unknown'} {activity.last_name || ''}
                                {activity.email && (
                                  <>
                                    <br />
                                    <small>{activity.email}</small>
                                  </>
                                )}
                              </td>
                              <td>
                                <span className="action-badge">
                                  <i className={auditService.getActionIcon(activity.action)}></i>
                                  {auditService.formatAction(activity.action)}
                                </span>
                              </td>
                              <td>{auditService.formatResourceType(activity.resource_type)}</td>
                              <td>{activity.resource_id}</td>
                              <td>
                                <div className="details-cell">
                                  {activity.details ? (
                                    typeof activity.details === 'string' ? (
                                      <span>{activity.details}</span>
                                    ) : (
                                      <pre>{JSON.stringify(activity.details, null, 2)}</pre>
                                    )
                                  ) : (
                                    <span className="text-muted">No details</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="empty-state">
                              <i className="fas fa-history"></i>
                              <p>No activity found</p>
                            </td>
                          </tr>
                        )}
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
                        {(auditLogs || []).map((log) => (
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
                    {(!auditLogs || auditLogs.length === 0) && (
                      <div className="empty-state">
                        <i className="fas fa-clipboard-list"></i>
                        <p>No audit logs found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Storage Analytics */}
              {currentView === 'storage' && (
                <div className="storage-section">
                  <h2>Storage Analytics</h2>
                  {storageAnalytics ? (
                    <>
                      <div className="storage-overview">
                        <div className="storage-stats">
                          <div className="stat-item">
                            <h3>{storageAnalytics.overview?.total_organizations || 0}</h3>
                            <p>Total Organizations</p>
                          </div>
                          <div className="stat-item">
                            <h3>{storageAnalytics.overview?.total_used_bytes ? Math.round(storageAnalytics.overview.total_used_bytes / 1024 / 1024 / 1024) : 0} GB</h3>
                            <p>Total Storage Used</p>
                          </div>
                          <div className="stat-item">
                            <h3>{storageAnalytics.overview?.total_quota_bytes ? Math.round(storageAnalytics.overview.total_quota_bytes / 1024 / 1024 / 1024) : 0} GB</h3>
                            <p>Total Storage Quota</p>
                          </div>
                          <div className="stat-item">
                            <h3>{storageAnalytics.overview?.usage_percentage ? storageAnalytics.overview.usage_percentage.toFixed(1) : 0}%</h3>
                            <p>Usage Percentage</p>
                          </div>
                        </div>
                      </div>

                      {storageAnalytics.byOrganization && storageAnalytics.byOrganization.length > 0 && (
                        <div className="storage-by-org">
                          <h3>Storage by Organization</h3>
                          <div className="table-container">
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>Organization</th>
                                  <th>Storage Used</th>
                                  <th>Storage Quota</th>
                                  <th>Usage %</th>
                                  <th>File Count</th>
                                </tr>
                              </thead>
                              <tbody>
                                {storageAnalytics.byOrganization.map((org) => (
                                  <tr key={org.id}>
                                    <td><strong>{org.name}</strong></td>
                                    <td>{Math.round(org.used_bytes / 1024 / 1024)} MB</td>
                                    <td>{Math.round(org.storage_quota / 1024 / 1024)} MB</td>
                                    <td>
                                      <div className="usage-bar">
                                        <div 
                                          className="usage-fill" 
                                          style={{ width: `${org.usage_percentage}%` }}
                                        ></div>
                                        <span>{org.usage_percentage.toFixed(1)}%</span>
                                      </div>
                                    </td>
                                    <td>{org.file_count || 0}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {storageAnalytics.byFileType && storageAnalytics.byFileType.length > 0 && (
                        <div className="storage-by-type">
                          <h3>Storage by File Type</h3>
                          <div className="table-container">
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>File Type</th>
                                  <th>File Count</th>
                                  <th>Total Size</th>
                                  <th>Average Size</th>
                                </tr>
                              </thead>
                              <tbody>
                                {storageAnalytics.byFileType.map((type, index) => (
                                  <tr key={index}>
                                    <td><strong>{type.type || 'Unknown'}</strong></td>
                                    <td>{type.file_count || 0}</td>
                                    <td>{Math.round((type.total_size || 0) / 1024 / 1024)} MB</td>
                                    <td>{Math.round((type.avg_size || 0) / 1024)} KB</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="empty-state">
                      <i className="fas fa-hdd"></i>
                      <p>Loading storage analytics...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Settings */}
              {currentView === 'settings' && (
                <div className="settings-section">
                  <h2>System Settings</h2>
                  <div className="settings-content">
                    <div className="settings-group">
                      <h3>File Upload Settings</h3>
                      <div className="setting-item">
                        <label>Maximum File Size</label>
                        <div className="setting-value">
                          <span>10 MB</span>
                          <button className="btn-secondary btn-sm">Change</button>
                        </div>
                      </div>
                      <div className="setting-item">
                        <label>Allowed File Types</label>
                        <div className="setting-value">
                          <span>All common file types</span>
                          <button className="btn-secondary btn-sm">Configure</button>
                        </div>
                      </div>
                    </div>

                    <div className="settings-group">
                      <h3>Storage Settings</h3>
                      <div className="setting-item">
                        <label>Default Storage Quota</label>
                        <div className="setting-value">
                          <span>5 GB per organization</span>
                          <button className="btn-secondary btn-sm">Change</button>
                        </div>
                      </div>
                      <div className="setting-item">
                        <label>Storage Warning Threshold</label>
                        <div className="setting-value">
                          <span>80%</span>
                          <button className="btn-secondary btn-sm">Change</button>
                        </div>
                      </div>
                    </div>

                    <div className="settings-group">
                      <h3>User Management</h3>
                      <div className="setting-item">
                        <label>Registration</label>
                        <div className="setting-value">
                          <span>Requires invitation code</span>
                          <button className="btn-secondary btn-sm">Change</button>
                        </div>
                      </div>
                      <div className="setting-item">
                        <label>Session Timeout</label>
                        <div className="setting-value">
                          <span>24 hours</span>
                          <button className="btn-secondary btn-sm">Change</button>
                        </div>
                      </div>
                    </div>

                    <div className="settings-group">
                      <h3>Security Settings</h3>
                      <div className="setting-item">
                        <label>Password Requirements</label>
                        <div className="setting-value">
                          <span>Minimum 6 characters</span>
                          <button className="btn-secondary btn-sm">Configure</button>
                        </div>
                      </div>
                      <div className="setting-item">
                        <label>Two-Factor Authentication</label>
                        <div className="setting-value">
                          <span>Not enabled</span>
                          <button className="btn-secondary btn-sm">Enable</button>
                        </div>
                      </div>
                    </div>

                    <div className="settings-actions">
                      <button className="btn-primary">
                        <i className="fas fa-save"></i> Save All Settings
                      </button>
                      <button className="btn-secondary">
                        <i className="fas fa-undo"></i> Reset to Defaults
                      </button>
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
                <input type="number" id="storage-quota" defaultValue="5368709120" />
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

    </div>
  );
};

export default AdminPanel;
const express = require('express');
const { executeQuery } = require('../config/database');
const { verifyToken, requirePlatformOwner } = require('../middleware/auth');
const { validatePagination, validateSearch, validateDateRange } = require('../middleware/validation');

const router = express.Router();

// Dashboard statistics
router.get('/dashboard/stats', verifyToken, requirePlatformOwner, async (req, res) => {
  try {
    // Get platform overview statistics
    const platformStats = await executeQuery(`
      SELECT 
        (SELECT COUNT(*) FROM organizations WHERE status = 'active') as active_organizations,
        (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
        (SELECT COUNT(*) FROM files WHERE status = 'active') as total_files,
        (SELECT COALESCE(SUM(file_size), 0) FROM files WHERE status = 'active') as total_storage_used,
        (SELECT SUM(storage_quota) FROM organizations WHERE status = 'active') as total_storage_quota
    `);

    // Get recent activity (last 7 days)
    const recentActivity = await executeQuery(`
      SELECT action, COUNT(*) as count, DATE(created_at) as date
      FROM audit_logs 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY action, DATE(created_at)
      ORDER BY date DESC
    `);

    // Get user registrations by day (last 30 days)
    const userRegistrations = await executeQuery(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Get organization creation by day (last 30 days)
    const orgCreations = await executeQuery(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM organizations 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Get top organizations by storage usage
    const topOrgsByStorage = await executeQuery(`
      SELECT o.name, o.id, 
             COALESCE(SUM(f.file_size), 0) as storage_used,
             o.storage_quota as storage_quota,
             ROUND((COALESCE(SUM(f.file_size), 0) / o.storage_quota) * 100, 2) as usage_percentage
      FROM organizations o
      LEFT JOIN files f ON o.id = f.organization_id AND f.status = 'active'
      WHERE o.status = 'active'
      GROUP BY o.id, o.name, o.storage_quota
      ORDER BY storage_used DESC
      LIMIT 10
    `);

    // Get system health metrics
    const systemHealth = await executeQuery(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE status = 'active' AND last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as active_users_30d,
        (SELECT COUNT(*) FROM files WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as files_uploaded_7d,
        (SELECT COUNT(*) FROM organizations WHERE status = 'active') as total_organizations,
        (SELECT COUNT(*) FROM audit_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)) as daily_activity
    `);

    if (!platformStats.success || !recentActivity.success || !userRegistrations.success || 
        !orgCreations.success || !topOrgsByStorage.success || !systemHealth.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics'
      });
    }

    res.json({
      success: true,
      data: {
        platformStats: platformStats.data[0],
        recentActivity: recentActivity.data,
        userRegistrations: userRegistrations.data,
        organizationCreations: orgCreations.data,
        topOrganizationsByStorage: topOrgsByStorage.data,
        systemHealth: systemHealth.data[0]
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get recent activity timeline
router.get('/activity/timeline', verifyToken, requirePlatformOwner, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, action, userId, organizationId } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];

    // Filter by action
    if (action) {
      whereConditions.push('al.action = ?');
      queryParams.push(action);
    }

    // Filter by user
    if (userId) {
      whereConditions.push('al.user_id = ?');
      queryParams.push(userId);
    }

    // Filter by organization
    if (organizationId) {
      whereConditions.push('u.organization_id = ?');
      queryParams.push(organizationId);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const activityQuery = `
      SELECT al.*, u.first_name, u.last_name, u.email, o.name as organization_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN organizations o ON u.organization_id = o.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const activityResult = await executeQuery(activityQuery, [...queryParams, parseInt(limit), offset]);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
    `;

    const countResult = await executeQuery(countQuery, queryParams);

    if (!activityResult.success || !countResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch activity timeline'
      });
    }

    res.json({
      success: true,
      data: {
        data: activityResult.data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.data[0].total,
          pages: Math.ceil(countResult.data[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get activity timeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Generate invitation code
router.post('/invitations/generate', verifyToken, requirePlatformOwner, async (req, res) => {
  try {
    const { organizationId, role = 'member', expiresInDays = 7 } = req.body;

    // Validate organization
    const orgResult = await executeQuery(
      'SELECT id, name FROM organizations WHERE id = ? AND status = "active"',
      [organizationId]
    );

    if (!orgResult.success || orgResult.data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Generate unique invitation code
    const code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    // Update organization with invitation code
    const updateResult = await executeQuery(
      'UPDATE organizations SET invitation_code = ?, invitation_role = ?, invitation_expires_at = ?, invitation_generated_by = ? WHERE id = ?',
      [code, role, expiresAt, req.user.id, organizationId]
    );

    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate invitation code'
      });
    }

    // Log invitation creation
    await executeQuery(
      'INSERT INTO audit_logs (user_id, organization_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, organizationId, 'CREATE', 'INVITATION', organizationId, JSON.stringify({ code, organizationId, role, expiresAt })]
    );

    res.status(201).json({
      success: true,
      message: 'Invitation code generated successfully',
      data: {
        code,
        organizationId,
        organizationName: orgResult.data[0].name,
        role,
        expiresAt
      }
    });
  } catch (error) {
    console.error('Generate invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all invitations (from organizations table)
router.get('/invitations', verifyToken, requirePlatformOwner, validatePagination, validateSearch, async (req, res) => {
  try {
    const { page = 1, limit = 10, q: search, organizationId } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['o.invitation_code IS NOT NULL'];
    let queryParams = [];

    // Search filter
    if (search) {
      whereConditions.push('(o.invitation_code LIKE ? OR o.name LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    // Organization filter
    if (organizationId) {
      whereConditions.push('o.id = ?');
      queryParams.push(organizationId);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get invitations from organizations
    const invitationsQuery = `
      SELECT o.id as organization_id, o.name as organization_name, 
             o.invitation_code as code, o.invitation_role as role, 
             o.invitation_expires_at as expires_at, o.invitation_generated_by as generated_by,
             u.first_name, u.last_name
      FROM organizations o
      LEFT JOIN users u ON o.invitation_generated_by = u.id
      ${whereClause}
      ORDER BY o.updated_at DESC
      LIMIT ? OFFSET ?
    `;

    const invitationsResult = await executeQuery(invitationsQuery, [...queryParams, parseInt(limit), offset]);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM organizations o
      ${whereClause}
    `;

    const countResult = await executeQuery(countQuery, queryParams);

    if (!invitationsResult.success || !countResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch invitations'
      });
    }

    res.json({
      success: true,
      data: {
        data: invitationsResult.data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.data[0].total,
          pages: Math.ceil(countResult.data[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete invitation (clear from organization)
router.delete('/invitations/:organizationId', verifyToken, requirePlatformOwner, async (req, res) => {
  try {
    const { organizationId } = req.params;

    // Check if organization exists and has invitation code
    const orgResult = await executeQuery(
      'SELECT * FROM organizations WHERE id = ? AND invitation_code IS NOT NULL',
      [organizationId]
    );

    if (!orgResult.success || orgResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organization or invitation not found'
      });
    }

    const org = orgResult.data[0];

    // Clear invitation from organization
    const deleteResult = await executeQuery(
      'UPDATE organizations SET invitation_code = NULL, invitation_role = NULL, invitation_expires_at = NULL, invitation_generated_by = NULL WHERE id = ?',
      [organizationId]
    );

    if (!deleteResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete invitation'
      });
    }

    // Log deletion
    await executeQuery(
      'INSERT INTO audit_logs (user_id, organization_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, parseInt(organizationId), 'DELETE', 'INVITATION', parseInt(organizationId), JSON.stringify({ code: org.invitation_code })]
    );

    res.json({
      success: true,
      message: 'Invitation deleted successfully'
    });
  } catch (error) {
    console.error('Delete invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get storage analytics
router.get('/storage/analytics', verifyToken, requirePlatformOwner, async (req, res) => {
  try {
    // Get storage overview
    // Calculate total quota separately to avoid duplication from JOIN
    const storageOverview = await executeQuery(`
      SELECT 
        (SELECT COUNT(DISTINCT id) FROM organizations WHERE status = 'active') as total_organizations,
        (SELECT COALESCE(SUM(storage_quota), 0) FROM organizations WHERE status = 'active') as total_quota_bytes,
        (SELECT COALESCE(SUM(file_size), 0) FROM files WHERE status = 'active') as total_used_bytes,
        ROUND(
          (SELECT COALESCE(SUM(file_size), 0) FROM files WHERE status = 'active') / 
          NULLIF((SELECT COALESCE(SUM(storage_quota), 0) FROM organizations WHERE status = 'active'), 0) * 100, 
          2
        ) as usage_percentage
    `);

    // Get storage by organization
    const storageByOrg = await executeQuery(`
      SELECT o.name, o.id, o.storage_quota,
             COALESCE(SUM(f.file_size), 0) as used_bytes,
             ROUND((COALESCE(SUM(f.file_size), 0) / o.storage_quota) * 100, 2) as usage_percentage,
             COUNT(f.id) as file_count
      FROM organizations o
      LEFT JOIN files f ON o.id = f.organization_id AND f.status = 'active'
      WHERE o.status = 'active'
      GROUP BY o.id, o.name, o.storage_quota
      ORDER BY used_bytes DESC
    `);

    // Get storage by file type
    const storageByType = await executeQuery(`
      SELECT file_type as type, 
             COUNT(*) as file_count,
             SUM(file_size) as total_size,
             ROUND(AVG(file_size), 2) as avg_size
      FROM files 
      WHERE status = 'active'
      GROUP BY file_type
      ORDER BY total_size DESC
    `);

    // Get storage trends (last 30 days)
    const storageTrends = await executeQuery(`
      SELECT DATE(created_at) as date,
             COUNT(*) as files_uploaded,
             SUM(file_size) as daily_storage_added
      FROM files 
      WHERE status = 'active' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    if (!storageOverview.success || !storageByOrg.success || !storageByType.success || !storageTrends.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch storage analytics'
      });
    }

    res.json({
      success: true,
      data: {
        overview: storageOverview.data[0],
        byOrganization: storageByOrg.data,
        byFileType: storageByType.data,
        trends: storageTrends.data
      }
    });
  } catch (error) {
    console.error('Get storage analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get system settings
router.get('/settings', verifyToken, requirePlatformOwner, async (req, res) => {
  try {
    // This would typically come from a settings table
    // For now, we'll return some default settings
    const settings = {
      maxFileSize: process.env.MAX_FILE_SIZE || 10485760,
      allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,txt,jpg,jpeg,png,gif,mp4,avi,mov').split(','),
      defaultStorageQuota: 5120, // MB (5GB)
      sessionTimeout: process.env.JWT_EXPIRES_IN || '24h',
      registrationEnabled: true,
      invitationRequired: true
    };

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update system settings
router.put('/settings', verifyToken, requirePlatformOwner, async (req, res) => {
  try {
    const { maxFileSize, allowedFileTypes, defaultStorageQuota, sessionTimeout, registrationEnabled, invitationRequired } = req.body;

    // This would typically update a settings table
    // For now, we'll just log the update attempt
    await executeQuery(
      'INSERT INTO audit_logs (user_id, organization_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, req.user.organization_id, 'UPDATE', 'SYSTEM_SETTINGS', 1, JSON.stringify({ 
        maxFileSize, 
        allowedFileTypes, 
        defaultStorageQuota, 
        sessionTimeout, 
        registrationEnabled, 
        invitationRequired 
      })]
    );

    res.json({
      success: true,
      message: 'System settings updated successfully'
    });
  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

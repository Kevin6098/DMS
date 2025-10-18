const express = require('express');
const { executeQuery } = require('../config/database');
const { verifyToken, requirePlatformOwner, requireOrgAdmin } = require('../middleware/auth');
const { validateOrganization, validatePagination, validateSearch } = require('../middleware/validation');

const router = express.Router();

// Get all organizations
router.get('/', verifyToken, requirePlatformOwner, validatePagination, validateSearch, async (req, res) => {
  try {
    const { page = 1, limit = 10, q: search, status } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];

    // Search filter
    if (search) {
      whereConditions.push('(name LIKE ? OR description LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    // Status filter
    if (status) {
      whereConditions.push('status = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get organizations with pagination
    const orgsQuery = `
      SELECT o.*, 
             COUNT(u.id) as user_count,
             COALESCE(SUM(f.size), 0) as storage_used
      FROM organizations o 
      LEFT JOIN users u ON o.id = u.organization_id AND u.status = 'active'
      LEFT JOIN files f ON o.id = f.organization_id AND f.status = 'active'
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC 
      LIMIT ? OFFSET ?
    `;

    const orgsResult = await executeQuery(orgsQuery, [...queryParams, parseInt(limit), offset]);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM organizations o 
      ${whereClause}
    `;

    const countResult = await executeQuery(countQuery, queryParams);

    if (!orgsResult.success || !countResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch organizations'
      });
    }

    res.json({
      success: true,
      data: {
        organizations: orgsResult.data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.data[0].total,
          pages: Math.ceil(countResult.data[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get organization by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has access to this organization
    if (req.user.role === 'organization_admin' && req.user.organization_id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const orgResult = await executeQuery(
      `SELECT o.*, 
              COUNT(u.id) as user_count,
              COALESCE(SUM(f.size), 0) as storage_used
       FROM organizations o 
       LEFT JOIN users u ON o.id = u.organization_id AND u.status = 'active'
       LEFT JOIN files f ON o.id = f.organization_id AND f.status = 'active'
       WHERE o.id = ?
       GROUP BY o.id`,
      [id]
    );

    if (!orgResult.success || orgResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    res.json({
      success: true,
      data: orgResult.data[0]
    });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create organization
router.post('/', verifyToken, requirePlatformOwner, validateOrganization, async (req, res) => {
  try {
    const { name, description, storageQuota } = req.body;

    // Check if organization name already exists
    const existingOrg = await executeQuery(
      'SELECT id FROM organizations WHERE name = ?',
      [name]
    );

    if (existingOrg.success && existingOrg.data.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Organization with this name already exists'
      });
    }

    // Create organization
    const orgResult = await executeQuery(
      'INSERT INTO organizations (name, description, storage_quota, status) VALUES (?, ?, ?, ?)',
      [name, description, storageQuota || 1000, 'active']
    );

    if (!orgResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create organization'
      });
    }

    // Log organization creation
    await executeQuery(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'CREATE', 'ORGANIZATION', orgResult.data.insertId, JSON.stringify({ name, storageQuota })]
    );

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: {
        organizationId: orgResult.data.insertId,
        name,
        description,
        storageQuota: storageQuota || 1000
      }
    });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update organization
router.put('/:id', verifyToken, requirePlatformOwner, validateOrganization, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, storageQuota, status } = req.body;

    // Check if organization exists
    const existingOrg = await executeQuery(
      'SELECT * FROM organizations WHERE id = ?',
      [id]
    );

    if (!existingOrg.success || existingOrg.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Check if name is already taken by another organization
    if (name && name !== existingOrg.data[0].name) {
      const nameCheck = await executeQuery(
        'SELECT id FROM organizations WHERE name = ? AND id != ?',
        [name, id]
      );

      if (nameCheck.success && nameCheck.data.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Organization name is already taken'
        });
      }
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }

    if (storageQuota) {
      updateFields.push('storage_quota = ?');
      updateValues.push(storageQuota);
    }

    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateValues.push(id);

    const updateResult = await executeQuery(
      `UPDATE organizations SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update organization'
      });
    }

    // Log the update
    await executeQuery(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'UPDATE', 'ORGANIZATION', id, JSON.stringify({ updatedFields: updateFields })]
    );

    res.json({
      success: true,
      message: 'Organization updated successfully'
    });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete organization
router.delete('/:id', verifyToken, requirePlatformOwner, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if organization exists
    const orgResult = await executeQuery(
      'SELECT * FROM organizations WHERE id = ?',
      [id]
    );

    if (!orgResult.success || orgResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Check if organization has active users
    const userCount = await executeQuery(
      'SELECT COUNT(*) as count FROM users WHERE organization_id = ? AND status = "active"',
      [id]
    );

    if (userCount.success && userCount.data[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete organization with active users. Please deactivate all users first.'
      });
    }

    // Soft delete organization
    const deleteResult = await executeQuery(
      'UPDATE organizations SET status = "deleted", deleted_at = NOW() WHERE id = ?',
      [id]
    );

    if (!deleteResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete organization'
      });
    }

    // Log deletion
    await executeQuery(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'DELETE', 'ORGANIZATION', id, JSON.stringify({ name: orgResult.data[0].name })]
    );

    res.json({
      success: true,
      message: 'Organization deleted successfully'
    });
  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get organization users
router.get('/:id/users', verifyToken, requireOrgAdmin, validatePagination, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, q: search, role, status } = req.query;
    const offset = (page - 1) * limit;

    // Check access permissions
    if (req.user.role === 'organization_admin' && req.user.organization_id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    let whereConditions = ['u.organization_id = ?'];
    let queryParams = [id];

    // Search filter
    if (search) {
      whereConditions.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    // Role filter
    if (role) {
      whereConditions.push('u.role = ?');
      queryParams.push(role);
    }

    // Status filter
    if (status) {
      whereConditions.push('u.status = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get users
    const usersQuery = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.status, 
             u.created_at, u.last_login
      FROM users u 
      ${whereClause}
      ORDER BY u.created_at DESC 
      LIMIT ? OFFSET ?
    `;

    const usersResult = await executeQuery(usersQuery, [...queryParams, parseInt(limit), offset]);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM users u 
      ${whereClause}
    `;

    const countResult = await executeQuery(countQuery, queryParams);

    if (!usersResult.success || !countResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }

    res.json({
      success: true,
      data: {
        users: usersResult.data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.data[0].total,
          pages: Math.ceil(countResult.data[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get organization users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get organization statistics
router.get('/stats/overview', verifyToken, requirePlatformOwner, async (req, res) => {
  try {
    // Get organization counts by status
    const statusStats = await executeQuery(
      'SELECT status, COUNT(*) as count FROM organizations GROUP BY status'
    );

    // Get total organizations
    const totalOrgs = await executeQuery(
      'SELECT COUNT(*) as total FROM organizations'
    );

    // Get recent organizations (last 30 days)
    const recentOrgs = await executeQuery(
      'SELECT COUNT(*) as count FROM organizations WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );

    // Get storage statistics
    const storageStats = await executeQuery(
      `SELECT 
        SUM(storage_quota) as total_quota,
        SUM(CASE WHEN status = 'active' THEN storage_quota ELSE 0 END) as active_quota,
        COUNT(*) as total_organizations,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_organizations
       FROM organizations`
    );

    if (!statusStats.success || !totalOrgs.success || !recentOrgs.success || !storageStats.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch organization statistics'
      });
    }

    res.json({
      success: true,
      data: {
        totalOrganizations: totalOrgs.data[0].total,
        statusStats: statusStats.data,
        recentOrganizations: recentOrgs.data[0].count,
        storageStats: storageStats.data[0]
      }
    });
  } catch (error) {
    console.error('Get organization stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

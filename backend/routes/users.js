const express = require('express');
const bcrypt = require('bcrypt');
const { executeQuery } = require('../config/database');
const { verifyToken, requireOrgAdmin, requireOrgAccess } = require('../middleware/auth');
const { validateUserUpdate, validatePagination, validateSearch } = require('../middleware/validation');

const router = express.Router();

// Get all users (admin only)
router.get('/', verifyToken, requireOrgAdmin, validatePagination, validateSearch, async (req, res) => {
  try {
    const { page = 1, limit = 10, q: search, organizationId, role, status } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];

    // Platform owner can see all users, org admin only sees their org users
    if (req.user.role === 'organization_admin') {
      whereConditions.push('u.organization_id = ?');
      queryParams.push(req.user.organization_id);
    }

    // Search filter
    if (search) {
      whereConditions.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    // Organization filter
    if (organizationId) {
      whereConditions.push('u.organization_id = ?');
      queryParams.push(organizationId);
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

    // Get users with pagination
    const usersQuery = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.status, 
             u.created_at, u.last_login, o.name as organization_name
      FROM users u 
      LEFT JOIN organizations o ON u.organization_id = o.id 
      ${whereClause}
      ORDER BY u.created_at DESC 
      LIMIT ? OFFSET ?
    `;

    const usersResult = await executeQuery(usersQuery, [...queryParams, parseInt(limit), offset]);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM users u 
      LEFT JOIN organizations o ON u.organization_id = o.id 
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
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user by ID
router.get('/:id', verifyToken, requireOrgAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await executeQuery(
      'SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.status, u.created_at, u.last_login, o.name as organization_name FROM users u LEFT JOIN organizations o ON u.organization_id = o.id WHERE u.id = ?',
      [id]
    );

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: userResult.data[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user
router.put('/:id', verifyToken, requireOrgAdmin, validateUserUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role, status } = req.body;

    // Check if user exists
    const existingUser = await executeQuery(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (!existingUser.success || existingUser.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = existingUser.data[0];

    // Check permissions
    if (req.user.role === 'organization_admin' && user.organization_id !== req.user.organization_id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update users in your organization'
      });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const emailCheck = await executeQuery(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );

      if (emailCheck.success && emailCheck.data.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken'
        });
      }
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    if (firstName) {
      updateFields.push('first_name = ?');
      updateValues.push(firstName);
    }

    if (lastName) {
      updateFields.push('last_name = ?');
      updateValues.push(lastName);
    }

    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    if (role) {
      updateFields.push('role = ?');
      updateValues.push(role);
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
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update user'
      });
    }

    // Log the update
    await executeQuery(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'UPDATE', 'USER', id, JSON.stringify({ updatedFields: updateFields })]
    );

    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change user password
router.put('/:id/password', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // User can only change their own password unless they're admin
    if (req.user.id !== parseInt(id) && !['organization_admin', 'platform_owner'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only change your own password'
      });
    }

    // Get user
    const userResult = await executeQuery(
      'SELECT password_hash FROM users WHERE id = ?',
      [id]
    );

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password (except for admin changing other user's password)
    if (req.user.id === parseInt(id)) {
      const isValidPassword = await bcrypt.compare(currentPassword, userResult.data[0].password_hash);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const updateResult = await executeQuery(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedPassword, id]
    );

    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update password'
      });
    }

    // Log password change
    await executeQuery(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'UPDATE', 'USER', id, JSON.stringify({ action: 'password_change' })]
    );

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete user (soft delete)
router.delete('/:id', verifyToken, requireOrgAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const userResult = await executeQuery(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.data[0];

    // Check permissions
    if (req.user.role === 'organization_admin' && user.organization_id !== req.user.organization_id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete users in your organization'
      });
    }

    // Cannot delete yourself
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Soft delete user
    const deleteResult = await executeQuery(
      'UPDATE users SET status = "deleted", deleted_at = NOW() WHERE id = ?',
      [id]
    );

    if (!deleteResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      });
    }

    // Log deletion
    await executeQuery(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'DELETE', 'USER', id, JSON.stringify({ email: user.email })]
    );

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user statistics
router.get('/stats/overview', verifyToken, requireOrgAdmin, async (req, res) => {
  try {
    const { organizationId } = req.query;
    
    let whereClause = '';
    let queryParams = [];

    if (req.user.role === 'organization_admin') {
      whereClause = 'WHERE organization_id = ?';
      queryParams.push(req.user.organization_id);
    } else if (organizationId) {
      whereClause = 'WHERE organization_id = ?';
      queryParams.push(organizationId);
    }

    // Get user counts by status
    const statusStats = await executeQuery(
      `SELECT status, COUNT(*) as count FROM users ${whereClause} GROUP BY status`,
      queryParams
    );

    // Get user counts by role
    const roleStats = await executeQuery(
      `SELECT role, COUNT(*) as count FROM users ${whereClause} GROUP BY role`,
      queryParams
    );

    // Get total users
    const totalUsers = await executeQuery(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      queryParams
    );

    // Get recent registrations (last 30 days)
    const recentRegistrations = await executeQuery(
      `SELECT COUNT(*) as count FROM users ${whereClause} AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      queryParams
    );

    if (!statusStats.success || !roleStats.success || !totalUsers.success || !recentRegistrations.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user statistics'
      });
    }

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers.data[0].total,
        statusStats: statusStats.data,
        roleStats: roleStats.data,
        recentRegistrations: recentRegistrations.data[0].count
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

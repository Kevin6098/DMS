const jwt = require('jsonwebtoken');
const path = require('path');
const { executeQuery } = require('../config/database');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const userResult = await executeQuery(
      'SELECT id, email, role, status, organization_id FROM users WHERE id = ? AND status = "active"',
      [decoded.userId]
    );

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found or inactive.'
      });
    }

    req.user = userResult.data[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};

// Check if user is platform owner
const requirePlatformOwner = (req, res, next) => {
  if (req.user.role !== 'platform_owner') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Platform owner role required.'
    });
  }
  next();
};

// Check if user is organization admin or platform owner
const requireOrgAdmin = (req, res, next) => {
  if (!['organization_admin', 'platform_owner'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Organization admin or platform owner role required.'
    });
  }
  next();
};

// Check if user belongs to organization
const requireOrgAccess = async (req, res, next) => {
  try {
    const orgId = req.params.orgId || req.body.organizationId || req.query.organizationId;
    
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID required.'
      });
    }

    // Platform owner has access to all organizations
    if (req.user.role === 'platform_owner') {
      return next();
    }

    // Check if user belongs to the organization
    const result = await executeQuery(
      'SELECT id FROM users WHERE id = ? AND organization_id = ?',
      [req.user.id, orgId]
    );

    if (!result.success || result.data.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not belong to this organization.'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking organization access.'
    });
  }
};

// Check file access permissions
const requireFileAccess = async (req, res, next) => {
  try {
    const fileId = req.params.fileId || req.params.id;
    
    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'File ID required.'
      });
    }

    // Get file information
    const fileResult = await executeQuery(
      'SELECT * FROM files WHERE id = ?',
      [fileId]
    );

    if (!fileResult.success || fileResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found.'
      });
    }

    const file = fileResult.data[0];

    // Helper function to resolve file path
    const resolveFilePath = (storagePath) => {
      if (!storagePath) return null;
      // If path is already absolute, return as is
      if (path.isAbsolute(storagePath)) {
        return storagePath;
      }
      // Otherwise, resolve relative to uploads directory
      return path.resolve(__dirname, '../uploads', storagePath);
    };

    // Platform owner has access to all files
    if (req.user.role === 'platform_owner') {
      // Set path property from storage_path for compatibility
      req.file = {
        ...file,
        path: resolveFilePath(file.storage_path)
      };
      return next();
    }

    // Check if user belongs to the same organization as the file
    const userResult = await executeQuery(
      'SELECT organization_id FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'User not found.'
      });
    }

    const userOrgId = userResult.data[0].organization_id;

    if (file.organization_id !== userOrgId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to access this file.'
      });
    }

    // Set path property from storage_path for compatibility
    req.file = {
      ...file,
      path: resolveFilePath(file.storage_path)
    };
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking file access.'
    });
  }
};

module.exports = {
  verifyToken,
  requireAdmin,
  requirePlatformOwner,
  requireOrgAdmin,
  requireOrgAccess,
  requireFileAccess
};

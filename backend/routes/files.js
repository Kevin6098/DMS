const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { executeQuery } = require('../config/database');
const { verifyToken, requireFileAccess } = require('../middleware/auth');
const { validateFileUpload, validateFileUpdate, validateFolder, validatePagination, validateSearch } = require('../middleware/validation');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,txt,jpg,jpeg,png,gif,mp4,avi,mov').split(',');
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${fileExtension} is not allowed`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

// Get all files
router.get('/', verifyToken, validatePagination, validateSearch, async (req, res) => {
  try {
    const { page = 1, limit = 10, q: search, folderId, type, organizationId } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['f.status = "active"'];
    let queryParams = [];

    // Filter by organization (platform owner can see all, others see their org)
    if (req.user.role === 'platform_owner' && organizationId) {
      whereConditions.push('f.organization_id = ?');
      queryParams.push(organizationId);
    } else if (req.user.role !== 'platform_owner') {
      whereConditions.push('f.organization_id = ?');
      queryParams.push(req.user.organization_id);
    }

    // Search filter
    if (search) {
      whereConditions.push('(f.name LIKE ? OR f.description LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    // Folder filter
    if (folderId) {
      whereConditions.push('f.folder_id = ?');
      queryParams.push(folderId);
    }

    // File type filter
    if (type) {
      whereConditions.push('f.type = ?');
      queryParams.push(type);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get files with pagination
    const filesQuery = `
      SELECT f.*, u.first_name, u.last_name, u.email, 
             fo.name as folder_name, o.name as organization_name
      FROM files f 
      LEFT JOIN users u ON f.uploaded_by = u.id
      LEFT JOIN folders fo ON f.folder_id = fo.id
      LEFT JOIN organizations o ON f.organization_id = o.id
      ${whereClause}
      ORDER BY f.created_at DESC 
      LIMIT ? OFFSET ?
    `;

    const filesResult = await executeQuery(filesQuery, [...queryParams, parseInt(limit), offset]);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM files f 
      ${whereClause}
    `;

    const countResult = await executeQuery(countQuery, queryParams);

    if (!filesResult.success || !countResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch files'
      });
    }

    res.json({
      success: true,
      data: {
        files: filesResult.data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.data[0].total,
          pages: Math.ceil(countResult.data[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Upload file
router.post('/upload', verifyToken, upload.single('file'), validateFileUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { name, description, folderId } = req.body;
    const file = req.file;

    // Check organization storage quota
    const orgResult = await executeQuery(
      'SELECT storage_quota FROM organizations WHERE id = ?',
      [req.user.organization_id]
    );

    if (!orgResult.success || orgResult.data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Organization not found'
      });
    }

    const storageQuota = orgResult.data[0].storage_quota * 1024 * 1024; // Convert MB to bytes

    // Get current storage usage
    const usageResult = await executeQuery(
      'SELECT COALESCE(SUM(size), 0) as used FROM files WHERE organization_id = ? AND status = "active"',
      [req.user.organization_id]
    );

    const usedStorage = usageResult.success ? usageResult.data[0].used : 0;

    if (usedStorage + file.size > storageQuota) {
      // Delete uploaded file
      await fs.unlink(file.path);
      return res.status(400).json({
        success: false,
        message: 'File upload would exceed organization storage quota'
      });
    }

    // Validate folder if provided
    if (folderId) {
      const folderResult = await executeQuery(
        'SELECT id FROM folders WHERE id = ? AND organization_id = ? AND status = "active"',
        [folderId, req.user.organization_id]
      );

      if (!folderResult.success || folderResult.data.length === 0) {
        await fs.unlink(file.path);
        return res.status(400).json({
          success: false,
          message: 'Invalid folder'
        });
      }
    }

    // Create file record
    const fileResult = await executeQuery(
      'INSERT INTO files (name, original_name, path, size, type, description, organization_id, uploaded_by, folder_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name || file.originalname,
        file.originalname,
        file.path,
        file.size,
        path.extname(file.originalname).toLowerCase(),
        description,
        req.user.organization_id,
        req.user.id,
        folderId || null,
        'active'
      ]
    );

    if (!fileResult.success) {
      await fs.unlink(file.path);
      return res.status(500).json({
        success: false,
        message: 'Failed to save file record'
      });
    }

    // Log file upload
    await executeQuery(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'CREATE', 'FILE', fileResult.data.insertId, JSON.stringify({ name: name || file.originalname, size: file.size })]
    );

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileId: fileResult.data.insertId,
        name: name || file.originalname,
        size: file.size,
        type: path.extname(file.originalname).toLowerCase()
      }
    });
  } catch (error) {
    console.error('Upload file error:', error);
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete uploaded file:', unlinkError);
      }
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get file by ID
router.get('/:fileId', verifyToken, requireFileAccess, async (req, res) => {
  try {
    const { fileId } = req.params;

    const fileResult = await executeQuery(
      `SELECT f.*, u.first_name, u.last_name, u.email, 
              fo.name as folder_name, o.name as organization_name
       FROM files f 
       LEFT JOIN users u ON f.uploaded_by = u.id
       LEFT JOIN folders fo ON f.folder_id = fo.id
       LEFT JOIN organizations o ON f.organization_id = o.id
       WHERE f.id = ?`,
      [fileId]
    );

    if (!fileResult.success || fileResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.json({
      success: true,
      data: fileResult.data[0]
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Download file
router.get('/:fileId/download', verifyToken, requireFileAccess, async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!req.file.path || !await fs.access(req.file.path).then(() => true).catch(() => false)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on disk'
      });
    }

    // Log download
    await executeQuery(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'DOWNLOAD', 'FILE', fileId, JSON.stringify({ fileName: req.file.name })]
    );

    res.download(req.file.path, req.file.name);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update file
router.put('/:fileId', verifyToken, requireFileAccess, validateFileUpdate, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { name, description, folderId } = req.body;

    // Validate folder if provided
    if (folderId) {
      const folderResult = await executeQuery(
        'SELECT id FROM folders WHERE id = ? AND organization_id = ? AND status = "active"',
        [folderId, req.user.organization_id]
      );

      if (!folderResult.success || folderResult.data.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid folder'
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

    if (folderId !== undefined) {
      updateFields.push('folder_id = ?');
      updateValues.push(folderId);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateValues.push(fileId);

    const updateResult = await executeQuery(
      `UPDATE files SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update file'
      });
    }

    // Log the update
    await executeQuery(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'UPDATE', 'FILE', fileId, JSON.stringify({ updatedFields: updateFields })]
    );

    res.json({
      success: true,
      message: 'File updated successfully'
    });
  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete file
router.delete('/:fileId', verifyToken, requireFileAccess, async (req, res) => {
  try {
    const { fileId } = req.params;

    // Check if user has permission to delete (uploader or admin)
    if (req.file.uploaded_by !== req.user.id && !['organization_admin', 'platform_owner'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete files you uploaded'
      });
    }

    // Soft delete file
    const deleteResult = await executeQuery(
      'UPDATE files SET status = "deleted", deleted_at = NOW() WHERE id = ?',
      [fileId]
    );

    if (!deleteResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete file'
      });
    }

    // Log deletion
    await executeQuery(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'DELETE', 'FILE', fileId, JSON.stringify({ fileName: req.file.name })]
    );

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get folders
router.get('/folders/list', verifyToken, async (req, res) => {
  try {
    const { organizationId } = req.query;
    
    let whereClause = 'WHERE f.status = "active"';
    let queryParams = [];

    if (req.user.role === 'platform_owner' && organizationId) {
      whereClause += ' AND f.organization_id = ?';
      queryParams.push(organizationId);
    } else if (req.user.role !== 'platform_owner') {
      whereClause += ' AND f.organization_id = ?';
      queryParams.push(req.user.organization_id);
    }

    const foldersResult = await executeQuery(
      `SELECT f.*, u.first_name, u.last_name, 
              COUNT(files.id) as file_count,
              COALESCE(SUM(files.size), 0) as total_size
       FROM folders f 
       LEFT JOIN users u ON f.created_by = u.id
       LEFT JOIN files ON f.id = files.folder_id AND files.status = "active"
       ${whereClause}
       GROUP BY f.id
       ORDER BY f.name`,
      queryParams
    );

    if (!foldersResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch folders'
      });
    }

    res.json({
      success: true,
      data: foldersResult.data
    });
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create folder
router.post('/folders', verifyToken, validateFolder, async (req, res) => {
  try {
    const { name, description, parentId } = req.body;

    // Validate parent folder if provided
    if (parentId) {
      const parentResult = await executeQuery(
        'SELECT id FROM folders WHERE id = ? AND organization_id = ? AND status = "active"',
        [parentId, req.user.organization_id]
      );

      if (!parentResult.success || parentResult.data.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parent folder'
        });
      }
    }

    // Check if folder name already exists in the same parent
    const existingFolder = await executeQuery(
      'SELECT id FROM folders WHERE name = ? AND parent_id = ? AND organization_id = ? AND status = "active"',
      [name, parentId || null, req.user.organization_id]
    );

    if (existingFolder.success && existingFolder.data.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Folder with this name already exists in the same location'
      });
    }

    // Create folder
    const folderResult = await executeQuery(
      'INSERT INTO folders (name, description, organization_id, created_by, parent_id, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, req.user.organization_id, req.user.id, parentId || null, 'active']
    );

    if (!folderResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create folder'
      });
    }

    // Log folder creation
    await executeQuery(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'CREATE', 'FOLDER', folderResult.data.insertId, JSON.stringify({ name, parentId })]
    );

    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      data: {
        folderId: folderResult.data.insertId,
        name,
        description,
        parentId
      }
    });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get file statistics
router.get('/stats/overview', verifyToken, requireFileAccess, async (req, res) => {
  try {
    const { organizationId } = req.query;
    
    let whereClause = 'WHERE f.status = "active"';
    let queryParams = [];

    if (req.user.role === 'platform_owner' && organizationId) {
      whereClause += ' AND f.organization_id = ?';
      queryParams.push(organizationId);
    } else if (req.user.role !== 'platform_owner') {
      whereClause += ' AND f.organization_id = ?';
      queryParams.push(req.user.organization_id);
    }

    // Get file counts by type
    const typeStats = await executeQuery(
      `SELECT type, COUNT(*) as count, SUM(size) as total_size 
       FROM files f ${whereClause} 
       GROUP BY type`,
      queryParams
    );

    // Get total files and storage
    const totalStats = await executeQuery(
      `SELECT COUNT(*) as total_files, SUM(size) as total_size 
       FROM files f ${whereClause}`,
      queryParams
    );

    // Get recent uploads (last 30 days)
    const recentUploads = await executeQuery(
      `SELECT COUNT(*) as count 
       FROM files f ${whereClause} 
       AND f.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      queryParams
    );

    if (!typeStats.success || !totalStats.success || !recentUploads.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch file statistics'
      });
    }

    res.json({
      success: true,
      data: {
        totalFiles: totalStats.data[0].total_files,
        totalSize: totalStats.data[0].total_size || 0,
        typeStats: typeStats.data,
        recentUploads: recentUploads.data[0].count
      }
    });
  } catch (error) {
    console.error('Get file stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

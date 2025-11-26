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
    console.log('📁 [FILES] Get files request received', {
      user: req.user.email,
      role: req.user.role,
      organizationId: req.user.organization_id,
      query: req.query
    });
    const { page = 1, limit = 10, q: search, folderId, type, organizationId } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

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
      whereConditions.push('f.file_type = ?');
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

    console.log('📁 [FILES] Executing query with params:', {
      queryParams,
      limitNum,
      offset,
      totalParams: [...queryParams, limitNum, offset].length
    });
    
    const filesResult = await executeQuery(filesQuery, [...queryParams, limitNum, offset]);
    
    console.log('📁 [FILES] Files query result:', {
      success: filesResult.success,
      error: filesResult.error,
      dataLength: filesResult.data?.length || 0
    });

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM files f 
      ${whereClause}
    `;

    const countResult = await executeQuery(countQuery, queryParams);
    
    console.log('📁 [FILES] Count query result:', {
      success: countResult.success,
      error: countResult.error,
      total: countResult.data?.[0]?.total
    });

    if (!filesResult.success || !countResult.success) {
      console.error('📁 [FILES] Query failed:', {
        filesResult: filesResult.error || 'Unknown error',
        countResult: countResult.error || 'Unknown error',
        query: filesQuery,
        params: [...queryParams, limitNum, offset]
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch files',
        error: process.env.NODE_ENV === 'development' ? (filesResult.error || countResult.error) : undefined
      });
    }

    res.json({
      success: true,
      data: {
        files: filesResult.data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: countResult.data[0].total,
          pages: Math.ceil(countResult.data[0].total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('❌ [FILES] Get files error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      'SELECT COALESCE(SUM(file_size), 0) as used FROM files WHERE organization_id = ? AND status = "active"',
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
      'INSERT INTO files (name, original_name, storage_path, file_size, file_type, description, organization_id, uploaded_by, folder_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name || file.originalname,
        file.originalname,
        file.path,
        file.size,
        path.extname(file.originalname).toLowerCase(),
        description || null,
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
      'INSERT INTO audit_logs (user_id, organization_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, req.user.organization_id, 'CREATE', 'FILE', fileResult.data.insertId, JSON.stringify({ name: name || file.originalname, size: file.size })]
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
      'INSERT INTO audit_logs (user_id, organization_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, req.user.organization_id, 'DOWNLOAD', 'FILE', fileId, JSON.stringify({ fileName: req.file.name })]
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
      'INSERT INTO audit_logs (user_id, organization_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, req.user.organization_id, 'UPDATE', 'FILE', fileId, JSON.stringify({ updatedFields: updateFields })]
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

// Toggle star/favorite for file or folder
router.post('/star/:itemType/:itemId', verifyToken, async (req, res) => {
  try {
    const { itemType, itemId } = req.params; // itemType: 'file' or 'folder'

    if (!['file', 'folder'].includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item type'
      });
    }

    // Check if already starred
    const existingResult = await executeQuery(
      'SELECT id FROM starred_items WHERE user_id = ? AND item_type = ? AND item_id = ?',
      [req.user.id, itemType, itemId]
    );

    if (existingResult.success && existingResult.data.length > 0) {
      // Unstar - remove from starred_items
      await executeQuery(
        'DELETE FROM starred_items WHERE user_id = ? AND item_type = ? AND item_id = ?',
        [req.user.id, itemType, itemId]
      );

      return res.json({
        success: true,
        message: 'Item unstarred',
        data: { starred: false }
      });
    } else {
      // Star - add to starred_items
      await executeQuery(
        'INSERT INTO starred_items (user_id, item_type, item_id) VALUES (?, ?, ?)',
        [req.user.id, itemType, itemId]
      );

      return res.json({
        success: true,
        message: 'Item starred',
        data: { starred: true }
      });
    }
  } catch (error) {
    console.error('Toggle star error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get starred items
router.get('/starred/list', verifyToken, async (req, res) => {
  try {
    // Get starred files
    const starredFilesQuery = `
      SELECT f.*, u.first_name, u.last_name, u.email,
             fo.name as folder_name, o.name as organization_name,
             'file' as item_type,
             s.created_at as starred_at
      FROM starred_items s
      INNER JOIN files f ON s.item_id = f.id
      LEFT JOIN users u ON f.uploaded_by = u.id
      LEFT JOIN folders fo ON f.folder_id = fo.id
      LEFT JOIN organizations o ON f.organization_id = o.id
      WHERE s.user_id = ? AND s.item_type = 'file' AND f.status = 'active'
      ORDER BY s.created_at DESC
    `;

    const starredFilesResult = await executeQuery(starredFilesQuery, [req.user.id]);

    // Get starred folders
    const starredFoldersQuery = `
      SELECT fo.*, u.first_name, u.last_name,
             'folder' as item_type,
             s.created_at as starred_at,
             (SELECT COUNT(*) FROM files WHERE folder_id = fo.id AND status = 'active') as file_count,
             (SELECT COALESCE(SUM(file_size), 0) FROM files WHERE folder_id = fo.id AND status = 'active') as total_size
      FROM starred_items s
      INNER JOIN folders fo ON s.item_id = fo.id
      LEFT JOIN users u ON fo.created_by = u.id
      WHERE s.user_id = ? AND s.item_type = 'folder' AND fo.status = 'active'
      ORDER BY s.created_at DESC
    `;

    const starredFoldersResult = await executeQuery(starredFoldersQuery, [req.user.id]);

    if (!starredFilesResult.success || !starredFoldersResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch starred items'
      });
    }

    res.json({
      success: true,
      data: {
        files: starredFilesResult.data,
        folders: starredFoldersResult.data
      }
    });
  } catch (error) {
    console.error('Get starred items error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get deleted files (trash)
router.get('/trash/list', verifyToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['f.status = "deleted"'];
    let queryParams = [];

    // Filter by organization
    if (req.user.role !== 'platform_owner') {
      whereConditions.push('f.organization_id = ?');
      queryParams.push(req.user.organization_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get deleted files with pagination
    const filesQuery = `
      SELECT f.*, u.first_name, u.last_name, u.email, 
             fo.name as folder_name, o.name as organization_name
      FROM files f 
      LEFT JOIN users u ON f.uploaded_by = u.id
      LEFT JOIN folders fo ON f.folder_id = fo.id
      LEFT JOIN organizations o ON f.organization_id = o.id
      ${whereClause}
      ORDER BY f.deleted_at DESC 
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
        message: 'Failed to fetch deleted files'
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
    console.error('Get trash error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Restore file from trash
router.post('/:fileId/restore', verifyToken, requireFileAccess, async (req, res) => {
  try {
    const { fileId } = req.params;

    // Restore file
    const restoreResult = await executeQuery(
      'UPDATE files SET status = "active", deleted_at = NULL, deleted_by = NULL WHERE id = ?',
      [fileId]
    );

    if (!restoreResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to restore file'
      });
    }

    // Log restoration
    await executeQuery(
      'INSERT INTO audit_logs (user_id, organization_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, req.user.organization_id, 'RESTORE', 'FILE', fileId, JSON.stringify({ fileName: req.file.name })]
    );

    res.json({
      success: true,
      message: 'File restored successfully'
    });
  } catch (error) {
    console.error('Restore file error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Permanently delete file
router.delete('/:fileId/permanent', verifyToken, requireFileAccess, async (req, res) => {
  try {
    const { fileId } = req.params;

    // Check if file is already in trash
    if (req.file.status !== 'deleted') {
      return res.status(400).json({
        success: false,
        message: 'File must be in trash before permanent deletion'
      });
    }

    // Delete file from disk
    try {
      await fs.unlink(req.file.storage_path);
    } catch (unlinkError) {
      console.error('Failed to delete file from disk:', unlinkError);
      // Continue with database deletion even if file doesn't exist on disk
    }

    // Permanently delete from database
    const deleteResult = await executeQuery(
      'DELETE FROM files WHERE id = ?',
      [fileId]
    );

    if (!deleteResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to permanently delete file'
      });
    }

    // Log permanent deletion
    await executeQuery(
      'INSERT INTO audit_logs (user_id, organization_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, req.user.organization_id, 'PERMANENT_DELETE', 'FILE', fileId, JSON.stringify({ fileName: req.file.name })]
    );

    res.json({
      success: true,
      message: 'File permanently deleted'
    });
  } catch (error) {
    console.error('Permanent delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete file (soft delete - move to trash)
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
      'UPDATE files SET status = "deleted", deleted_at = NOW(), deleted_by = ? WHERE id = ?',
      [req.user.id, fileId]
    );

    if (!deleteResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete file'
      });
    }

    // Log deletion
    await executeQuery(
      'INSERT INTO audit_logs (user_id, organization_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, req.user.organization_id, 'DELETE', 'FILE', fileId, JSON.stringify({ fileName: req.file.name })]
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

    let whereConditions = ['folders.status = "active"'];
    let queryParams = [];

    // Filter by organization (platform owner can see all, others see their org)
    if (req.user.role === 'platform_owner' && organizationId) {
      whereConditions.push('folders.organization_id = ?');
      queryParams.push(organizationId);
    } else if (req.user.role !== 'platform_owner') {
      whereConditions.push('folders.organization_id = ?');
      queryParams.push(req.user.organization_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const foldersQuery = `
      SELECT folders.*, users.first_name, users.last_name,
             (SELECT COUNT(*) FROM files WHERE folder_id = folders.id AND status = 'active') as file_count,
             (SELECT COALESCE(SUM(file_size), 0) FROM files WHERE folder_id = folders.id AND status = 'active') as total_size
      FROM folders
      LEFT JOIN users ON folders.created_by = users.id
      ${whereClause}
      ORDER BY folders.created_at DESC
    `;

    const foldersResult = await executeQuery(foldersQuery, queryParams);

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
      'INSERT INTO audit_logs (user_id, organization_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, req.user.organization_id, 'CREATE', 'FOLDER', folderResult.data.insertId, JSON.stringify({ name, parentId })]
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
router.get('/stats/overview', verifyToken, async (req, res) => {
  try {
    const { organizationId } = req.query;

    let whereConditions = ['status = "active"'];
    let queryParams = [];

    // Filter by organization (platform owner can see all, others see their org)
    if (req.user.role === 'platform_owner' && organizationId) {
      whereConditions.push('organization_id = ?');
      queryParams.push(organizationId);
    } else if (req.user.role !== 'platform_owner') {
      whereConditions.push('organization_id = ?');
      queryParams.push(req.user.organization_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total files and size
    const totalQuery = `
      SELECT COUNT(*) as totalFiles, COALESCE(SUM(file_size), 0) as totalSize
      FROM files
      ${whereClause}
    `;

    const totalResult = await executeQuery(totalQuery, queryParams);

    // Get stats by file type
    const typeStatsQuery = `
      SELECT 
        file_type as type,
        COUNT(*) as count,
        COALESCE(SUM(file_size), 0) as total_size,
        COALESCE(AVG(file_size), 0) as avg_size
      FROM files
      ${whereClause}
      GROUP BY file_type
      ORDER BY count DESC
    `;

    const typeStatsResult = await executeQuery(typeStatsQuery, queryParams);

    // Get recent uploads (last 7 days)
    const recentQuery = `
      SELECT COUNT(*) as recentUploads
      FROM files
      ${whereClause} AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;

    const recentResult = await executeQuery(recentQuery, queryParams);

    if (!totalResult.success || !typeStatsResult.success || !recentResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch file statistics'
      });
    }

    res.json({
      success: true,
      data: {
        totalFiles: parseInt(totalResult.data[0].totalFiles) || 0,
        totalSize: parseInt(totalResult.data[0].totalSize) || 0,
        typeStats: typeStatsResult.data,
        recentUploads: parseInt(recentResult.data[0].recentUploads) || 0
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

// Clean up old deleted files (30+ days in trash)
router.post('/cleanup/old-trash', verifyToken, async (req, res) => {
  try {
    // Only allow platform owners to run cleanup
    if (req.user.role !== 'platform_owner') {
      return res.status(403).json({
        success: false,
        message: 'Only platform owners can run cleanup'
      });
    }

    // Find files deleted more than 30 days ago
    const oldFilesQuery = `
      SELECT id, storage_path, name
      FROM files
      WHERE status = 'deleted' AND deleted_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;

    const oldFilesResult = await executeQuery(oldFilesQuery);

    if (!oldFilesResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch old files'
      });
    }

    let deletedCount = 0;
    let errorCount = 0;

    // Delete each file from disk and database
    for (const file of oldFilesResult.data) {
      try {
        // Delete from disk
        try {
          await fs.unlink(file.storage_path);
        } catch (unlinkError) {
          console.error(`Failed to delete file from disk: ${file.storage_path}`, unlinkError);
        }

        // Delete from database
        await executeQuery('DELETE FROM files WHERE id = ?', [file.id]);
        
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete file ${file.id}:`, error);
        errorCount++;
      }
    }

    // Log cleanup
    await executeQuery(
      'INSERT INTO audit_logs (user_id, organization_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, req.user.organization_id, 'CLEANUP', 'SYSTEM', 0, JSON.stringify({ deletedCount, errorCount, type: 'auto_delete_old_trash' })]
    );

    res.json({
      success: true,
      message: `Cleanup completed: ${deletedCount} files deleted, ${errorCount} errors`,
      data: {
        deletedCount,
        errorCount
      }
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

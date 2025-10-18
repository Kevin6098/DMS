-- ============================================
-- Task Insight DMS - MySQL Database Schema
-- Version: 1.0
-- Description: Complete database schema for Document Management System
-- ============================================

-- Set charset and timezone
SET NAMES utf8mb4;
SET TIME_ZONE = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- DROP EXISTING TABLES (if exists)
-- ============================================

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS starred_items;
DROP TABLE IF EXISTS folder_shares;
DROP TABLE IF EXISTS file_shares;
DROP TABLE IF EXISTS file_versions;
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS folders;
DROP TABLE IF EXISTS invitation_codes;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS organizations;

-- ============================================
-- CORE TABLES
-- ============================================

-- Organizations Table
CREATE TABLE organizations (
    organization_id INT PRIMARY KEY AUTO_INCREMENT,
    organization_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    storage_quota BIGINT DEFAULT 107374182400, -- 100GB in bytes
    storage_used BIGINT DEFAULT 0,
    INDEX idx_org_name (organization_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users Table
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'member') NOT NULL DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    avatar_url VARCHAR(500) NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    INDEX idx_email (email),
    INDEX idx_org_user (organization_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invitation Codes Table
CREATE TABLE invitation_codes (
    invitation_id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    invitation_code VARCHAR(50) NOT NULL UNIQUE,
    generated_by INT NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_by INT NULL,
    used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (used_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_code (invitation_code),
    INDEX idx_org_codes (organization_id, is_used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FILE MANAGEMENT TABLES
-- ============================================

-- Folders Table
CREATE TABLE folders (
    folder_id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    folder_name VARCHAR(255) NOT NULL,
    parent_folder_id INT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_by INT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by INT NULL,
    path VARCHAR(1000) NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_folder_id) REFERENCES folders(folder_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (last_accessed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (deleted_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_org_folder (organization_id, is_deleted),
    INDEX idx_parent (parent_folder_id),
    INDEX idx_path (path),
    INDEX idx_last_accessed (last_accessed_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Files Table
CREATE TABLE files (
    file_id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    folder_id INT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_extension VARCHAR(20) NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NULL,
    storage_path VARCHAR(500) NOT NULL,
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_by INT NULL,
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by INT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by INT NULL,
    current_version INT DEFAULT 1,
    checksum VARCHAR(64) NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    FOREIGN KEY (folder_id) REFERENCES folders(folder_id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (last_accessed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (last_modified_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (deleted_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_org_file (organization_id, is_deleted),
    INDEX idx_folder (folder_id),
    INDEX idx_name (file_name),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_last_accessed (last_accessed_at DESC),
    INDEX idx_last_modified (last_modified_at DESC),
    FULLTEXT idx_fulltext_search (file_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- File Versions Table
CREATE TABLE file_versions (
    version_id INT PRIMARY KEY AUTO_INCREMENT,
    file_id INT NOT NULL,
    version_number INT NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version_note TEXT NULL,
    checksum VARCHAR(64) NULL,
    FOREIGN KEY (file_id) REFERENCES files(file_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_file_version (file_id, version_number),
    INDEX idx_file_versions (file_id, version_number DESC),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SHARING & PERMISSIONS TABLES
-- ============================================

-- File Shares Table
CREATE TABLE file_shares (
    share_id INT PRIMARY KEY AUTO_INCREMENT,
    file_id INT NOT NULL,
    shared_by INT NOT NULL,
    shared_with INT NULL,
    share_type ENUM('user', 'link', 'organization') NOT NULL DEFAULT 'user',
    permission_level ENUM('view', 'comment', 'edit') NOT NULL DEFAULT 'view',
    share_link VARCHAR(255) NULL UNIQUE,
    general_access ENUM('restricted', 'anyone_with_link', 'organization') DEFAULT 'restricted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (file_id) REFERENCES files(file_id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_file_shares (file_id, is_active),
    INDEX idx_shared_with (shared_with, is_active),
    INDEX idx_share_link (share_link)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Folder Shares Table
CREATE TABLE folder_shares (
    share_id INT PRIMARY KEY AUTO_INCREMENT,
    folder_id INT NOT NULL,
    shared_by INT NOT NULL,
    shared_with INT NULL,
    share_type ENUM('user', 'link', 'organization') NOT NULL DEFAULT 'user',
    permission_level ENUM('view', 'comment', 'edit') NOT NULL DEFAULT 'view',
    share_link VARCHAR(255) NULL UNIQUE,
    general_access ENUM('restricted', 'anyone_with_link', 'organization') DEFAULT 'restricted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (folder_id) REFERENCES folders(folder_id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_folder_shares (folder_id, is_active),
    INDEX idx_shared_with (shared_with, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- USER ACTIVITY TABLES
-- ============================================

-- Starred Items Table
CREATE TABLE starred_items (
    starred_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    item_type ENUM('file', 'folder') NOT NULL,
    item_id INT NOT NULL,
    starred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_starred (user_id, item_type, item_id),
    INDEX idx_user_starred (user_id, item_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SYSTEM TABLES
-- ============================================

-- User Sessions Table
CREATE TABLE user_sessions (
    session_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_token (session_token),
    INDEX idx_user_sessions (user_id, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Logs Table
CREATE TABLE audit_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    organization_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INT NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(organization_id) ON DELETE CASCADE,
    INDEX idx_user_logs (user_id, created_at DESC),
    INDEX idx_org_logs (organization_id, created_at DESC),
    INDEX idx_resource (resource_type, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VIEWS
-- ============================================

-- View for Recent Files
CREATE VIEW recent_files_view AS
SELECT 
    f.*,
    u_creator.full_name as creator_name,
    u_accessed.full_name as last_accessed_by_name
FROM files f
LEFT JOIN users u_creator ON f.uploaded_by = u_creator.user_id
LEFT JOIN users u_accessed ON f.last_accessed_by = u_accessed.user_id
WHERE f.is_deleted = FALSE
ORDER BY f.last_accessed_at DESC;

-- View for Recent Folders
CREATE VIEW recent_folders_view AS
SELECT 
    fo.*,
    u_creator.full_name as creator_name,
    u_accessed.full_name as last_accessed_by_name
FROM folders fo
LEFT JOIN users u_creator ON fo.created_by = u_creator.user_id
LEFT JOIN users u_accessed ON fo.last_accessed_by = u_accessed.user_id
WHERE fo.is_deleted = FALSE
ORDER BY fo.last_accessed_at DESC;

-- View for Shared Files
CREATE VIEW user_shared_files AS
SELECT 
    f.*,
    fs.permission_level,
    fs.shared_by,
    fs.shared_with,
    u_owner.full_name as owner_name,
    u_sharer.full_name as shared_by_name
FROM files f
INNER JOIN file_shares fs ON f.file_id = fs.file_id
LEFT JOIN users u_owner ON f.uploaded_by = u_owner.user_id
LEFT JOIN users u_sharer ON fs.shared_by = u_sharer.user_id
WHERE f.is_deleted = FALSE AND fs.is_active = TRUE;

-- View for User's Starred Items
CREATE VIEW user_starred_items_view AS
SELECT 
    si.user_id,
    si.item_type,
    si.item_id,
    si.starred_at,
    CASE 
        WHEN si.item_type = 'file' THEN f.file_name
        WHEN si.item_type = 'folder' THEN fo.folder_name
    END as item_name,
    CASE 
        WHEN si.item_type = 'file' THEN f.last_accessed_at
        WHEN si.item_type = 'folder' THEN fo.last_accessed_at
    END as last_accessed_at
FROM starred_items si
LEFT JOIN files f ON si.item_type = 'file' AND si.item_id = f.file_id
LEFT JOIN folders fo ON si.item_type = 'folder' AND si.item_id = fo.folder_id;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample organization
INSERT INTO organizations (organization_name, storage_quota, storage_used) 
VALUES ('Demo Organization', 107374182400, 0);

-- Insert sample admin user (password: admin123 - bcrypt hashed)
INSERT INTO users (organization_id, email, password_hash, full_name, role) 
VALUES (
    1, 
    'admin@demo.com', 
    '$2a$10$XQVZqxLqN5R5NX9xZJ5xNeqY5rGqLJKH8X4P4VN9K4yJ5K5K5K5K5', 
    'Admin User', 
    'admin'
);

-- Insert sample member user (password: member123 - bcrypt hashed)
INSERT INTO users (organization_id, email, password_hash, full_name, role) 
VALUES (
    1, 
    'member@demo.com', 
    '$2a$10$YRWVZrxMrO6S6OY0aK6yOfzZ6sHsMKLI9Y5Q5WO0L5zK6L6L6L6L6', 
    'Member User', 
    'member'
);

-- Insert sample invitation codes
INSERT INTO invitation_codes (organization_id, invitation_code, generated_by, expires_at) 
VALUES 
    (1, 'DEMO-2024-ABCD-1234', 1, DATE_ADD(NOW(), INTERVAL 30 DAY)),
    (1, 'DEMO-2024-EFGH-5678', 1, DATE_ADD(NOW(), INTERVAL 30 DAY)),
    (1, 'DEMO-2024-IJKL-9012', 1, DATE_ADD(NOW(), INTERVAL 30 DAY));

-- Insert sample root folder
INSERT INTO folders (organization_id, folder_name, parent_folder_id, created_by, path)
VALUES (1, 'Documents', NULL, 1, '/Documents');

-- Insert sample subfolder
INSERT INTO folders (organization_id, folder_name, parent_folder_id, created_by, path)
VALUES (1, 'Projects', 1, 1, '/Documents/Projects');

-- ============================================
-- USEFUL STORED PROCEDURES
-- ============================================

DELIMITER $$

-- Procedure to update organization storage
CREATE PROCEDURE update_organization_storage(
    IN p_organization_id INT
)
BEGIN
    UPDATE organizations
    SET storage_used = (
        SELECT COALESCE(SUM(file_size), 0)
        FROM files
        WHERE organization_id = p_organization_id AND is_deleted = FALSE
    )
    WHERE organization_id = p_organization_id;
END$$

-- Procedure to soft delete a file
CREATE PROCEDURE soft_delete_file(
    IN p_file_id INT,
    IN p_user_id INT
)
BEGIN
    UPDATE files
    SET is_deleted = TRUE,
        deleted_at = NOW(),
        deleted_by = p_user_id
    WHERE file_id = p_file_id;
END$$

-- Procedure to restore a file from trash
CREATE PROCEDURE restore_file(
    IN p_file_id INT
)
BEGIN
    UPDATE files
    SET is_deleted = FALSE,
        deleted_at = NULL,
        deleted_by = NULL
    WHERE file_id = p_file_id;
END$$

-- Procedure to permanently delete old trash items (older than 30 days)
CREATE PROCEDURE cleanup_trash()
BEGIN
    DELETE FROM files
    WHERE is_deleted = TRUE 
    AND deleted_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    DELETE FROM folders
    WHERE is_deleted = TRUE 
    AND deleted_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
END$$

-- Procedure to get recent items for a user
CREATE PROCEDURE get_recent_items(
    IN p_user_id INT,
    IN p_limit INT
)
BEGIN
    (SELECT 'file' as item_type, file_id as item_id, file_name as item_name, 
            last_accessed_at, last_accessed_by, created_at
     FROM files
     WHERE last_accessed_by = p_user_id AND is_deleted = FALSE)
    UNION ALL
    (SELECT 'folder' as item_type, folder_id as item_id, folder_name as item_name,
            last_accessed_at, last_accessed_by, created_at
     FROM folders
     WHERE last_accessed_by = p_user_id AND is_deleted = FALSE)
    ORDER BY last_accessed_at DESC
    LIMIT p_limit;
END$$

DELIMITER ;

-- ============================================
-- ENABLE FOREIGN KEY CHECKS
-- ============================================

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- END OF SCHEMA
-- ============================================


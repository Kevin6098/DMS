-- ============================================
-- Task Insight DMS - Single Database Setup
-- Version: 2.0
-- Description: Complete database setup for Document Management System
-- ============================================

-- Create single database

USE task_insight;

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
DROP TABLE IF EXISTS invitations;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS organizations;

-- ============================================
-- CORE TABLES
-- ============================================

-- Organizations Table
CREATE TABLE organizations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    storage_quota BIGINT DEFAULT 107374182400, -- 100GB in bytes
    storage_used BIGINT DEFAULT 0,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_org_name (name),
    INDEX idx_org_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users Table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    role ENUM('platform_owner', 'organization_admin', 'member') NOT NULL DEFAULT 'member',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    avatar_url VARCHAR(500) NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_email (email),
    INDEX idx_org_user (organization_id, id),
    INDEX idx_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invitations Table
CREATE TABLE invitations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    role ENUM('organization_admin', 'member') NOT NULL DEFAULT 'member',
    generated_by INT NOT NULL,
    status ENUM('active', 'used', 'expired', 'cancelled') DEFAULT 'active',
    used_by INT NULL,
    used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_code (code),
    INDEX idx_org_codes (organization_id, status),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FILE MANAGEMENT TABLES
-- ============================================

-- Folders Table
CREATE TABLE folders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    parent_id INT NULL,
    created_by INT NOT NULL,
    status ENUM('active', 'deleted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_by INT NULL,
    deleted_at TIMESTAMP NULL,
    deleted_by INT NULL,
    path VARCHAR(1000) NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (last_accessed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_org_folder (organization_id, status),
    INDEX idx_parent (parent_id),
    INDEX idx_path (path),
    INDEX idx_last_accessed (last_accessed_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Files Table
CREATE TABLE files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    folder_id INT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NULL,
    storage_path VARCHAR(500) NOT NULL,
    uploaded_by INT NOT NULL,
    status ENUM('active', 'deleted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_by INT NULL,
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by INT NULL,
    deleted_at TIMESTAMP NULL,
    deleted_by INT NULL,
    current_version INT DEFAULT 1,
    checksum VARCHAR(64) NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (last_accessed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (last_modified_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_org_file (organization_id, status),
    INDEX idx_folder (folder_id),
    INDEX idx_name (name),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_last_accessed (last_accessed_at DESC),
    INDEX idx_last_modified (last_modified_at DESC),
    FULLTEXT idx_fulltext_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- File Versions Table
CREATE TABLE file_versions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    file_id INT NOT NULL,
    version_number INT NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version_note TEXT NULL,
    checksum VARCHAR(64) NULL,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_file_version (file_id, version_number),
    INDEX idx_file_versions (file_id, version_number DESC),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SHARING & PERMISSIONS TABLES
-- ============================================

-- File Shares Table
CREATE TABLE file_shares (
    id INT PRIMARY KEY AUTO_INCREMENT,
    file_id INT NOT NULL,
    shared_by INT NOT NULL,
    shared_with INT NULL,
    share_type ENUM('user', 'link', 'organization') NOT NULL DEFAULT 'user',
    permission_level ENUM('view', 'comment', 'edit') NOT NULL DEFAULT 'view',
    share_link VARCHAR(255) NULL UNIQUE,
    general_access ENUM('restricted', 'anyone_with_link', 'organization') DEFAULT 'restricted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_file_shares (file_id, status),
    INDEX idx_shared_with (shared_with, status),
    INDEX idx_share_link (share_link)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Folder Shares Table
CREATE TABLE folder_shares (
    id INT PRIMARY KEY AUTO_INCREMENT,
    folder_id INT NOT NULL,
    shared_by INT NOT NULL,
    shared_with INT NULL,
    share_type ENUM('user', 'link', 'organization') NOT NULL DEFAULT 'user',
    permission_level ENUM('view', 'comment', 'edit') NOT NULL DEFAULT 'view',
    share_link VARCHAR(255) NULL UNIQUE,
    general_access ENUM('restricted', 'anyone_with_link', 'organization') DEFAULT 'restricted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_folder_shares (folder_id, status),
    INDEX idx_shared_with (shared_with, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- USER ACTIVITY TABLES
-- ============================================

-- Starred Items Table
CREATE TABLE starred_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    item_type ENUM('file', 'folder') NOT NULL,
    item_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_starred (user_id, item_type, item_id),
    INDEX idx_user_starred (user_id, item_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SYSTEM TABLES
-- ============================================

-- User Sessions Table
CREATE TABLE user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL 24 HOUR),
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (session_token),
    INDEX idx_user_sessions (user_id, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Logs Table
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    organization_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INT NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_user_logs (user_id, created_at DESC),
    INDEX idx_org_logs (organization_id, created_at DESC),
    INDEX idx_resource (resource_type, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Insert sample organization
INSERT INTO organizations (name, description, storage_quota, storage_used, status) 
VALUES ('Demo Organization', 'A demo organization for testing', 107374182400, 0, 'active');

-- Insert sample platform owner (password: admin123)
INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role, status) 
VALUES (
    1, 
    'owner@taskinsight.com', 
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4Qy6K5K5K5', 
    'Platform', 
    'Owner', 
    'platform_owner',
    'active'
);

-- Insert sample organization admin (password: admin123)
INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role, status) 
VALUES (
    1, 
    'admin@demo.com', 
    '$2a$12$XQVZqxLqN5R5NX9xZJ5xNeqY5rGqLJKH8X4P4VN9K4yJ5K5K5K5K5', 
    'Admin', 
    'User', 
    'organization_admin',
    'active'
);

-- Insert sample member user (password: member123)
INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role, status) 
VALUES (
    1, 
    'member@demo.com', 
    '$2a$12$YRWVZrxMrO6S6OY0aK6yOfzZ6sHsMKLI9Y5Q5WO0L5zK6L6L6L6L6', 
    'Member', 
    'User', 
    'member',
    'active'
);

-- Insert sample invitation codes
INSERT INTO invitations (organization_id, code, role, generated_by, expires_at, status) 
VALUES 
    (1, 'DEMO-2024-ABCD-1234', 'member', 2, DATE_ADD(NOW(), INTERVAL 30 DAY), 'active'),
    (1, 'DEMO-2024-EFGH-5678', 'member', 2, DATE_ADD(NOW(), INTERVAL 30 DAY), 'active'),
    (1, 'DEMO-2024-IJKL-9012', 'organization_admin', 2, DATE_ADD(NOW(), INTERVAL 30 DAY), 'active');

-- Insert sample root folder
INSERT INTO folders (organization_id, name, description, parent_id, created_by, path, status)
VALUES (1, 'Documents', 'Root documents folder', NULL, 2, '/Documents', 'active');

-- Insert sample subfolder
INSERT INTO folders (organization_id, name, description, parent_id, created_by, path, status)
VALUES (1, 'Projects', 'Projects folder', 1, 2, '/Documents/Projects', 'active');

-- ============================================
-- ENABLE FOREIGN KEY CHECKS
-- ============================================

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Show all tables created
SHOW TABLES;

-- Show sample data
SELECT 'Organizations:' as info;
SELECT * FROM organizations;

SELECT 'Users:' as info;
SELECT id, email, first_name, last_name, role, status FROM users;

SELECT 'Invitations:' as info;
SELECT code, role, status, expires_at FROM invitations;

SELECT 'Folders:' as info;
SELECT id, name, description, path, status FROM folders;

-- ============================================
-- END OF DATABASE SETUP
-- ============================================

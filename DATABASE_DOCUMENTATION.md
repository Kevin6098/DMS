# Task Insight DMS - Database Documentation

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Tables](#tables)
4. [Relationships](#relationships)
5. [Indexes](#indexes)
6. [Database Operations](#database-operations)
7. [Backup & Recovery](#backup--recovery)
8. [Performance Optimization](#performance-optimization)

---

## Overview

Task Insight DMS uses **MySQL 8.0+** as its primary database management system.

### Database Details

- **Database Name**: `task_insight`
- **Character Set**: `utf8mb4`
- **Collation**: `utf8mb4_unicode_ci`
- **Engine**: InnoDB (for all tables)
- **Timezone**: UTC

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐         ┌──────────────────┐
│  organizations  │←────────│      users       │
└────────┬────────┘         └─────────┬────────┘
         │                            │
         │                            │
         ├────────────────────────────┤
         │                            │
         ▼                            ▼
┌─────────────────┐         ┌──────────────────┐
│     folders     │         │      files       │
└─────────────────┘         └──────────────────┘
         │                            │
         └────────────┬───────────────┘
                      │
                      ▼
              ┌──────────────────┐
              │  file_shares     │
              └──────────────────┘

┌─────────────────────┐
│  invitation_codes   │
└─────────────────────┘

┌─────────────────────┐
│   audit_logs        │
└─────────────────────┘

┌─────────────────────┐
│   file_versions     │
└─────────────────────┘
```

---

## Tables

### 1. organizations

Stores organization information.

```sql
CREATE TABLE organizations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  address TEXT,
  storage_quota BIGINT DEFAULT 10737418240,
  current_storage BIGINT DEFAULT 0,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  settings JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Fields**:
- `id` - Unique identifier
- `name` - Organization name (unique)
- `description` - Organization description
- `contact_email` - Primary contact email
- `contact_phone` - Contact phone number
- `address` - Physical address
- `storage_quota` - Maximum storage in bytes (default: 10GB)
- `current_storage` - Current storage usage in bytes
- `status` - Organization status
- `settings` - JSON field for custom settings
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

### 2. users

Stores user account information.

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role ENUM('platform_owner', 'org_admin', 'member') DEFAULT 'member',
  organization_id INT,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  profile_picture VARCHAR(255),
  phone VARCHAR(50),
  last_login TIMESTAMP NULL,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  INDEX idx_email (email),
  INDEX idx_organization (organization_id),
  INDEX idx_role (role),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Fields**:
- `id` - Unique identifier
- `email` - User email address (unique)
- `password_hash` - Bcrypt hashed password
- `first_name` - User's first name
- `last_name` - User's last name
- `role` - User role (platform_owner, org_admin, member)
- `organization_id` - Associated organization
- `status` - Account status
- `profile_picture` - Profile picture URL
- `phone` - Phone number
- `last_login` - Last login timestamp
- `password_reset_token` - Token for password reset
- `password_reset_expires` - Password reset token expiration
- `email_verified` - Email verification status
- `verification_token` - Email verification token
- `failed_login_attempts` - Failed login counter
- `locked_until` - Account lock expiration
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

---

### 3. folders

Stores folder structure for file organization.

```sql
CREATE TABLE folders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  folder_name VARCHAR(255) NOT NULL,
  parent_id INT NULL,
  organization_id INT NOT NULL,
  created_by INT NOT NULL,
  description TEXT,
  path VARCHAR(1000),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_organization (organization_id),
  INDEX idx_parent (parent_id),
  INDEX idx_path (path(255)),
  INDEX idx_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Fields**:
- `id` - Unique identifier
- `folder_name` - Folder name
- `parent_id` - Parent folder ID (null for root folders)
- `organization_id` - Owner organization
- `created_by` - User who created the folder
- `description` - Folder description
- `path` - Full folder path for quick lookups
- `is_deleted` - Soft delete flag
- `deleted_at` - Deletion timestamp
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

### 4. files

Stores file metadata and information.

```sql
CREATE TABLE files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size BIGINT NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100),
  folder_id INT NULL,
  organization_id INT NOT NULL,
  uploaded_by INT NOT NULL,
  description TEXT,
  tags JSON,
  metadata JSON,
  checksum VARCHAR(64),
  version INT DEFAULT 1,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP NULL,
  deleted_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_organization (organization_id),
  INDEX idx_folder (folder_id),
  INDEX idx_uploader (uploaded_by),
  INDEX idx_file_type (file_type),
  INDEX idx_deleted (is_deleted),
  INDEX idx_checksum (checksum),
  FULLTEXT INDEX idx_fulltext (file_name, original_name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Fields**:
- `id` - Unique identifier
- `file_name` - Stored file name
- `original_name` - Original file name
- `file_type` - File extension
- `file_size` - File size in bytes
- `file_path` - Storage path
- `mime_type` - MIME type
- `folder_id` - Parent folder
- `organization_id` - Owner organization
- `uploaded_by` - Uploader user ID
- `description` - File description
- `tags` - JSON array of tags
- `metadata` - JSON metadata
- `checksum` - SHA-256 checksum
- `version` - Version number
- `is_deleted` - Soft delete flag
- `deleted_at` - Deletion timestamp
- `deleted_by` - User who deleted
- `created_at` - Upload timestamp
- `updated_at` - Last update timestamp

---

### 5. file_shares

Stores file sharing information.

```sql
CREATE TABLE file_shares (
  id INT PRIMARY KEY AUTO_INCREMENT,
  file_id INT NOT NULL,
  share_token VARCHAR(255) NOT NULL UNIQUE,
  shared_by INT NOT NULL,
  shared_with VARCHAR(255),
  permission ENUM('view', 'comment', 'edit') DEFAULT 'view',
  password_hash VARCHAR(255),
  expires_at TIMESTAMP NULL,
  access_count INT DEFAULT 0,
  last_accessed TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_share_token (share_token),
  INDEX idx_file (file_id),
  INDEX idx_expires (expires_at),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Fields**:
- `id` - Unique identifier
- `file_id` - Shared file ID
- `share_token` - Unique share token
- `shared_by` - User who created the share
- `shared_with` - Email of recipient (optional)
- `permission` - Share permission level
- `password_hash` - Optional password protection
- `expires_at` - Share expiration
- `access_count` - Number of times accessed
- `last_accessed` - Last access timestamp
- `is_active` - Active status
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

### 6. file_versions

Stores file version history.

```sql
CREATE TABLE file_versions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  file_id INT NOT NULL,
  version_number INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  checksum VARCHAR(64),
  uploaded_by INT NOT NULL,
  change_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_file (file_id),
  INDEX idx_version (file_id, version_number),
  UNIQUE KEY unique_file_version (file_id, version_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 7. invitation_codes

Stores invitation codes for user registration.

```sql
CREATE TABLE invitation_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  organization_id INT NOT NULL,
  role ENUM('org_admin', 'member') DEFAULT 'member',
  status ENUM('unused', 'used', 'expired') DEFAULT 'unused',
  max_uses INT DEFAULT 1,
  current_uses INT DEFAULT 0,
  used_by INT NULL,
  used_at TIMESTAMP NULL,
  expires_at TIMESTAMP NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_code (code),
  INDEX idx_organization (organization_id),
  INDEX idx_status (status),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 8. audit_logs

Stores audit trail of all system activities.

```sql
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NULL,
  organization_id INT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INT,
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_data JSON,
  response_data JSON,
  status ENUM('success', 'failure', 'warning') DEFAULT 'success',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_organization (organization_id),
  INDEX idx_action (action),
  INDEX idx_resource (resource_type, resource_id),
  INDEX idx_created (created_at),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Relationships

### One-to-Many Relationships

1. **organizations → users**
   - One organization can have many users
   - `users.organization_id` → `organizations.id`

2. **organizations → folders**
   - One organization can have many folders
   - `folders.organization_id` → `organizations.id`

3. **organizations → files**
   - One organization can have many files
   - `files.organization_id` → `organizations.id`

4. **users → files**
   - One user can upload many files
   - `files.uploaded_by` → `users.id`

5. **folders → folders** (Self-referencing)
   - One folder can have many subfolders
   - `folders.parent_id` → `folders.id`

6. **folders → files**
   - One folder can contain many files
   - `files.folder_id` → `folders.id`

7. **files → file_shares**
   - One file can have many shares
   - `file_shares.file_id` → `files.id`

8. **files → file_versions**
   - One file can have many versions
   - `file_versions.file_id` → `files.id`

9. **organizations → invitation_codes**
   - One organization can have many invitation codes
   - `invitation_codes.organization_id` → `organizations.id`

---

## Indexes

### Primary Indexes
- All tables have a primary key on `id` field

### Foreign Key Indexes
- All foreign key relationships are indexed for performance

### Custom Indexes

1. **users**
   - `idx_email` - Fast user lookup by email
   - `idx_organization` - Filter users by organization
   - `idx_role` - Filter users by role
   - `idx_status` - Filter by account status

2. **files**
   - `idx_organization` - Filter files by organization
   - `idx_folder` - Files in folder lookup
   - `idx_file_type` - Filter by file type
   - `idx_fulltext` - Full-text search on file name and description
   - `idx_checksum` - Duplicate detection

3. **folders**
   - `idx_organization` - Folders by organization
   - `idx_parent` - Subfolder lookups
   - `idx_path` - Quick path-based lookups

4. **file_shares**
   - `idx_share_token` - Share link validation
   - `idx_expires` - Cleanup expired shares

5. **audit_logs**
   - `idx_created` - Time-based queries
   - `idx_action` - Filter by action type
   - `idx_resource` - Composite index for resource lookups

---

## Database Operations

### Initialization

```bash
# Create database
mysql -u root -p < setup_database.sql

# Run migrations
mysql -u root -p task_insight < migrations/001_initial_schema.sql
```

### Common Queries

#### Get user with organization details
```sql
SELECT u.*, o.name as organization_name, o.storage_quota
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
WHERE u.id = ?;
```

#### Get files in folder with uploader info
```sql
SELECT f.*, u.first_name, u.last_name,
       CONCAT(u.first_name, ' ', u.last_name) as uploader_name
FROM files f
JOIN users u ON f.uploaded_by = u.id
WHERE f.folder_id = ? AND f.is_deleted = FALSE
ORDER BY f.created_at DESC;
```

#### Calculate organization storage usage
```sql
SELECT organization_id, SUM(file_size) as total_storage
FROM files
WHERE is_deleted = FALSE
GROUP BY organization_id;
```

#### Get folder path
```sql
WITH RECURSIVE folder_path AS (
  SELECT id, folder_name, parent_id, folder_name as path
  FROM folders
  WHERE id = ?
  UNION ALL
  SELECT f.id, f.folder_name, f.parent_id,
         CONCAT(f.folder_name, '/', fp.path) as path
  FROM folders f
  JOIN folder_path fp ON f.id = fp.parent_id
)
SELECT path FROM folder_path WHERE parent_id IS NULL;
```

---

## Backup & Recovery

### Backup Strategies

#### Full Backup (Daily)
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p task_insight > backup_${DATE}.sql
gzip backup_${DATE}.sql
```

#### Incremental Backup (Hourly)
```bash
# Enable binary logging in my.cnf
log-bin=mysql-bin
expire_logs_days=7

# Flush binary logs
mysqladmin -u root -p flush-logs
```

### Restore from Backup

```bash
# Restore full backup
mysql -u root -p task_insight < backup_20240115_120000.sql

# Restore to specific time using binary logs
mysqlbinlog mysql-bin.000001 | mysql -u root -p task_insight
```

---

## Performance Optimization

### Query Optimization Tips

1. **Use EXPLAIN** to analyze query performance
```sql
EXPLAIN SELECT * FROM files WHERE organization_id = 1;
```

2. **Add composite indexes** for frequently joined columns
```sql
CREATE INDEX idx_org_folder ON files(organization_id, folder_id);
```

3. **Optimize full-text searches**
```sql
SELECT * FROM files
WHERE MATCH(file_name, description) AGAINST('search term' IN NATURAL LANGUAGE MODE);
```

### Configuration Tuning

**my.cnf / my.ini**:
```ini
[mysqld]
# InnoDB Buffer Pool (70-80% of RAM)
innodb_buffer_pool_size = 4G

# Connection Settings
max_connections = 200
max_allowed_packet = 256M

# Query Cache
query_cache_type = 1
query_cache_size = 256M

# Binary Logging
log_bin = mysql-bin
expire_logs_days = 7

# Slow Query Log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2
```

### Maintenance Tasks

#### Daily Tasks
```sql
-- Optimize tables
OPTIMIZE TABLE files, folders, users;

-- Analyze tables
ANALYZE TABLE files, folders, users;
```

#### Weekly Tasks
```sql
-- Check tables for errors
CHECK TABLE files, folders, users;

-- Clean up soft-deleted records older than 30 days
DELETE FROM files WHERE is_deleted = TRUE AND deleted_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

#### Monthly Tasks
```sql
-- Update statistics
ANALYZE TABLE files, folders, users, organizations;

-- Archive old audit logs
INSERT INTO audit_logs_archive SELECT * FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);
DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);
```

---

## Security Best Practices

1. **Use prepared statements** for all queries
2. **Encrypt sensitive data** at rest
3. **Regular security audits** of database access
4. **Principle of least privilege** for database users
5. **Enable SSL** for database connections
6. **Regular password rotation** for database accounts
7. **Monitor and log** all database access
8. **Keep MySQL updated** to the latest stable version

---

## Troubleshooting

### Common Issues

#### Connection Pool Exhaustion
```sql
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Threads_connected';
```

#### Slow Queries
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Check slow queries
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;
```

#### Disk Space Issues
```sql
-- Check table sizes
SELECT table_name, 
       ROUND((data_length + index_length) / 1024 / 1024, 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'task_insight'
ORDER BY (data_length + index_length) DESC;
```

---

## Contact & Support

For database-related questions:
- Email: database@taskinsight.com
- Documentation: https://docs.taskinsight.com/database
- GitHub: https://github.com/taskinsight/dms

---

**Last Updated**: January 2024  
**Database Version**: MySQL 8.0+


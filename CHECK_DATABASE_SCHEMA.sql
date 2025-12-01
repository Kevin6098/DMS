-- Check if all required columns exist in tables
-- Run this to verify your database schema matches what the code expects

-- Check organizations table
DESCRIBE organizations;
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'task_insight' AND TABLE_NAME = 'organizations'
ORDER BY ORDINAL_POSITION;

-- Check users table
DESCRIBE users;
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'task_insight' AND TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;

-- Check files table
DESCRIBE files;
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'task_insight' AND TABLE_NAME = 'files'
ORDER BY ORDINAL_POSITION;

-- Check audit_logs table
DESCRIBE audit_logs;
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'task_insight' AND TABLE_NAME = 'audit_logs'
ORDER BY ORDINAL_POSITION;

-- Test the dashboard stats query directly
SELECT 
  (SELECT COUNT(*) FROM organizations WHERE status = 'active') as active_organizations,
  (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
  (SELECT COUNT(*) FROM files WHERE status = 'active') as total_files,
  (SELECT COALESCE(SUM(file_size), 0) FROM files WHERE status = 'active') as total_storage_used,
  (SELECT SUM(storage_quota) FROM organizations WHERE status = 'active') as total_storage_quota;


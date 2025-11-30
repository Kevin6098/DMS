-- ============================================
-- Migration: Combine Invitations into Organizations
-- Description: Move invitation fields to organizations table and remove unused tables
-- ============================================

USE task_insight;

-- Step 1: Add invitation fields to organizations table
ALTER TABLE organizations
ADD COLUMN invitation_code VARCHAR(50) NULL UNIQUE AFTER status,
ADD COLUMN invitation_role ENUM('organization_admin', 'member') DEFAULT 'member' AFTER invitation_code,
ADD COLUMN invitation_expires_at TIMESTAMP NULL AFTER invitation_role,
ADD COLUMN invitation_generated_by INT NULL AFTER invitation_expires_at,
ADD INDEX idx_invitation_code (invitation_code),
ADD FOREIGN KEY (invitation_generated_by) REFERENCES users(id) ON DELETE SET NULL;

-- Step 2: Migrate existing invitation data to organizations
-- Update organizations with their active invitation codes (if any exist)
UPDATE organizations o
INNER JOIN (
    SELECT 
        organization_id,
        code,
        role,
        expires_at,
        generated_by
    FROM invitations
    WHERE status = 'active'
    ORDER BY created_at DESC
) i ON o.id = i.organization_id
SET 
    o.invitation_code = i.code,
    o.invitation_role = i.role,
    o.invitation_expires_at = i.expires_at,
    o.invitation_generated_by = i.generated_by;

-- Step 3: Disable foreign key checks temporarily to drop tables
SET FOREIGN_KEY_CHECKS = 0;

-- Step 4: Drop invitations table
DROP TABLE IF EXISTS invitations;

-- Step 5: Drop user_sessions table (not used)
DROP TABLE IF EXISTS user_sessions;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- Verification
-- ============================================
SELECT 'Organizations with invitation codes:' as info;
SELECT id, name, invitation_code, invitation_role, invitation_expires_at 
FROM organizations 
WHERE invitation_code IS NOT NULL;

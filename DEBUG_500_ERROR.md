# Debug 500 Error - Step by Step

Since all tables exist, the issue is likely:
1. Missing columns in tables
2. SQL query syntax error
3. Data type mismatch
4. Null/division by zero errors

## Step 1: Check the Actual Error

**Most Important:** Get the exact error message from logs:

```bash
pm2 logs dms-backend --lines 100 | grep -i error
```

Or check the error log file:
```bash
tail -50 /root/.pm2/logs/dms-backend-error.log
```

**Look for:**
- "Unknown column"
- "Table doesn't exist"
- "Division by zero"
- "Incorrect syntax"
- Any SQL error messages

## Step 2: Check Table Structure

Run this in MySQL to verify columns exist:

```bash
mysql -u your_db_user -p task_insight
```

Then run:
```sql
-- Check organizations table
DESCRIBE organizations;

-- Check users table  
DESCRIBE users;

-- Check files table
DESCRIBE files;

-- Check audit_logs table
DESCRIBE audit_logs;
```

**Or use the provided script:**
```bash
mysql -u your_db_user -p task_insight < CHECK_DATABASE_SCHEMA.sql
```

## Step 3: Test the Dashboard Query Directly

Test if the SQL query works in MySQL:

```bash
mysql -u your_db_user -p task_insight
```

```sql
-- Test the exact query from the dashboard stats endpoint
SELECT 
  (SELECT COUNT(*) FROM organizations WHERE status = 'active') as active_organizations,
  (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
  (SELECT COUNT(*) FROM files WHERE status = 'active') as total_files,
  (SELECT COALESCE(SUM(file_size), 0) FROM files WHERE status = 'active') as total_storage_used,
  (SELECT SUM(storage_quota) FROM organizations WHERE status = 'active') as total_storage_quota;
```

**If this query fails, you'll see the exact error.**

## Step 4: Common Issues & Fixes

### Issue 1: Missing `status` column
**Error:** "Unknown column 'status'"

**Fix:** Add status column:
```sql
ALTER TABLE organizations ADD COLUMN status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
ALTER TABLE files ADD COLUMN status VARCHAR(20) DEFAULT 'active';
```

### Issue 2: Missing `storage_quota` column
**Error:** "Unknown column 'storage_quota'"

**Fix:**
```sql
ALTER TABLE organizations ADD COLUMN storage_quota BIGINT DEFAULT 10737418240; -- 10GB default
```

### Issue 3: Missing `file_size` column
**Error:** "Unknown column 'file_size'"

**Fix:**
```sql
ALTER TABLE files ADD COLUMN file_size BIGINT DEFAULT 0;
```

### Issue 4: Division by zero
**Error:** "Division by zero" (when storage_quota is 0)

**Fix:** The query should handle this, but check if organizations have storage_quota set:
```sql
SELECT id, name, storage_quota FROM organizations WHERE storage_quota IS NULL OR storage_quota = 0;

-- Fix null/zero quotas
UPDATE organizations SET storage_quota = 10737418240 WHERE storage_quota IS NULL OR storage_quota = 0;
```

## Step 5: Test the API Endpoint Directly

Get your JWT token and test the endpoint:

```bash
# First, login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your_email@example.com","password":"your_password"}' \
  | jq -r '.data.token'

# Then test dashboard endpoint (replace TOKEN with actual token)
TOKEN="your_token_here"
curl -X GET http://localhost:5000/api/admin/dashboard/stats \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

This will show you the exact error response.

## Step 6: Check Backend Code vs Database

The dashboard stats endpoint queries these columns:
- `organizations.status`
- `organizations.storage_quota`
- `users.status`
- `files.status`
- `files.file_size`
- `audit_logs.created_at`
- `audit_logs.action`

**Verify all these columns exist:**
```sql
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'task_insight' 
  AND TABLE_NAME IN ('organizations', 'users', 'files', 'audit_logs')
  AND COLUMN_NAME IN ('status', 'storage_quota', 'file_size', 'created_at', 'action');
```

## Quick Fix Script

If you want to add missing columns quickly:

```sql
-- Add status columns if missing
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE files ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add storage_quota if missing
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS storage_quota BIGINT DEFAULT 10737418240;

-- Add file_size if missing
ALTER TABLE files ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;

-- Update existing rows
UPDATE organizations SET status = 'active' WHERE status IS NULL;
UPDATE users SET status = 'active' WHERE status IS NULL;
UPDATE files SET status = 'active' WHERE status IS NULL;
UPDATE organizations SET storage_quota = 10737418240 WHERE storage_quota IS NULL OR storage_quota = 0;
```

## Next Steps

1. **Run the error log check** to get the exact error
2. **Test the SQL query directly** in MySQL
3. **Check table structure** matches what the code expects
4. **Share the error message** so we can fix it precisely

The most important thing is to see the actual error from `pm2 logs` - that will tell us exactly what's wrong!


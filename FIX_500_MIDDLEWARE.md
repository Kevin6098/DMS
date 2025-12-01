# Fix 500 Error - Middleware/Code Issue

Since the SQL query works directly in MySQL, the issue is in the Node.js backend code, not the database.

## Most Likely Causes

### 1. Middleware Authentication Issue
The `requirePlatformOwner` middleware might be failing.

**Check if user has platform_owner role:**
```sql
SELECT id, email, role FROM users WHERE role = 'platform_owner';
```

**If no platform owner exists, create one:**
```sql
-- Update an existing user to platform_owner
UPDATE users SET role = 'platform_owner' WHERE email = 'your_admin_email@example.com';
```

### 2. Query Result Processing Error
The code might be trying to access `data[0]` when the result is empty or has a different structure.

**Check the actual error in logs:**
```bash
pm2 logs dms-backend --lines 100
```

Look for:
- "Cannot read property 'data' of undefined"
- "Cannot read property '0' of undefined"
- Any JavaScript errors

### 3. JWT Token Issue
The token might be invalid or expired.

**Test with a fresh login:**
1. Logout and login again
2. Check if token is being sent in headers
3. Verify JWT_SECRET is set in .env

## Step-by-Step Debug

### Step 1: Check Backend Logs for Exact Error
```bash
pm2 logs dms-backend --lines 100 | grep -A 10 -i error
```

**This is the most important step** - it will show the exact JavaScript error.

### Step 2: Test Authentication
```bash
# Login to get a token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your_email@example.com","password":"your_password"}'

# Copy the token from response, then test dashboard endpoint
TOKEN="your_token_here"
curl -X GET http://localhost:5000/api/admin/dashboard/stats \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -v
```

The `-v` flag will show detailed response including the error message.

### Step 3: Check User Role
```sql
-- Check your user's role
SELECT id, email, role, status FROM users WHERE email = 'your_email@example.com';

-- If role is not 'platform_owner', update it:
UPDATE users SET role = 'platform_owner' WHERE email = 'your_email@example.com';
```

### Step 4: Add Debug Logging
Temporarily add console.log to see what's happening:

Edit `/root/projects/dms/backend/routes/admin.js` around line 9-20:

```javascript
router.get('/dashboard/stats', verifyToken, requirePlatformOwner, async (req, res) => {
  try {
    console.log('📊 [DASHBOARD STATS] Request received', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role
    });
    
    // Get platform overview statistics
    const platformStats = await executeQuery(`
      SELECT 
        (SELECT COUNT(*) FROM organizations WHERE status = 'active') as active_organizations,
        (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
        (SELECT COUNT(*) FROM files WHERE status = 'active') as total_files,
        (SELECT COALESCE(SUM(file_size), 0) FROM files WHERE status = 'active') as total_storage_used,
        (SELECT SUM(storage_quota) FROM organizations WHERE status = 'active') as total_storage_quota
    `);
    
    console.log('📊 [DASHBOARD STATS] platformStats result:', {
      success: platformStats.success,
      hasData: !!platformStats.data,
      dataLength: platformStats.data?.length,
      firstItem: platformStats.data?.[0]
    });
    
    // ... rest of the code
```

Then restart and check logs:
```bash
pm2 restart dms-backend
pm2 logs dms-backend --lines 50
```

## Common Fixes

### Fix 1: User Not Platform Owner
```sql
-- Make your user a platform owner
UPDATE users SET role = 'platform_owner' WHERE email = 'your_email@example.com';
```

### Fix 2: Check executeQuery Return Format
The `executeQuery` function might be returning a different format. Check `backend/config/database.js`:

```javascript
// Should return: { success: true, data: results }
// If it returns something else, that's the issue
```

### Fix 3: Add Null Checks
If `platformStats.data[0]` is undefined, add a check:

```javascript
if (!platformStats.success || !platformStats.data || platformStats.data.length === 0) {
  return res.status(500).json({
    success: false,
    message: 'Failed to fetch dashboard statistics'
  });
}
```

## Quick Test Script

Create a test file to debug:

```bash
cd /root/projects/dms/backend
cat > test-dashboard.js << 'EOF'
require('dotenv').config();
const { executeQuery } = require('./config/database');

(async () => {
  console.log('Testing dashboard query...');
  
  try {
    const platformStats = await executeQuery(`
      SELECT 
        (SELECT COUNT(*) FROM organizations WHERE status = 'active') as active_organizations,
        (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
        (SELECT COUNT(*) FROM files WHERE status = 'active') as total_files,
        (SELECT COALESCE(SUM(file_size), 0) FROM files WHERE status = 'active') as total_storage_used,
        (SELECT SUM(storage_quota) FROM organizations WHERE status = 'active') as total_storage_quota
    `);
    
    console.log('Result:', JSON.stringify(platformStats, null, 2));
    console.log('Success:', platformStats.success);
    console.log('Has data:', !!platformStats.data);
    console.log('Data length:', platformStats.data?.length);
    console.log('First item:', platformStats.data?.[0]);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
  
  process.exit(0);
})();
EOF

node test-dashboard.js
```

## Next Steps

1. **Check the actual error from logs** - This is the most important!
2. **Verify user role** - Make sure you're logged in as platform_owner
3. **Test the endpoint directly** - Use curl to see the exact error response
4. **Add debug logging** - See what's happening in the code

The error message from `pm2 logs` will tell us exactly what's wrong!


# Fix 500 Error - Dashboard Data Loading

## Problem
The dashboard is getting a 500 (Internal Server Error) when trying to load data. This works locally but fails on the production server.

## Common Causes

### 1. Database Connection Issues
The most common cause is database connection problems.

**Check database connection:**
```bash
# SSH into your server
ssh user@your-server

# Test MySQL connection
mysql -u your_db_user -p -h localhost your_database

# If this fails, check:
# - Database credentials in .env file
# - MySQL service is running: systemctl status mysql
```

**Verify .env file has correct database settings:**
```env
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_database
DB_PORT=3306
```

### 2. Missing Database Tables
The queries might be failing because tables don't exist.

**Check if tables exist:**
```bash
mysql -u your_db_user -p your_database

# Then run:
SHOW TABLES;

# Should show:
# - users
# - organizations
# - files
# - folders
# - audit_logs
# - etc.
```

**If tables are missing, run your migration scripts:**
```bash
cd /root/projects/dms/backend
mysql -u your_db_user -p your_database < setup_database.sql
# or
mysql -u your_db_user -p your_database < migration_combine_invitations.sql
```

### 3. Database User Permissions
The database user might not have proper permissions.

**Check and grant permissions:**
```bash
mysql -u root -p

# Then:
GRANT ALL PRIVILEGES ON your_database.* TO 'your_db_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. SQL Query Errors
Check the backend logs for specific SQL errors.

**View detailed error logs:**
```bash
pm2 logs dms-backend --lines 50

# Look for SQL errors like:
# - "Table 'database.table' doesn't exist"
# - "Access denied"
# - "Unknown column"
```

### 5. Environment Variables Not Set
Check if all required environment variables are set.

**Check .env file:**
```bash
cd /root/projects/dms/backend
cat .env

# Should have:
# - DB_HOST
# - DB_USER
# - DB_PASSWORD
# - DB_NAME
# - JWT_SECRET
# - PORT
# - CORS_ORIGIN
```

**If .env is missing or incomplete:**
```bash
# Copy from your local .env or create new one
nano .env

# Add all required variables
```

### 6. Check Backend Logs for Specific Error
The most important step is to see the actual error.

```bash
# View real-time logs
pm2 logs dms-backend --lines 100

# Or check error log file
tail -f /root/.pm2/logs/dms-backend-error.log

# Look for:
# - SQL errors
# - Connection errors
# - Missing module errors
# - Permission errors
```

## Step-by-Step Fix

### Step 1: Check Backend Logs
```bash
pm2 logs dms-backend --lines 50
```

**Look for the actual error message** - this will tell you exactly what's wrong.

### Step 2: Test Database Connection
```bash
cd /root/projects/dms/backend
node -e "
require('dotenv').config();
const mysql = require('mysql2/promise');
(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log('✅ Database connection successful!');
    await conn.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
})();
"
```

### Step 3: Test the API Endpoint Directly
```bash
# Get your JWT token from browser localStorage or login
TOKEN="your_jwt_token_here"

# Test the dashboard stats endpoint
curl -X GET http://localhost:5000/api/admin/dashboard/stats \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# This will show you the exact error
```

### Step 4: Check Database Tables
```bash
mysql -u your_db_user -p your_database -e "SHOW TABLES;"
```

**If tables are missing:**
```bash
# Run your setup script
mysql -u your_db_user -p your_database < setup_database.sql
```

### Step 5: Verify Environment Variables
```bash
cd /root/projects/dms/backend

# Check if .env exists
ls -la .env

# View .env (be careful with passwords)
cat .env | grep -v PASSWORD

# Make sure all required vars are set
```

## Common Error Messages & Solutions

### "Table 'database.table' doesn't exist"
**Solution:** Run your database migration scripts
```bash
mysql -u your_db_user -p your_database < setup_database.sql
```

### "Access denied for user"
**Solution:** Check database credentials and permissions
```bash
# Verify credentials
mysql -u your_db_user -p your_database

# If fails, check password or grant permissions
```

### "ER_NOT_SUPPORTED_AUTH_MODE"
**Solution:** Update MySQL user authentication
```bash
mysql -u root -p
ALTER USER 'your_db_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

### "Connection refused" or "ECONNREFUSED"
**Solution:** MySQL service not running
```bash
systemctl status mysql
# or
systemctl status mariadb

# Start if not running
systemctl start mysql
```

### "Unknown column 'column_name'"
**Solution:** Database schema mismatch - run migrations
```bash
mysql -u your_db_user -p your_database < migration_combine_invitations.sql
```

## Quick Diagnostic Script

Create a test file to diagnose the issue:

```bash
cd /root/projects/dms/backend
cat > test-db.js << 'EOF'
require('dotenv').config();
const { executeQuery } = require('./config/database');

(async () => {
  console.log('Testing database connection...');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_NAME:', process.env.DB_NAME);
  
  try {
    // Test simple query
    const result = await executeQuery('SELECT 1 as test');
    console.log('✅ Database connection works!', result);
    
    // Test if tables exist
    const tables = await executeQuery('SHOW TABLES');
    console.log('✅ Tables found:', tables.data.length);
    
    // Test dashboard query
    const stats = await executeQuery(`
      SELECT 
        (SELECT COUNT(*) FROM organizations WHERE status = 'active') as active_organizations,
        (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users
    `);
    console.log('✅ Dashboard query works!', stats.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
  
  process.exit(0);
})();
EOF

node test-db.js
```

## After Fixing

1. **Restart the backend:**
   ```bash
   pm2 restart dms-backend
   ```

2. **Check logs:**
   ```bash
   pm2 logs dms-backend --lines 20
   ```

3. **Test the endpoint:**
   ```bash
   curl http://localhost:5000/api/health
   ```

4. **Try logging in again from the frontend**

## Prevention

1. **Always run migrations after deployment:**
   ```bash
   mysql -u your_db_user -p your_database < setup_database.sql
   ```

2. **Verify .env file is set correctly:**
   ```bash
   # Compare with local .env
   diff .env.local .env.production
   ```

3. **Test database connection before starting backend:**
   ```bash
   # Add to your deployment script
   node test-db.js && pm2 restart dms-backend
   ```

4. **Monitor logs regularly:**
   ```bash
   pm2 logs dms-backend --lines 50
   ```


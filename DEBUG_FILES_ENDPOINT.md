# Debug 500 Error on /api/files Endpoint

## Quick Debugging Steps

### Step 1: Check Backend Logs (Most Important!)

SSH into your VPS and check the backend logs:

```bash
# Check the latest error logs
pm2 logs dms-backend --err --lines 50

# Check all logs (both output and errors)
pm2 logs dms-backend --lines 100

# Follow logs in real-time
pm2 logs dms-backend --lines 20
```

**Look for:**
- `📁 [FILES] Get files request received` - confirms request reached backend
- `Database query error:` - shows the actual SQL error
- `❌ Database connection failed` - database connection issue
- `Unknown column` - column name mismatch (like `f.type` vs `f.file_type`)

### Step 2: Test Database Connection

```bash
# Test if backend can connect to database
cd ~/projects/dms/backend
node -e "
require('dotenv').config();
const mysql = require('mysql2/promise');
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'task_insight'
};
mysql.createConnection(config)
  .then(conn => {
    console.log('✅ Database connection successful!');
    return conn.query('SELECT COUNT(*) as count FROM files');
  })
  .then(([rows]) => {
    console.log('✅ Query successful! Files count:', rows[0].count);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
"
```

### Step 3: Check Environment Variables

```bash
cd ~/projects/dms/backend

# Check if .env file exists
ls -la .env

# Check database configuration (without showing password)
cat .env | grep -E "DB_|NODE_ENV" | grep -v PASSWORD
```

**Verify these values:**
- `DB_HOST=localhost` (or your MySQL host)
- `DB_PORT=3306`
- `DB_NAME=task_insight` (must match your database name)
- `DB_USER=task_insight_admin` (must match your MySQL user)
- `DB_PASSWORD=...` (must match your MySQL password)
- `NODE_ENV=production` (or development)

### Step 4: Test the API Directly from VPS

```bash
# First, get a JWT token by logging in
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"member@demo.com","password":"member123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"

# Test the files endpoint
curl -v -H "Authorization: Bearer $TOKEN" \
     http://localhost:5000/api/files?page=1&limit=10
```

**What to look for:**
- Status code (should be 200, not 500)
- Response body (should show files or empty array)
- Error message in response

### Step 5: Check Database Tables Exist

```bash
# Connect to MySQL
mysql -u task_insight_admin -p task_insight

# Then run these queries:
SHOW TABLES;
SELECT COUNT(*) FROM files;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM organizations;

# Check if user has organization_id
SELECT id, email, role, organization_id FROM users WHERE email = 'member@demo.com';
```

**Common issues:**
- Tables don't exist → Run `setup_database.sql`
- User has NULL organization_id → Update it
- Database name mismatch → Check `.env` file

### Step 6: Verify Code is Updated

```bash
cd ~/projects/dms/backend

# Check if the fix is applied (should show f.file_type, not f.type)
grep -n "f\.type\|f\.file_type" routes/files.js

# Should show line 75 with: f.file_type = ?
```

### Step 7: Check Backend is Running

```bash
# Check PM2 status
pm2 status

# Check if backend process is running
pm2 list | grep dms-backend

# Restart if needed
pm2 restart dms-backend

# Check logs after restart
pm2 logs dms-backend --lines 30
```

## Common Error Messages and Fixes

### Error: "Unknown column 'f.type'"
**Fix:** Already fixed in code. Make sure:
1. Code is updated on VPS
2. Backend is restarted: `pm2 restart dms-backend`

### Error: "Access denied for user"
**Fix:** 
- Check `.env` file has correct `DB_USER` and `DB_PASSWORD`
- Verify MySQL user exists and has permissions
- Restart backend after changing `.env`

### Error: "Unknown database"
**Fix:**
- Check `DB_NAME` in `.env` matches actual database name
- Create database if it doesn't exist
- Restart backend

### Error: "Table 'files' doesn't exist"
**Fix:**
```bash
mysql -u root -p task_insight < setup_database.sql
```

### Error: "Cannot read property 'organization_id' of undefined"
**Fix:**
- User missing `organization_id` in database
- Update user: `UPDATE users SET organization_id = 1 WHERE email = 'member@demo.com';`

## Quick Diagnostic Script

Save this as `debug_files.sh` and run it:

```bash
#!/bin/bash
echo "=== Files Endpoint Debug ==="
echo ""

echo "1. Backend Status:"
pm2 status | grep dms-backend
echo ""

echo "2. Latest Backend Errors:"
pm2 logs dms-backend --err --lines 10 --nostream
echo ""

echo "3. Database Connection Test:"
cd ~/projects/dms/backend
node -e "
require('dotenv').config();
const mysql = require('mysql2/promise');
mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'task_insight'
}).then(conn => {
  console.log('✅ Connected');
  return conn.query('SELECT COUNT(*) as c FROM files');
}).then(([r]) => {
  console.log('✅ Files table exists, count:', r[0].c);
  process.exit(0);
}).catch(e => {
  console.log('❌ Error:', e.message);
  process.exit(1);
});
"
echo ""

echo "4. Code Check (f.file_type fix):"
grep -n "f\.file_type\|f\.type" routes/files.js | head -5
echo ""

echo "5. Environment Check:"
cat .env | grep -E "DB_NAME|DB_USER|NODE_ENV" | grep -v PASSWORD
echo ""

echo "=== Debug Complete ==="
```

Make it executable and run:
```bash
chmod +x debug_files.sh
./debug_files.sh
```

## Step-by-Step Fix Process

1. **SSH into VPS**
   ```bash
   ssh root@your-vps-ip
   ```

2. **Check backend logs**
   ```bash
   pm2 logs dms-backend --err --lines 50
   ```
   Copy the exact error message.

3. **Verify code is updated**
   ```bash
   cd ~/projects/dms/backend
   grep "f\.file_type" routes/files.js
   ```
   Should show `f.file_type = ?` on line 75.

4. **If code is not updated, update it:**
   ```bash
   # Edit the file
   nano routes/files.js
   # Find line 75, change f.type to f.file_type
   # Save and exit (Ctrl+X, Y, Enter)
   ```

5. **Restart backend**
   ```bash
   pm2 restart dms-backend
   ```

6. **Test again**
   ```bash
   # Get token and test
   TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"member@demo.com","password":"member123"}' | \
     grep -o '"token":"[^"]*' | cut -d'"' -f4)
   
   curl -H "Authorization: Bearer $TOKEN" \
        http://localhost:5000/api/files?page=1&limit=10
   ```

## Still Not Working?

Share these outputs:

1. **Backend error logs:**
   ```bash
   pm2 logs dms-backend --err --lines 50 --nostream
   ```

2. **Database connection test:**
   ```bash
   mysql -u task_insight_admin -p task_insight -e "SELECT COUNT(*) FROM files;"
   ```

3. **Code check:**
   ```bash
   grep -n "f\.file_type\|f\.type" ~/projects/dms/backend/routes/files.js
   ```

4. **Environment check:**
   ```bash
   cat ~/projects/dms/backend/.env | grep DB_ | grep -v PASSWORD
   ```


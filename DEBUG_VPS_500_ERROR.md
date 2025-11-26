# Debug 500 Error on VPS

The `/api/files` endpoint is returning 500 error on VPS but works locally. Let's debug this step by step.

## Step 1: Check Backend Logs

SSH into your VPS and check the backend logs:

```bash
# Check PM2 logs for the backend
pm2 logs dms-backend --lines 100

# Or check specific error logs
pm2 logs dms-backend --err --lines 50
```

Look for:
- `📁 [FILES] Get files request received` - to confirm the request is reaching the backend
- `❌ [FILES]` - any error messages
- Database connection errors
- SQL query errors

## Step 2: Common Issues and Fixes

### Issue 1: Database Connection Problem

**Symptoms:**
- Logs show `ECONNREFUSED` or database connection errors
- Backend can't connect to MySQL

**Fix:**
```bash
# Check if MySQL is running
sudo systemctl status mysql

# If not running, start it
sudo systemctl start mysql

# Check database exists
mysql -u root -p -e "SHOW DATABASES;"

# Verify the database name matches your .env
cd /path/to/dms/backend
cat .env | grep DB_NAME
```

### Issue 2: Wrong Database Credentials

**Symptoms:**
- Logs show `Access denied for user`
- Authentication failed

**Fix:**
```bash
cd /path/to/dms/backend
nano .env
```

Verify these settings:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=task_insight_prod
DB_USER=taskinsight_user
DB_PASSWORD=your_actual_password
```

Test the connection:
```bash
mysql -u task_insight_admin -p -h localhost task_insight -e "SELECT COUNT(*) FROM users;"
```

### Issue 3: Missing Tables

**Symptoms:**
- Logs show `Table 'task_insight_prod.files' doesn't exist`
- SQL errors about missing tables

**Fix:**
```bash
# Import the database schema
cd /path/to/dms
mysql -u root -p task_insight_prod < setup_database.sql

# Verify tables exist
mysql -u root -p task_insight_prod -e "SHOW TABLES;"
```

### Issue 4: User Missing organization_id

**Symptoms:**
- Logs show user has no `organization_id`
- Query fails because of NULL organization_id

**Fix:**
This should now be handled by the code, but verify:
```bash
mysql -u root -p task_insight_prod
```

```sql
-- Check user's organization_id
SELECT id, email, role, organization_id FROM users WHERE email = 'member@demo.com';

-- If organization_id is NULL, update it
UPDATE users SET organization_id = 1 WHERE email = 'member@demo.com';
```

### Issue 5: Backend Not Restarted

**Symptoms:**
- Changes to code not reflected
- Old code still running

**Fix:**
```bash
# Restart the backend
pm2 restart dms-backend

# Verify it's running
pm2 status

# Check logs after restart
pm2 logs dms-backend --lines 50
```

## Step 3: Test the API Directly

Test the API endpoint from the VPS:

```bash
# Test health endpoint first
curl http://localhost:5000/health

# Test files endpoint (replace TOKEN with actual JWT token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:5000/api/files?page=1&limit=10
```

To get a JWT token:
```bash
# Login and get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"member@demo.com","password":"member123"}'
```

Copy the token from the response and use it in the files request.

## Step 4: Check Environment Variables

Verify all environment variables are set:

```bash
cd /path/to/dms/backend
cat .env
```

Required variables:
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=task_insight_prod
DB_USER=taskinsight_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_long_random_string

# Server
PORT=5000
NODE_ENV=production

# CORS
CORS_ORIGIN=https://taskinsight.my
```

## Step 5: Check File Permissions

Ensure the backend has proper permissions:

```bash
cd /path/to/dms/backend

# Check uploads directory exists and is writable
ls -la uploads/
# If it doesn't exist or has wrong permissions:
mkdir -p uploads
chmod 755 uploads

# Check logs directory
mkdir -p logs
chmod 755 logs
```

## Step 6: Enable Debug Mode Temporarily

Add more logging to see what's happening:

```bash
cd /path/to/dms/backend
nano .env
```

Change:
```env
NODE_ENV=development  # Temporarily for debugging
LOG_LEVEL=debug
```

Then restart:
```bash
pm2 restart dms-backend
pm2 logs dms-backend --lines 100
```

Try the request again and check the detailed logs.

**Don't forget to change back to production after debugging:**
```env
NODE_ENV=production
```

## Step 7: Check Nginx Configuration

If using Nginx as a reverse proxy:

```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Verify Nginx config
sudo nginx -t

# Check the proxy configuration
sudo cat /etc/nginx/sites-available/taskinsight.my
```

Ensure the `/api` location is properly configured:
```nginx
location /api {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

## Quick Diagnostic Script

Run this on your VPS to check everything:

```bash
#!/bin/bash
echo "=== DMS Diagnostic ==="
echo ""

echo "1. Backend Status:"
pm2 status | grep dms-backend

echo ""
echo "2. MySQL Status:"
sudo systemctl status mysql | grep Active

echo ""
echo "3. Database Exists:"
mysql -u root -p -e "SHOW DATABASES LIKE 'task_insight%';"

echo ""
echo "4. Tables in Database:"
mysql -u root -p task_insight_prod -e "SHOW TABLES;"

echo ""
echo "5. User Count:"
mysql -u root -p task_insight_prod -e "SELECT COUNT(*) as user_count FROM users;"

echo ""
echo "6. Backend Health:"
curl -s http://localhost:5000/health | python3 -m json.tool

echo ""
echo "7. Backend Logs (last 20 lines):"
pm2 logs dms-backend --lines 20 --nostream

echo ""
echo "=== Diagnostic Complete ==="
```

Save this as `diagnose.sh`, make it executable, and run it:
```bash
chmod +x diagnose.sh
./diagnose.sh
```

## Most Likely Causes

Based on the error happening on VPS but not locally, it's usually:

1. **Database not running** - `sudo systemctl start mysql`
2. **Wrong database name in .env** - Check `DB_NAME=task_insight_prod`
3. **Backend not restarted** - `pm2 restart dms-backend`
4. **Missing password hashes** - Run `node fix_passwords.js`
5. **User missing organization_id** - Update in database

## What to Share for Help

If you're still stuck, share:

1. **Backend logs:**
   ```bash
   pm2 logs dms-backend --lines 100 --nostream
   ```

2. **Database check:**
   ```bash
   mysql -u root -p task_insight_prod -e "SELECT email, role, organization_id FROM users;"
   ```

3. **Environment check:**
   ```bash
   cd /path/to/dms/backend
   cat .env | grep -v PASSWORD | grep -v SECRET
   ```

This will help identify the exact issue.


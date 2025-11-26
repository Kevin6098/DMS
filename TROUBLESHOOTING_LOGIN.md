# Troubleshooting Login Issues on VPS

If you cannot login after deploying to your VPS, follow these steps systematically:

## 🔍 Step 1: Check Backend is Running

SSH into your VPS and verify the backend is running:

```bash
# Check PM2 status
pm2 status

# Check backend logs
pm2 logs dms-backend --lines 50

# If backend is not running, start it
cd /path/to/dms/backend
pm2 start server.js --name dms-backend
pm2 save
```

## 🔍 Step 2: Verify Backend Health

Test if the backend is accessible:

```bash
# Test local backend
curl http://localhost:5000/health

# Test through Nginx (if configured)
curl https://taskinsight.my/api/health
```

**Expected response:**
```json
{
  "status": "OK",
  "timestamp": "...",
  "uptime": ...,
  "environment": "production"
}
```

## 🔍 Step 3: Check Database Connection

The backend must connect to MySQL. Check logs for database errors:

```bash
pm2 logs dms-backend | grep -i "database\|mysql\|connection"
```

**Common errors:**
- `ECONNREFUSED` - MySQL not running or wrong host/port
- `Access denied` - Wrong username/password
- `Unknown database` - Database not created

**Fix database issues:**
```bash
# Check MySQL is running
sudo systemctl status mysql

# Start MySQL if not running
sudo systemctl start mysql

# Connect to MySQL and verify database exists
mysql -u root -p
SHOW DATABASES;
USE task_insight_prod;
SHOW TABLES;
```

## 🔍 Step 4: Verify Environment Variables

Check your backend `.env` file has correct values:

```bash
cd /path/to/dms/backend
cat .env
```

**Critical settings:**
```env
# Database - MUST match your MySQL setup
DB_HOST=localhost
DB_PORT=3306
DB_NAME=task_insight_prod
DB_USER=taskinsight_user
DB_PASSWORD=your_actual_password

# CORS - MUST match your frontend domain
CORS_ORIGIN=https://taskinsight.my

# JWT - Must be set (generate if missing)
JWT_SECRET=your_long_random_string_here

# Environment
NODE_ENV=production
PORT=5000
```

**After changing .env, restart backend:**
```bash
pm2 restart dms-backend
```

## 🔍 Step 5: Check Frontend API Configuration

Your frontend must point to the correct backend URL. Check the built frontend:

```bash
# If using build files, check the environment
cd /path/to/dms/frontend
cat .env.production
```

**Should contain:**
```env
REACT_APP_API_BASE_URL=https://taskinsight.my/api
```

**If you changed this, rebuild:**
```bash
cd /path/to/dms/frontend
npm run build
# Then copy build files to web directory
```

## 🔍 Step 6: Verify Database Has Users

Check if users exist in the database:

```bash
mysql -u root -p
USE task_insight_prod;
SELECT id, email, role, status FROM users;
```

**If no users exist, import the database:**
```bash
mysql -u root -p task_insight_prod < /path/to/setup_database.sql
```

**Or create a test user manually:**
```bash
mysql -u root -p task_insight_prod
```

```sql
-- Create a test admin user
INSERT INTO users (email, password_hash, first_name, last_name, role, status, organization_id)
VALUES (
  'admin@test.com',
  '$2b$10$YourBcryptHashHere',  -- Use bcrypt to hash 'admin123'
  'Admin',
  'User',
  'organization_admin',
  'active',
  1
);
```

**Generate password hash:**
```bash
cd /path/to/dms/backend
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10).then(h => console.log(h));"
```

## 🔍 Step 7: Check Browser Console

Open your browser's developer console (F12) and check for errors:

1. **Network tab** - Look for failed API requests
2. **Console tab** - Look for JavaScript errors
3. **Check the actual request URL** - Should be `https://taskinsight.my/api/auth/login`

**Common errors:**
- `CORS policy` - Backend CORS_ORIGIN not matching frontend domain
- `Network Error` - Backend not accessible or wrong URL
- `401 Unauthorized` - Wrong credentials or JWT issue
- `500 Internal Server Error` - Backend error (check PM2 logs)

## 🔍 Step 8: Test Login API Directly

Test the login endpoint directly from VPS:

```bash
# Test login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"admin123"}'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "...",
    "user": {...}
  }
}
```

**If this fails, check:**
- Database connection
- User exists in database
- Password hash is correct

## 🔍 Step 9: Check Nginx Configuration

If using Nginx, verify the proxy configuration:

```bash
sudo cat /etc/nginx/sites-available/taskinsight.my
```

**Should have:**
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

**Test and reload Nginx:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 🔍 Step 10: Verify Database Schema

Ensure all tables exist:

```bash
mysql -u root -p task_insight_prod
```

```sql
SHOW TABLES;
-- Should show: users, organizations, files, etc.

-- Check users table structure
DESCRIBE users;

-- Check if sample users exist
SELECT email, role, status FROM users;
```

## 🔧 Quick Fix Checklist

Run through this checklist:

- [ ] Backend is running (`pm2 status`)
- [ ] Backend health check works (`curl http://localhost:5000/health`)
- [ ] Database is running (`sudo systemctl status mysql`)
- [ ] Database exists and has tables (`mysql -u root -p -e "USE task_insight_prod; SHOW TABLES;"`)
- [ ] `.env` file has correct database credentials
- [ ] `.env` file has `CORS_ORIGIN=https://taskinsight.my`
- [ ] `.env` file has `NODE_ENV=production`
- [ ] Frontend `.env.production` has `REACT_APP_API_BASE_URL=https://taskinsight.my/api`
- [ ] Frontend is rebuilt after changing `.env.production`
- [ ] Nginx is configured correctly and reloaded
- [ ] Users exist in database
- [ ] Password hashes are correct (bcrypt)

## 🆘 Still Not Working?

1. **Check all logs:**
   ```bash
   # Backend logs
   pm2 logs dms-backend --lines 100
   
   # Nginx error logs
   sudo tail -f /var/log/nginx/error.log
   
   # MySQL error logs
   sudo tail -f /var/log/mysql/error.log
   ```

2. **Test with curl from VPS:**
   ```bash
   curl -v -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@demo.com","password":"admin123"}'
   ```

3. **Check firewall:**
   ```bash
   sudo ufw status
   # Port 5000 should be open if accessing directly
   # Or only 80/443 if using Nginx
   ```

4. **Verify file permissions:**
   ```bash
   ls -la /path/to/dms/backend/.env
   ls -la /path/to/dms/backend/uploads
   ```

## 📝 Common Issues and Solutions

### Issue: "Cannot connect to database"
**Solution:** 
- Check MySQL is running: `sudo systemctl start mysql`
- Verify credentials in `.env`
- Test connection: `mysql -u taskinsight_user -p -h localhost task_insight_prod`

### Issue: "CORS error in browser"
**Solution:**
- Set `CORS_ORIGIN=https://taskinsight.my` in backend `.env`
- Restart backend: `pm2 restart dms-backend`
- Check browser console for exact CORS error

### Issue: "401 Unauthorized"
**Solution:**
- Verify user exists: `SELECT * FROM users WHERE email='admin@demo.com';`
- Check password hash is correct (use `fix_passwords.js` script)
- Verify JWT_SECRET is set in `.env`

### Issue: "Network Error" or timeout
**Solution:**
- Check backend is running: `pm2 status`
- Check backend is accessible: `curl http://localhost:5000/health`
- Verify frontend API URL is correct
- Check Nginx proxy configuration

### Issue: "Database query error"
**Solution:**
- Import database schema: `mysql -u root -p task_insight_prod < setup_database.sql`
- Verify all tables exist
- Check database user has proper permissions

---

**Need more help?** Check the full deployment guide: `VPS_DEPLOYMENT_GUIDE.md`


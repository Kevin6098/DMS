# VPS Folder Permissions Guide

The backend needs proper folder permissions to:
1. Read/write files in the `uploads/` directory
2. Access the backend code files
3. Write log files (if configured)

## Check Current Permissions

SSH into your VPS and run:

```bash
cd ~/projects/dms/backend

# Check uploads folder permissions
ls -la uploads/

# Check backend folder permissions
ls -la

# Check who owns the files
ls -la | grep -E "uploads|node_modules|\.env"
```

## Fix Uploads Folder Permissions

The `uploads/` folder needs to be writable by the Node.js process:

```bash
cd ~/projects/dms/backend

# Create uploads folder if it doesn't exist
mkdir -p uploads

# Set proper permissions (755 = owner read/write/execute, group/others read/execute)
chmod 755 uploads

# If using PM2, make sure the folder is owned by the correct user
# Check what user PM2 is running as:
ps aux | grep node | grep dms-backend

# If running as root, make root the owner:
chown -R root:root uploads

# If running as a different user (e.g., nodejs), change ownership:
# chown -R nodejs:nodejs uploads
```

## Fix Backend Folder Permissions

```bash
cd ~/projects/dms

# Make sure backend folder is readable
chmod -R 755 backend

# Make sure .env file is readable (but not world-readable)
chmod 600 backend/.env

# Make sure node_modules is accessible
chmod -R 755 backend/node_modules
```

## Common Permission Issues

### Issue 1: "EACCES: permission denied, mkdir '/path/to/uploads'"

**Fix:**
```bash
cd ~/projects/dms/backend
mkdir -p uploads
chmod 755 uploads
chown -R $(whoami) uploads
```

### Issue 2: "EACCES: permission denied, open '/path/to/uploads/file.pdf'"

**Fix:**
```bash
cd ~/projects/dms/backend
chmod -R 755 uploads
# If files already exist:
chmod -R 644 uploads/*
```

### Issue 3: "Cannot read .env file"

**Fix:**
```bash
cd ~/projects/dms/backend
chmod 600 .env
ls -la .env
# Should show: -rw------- (only owner can read/write)
```

### Issue 4: PM2 can't access files

**Fix:**
```bash
# Check what user PM2 is running as
pm2 describe dms-backend | grep "exec cwd\|username"

# Make sure files are owned by that user
# If running as root:
chown -R root:root ~/projects/dms/backend

# If running as another user (e.g., ubuntu):
chown -R ubuntu:ubuntu ~/projects/dms/backend
```

## Recommended Permissions

```bash
cd ~/projects/dms/backend

# Backend folder structure
chmod 755 .                    # Backend root
chmod 600 .env                 # Environment file (sensitive)
chmod 755 routes/              # Routes folder
chmod 644 routes/*.js          # Route files
chmod 755 config/              # Config folder
chmod 644 config/*.js         # Config files
chmod 755 uploads/             # Uploads folder (must be writable)
chmod 755 logs/                 # Logs folder (if exists)

# Node modules (usually fine as-is)
# chmod -R 755 node_modules/   # Only if having issues
```

## Quick Permission Fix Script

Save this as `fix_permissions.sh`:

```bash
#!/bin/bash
echo "=== Fixing DMS Permissions ==="

cd ~/projects/dms/backend || exit 1

echo "1. Creating uploads folder..."
mkdir -p uploads
chmod 755 uploads

echo "2. Fixing .env permissions..."
if [ -f .env ]; then
  chmod 600 .env
  echo "✅ .env permissions set"
else
  echo "⚠️  .env file not found"
fi

echo "3. Fixing folder permissions..."
chmod 755 .
chmod 755 routes
chmod 755 config
chmod 755 middleware

echo "4. Fixing file permissions..."
find routes -type f -name "*.js" -exec chmod 644 {} \;
find config -type f -name "*.js" -exec chmod 644 {} \;
find middleware -type f -name "*.js" -exec chmod 644 {} \;

echo "5. Checking uploads folder..."
if [ -d uploads ]; then
  ls -la uploads/ | head -5
  echo "✅ Uploads folder exists and is accessible"
else
  echo "❌ Uploads folder not found"
fi

echo ""
echo "6. Current permissions:"
ls -la | grep -E "uploads|\.env|routes|config"

echo ""
echo "=== Done ==="
echo "Restart backend: pm2 restart dms-backend"
```

Make it executable and run:
```bash
chmod +x fix_permissions.sh
./fix_permissions.sh
```

## Test Permissions

After fixing permissions, test if the backend can write:

```bash
cd ~/projects/dms/backend

# Test write permission
touch uploads/test_write.txt
if [ $? -eq 0 ]; then
  echo "✅ Write permission OK"
  rm uploads/test_write.txt
else
  echo "❌ Write permission FAILED"
fi

# Test read permission
if [ -r .env ]; then
  echo "✅ .env read permission OK"
else
  echo "❌ .env read permission FAILED"
fi
```

## PM2 User Context

If PM2 is running as a different user, you need to ensure that user has permissions:

```bash
# Check PM2 user
pm2 describe dms-backend | grep username

# If PM2 is running as a different user, you have two options:

# Option 1: Change folder ownership to PM2 user
sudo chown -R pm2user:pm2user ~/projects/dms/backend

# Option 2: Run PM2 as current user
pm2 delete dms-backend
pm2 start server.js --name dms-backend
pm2 save
```

## SELinux (If Enabled)

If SELinux is enabled on your VPS, you might need to set contexts:

```bash
# Check if SELinux is enabled
getenforce

# If enabled, set proper context for uploads
sudo chcon -R -t httpd_sys_rw_content_t ~/projects/dms/backend/uploads/

# Or disable SELinux (not recommended for production)
# sudo setenforce 0
```

## Verify After Fix

1. **Restart backend:**
   ```bash
   pm2 restart dms-backend
   ```

2. **Check logs:**
   ```bash
   pm2 logs dms-backend --lines 20
   ```

3. **Test file upload:**
   - Try uploading a file through the web interface
   - Check if it appears in `uploads/` folder
   - Check backend logs for permission errors

## Common Error Messages

### "EACCES: permission denied"
→ Folder/file doesn't have write/read permissions
→ Fix: `chmod 755 folder` or `chmod 644 file`

### "ENOENT: no such file or directory"
→ Folder doesn't exist
→ Fix: `mkdir -p uploads`

### "EISDIR: illegal operation on a directory"
→ Trying to write to a directory instead of a file
→ Fix: Check your code logic

### "Cannot find module"
→ Node modules don't have read permissions
→ Fix: `chmod -R 755 node_modules`

## Quick Reference

```bash
# Most common fix for uploads folder
cd ~/projects/dms/backend
mkdir -p uploads
chmod 755 uploads
chown -R $(whoami) uploads

# Restart backend
pm2 restart dms-backend

# Check if it worked
pm2 logs dms-backend --lines 10
```


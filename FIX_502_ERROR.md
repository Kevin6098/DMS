# Fix 502 Error - Missing Module

## Problem
The backend is crashing because the `archiver` module (and possibly other dependencies) are not installed on the production server.

## Solution

### Step 1: SSH into your server
```bash
ssh user@your-server
```

### Step 2: Navigate to backend directory
```bash
cd /root/projects/dms/backend
```

### Step 3: Install missing dependencies
```bash
npm install
```

This will install all packages listed in `package.json`, including:
- archiver
- express
- multer
- mysql2
- bcrypt
- jsonwebtoken
- and all other dependencies

### Step 4: Verify installation
```bash
# Check if archiver is installed
npm list archiver

# Or check all installed packages
npm list --depth=0
```

### Step 5: Restart the backend
```bash
pm2 restart dms-backend
```

### Step 6: Check if it's running
```bash
pm2 status
pm2 logs dms-backend --lines 20
```

## Alternative: If npm install fails

If `npm install` fails, try:

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Restart
pm2 restart dms-backend
```

## Verify the fix

After restarting, check:
1. Backend is running: `pm2 status` should show `online`
2. No errors in logs: `pm2 logs dms-backend` should show no errors
3. Health check works: `curl http://localhost:5000/api/health`
4. Login works: Try logging in from the frontend

## Prevention

Make sure to run `npm install` on the server whenever you:
- Add new dependencies
- Update package.json
- Deploy new code

Consider adding this to your deployment script:
```bash
cd /root/projects/dms/backend
npm install
pm2 restart dms-backend
```


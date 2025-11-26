# Instructions to Update VPS Code

Since the code works locally but not on VPS, you need to update the VPS code with the latest fixes.

## Quick Update Steps

### Option 1: Manual Update (Fastest)

SSH into your VPS and manually update the file:

```bash
# SSH into VPS
ssh root@your-vps-ip

# Navigate to backend
cd ~/projects/dms/backend

# Backup current file
cp routes/files.js routes/files.js.backup

# Edit the file
nano routes/files.js
```

**Find line 51-54 and change:**
```javascript
// OLD (WRONG):
const { page = 1, limit = 10, q: search, folderId, type, organizationId } = req.query;
const offset = (page - 1) * limit;

// NEW (CORRECT):
const { page = 1, limit = 10, q: search, folderId, type, organizationId } = req.query;
const pageNum = parseInt(page, 10) || 1;
const limitNum = parseInt(limit, 10) || 10;
const offset = (pageNum - 1) * limitNum;
```

**Find line 102 and change:**
```javascript
// OLD:
const filesResult = await executeQuery(filesQuery, [...queryParams, parseInt(limit), offset]);

// NEW:
const filesResult = await executeQuery(filesQuery, [...queryParams, limitNum, offset]);
```

**Find line 132-135 and change:**
```javascript
// OLD:
pagination: {
  page: parseInt(page),
  limit: parseInt(limit),
  total: countResult.data[0].total,
  pages: Math.ceil(countResult.data[0].total / limit)
}

// NEW:
pagination: {
  page: pageNum,
  limit: limitNum,
  total: countResult.data[0].total,
  pages: Math.ceil(countResult.data[0].total / limitNum)
}
```

**Find line 139-143 and change:**
```javascript
// OLD:
} catch (error) {
  console.error('Get files error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
}

// NEW:
} catch (error) {
  console.error('❌ [FILES] Get files error:', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    sqlState: error.sqlState,
    sqlMessage: error.sqlMessage
  });
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}
```

**Also find line 75 and make sure it says:**
```javascript
// Should be:
whereConditions.push('f.file_type = ?');
// NOT:
whereConditions.push('f.type = ?');
```

Save the file (Ctrl+X, then Y, then Enter).

### Option 2: Copy from Local (If you have access)

If you can copy files from your local machine to VPS:

```bash
# On your local machine
scp backend/routes/files.js root@your-vps-ip:~/projects/dms/backend/routes/files.js

# Then on VPS, restart
ssh root@your-vps-ip
cd ~/projects/dms/backend
pm2 restart dms-backend
```

### Option 3: Git Pull (If using Git)

```bash
# On VPS
cd ~/projects/dms
git pull origin main
cd backend
pm2 restart dms-backend
```

## After Updating

1. **Restart the backend:**
   ```bash
   pm2 restart dms-backend
   ```

2. **Check logs:**
   ```bash
   pm2 logs dms-backend --lines 30
   ```

3. **Test the endpoint:**
   ```bash
   # Get token
   TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"member@demo.com","password":"member123"}' | \
     grep -o '"token":"[^"]*' | cut -d'"' -f4)

   # Test files endpoint
   curl -H "Authorization: Bearer $TOKEN" \
        http://localhost:5000/api/files?page=1&limit=10
   ```

## Verify the Fix is Applied

Check if the fix is in place:

```bash
cd ~/projects/dms/backend

# Should show "limitNum" and "pageNum" (not parseInt(limit))
grep -n "limitNum\|pageNum\|parseInt(limit)" routes/files.js | head -10
```

## Common Issues

### Issue: Still getting 500 error after update

1. **Check error logs:**
   ```bash
   pm2 logs dms-backend --err --lines 50
   ```

2. **Verify code is updated:**
   ```bash
   grep "pageNum\|limitNum" routes/files.js
   ```
   Should show results.

3. **Check database connection:**
   ```bash
   node test_files_endpoint.js
   ```

### Issue: "Cannot find module" or syntax errors

Make sure you saved the file correctly. Check for syntax errors:

```bash
node -c routes/files.js
```

If there are errors, restore from backup and try again:

```bash
cp routes/files.js.backup routes/files.js
# Then edit again carefully
```

## Quick Check Script

Run this to verify everything:

```bash
#!/bin/bash
echo "=== Checking VPS Code ==="
cd ~/projects/dms/backend

echo "1. Checking for pageNum/limitNum:"
grep -c "pageNum\|limitNum" routes/files.js
if [ $? -eq 0 ]; then
  echo "✅ Fix is applied"
else
  echo "❌ Fix NOT applied - need to update"
fi

echo ""
echo "2. Checking for f.file_type:"
grep -c "f\.file_type" routes/files.js
if [ $? -eq 0 ]; then
  echo "✅ Column name fix is applied"
else
  echo "❌ Column name fix NOT applied"
fi

echo ""
echo "3. Backend status:"
pm2 status | grep dms-backend

echo ""
echo "4. Latest errors:"
pm2 logs dms-backend --err --lines 5 --nostream
```

Save as `check_fix.sh`, make executable, and run:
```bash
chmod +x check_fix.sh
./check_fix.sh
```


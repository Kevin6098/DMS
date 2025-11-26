# Quick Fix for VPS - "Incorrect arguments to mysqld_stmt_execute"

## The Problem

The error happens because `LIMIT` and `OFFSET` parameters must be **integers**, but the code is passing strings or incorrectly calculated values.

## Quick Fix (Copy-Paste This)

SSH into your VPS and run these commands:

```bash
cd ~/projects/dms/backend

# Backup current file
cp routes/files.js routes/files.js.backup

# Edit the file
nano routes/files.js
```

**Find line 51-54** (around there) and **REPLACE**:
```javascript
const { page = 1, limit = 10, q: search, folderId, type, organizationId } = req.query;
const offset = (page - 1) * limit;
```

**WITH:**
```javascript
const { page = 1, limit = 10, q: search, folderId, type, organizationId } = req.query;
const pageNum = parseInt(page, 10) || 1;
const limitNum = parseInt(limit, 10) || 10;
const offset = (pageNum - 1) * limitNum;
```

**Find line 102** (or wherever `executeQuery` is called with limit/offset) and **REPLACE**:
```javascript
const filesResult = await executeQuery(filesQuery, [...queryParams, parseInt(limit), offset]);
```

**WITH:**
```javascript
const filesResult = await executeQuery(filesQuery, [...queryParams, limitNum, offset]);
```

**Find the pagination response** (around line 131-135) and **REPLACE**:
```javascript
pagination: {
  page: parseInt(page),
  limit: parseInt(limit),
  total: countResult.data[0].total,
  pages: Math.ceil(countResult.data[0].total / limit)
}
```

**WITH:**
```javascript
pagination: {
  page: pageNum,
  limit: limitNum,
  total: countResult.data[0].total,
  pages: Math.ceil(countResult.data[0].total / limitNum)
}
```

**Save:** Ctrl+X, then Y, then Enter

**Restart:**
```bash
pm2 restart dms-backend
pm2 logs dms-backend --lines 20
```

## Test the API

### Option 1: Quick Test Script

```bash
# Make script executable
chmod +x test_api.sh

# Run it
./test_api.sh
```

### Option 2: Manual curl Commands

```bash
# 1. Test health
curl http://localhost:5000/health

# 2. Login and get token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"member@demo.com","password":"member123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"

# 3. Test files endpoint
curl -v -H "Authorization: Bearer $TOKEN" \
     http://localhost:5000/api/files?page=1&limit=10

# 4. Pretty print response
curl -s -H "Authorization: Bearer $TOKEN" \
     http://localhost:5000/api/files?page=1&limit=10 | python3 -m json.tool
```

### Option 3: One-Line Test

```bash
# Login, get token, and test files in one go
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"member@demo.com","password":"member123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4 | \
  xargs -I {} curl -s -H "Authorization: Bearer {}" \
  http://localhost:5000/api/files?page=1&limit=10 | python3 -m json.tool
```

## Verify the Fix is Applied

```bash
cd ~/projects/dms/backend

# Check if pageNum and limitNum exist
grep -n "pageNum\|limitNum" routes/files.js

# Should show results like:
# 52:    const pageNum = parseInt(page, 10) || 1;
# 53:    const limitNum = parseInt(limit, 10) || 10;
# 109:    const filesResult = await executeQuery(filesQuery, [...queryParams, limitNum, offset]);
```

If you see `pageNum` and `limitNum`, the fix is applied! ✅

## Still Not Working?

Check the logs:
```bash
pm2 logs dms-backend --err --lines 20
```

Look for the new debug logs:
- `📁 [FILES] Executing query with params:` - should show integers
- `📁 [FILES] Files query result:` - should show success: true

If you still see errors, share the log output.


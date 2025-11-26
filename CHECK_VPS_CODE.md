# Check VPS Code and Get Detailed Error

## Step 1: Check if Fix is Applied

Run this on your VPS:

```bash
cd ~/projects/dms/backend

# Check if pageNum and limitNum exist
grep -n "pageNum\|limitNum" routes/files.js

# Should show:
# 52:    const pageNum = parseInt(page, 10) || 1;
# 53:    const limitNum = parseInt(limit, 10) || 10;
# 109:    const filesResult = await executeQuery(filesQuery, [...queryParams, limitNum, offset]);
```

If you DON'T see these lines, the fix is NOT applied!

## Step 2: Get Detailed Error from Logs

```bash
# Check the latest error logs
pm2 logs dms-backend --err --lines 30

# Look for:
# - "📁 [FILES] Executing query with params:" - shows what params are being sent
# - "📁 [FILES] Files query result:" - shows the actual error
# - "Database query error:" - shows MySQL error
```

## Step 3: Check What Params Are Being Sent

The logs should show something like:
```
📁 [FILES] Executing query with params: {
  queryParams: [ 1 ],
  limitNum: 10,
  offset: 0,
  totalParams: 3
}
```

If `limitNum` and `offset` are NOT integers, that's the problem!

## Step 4: Verify Code is Correct

Check these specific lines:

```bash
cd ~/projects/dms/backend

# Line 51-54 should have pageNum and limitNum
sed -n '51,54p' routes/files.js

# Line 109 should use limitNum (not parseInt(limit))
sed -n '109p' routes/files.js
```

## Step 5: If Fix is NOT Applied

Edit the file:
```bash
nano routes/files.js
```

Make sure these changes are made:
1. Line 52-54: Add `pageNum` and `limitNum`
2. Line 109: Use `limitNum` instead of `parseInt(limit)`
3. Line 132-135: Use `pageNum` and `limitNum` in response

Save and restart:
```bash
pm2 restart dms-backend
pm2 logs dms-backend --lines 20
```


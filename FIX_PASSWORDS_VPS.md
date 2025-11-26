# Fix Passwords on VPS

The password hashes in your database are placeholders and need to be regenerated with proper bcrypt hashes.

## Quick Fix

SSH into your VPS and run:

```bash
# Navigate to backend directory
cd /path/to/dms/backend

# Run the password fix script
node fix_passwords.js
```

## Expected Output

You should see:
```
Generating password hashes...
Admin hash: $2b$12$...
Member hash: $2b$12$...

Updating platform owner password...
✓ Platform owner password updated
Updating organization admin password...
✓ Organization admin password updated
Updating member password...
✓ Member password updated

✅ Password update complete!

Login credentials:
Platform Owner: owner@taskinsight.com / admin123
Org Admin: admin@demo.com / admin123
Member: member@demo.com / member123
```

## Verify It Worked

After running the script, try logging in again with:
- **Email:** `member@demo.com`
- **Password:** `member123`

## If the Script Fails

If you get database connection errors, make sure:

1. **Backend `.env` file is configured correctly:**
   ```bash
   cd /path/to/dms/backend
   cat .env
   ```
   
   Should have:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=task_insight_prod
   DB_USER=taskinsight_user
   DB_PASSWORD=your_password
   ```

2. **Database exists and is accessible:**
   ```bash
   mysql -u taskinsight_user -p task_insight_prod -e "SELECT email, role FROM users;"
   ```

3. **Node.js dependencies are installed:**
   ```bash
   cd /path/to/dms/backend
   npm install
   ```

## Manual Fix (Alternative)

If the script doesn't work, you can manually update the password hash:

```bash
# Generate a password hash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('member123', 12).then(h => console.log(h));"
```

Then update the database:
```sql
mysql -u taskinsight_user -p task_insight_prod

UPDATE users 
SET password_hash = 'PASTE_THE_HASH_HERE' 
WHERE email = 'member@demo.com';
```

## After Fixing

1. Restart your backend (if needed):
   ```bash
   pm2 restart dms-backend
   ```

2. Try logging in again with:
   - Email: `member@demo.com`
   - Password: `member123`


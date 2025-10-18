# Database Setup Guide - Task Insight DMS

## Prerequisites
- MySQL 8.0 or higher installed
- MySQL Workbench (optional, for GUI management)
- Command line access to MySQL

---

## Step 1: Install MySQL

### Windows
1. Download MySQL installer from [mysql.com](https://dev.mysql.com/downloads/installer/)
2. Run installer and select "Developer Default"
3. Set root password during installation
4. Complete installation wizard

### macOS
```bash
# Using Homebrew
brew install mysql
brew services start mysql
mysql_secure_installation
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
```

---

## Step 2: Create Database

### Option A: Using Command Line
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE taskinsight_dms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user (optional, recommended for security)
CREATE USER 'taskinsight_user'@'localhost' IDENTIFIED BY 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON taskinsight_dms.* TO 'taskinsight_user'@'localhost';

# Flush privileges
FLUSH PRIVILEGES;

# Exit
EXIT;
```

### Option B: Using MySQL Workbench
1. Open MySQL Workbench
2. Connect to your MySQL server
3. Click "Create a new schema" button
4. Name: `taskinsight_dms`
5. Charset: `utf8mb4`
6. Collation: `utf8mb4_unicode_ci`
7. Click "Apply"

---

## Step 3: Import Database Schema

### Option A: Using Command Line
```bash
# Navigate to your project directory
cd /path/to/DMS

# Import the schema
mysql -u root -p taskinsight_dms < database_schema.sql

# Verify tables were created
mysql -u root -p taskinsight_dms -e "SHOW TABLES;"
```

### Option B: Using MySQL Workbench
1. Open MySQL Workbench
2. Connect to your server
3. File → Run SQL Script
4. Select `database_schema.sql`
5. Default Schema: `taskinsight_dms`
6. Click "Run"

---

## Step 4: Verify Installation

### Check Tables
```sql
USE taskinsight_dms;
SHOW TABLES;
```

Expected output:
```
+---------------------------+
| Tables_in_taskinsight_dms |
+---------------------------+
| audit_logs                |
| file_shares               |
| file_versions             |
| files                     |
| folder_shares             |
| folders                   |
| invitation_codes          |
| organizations             |
| starred_items             |
| user_sessions             |
| users                     |
+---------------------------+
```

### Check Views
```sql
SHOW FULL TABLES WHERE TABLE_TYPE = 'VIEW';
```

Expected output:
```
+---------------------------+------------+
| Tables_in_taskinsight_dms | Table_type |
+---------------------------+------------+
| recent_files_view         | VIEW       |
| recent_folders_view       | VIEW       |
| user_shared_files         | VIEW       |
| user_starred_items_view   | VIEW       |
+---------------------------+------------+
```

### Check Sample Data
```sql
-- Check organizations
SELECT * FROM organizations;

-- Check users
SELECT user_id, email, full_name, role FROM users;

-- Check invitation codes
SELECT invitation_code, is_used FROM invitation_codes;
```

---

## Step 5: Configure Backend Connection

### For Node.js (Sequelize)

Create `config/database.js`:
```javascript
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'taskinsight_dms',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};
```

Create `.env`:
```env
DB_HOST=localhost
DB_USER=taskinsight_user
DB_PASSWORD=your_secure_password
DB_NAME=taskinsight_dms
DB_PORT=3306
```

### For Python (SQLAlchemy)

Create `config/database.py`:
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_NAME = os.getenv('DB_NAME', 'taskinsight_dms')
DB_PORT = os.getenv('DB_PORT', '3306')

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

Create `.env`:
```env
DB_HOST=localhost
DB_USER=taskinsight_user
DB_PASSWORD=your_secure_password
DB_NAME=taskinsight_dms
DB_PORT=3306
```

---

## Step 6: Test Connection

### Node.js Test
```javascript
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql'
  }
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
  }
}

testConnection();
```

### Python Test
```python
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST')
DB_NAME = os.getenv('DB_NAME')

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

try:
    engine = create_engine(DATABASE_URL)
    connection = engine.connect()
    print("✅ Database connection successful!")
    connection.close()
except Exception as e:
    print(f"❌ Unable to connect to database: {e}")
```

---

## Common Issues & Solutions

### Issue 1: Access Denied
```
ERROR 1045 (28000): Access denied for user 'root'@'localhost'
```
**Solution:**
- Reset MySQL root password
- Check if password is correct in `.env` file

### Issue 2: Database Doesn't Exist
```
ERROR 1049 (42000): Unknown database 'taskinsight_dms'
```
**Solution:**
```sql
CREATE DATABASE taskinsight_dms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Issue 3: Connection Refused
```
ERROR 2002 (HY000): Can't connect to local MySQL server
```
**Solution:**
```bash
# Check if MySQL is running
# Windows
net start MySQL80

# macOS/Linux
sudo systemctl start mysql
# or
brew services start mysql
```

### Issue 4: Character Set Issues
```
Error: Incorrect string value
```
**Solution:**
- Ensure database is using `utf8mb4` charset
- Check connection string includes charset parameter

---

## Database Maintenance

### Backup Database
```bash
# Create backup
mysqldump -u root -p taskinsight_dms > backup_$(date +%Y%m%d).sql

# Restore backup
mysql -u root -p taskinsight_dms < backup_20240101.sql
```

### Run Stored Procedures

#### Update Storage Usage
```sql
CALL update_organization_storage(1);
```

#### Cleanup Old Trash (30+ days)
```sql
CALL cleanup_trash();
```

#### Get Recent Items
```sql
CALL get_recent_items(1, 20);
```

### Monitor Storage
```sql
-- Check organization storage
SELECT 
    organization_name,
    ROUND(storage_used / 1024 / 1024 / 1024, 2) as used_gb,
    ROUND(storage_quota / 1024 / 1024 / 1024, 2) as quota_gb,
    ROUND((storage_used / storage_quota) * 100, 2) as usage_percent
FROM organizations;

-- Check largest files
SELECT 
    file_name,
    ROUND(file_size / 1024 / 1024, 2) as size_mb,
    created_at
FROM files
WHERE is_deleted = FALSE
ORDER BY file_size DESC
LIMIT 10;
```

### Optimize Tables
```sql
-- Run periodically to optimize performance
OPTIMIZE TABLE files;
OPTIMIZE TABLE folders;
OPTIMIZE TABLE file_versions;
```

---

## Security Best Practices

1. **Never use root user in production**
   - Create dedicated user with limited privileges
   - Only grant necessary permissions

2. **Use strong passwords**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, symbols

3. **Enable SSL/TLS**
   ```sql
   -- Check if SSL is enabled
   SHOW VARIABLES LIKE '%ssl%';
   ```

4. **Regular backups**
   - Daily automated backups
   - Store backups in secure location
   - Test restore procedures

5. **Monitor access logs**
   ```sql
   -- Check recent login attempts
   SELECT * FROM user_sessions ORDER BY created_at DESC LIMIT 20;
   
   -- Check audit logs
   SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50;
   ```

6. **Keep MySQL updated**
   ```bash
   # Check MySQL version
   mysql --version
   ```

---

## Performance Tuning

### Recommended MySQL Configuration

Edit `my.cnf` or `my.ini`:
```ini
[mysqld]
# Buffer pool (set to 70% of available RAM)
innodb_buffer_pool_size = 4G

# Log file size
innodb_log_file_size = 512M

# Maximum connections
max_connections = 200

# Query cache (if MySQL < 8.0)
query_cache_type = 1
query_cache_size = 64M

# Character set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
```

### Analyze Slow Queries
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Check slow queries
SELECT * FROM mysql.slow_log ORDER BY query_time DESC LIMIT 10;
```

---

## Next Steps

1. ✅ Database schema created
2. ✅ Sample data inserted
3. ⬜ Set up backend application
4. ⬜ Configure file storage
5. ⬜ Implement authentication
6. ⬜ Connect React frontend
7. ⬜ Deploy to production

---

## Support

If you encounter issues:
1. Check the error message carefully
2. Verify MySQL is running: `mysql -u root -p`
3. Check database connection in `.env` file
4. Review MySQL error logs
5. Test connection with simple query

**Need help? Review the troubleshooting section above or consult MySQL documentation.**


# Task Insight DMS - Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Database Setup](#database-setup)
7. [Environment Configuration](#environment-configuration)
8. [SSL/HTTPS Setup](#sslhttps-setup)
9. [Monitoring & Logging](#monitoring--logging)
10. [Post-Deployment Testing](#post-deployment-testing)
11. [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers the deployment of Task Insight DMS to production environments. The application consists of three main components:

- **Frontend**: React application
- **Backend**: Node.js/Express API server
- **Database**: MySQL 8.0+

---

## System Requirements

### Server Requirements

#### Backend Server
- **CPU**: 2+ cores (4+ recommended)
- **RAM**: 4GB minimum (8GB+ recommended)
- **Storage**: 20GB + storage for uploaded files
- **OS**: Ubuntu 20.04+ or CentOS 8+

#### Frontend Server
- **CPU**: 1+ cores
- **RAM**: 1GB minimum
- **Storage**: 2GB
- **OS**: Ubuntu 20.04+ or CentOS 8+

#### Database Server
- **CPU**: 2+ cores (4+ recommended)
- **RAM**: 4GB minimum (8GB+ recommended)
- **Storage**: 50GB+ SSD recommended
- **OS**: Ubuntu 20.04+ or CentOS 8+

### Software Requirements

- **Node.js**: 16.x or 18.x LTS
- **MySQL**: 8.0+
- **Nginx**: 1.18+ (or Apache 2.4+)
- **PM2**: Latest version (process manager)
- **Git**: Latest version

---

## Pre-Deployment Checklist

### Code Preparation

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] No console.log() statements in production code
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Build scripts tested
- [ ] Documentation updated

### Infrastructure

- [ ] Servers provisioned
- [ ] Domain name registered
- [ ] DNS configured
- [ ] SSL certificates obtained
- [ ] Firewall rules configured
- [ ] Backup strategy in place
- [ ] Monitoring tools set up

### Security

- [ ] Secrets generated (JWT secrets, etc.)
- [ ] Database passwords changed from defaults
- [ ] SSH keys configured
- [ ] Firewall enabled
- [ ] Fail2ban installed
- [ ] Security headers configured

---

## Backend Deployment

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install build tools
sudo apt install -y build-essential

# Create application user
sudo useradd -m -s /bin/bash taskinsight
sudo su - taskinsight
```

### Step 2: Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/task-insight-dms.git
cd task-insight-dms/backend

# Checkout production branch
git checkout production
```

### Step 3: Install Dependencies

```bash
# Install production dependencies
npm ci --production

# Or with yarn
yarn install --production
```

### Step 4: Configure Environment

```bash
# Create .env file
cp env.example .env

# Edit environment variables
nano .env
```

**Production .env file**:
```env
# Database
DB_HOST=your-db-host
DB_PORT=3306
DB_NAME=task_insight_prod
DB_USER=taskinsight_user
DB_PASSWORD=your-secure-password

# JWT
JWT_SECRET=your-very-secure-random-string-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=production

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
ALLOWED_FILE_TYPES=pdf,doc,docx,txt,jpg,jpeg,png,gif,mp4,avi,mov,xlsx,xls,ppt,pptx,zip,rar

# Email (Configure with your SMTP provider)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@taskinsight.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=https://your-domain.com

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret

# Storage
STORAGE_TYPE=local
MAX_STORAGE_PER_ORG=107374182400

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# SSL
FORCE_HTTPS=true
```

### Step 5: Create Required Directories

```bash
# Create directories
mkdir -p logs uploads

# Set permissions
chmod 755 logs uploads
```

### Step 6: Start Application with PM2

```bash
# Start with PM2
pm2 start server.js --name taskinsight-api

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup

# View logs
pm2 logs taskinsight-api

# Monitor
pm2 monit
```

### Step 7: Configure PM2 Ecosystem

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'taskinsight-api',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

Start with ecosystem:
```bash
pm2 start ecosystem.config.js
pm2 save
```

### Step 8: Configure Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create configuration
sudo nano /etc/nginx/sites-available/taskinsight-api
```

**Nginx configuration**:
```nginx
upstream taskinsight_api {
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 50M;

    location / {
        proxy_pass http://taskinsight_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    location /uploads/ {
        alias /home/taskinsight/task-insight-dms/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/taskinsight-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Frontend Deployment

### Step 1: Build Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm ci

# Create production .env
cp .env.example .env.production

# Edit production environment
nano .env.production
```

**Production .env.production**:
```env
REACT_APP_API_BASE_URL=https://api.your-domain.com/api
REACT_APP_API_TIMEOUT=30000
REACT_APP_ENV=production
REACT_APP_MAX_FILE_SIZE=10485760
REACT_APP_ALLOWED_FILE_TYPES=pdf,doc,docx,txt,jpg,jpeg,png,gif,mp4,avi,mov,xlsx,xls,ppt,pptx,zip,rar
REACT_APP_APP_NAME=Task Insight DMS
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
```

```bash
# Build for production
npm run build

# Build folder will be created
ls -la build/
```

### Step 2: Deploy to Server

**Option A: Static Hosting (Nginx)**

```bash
# Copy build to server
scp -r build/* user@your-server:/var/www/taskinsight

# On server, configure Nginx
sudo nano /etc/nginx/sites-available/taskinsight-frontend
```

**Nginx configuration for frontend**:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    root /var/www/taskinsight;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/taskinsight-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Option B: Netlify / Vercel**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy to Netlify
cd build
netlify deploy --prod

# Or for Vercel
npm install -g vercel
vercel --prod
```

---

## Database Setup

### Step 1: Install MySQL

```bash
# Install MySQL 8.0
sudo apt install -y mysql-server

# Secure installation
sudo mysql_secure_installation
```

### Step 2: Create Database and User

```sql
-- Connect to MySQL
sudo mysql

-- Create database
CREATE DATABASE task_insight_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'taskinsight_user'@'localhost' IDENTIFIED BY 'your-secure-password';

-- Grant privileges
GRANT ALL PRIVILEGES ON task_insight_prod.* TO 'taskinsight_user'@'localhost';

-- For remote access (if needed)
CREATE USER 'taskinsight_user'@'%' IDENTIFIED BY 'your-secure-password';
GRANT ALL PRIVILEGES ON task_insight_prod.* TO 'taskinsight_user'@'%';

FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Import Schema

```bash
# Import database schema
mysql -u taskinsight_user -p task_insight_prod < setup_database.sql

# Verify tables
mysql -u taskinsight_user -p task_insight_prod -e "SHOW TABLES;"
```

### Step 4: Configure MySQL for Production

Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
# Basic Settings
user = mysql
pid-file = /var/run/mysqld/mysqld.pid
socket = /var/run/mysqld/mysqld.sock
port = 3306
datadir = /var/lib/mysql

# Character Set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# InnoDB Settings
innodb_buffer_pool_size = 4G
innodb_log_file_size = 512M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Connection Settings
max_connections = 200
max_allowed_packet = 256M

# Query Cache
query_cache_type = 1
query_cache_size = 256M

# Logging
log_error = /var/log/mysql/error.log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2

# Binary Logging (for backups)
log_bin = /var/log/mysql/mysql-bin.log
expire_logs_days = 7
max_binlog_size = 100M

# Security
bind-address = 127.0.0.1
```

Restart MySQL:
```bash
sudo systemctl restart mysql
```

### Step 5: Set Up Automated Backups

Create backup script `/home/taskinsight/backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/taskinsight/backups"
DB_NAME="task_insight_prod"
DB_USER="taskinsight_user"
DB_PASS="your-secure-password"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Backup uploaded files
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /home/taskinsight/task-insight-dms/backend/uploads

# Remove backups older than 30 days
find $BACKUP_DIR -type f -name "*.gz" -mtime +30 -delete

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_DIR s3://your-bucket/backups/ --recursive
```

Make executable and add to cron:
```bash
chmod +x /home/taskinsight/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /home/taskinsight/backup.sh >> /home/taskinsight/backup.log 2>&1
```

---

## Environment Configuration

### Security Configuration

1. **Generate Secure Secrets**

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. **Set File Permissions**

```bash
# Backend files
chmod 600 .env
chmod 755 server.js
chmod -R 755 uploads logs

# Frontend environment
chmod 644 .env.production
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
sudo certbot --nginx -d api.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run

# Certificates auto-renew via cron
```

### Manual SSL Certificate

If using purchased SSL certificates:

```bash
# Copy certificates
sudo cp your-cert.crt /etc/ssl/certs/
sudo cp your-key.key /etc/ssl/private/
sudo cp ca-bundle.crt /etc/ssl/certs/

# Set permissions
sudo chmod 644 /etc/ssl/certs/your-cert.crt
sudo chmod 600 /etc/ssl/private/your-key.key
```

---

## Monitoring & Logging

### PM2 Monitoring

```bash
# View logs
pm2 logs

# Monitor resources
pm2 monit

# Generate status report
pm2 status

# Web monitoring (optional)
pm2 install pm2-logrotate
```

### Application Logs

```bash
# Create log rotation configuration
sudo nano /etc/logrotate.d/taskinsight
```

```
/home/taskinsight/task-insight-dms/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 taskinsight taskinsight
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### System Monitoring

Install monitoring tools:

```bash
# Install htop for resource monitoring
sudo apt install -y htop

# Install netdata for comprehensive monitoring
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Access at: http://your-server-ip:19999
```

---

## Post-Deployment Testing

### Health Checks

1. **Backend API Health Check**

```bash
# Test API endpoint
curl https://api.your-domain.com/api/health

# Expected response:
# {"success":true,"message":"API is running","timestamp":"2024-01-15T10:30:00.000Z"}
```

2. **Frontend Accessibility**

```bash
# Test frontend
curl -I https://your-domain.com

# Expected: 200 OK
```

3. **Database Connection**

```bash
# Test from backend server
cd /home/taskinsight/task-insight-dms/backend
node -e "const db = require('./config/database'); db.executeQuery('SELECT 1').then(r => console.log('DB OK')).catch(e => console.error('DB Error:', e))"
```

### Functional Testing

1. **User Registration**: Create a test account
2. **Login**: Authenticate successfully
3. **File Upload**: Upload a test file
4. **File Download**: Download the uploaded file
5. **File Share**: Create a share link and test access
6. **Admin Panel**: Access with platform owner credentials

### Performance Testing

```bash
# Install Apache Bench
sudo apt install -y apache2-utils

# Test API performance
ab -n 1000 -c 10 https://api.your-domain.com/api/health

# Test file upload (with authentication)
ab -n 100 -c 5 -p testfile.pdf -T "multipart/form-data" https://api.your-domain.com/api/files/upload
```

### Security Testing

1. **SSL Labs Test**: https://www.ssllabs.com/ssltest/
2. **Security Headers**: https://securityheaders.com/
3. **OWASP ZAP Scan**: Run automated security scan

---

## Troubleshooting

### Common Issues

#### 1. API Returns 502 Bad Gateway

**Cause**: Backend not running or Nginx misconfiguration

**Solution**:
```bash
# Check PM2 status
pm2 status

# Restart backend
pm2 restart taskinsight-api

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx configuration
sudo nginx -t
```

#### 2. Database Connection Fails

**Cause**: Wrong credentials or MySQL not running

**Solution**:
```bash
# Check MySQL status
sudo systemctl status mysql

# Restart MySQL
sudo systemctl restart mysql

# Test connection
mysql -u taskinsight_user -p task_insight_prod

# Check logs
sudo tail -f /var/log/mysql/error.log
```

#### 3. File Uploads Fail

**Cause**: Insufficient permissions or disk space

**Solution**:
```bash
# Check disk space
df -h

# Check permissions
ls -la /home/taskinsight/task-insight-dms/backend/uploads

# Fix permissions
chmod 755 uploads
chown -R taskinsight:taskinsight uploads

# Check Nginx upload size limit
# Edit /etc/nginx/nginx.conf
# Set: client_max_body_size 50M;
```

#### 4. High Memory Usage

**Solution**:
```bash
# Check memory
free -m

# Restart PM2 processes
pm2 restart all

# Set memory limit in ecosystem.config.js
# max_memory_restart: '1G'
```

---

## Scaling Considerations

### Horizontal Scaling

**Load Balancer Configuration**:

```nginx
upstream backend_servers {
    least_conn;
    server backend1.internal:5000;
    server backend2.internal:5000;
    server backend3.internal:5000;
}

server {
    location / {
        proxy_pass http://backend_servers;
    }
}
```

### Database Replication

Set up MySQL master-slave replication for read scalability.

### Caching

Implement Redis for:
- Session storage
- API response caching
- Rate limiting

---

## Maintenance

### Regular Tasks

**Daily**:
- [ ] Check logs for errors
- [ ] Monitor disk space
- [ ] Verify backups completed

**Weekly**:
- [ ] Review audit logs
- [ ] Check security alerts
- [ ] Update dependencies

**Monthly**:
- [ ] Security updates
- [ ] Database optimization
- [ ] Performance review
- [ ] Backup restoration test

---

## Rollback Procedure

If deployment fails:

1. **Stop new version**
   ```bash
   pm2 stop taskinsight-api
   ```

2. **Restore previous version**
   ```bash
   cd /home/taskinsight/task-insight-dms
   git checkout previous-release-tag
   npm install
   pm2 restart taskinsight-api
   ```

3. **Restore database** (if schema changed)
   ```bash
   mysql -u taskinsight_user -p task_insight_prod < backup_20240115.sql
   ```

4. **Verify system operational**

---

## Contact & Support

**Production Issues**:
- Emergency: +1 (555) 123-4567
- Email: ops@taskinsight.com
- Slack: #production-support

**Documentation**:
- Deployment Wiki: https://wiki.taskinsight.com
- Runbook: https://runbook.taskinsight.com

---

**Deployment Checklist Complete!**

Congratulations on successfully deploying Task Insight DMS to production!

---

**Document Version**: 1.0.0  
**Last Updated**: January 2024


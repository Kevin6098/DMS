# Task Insight DMS - VPS Deployment Guide for taskinsight.my

## 🎯 Overview

This guide will help you deploy your DMS to your VPS and make it live at **taskinsight.my**. We'll integrate with your existing Nginx and PM2 setup without disrupting your current applications.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:
- [ ] SSH access to your VPS
- [ ] Root or sudo access
- [ ] Domain `taskinsight.my` DNS pointing to your VPS IP
- [ ] Node.js 16+ installed (check with `node -v`)
- [ ] MySQL installed and running
- [ ] Nginx installed and running
- [ ] PM2 installed globally (check with `pm2 -v`)
- [ ] Git installed

---

## 🚀 Step-by-Step Deployment

### Step 1: Connect to Your VPS

```bash
ssh user@your-vps-ip
# or
ssh user@taskinsight.my
```

### Step 2: Prepare Directory Structure

```bash
# Create application directory (adjust path as needed)
cd /home/$(whoami)
mkdir -p dms
cd dms

# Or if you prefer a different location
# sudo mkdir -p /var/www/dms
# sudo chown $USER:$USER /var/www/dms
# cd /var/www/dms
```

### Step 3: Upload Your Project Files

**Option A: Using Git (Recommended if your code is in a repository)**
```bash
# Clone your repository
git clone https://github.com/your-username/your-repo.git .
# or if using private repo with SSH
git clone git@github.com:your-username/your-repo.git .
```

**Option B: Using SCP (if not using Git)**
```bash
# From your local machine, run:
scp -r C:\Users\User\Desktop\Website\DMS\* user@your-vps-ip:/home/user/dms/
```

**Option C: Manual Upload**
- Use FileZilla or similar FTP client
- Upload entire project to `/home/user/dms/` (or your chosen path)

---

## 🔧 Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd /home/$(whoami)/dms/backend
# or wherever you placed the files
```

### Step 2: Install Node.js Dependencies

```bash
# Install dependencies
npm install --production

# If you need build tools:
# npm install
```

### Step 3: Create Environment File

```bash
# Copy example file
cp env.example .env

# Edit the environment file
nano .env
```

**Configure `.env` file with these values:**

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=task_insight_prod
DB_USER=taskinsight_user
DB_PASSWORD=your_secure_password_here

# JWT Configuration
JWT_SECRET=generate_a_very_long_random_string_here_use_crypto
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=production

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
ALLOWED_FILE_TYPES=pdf,doc,docx,txt,jpg,jpeg,png,gif,mp4,avi,mov,xlsx,xls,ppt,pptx,zip,rar

# CORS Configuration - IMPORTANT: Use your domain
CORS_ORIGIN=https://taskinsight.my

# Frontend URL - IMPORTANT: Used for generating share links
FRONTEND_URL=https://taskinsight.my

# Security
BCRYPT_ROUNDS=10
SESSION_SECRET=another_random_secret_string_here

# Storage
STORAGE_TYPE=local
MAX_STORAGE_PER_ORG=107374182400

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

**Generate secure secrets:**
```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Create Required Directories

```bash
mkdir -p uploads logs
chmod 755 uploads logs
```

### Step 5: Set Up Database

```bash
# Login to MySQL
sudo mysql
# or
mysql -u root -p
```

**Run these SQL commands:**

```sql
-- Create database
CREATE DATABASE task_insight CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (replace 'your_secure_password' with actual password)
CREATE USER 'task_insight_admin'@'localhost' IDENTIFIED BY '920214@Ang';

-- Grant privileges
GRANT ALL PRIVILEGES ON task_insight.* TO 'task_insight_admin'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

**Import database schema:**
```bash
# From your project root
cd /home/$(whoami)/dms
mysql -u task_insight_admin -p task_insight < setup_database.sql

# Verify tables were created
mysql -u task_insight_admin -p task_insight -e "SHOW TABLES;"
```

### Step 6: Test Backend Connection

```bash
cd /home/$(whoami)/dms/backend

# Test if server starts (Ctrl+C to stop)
node server.js
```

If it starts successfully, you'll see:
```
🚀 Server running on port 5000
📊 Environment: production
🔗 API Base URL: http://localhost:5000/api
```

Press `Ctrl+C` to stop.

### Step 7: Start Backend with PM2

```bash
cd /home/$(whoami)/dms/backend

# Start with PM2 (this won't conflict with existing PM2 processes)
pm2 start server.js --name dms-backend

# Save PM2 configuration so it survives reboots
pm2 save

# Check status
pm2 status

# View logs
pm2 logs dms-backend
```

**Optional: Create PM2 Ecosystem File for Better Control**

Create `ecosystem.config.js` in backend directory:

```bash
nano ecosystem.config.js
```

Add this content:

```javascript
module.exports = {
  apps: [{
    name: 'dms-backend',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
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

Then start with:
```bash
pm2 delete dms-backend  # Remove previous instance
pm2 start ecosystem.config.js
pm2 save
```

### Step 8: Test Backend API

```bash
# Test health endpoint
curl http://localhost:5000/health

# Should return:
# {"status":"OK","timestamp":"...","uptime":...,"environment":"production"}
```

---

## 🌐 Frontend Setup

### Step 1: Navigate to Frontend Directory

```bash
cd /home/$(whoami)/dms/frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Production Environment File

```bash
# Create .env.production file
nano .env.production
```

**Add this content:**

```env
# API Configuration - Point to your domain
REACT_APP_API_BASE_URL=https://taskinsight.my/api
REACT_APP_API_TIMEOUT=30000
REACT_APP_OFFLINE_MODE=false
REACT_APP_DISABLE_API_CALLS=false

# Environment
REACT_APP_ENV=production

# File Upload Configuration
REACT_APP_MAX_FILE_SIZE=10485760
REACT_APP_ALLOWED_FILE_TYPES=pdf,doc,docx,txt,jpg,jpeg,png,gif,mp4,avi,mov

# App Configuration
REACT_APP_APP_NAME=Task Insight DMS
REACT_APP_VERSION=1.0.0

# Disable source maps in production
GENERATE_SOURCEMAP=false
```

### Step 4: Build Frontend for Production

```bash
# Build the React app
npm run build

# This creates a 'build' directory with optimized production files
ls -la build/
```

### Step 5: Deploy Frontend Build to Web Directory

```bash
# Create web directory
sudo mkdir -p /var/www/taskinsight.my

# Copy build files
sudo cp -r build/* /var/www/taskinsight.my/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/taskinsight.my
sudo chmod -R 755 /var/www/taskinsight.my
```

---

## 🔀 Nginx Configuration

Since you already have Nginx running, we'll add a new server block for taskinsight.my without affecting your existing setup.

### Step 1: Create Nginx Configuration File

```bash
sudo nano /etc/nginx/sites-available/taskinsight.my
```

**Add this configuration:**

```nginx
# Upstream for backend API
upstream dms_backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name taskinsight.my www.taskinsight.my;

    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name taskinsight.my www.taskinsight.my;

    # SSL Configuration (will be updated after certbot)
    # ssl_certificate /etc/letsencrypt/live/taskinsight.my/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/taskinsight.my/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Increase upload size limit
    client_max_body_size 50M;

    # Frontend static files
    root /var/www/taskinsight.my;
    index index.html;

    # API routes - proxy to backend
    location /api {
        proxy_pass http://dms_backend;
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

    # Uploaded files
    location /uploads {
        proxy_pass http://dms_backend;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        proxy_pass http://dms_backend;
        access_log off;
    }

    # Frontend routes - serve React app
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /static {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Cache images
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Step 2: Enable the Site

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/taskinsight.my /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 SSL Certificate Setup (Let's Encrypt)

### Step 1: Install Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install -y certbot python3-certbot-nginx
```

### Step 2: Obtain SSL Certificate

```bash
# Get certificate and auto-configure Nginx
sudo certbot --nginx -d taskinsight.my -d www.taskinsight.my

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: yes)
```

Certbot will automatically update your Nginx configuration with SSL certificate paths.

### Step 3: Test Auto-Renewal

```bash
# Test renewal process
sudo certbot renew --dry-run
```

### Step 4: Verify SSL Certificate Auto-Renewal

Certbot sets up a cron job automatically, but verify:

```bash
# Check certbot timer (systemd)
sudo systemctl status certbot.timer

# Or check crontab
sudo crontab -l | grep certbot
```

---

## ✅ Final Verification Steps

### Step 1: Verify Backend is Running

```bash
# Check PM2 status
pm2 status

# Should show 'dms-backend' as online

# Check backend logs
pm2 logs dms-backend --lines 50

# Test backend directly
curl http://localhost:5000/health
```

### Step 2: Verify Nginx Configuration

```bash
# Test Nginx config
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Check Nginx error logs if needed
sudo tail -f /var/log/nginx/error.log
```

### Step 3: Test Domain Access

```bash
# Test HTTPS endpoint
curl https://taskinsight.my/health

# Test API endpoint
curl https://taskinsight.my/api/health
```

### Step 4: Access in Browser

1. Open browser and go to: `https://taskinsight.my`
2. You should see your DMS login page
3. Try logging in with an admin account
4. Test file upload functionality

---

## 🔧 Common Issues & Troubleshooting

### Issue 1: 502 Bad Gateway

**Symptoms:** Nginx shows 502 error

**Solutions:**
```bash
# Check if backend is running
pm2 status

# If not running, start it
pm2 start dms-backend
pm2 save

# Check backend logs
pm2 logs dms-backend

# Check if port 5000 is in use
sudo netstat -tulpn | grep 5000
# or
sudo ss -tulpn | grep 5000

# Verify backend is listening on correct port
curl http://localhost:5000/health
```

### Issue 2: Database Connection Failed

**Symptoms:** Backend logs show database connection errors

**Solutions:**
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test database connection
mysql -u taskinsight_user -p task_insight_prod

# Verify .env file has correct database credentials
cd /home/$(whoami)/dms/backend
cat .env | grep DB_

# Restart backend after fixing .env
pm2 restart dms-backend
```

### Issue 3: CORS Errors in Browser

**Symptoms:** Browser console shows CORS errors

**Solutions:**
```bash
# Verify CORS_ORIGIN in backend .env
cd /home/$(whoami)/dms/backend
cat .env | grep CORS_ORIGIN

# Should be: CORS_ORIGIN=https://taskinsight.my

# Restart backend
pm2 restart dms-backend
```

### Issue 4: Frontend Shows Blank Page

**Symptoms:** Page loads but shows nothing

**Solutions:**
```bash
# Check browser console for errors
# Check if build files are in correct location
ls -la /var/www/taskinsight.my/

# Verify index.html exists
cat /var/www/taskinsight.my/index.html | head -20

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Rebuild frontend if needed
cd /home/$(whoami)/dms/frontend
npm run build
sudo cp -r build/* /var/www/taskinsight.my/
```

### Issue 5: File Upload Fails

**Symptoms:** Can't upload files

**Solutions:**
```bash
# Check uploads directory permissions
ls -la /home/$(whoami)/dms/backend/uploads

# Fix permissions if needed
chmod 755 /home/$(whoami)/dms/backend/uploads
chown -R $(whoami):$(whoami) /home/$(whoami)/dms/backend/uploads

# Check Nginx upload size limit (should be 50M)
sudo grep client_max_body_size /etc/nginx/sites-available/taskinsight.my

# Check disk space
df -h
```

### Issue 6: SSL Certificate Issues

**Symptoms:** Browser shows SSL warning

**Solutions:**
```bash
# Check certificate exists
sudo ls -la /etc/letsencrypt/live/taskinsight.my/

# Renew certificate manually
sudo certbot renew --force-renewal -d taskinsight.my

# Reload Nginx
sudo systemctl reload nginx
```

---

## 📝 Useful Commands Reference

### PM2 Commands

```bash
# View all processes
pm2 list

# View logs
pm2 logs dms-backend

# Restart backend
pm2 restart dms-backend

# Stop backend
pm2 stop dms-backend

# Start backend
pm2 start dms-backend

# Delete process
pm2 delete dms-backend

# Monitor resources
pm2 monit

# Save current PM2 processes
pm2 save
```

### Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

### MySQL Commands

```bash
# Login to MySQL
sudo mysql
# or
mysql -u taskinsight_user -p

# Backup database
mysqldump -u taskinsight_user -p task_insight_prod > backup.sql

# Restore database
mysql -u taskinsight_user -p task_insight_prod < backup.sql
```

---

## 🔄 Updating Your Application

When you need to update the application:

```bash
# 1. Stop backend
pm2 stop dms-backend

# 2. Pull latest code (if using Git)
cd /home/$(whoami)/dms
git pull origin main

# 3. Update backend dependencies
cd backend
npm install --production

# 4. Restart backend
pm2 start dms-backend
pm2 save

# 5. Rebuild frontend
cd ../frontend
npm run build

# 6. Update web files
sudo cp -r build/* /var/www/taskinsight.my/

# 7. Verify everything works
pm2 logs dms-backend
curl https://taskinsight.my/health
```

---

## 🎉 Success!

Your DMS should now be live at **https://taskinsight.my**!

### Next Steps:

1. **Create your first admin user:**
   - Access the database and create a platform owner account
   - Or use your registration system if available

2. **Test all features:**
   - Login/Registration
   - File upload/download
   - File sharing
   - Admin panel

3. **Set up monitoring:**
   - Monitor PM2 processes regularly
   - Set up automated backups
   - Monitor disk space

4. **Security recommendations:**
   - Change all default passwords
   - Enable firewall if not already enabled
   - Regular system updates: `sudo apt update && sudo apt upgrade`

---

## 📞 Need Help?

If you encounter issues:

1. Check PM2 logs: `pm2 logs dms-backend`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check backend .env configuration
4. Verify database connection
5. Test endpoints individually with curl

---

**Good luck with your deployment! 🚀**


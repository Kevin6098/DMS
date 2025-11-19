# VPS Quick Reference - Essential Commands

## 🚀 Quick Start Commands

### Start Backend
```bash
cd /home/$(whoami)/dms/backend
pm2 start server.js --name dms-backend
pm2 save
```

### Stop Backend
```bash
pm2 stop dms-backend
```

### Restart Backend
```bash
pm2 restart dms-backend
```

### View Backend Logs
```bash
pm2 logs dms-backend
```

### Rebuild and Deploy Frontend
```bash
cd /home/$(whoami)/dms/frontend
npm run build
sudo cp -r build/* /var/www/taskinsight.my/
```

### Reload Nginx
```bash
sudo nginx -t  # Test config first
sudo systemctl reload nginx
```

---

## 🔍 Status Checks

### Check Backend Status
```bash
pm2 status
pm2 logs dms-backend --lines 50
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t
```

### Test API Endpoints
```bash
# Health check (local)
curl http://localhost:5000/health

# Health check (public)
curl https://taskinsight.my/api/health
```

### Check Database Connection
```bash
mysql -u taskinsight_user -p task_insight_prod
```

---

## 📝 Common Tasks

### Update Application
```bash
# Stop backend
pm2 stop dms-backend

# Update code (if using Git)
cd /home/$(whoami)/dms
git pull

# Update backend
cd backend
npm install --production
pm2 start dms-backend
pm2 save

# Update frontend
cd ../frontend
npm run build
sudo cp -r build/* /var/www/taskinsight.my/
```

### View Real-time Logs
```bash
# Backend logs
pm2 logs dms-backend --lines 0

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Backup Database
```bash
mysqldump -u taskinsight_user -p task_insight_prod > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database
```bash
mysql -u taskinsight_user -p task_insight_prod < backup_file.sql
```

---

## 🛠️ Troubleshooting Commands

### Check Port Usage
```bash
sudo netstat -tulpn | grep 5000
# or
sudo ss -tulpn | grep 5000
```

### Check Disk Space
```bash
df -h
du -sh /home/$(whoami)/dms/backend/uploads
```

### Check File Permissions
```bash
ls -la /home/$(whoami)/dms/backend/uploads
ls -la /var/www/taskinsight.my
```

### Restart Everything
```bash
pm2 restart dms-backend
sudo systemctl restart nginx
sudo systemctl restart mysql
```

---

## 🔐 SSL Certificate Commands

### Renew SSL Certificate
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Test SSL Renewal
```bash
sudo certbot renew --dry-run
```

---

## 📊 Monitoring

### Monitor Resources (PM2)
```bash
pm2 monit
```

### Monitor System Resources
```bash
htop
# or
top
```

### Check Application Uptime
```bash
pm2 info dms-backend
```

---

## 📂 Directory Structure

```
/home/user/dms/
├── backend/
│   ├── .env
│   ├── server.js
│   ├── uploads/
│   └── logs/
├── frontend/
│   └── build/
└── setup_database.sql

/var/www/taskinsight.my/
└── [Frontend build files]
```

---

## 🌐 Domain Configuration

**Frontend:** `https://taskinsight.my`  
**Backend API:** `https://taskinsight.my/api`  
**Local Backend:** `http://localhost:5000`

---

## 🔑 Environment Variables (Quick Check)

```bash
# Backend .env location
cat /home/$(whoami)/dms/backend/.env | grep -v PASSWORD

# Frontend .env.production
cat /home/$(whoami)/dms/frontend/.env.production
```

---

**Pro Tip:** Bookmark this file for quick reference during deployment and maintenance!


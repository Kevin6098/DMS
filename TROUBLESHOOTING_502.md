# Troubleshooting 502 Bad Gateway Error

## What is a 502 Error?
A 502 Bad Gateway error means your reverse proxy (nginx) cannot reach your backend Node.js server. This is a server-side issue, not a client-side problem.

## Common Causes & Solutions

### 1. Backend Server Not Running
**Check if your Node.js backend is running:**
```bash
# SSH into your server
ssh user@your-server

# Check if Node.js process is running
ps aux | grep node

# Or check with PM2 (if you're using it)
pm2 list
pm2 logs
```

**Start the backend if it's not running:**
```bash
cd /path/to/your/backend
npm start

# Or with PM2
pm2 start server.js --name dms-backend
pm2 save
```

### 2. Backend Server Crashed
**Check backend logs for errors:**
```bash
# If using PM2
pm2 logs dms-backend

# If using systemd
journalctl -u your-service-name -n 50

# Or check the log file directly
tail -f /path/to/backend/logs/error.log
```

**Common crash causes:**
- Database connection failed
- Missing environment variables
- Port already in use
- Out of memory

### 3. Database Connection Issues
**Check database connection:**
```bash
# Test MySQL connection
mysql -u your_db_user -p -h localhost your_database

# Check if MySQL is running
systemctl status mysql
# or
systemctl status mariadb
```

**Verify database credentials in `.env`:**
```env
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_database
DB_PORT=3306
```

### 4. Port Configuration Mismatch
**Check your backend port:**
```bash
# In your backend/.env file
PORT=5000

# Check if the port is in use
netstat -tulpn | grep 5000
# or
lsof -i :5000
```

**Check nginx configuration:**
```nginx
# Should point to the same port
location /api {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

### 5. Missing Environment Variables
**Check if all required env variables are set:**
```bash
cd /path/to/backend
cat .env

# Required variables:
# - DB_HOST
# - DB_USER
# - DB_PASSWORD
# - DB_NAME
# - JWT_SECRET
# - PORT
# - CORS_ORIGIN
```

### 6. Nginx Configuration Issues
**Check nginx error logs:**
```bash
tail -f /var/log/nginx/error.log
```

**Test nginx configuration:**
```bash
sudo nginx -t
```

**Restart nginx:**
```bash
sudo systemctl restart nginx
```

### 7. Firewall Issues
**Check if port 5000 is open:**
```bash
# Check firewall status
sudo ufw status

# Allow port 5000 if needed (for internal use only)
sudo ufw allow from 127.0.0.1 to any port 5000
```

### 8. Memory/Resource Issues
**Check server resources:**
```bash
# Check memory usage
free -h

# Check disk space
df -h

# Check CPU usage
top
```

## Quick Fix Steps

1. **SSH into your server**
2. **Check if backend is running:**
   ```bash
   pm2 list
   # or
   ps aux | grep node
   ```

3. **If not running, start it:**
   ```bash
   cd /path/to/backend
   pm2 start server.js --name dms-backend
   # or
   npm start
   ```

4. **Check backend logs:**
   ```bash
   pm2 logs dms-backend
   # Look for errors
   ```

5. **Check nginx logs:**
   ```bash
   tail -f /var/log/nginx/error.log
   ```

6. **Test the backend directly:**
   ```bash
   curl http://localhost:5000/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test"}'
   ```

7. **If backend works but nginx doesn't, restart nginx:**
   ```bash
   sudo systemctl restart nginx
   ```

## Prevention

1. **Use PM2 for process management:**
   ```bash
   npm install -g pm2
   pm2 start server.js --name dms-backend
   pm2 startup
   pm2 save
   ```

2. **Set up auto-restart on crash:**
   ```bash
   pm2 start server.js --name dms-backend --max-restarts 10
   ```

3. **Monitor with PM2:**
   ```bash
   pm2 monit
   ```

4. **Set up log rotation:**
   ```bash
   pm2 install pm2-logrotate
   ```

## Debugging Commands

```bash
# Check backend status
pm2 status

# View real-time logs
pm2 logs dms-backend --lines 100

# Restart backend
pm2 restart dms-backend

# Check nginx status
sudo systemctl status nginx

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Check if port is listening
netstat -tulpn | grep 5000

# Test database connection
mysql -u $DB_USER -p$DB_PASSWORD -h $DB_HOST $DB_NAME -e "SELECT 1;"
```


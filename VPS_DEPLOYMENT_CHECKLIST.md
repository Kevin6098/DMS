# VPS Deployment Checklist - taskinsight.my

Use this checklist to track your deployment progress.

## ✅ Pre-Deployment

- [ ] SSH access to VPS verified
- [ ] Domain `taskinsight.my` DNS pointing to VPS IP
- [ ] Node.js installed (`node -v` shows 16+)
- [ ] MySQL installed and running
- [ ] Nginx installed and running
- [ ] PM2 installed (`pm2 -v`)
- [ ] Git installed (if using Git)

## ✅ Project Setup

- [ ] Created project directory (e.g., `/home/user/dms`)
- [ ] Uploaded project files to VPS
- [ ] Verified all files are present

## ✅ Backend Setup

- [ ] Navigated to backend directory
- [ ] Ran `npm install --production`
- [ ] Created `.env` file from `env.example`
- [ ] Configured database credentials in `.env`
- [ ] Generated secure JWT_SECRET
- [ ] Generated secure SESSION_SECRET
- [ ] Set `CORS_ORIGIN=https://taskinsight.my`
- [ ] Set `NODE_ENV=production`
- [ ] Created `uploads` and `logs` directories
- [ ] Set proper permissions on directories

## ✅ Database Setup

- [ ] Created database `task_insight_prod`
- [ ] Created user `taskinsight_user`
- [ ] Granted privileges to user
- [ ] Imported schema (`setup_database.sql`)
- [ ] Verified tables exist

## ✅ Backend Deployment

- [ ] Tested backend starts (`node server.js`)
- [ ] Started backend with PM2
- [ ] Saved PM2 configuration (`pm2 save`)
- [ ] Verified PM2 status (`pm2 status`)
- [ ] Tested health endpoint (`curl http://localhost:5000/health`)
- [ ] Checked PM2 logs for errors

## ✅ Frontend Setup

- [ ] Navigated to frontend directory
- [ ] Ran `npm install`
- [ ] Created `.env.production` file
- [ ] Set `REACT_APP_API_BASE_URL=https://taskinsight.my/api`
- [ ] Ran `npm run build`
- [ ] Copied build files to `/var/www/taskinsight.my`
- [ ] Set proper permissions on web directory

## ✅ Nginx Configuration

- [ ] Created `/etc/nginx/sites-available/taskinsight.my`
- [ ] Added server block configuration
- [ ] Enabled site (symlink to sites-enabled)
- [ ] Tested Nginx configuration (`sudo nginx -t`)
- [ ] Reloaded Nginx (`sudo systemctl reload nginx`)

## ✅ SSL Certificate

- [ ] Installed Certbot
- [ ] Obtained SSL certificate (`certbot --nginx`)
- [ ] Verified certificate exists
- [ ] Tested auto-renewal (`certbot renew --dry-run`)

## ✅ Verification

- [ ] Backend health check works: `curl http://localhost:5000/health`
- [ ] Frontend accessible: `curl -I https://taskinsight.my`
- [ ] API endpoint works: `curl https://taskinsight.my/api/health`
- [ ] Can access site in browser: `https://taskinsight.my`
- [ ] Login page loads correctly
- [ ] Can create/login with account
- [ ] File upload works
- [ ] No CORS errors in browser console

## ✅ Post-Deployment

- [ ] Created first admin user
- [ ] Tested all major features
- [ ] Verified PM2 auto-start on reboot
- [ ] Set up database backup script
- [ ] Configured log rotation
- [ ] Documented access credentials (securely)
- [ ] Saved deployment notes

---

## 🆘 If Something Fails

1. Check PM2 logs: `pm2 logs dms-backend`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify .env file configuration
4. Test backend directly: `curl http://localhost:5000/health`
5. Review the troubleshooting section in VPS_DEPLOYMENT_GUIDE.md

---

**Deployment Date:** __________________  
**Deployed By:** __________________  
**VPS IP:** __________________  
**Notes:** __________________


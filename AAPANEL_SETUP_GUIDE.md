# aaPanel Subdomain Setup Guide - Mitsuki JPY Quiz System

## Overview

This guide shows you how to deploy your quiz system with subdomains using **aaPanel** (easier than manual setup!).

---

## Prerequisites

- ✅ aaPanel installed on your server
- ✅ Domain: `mitsukijp.com` pointing to your server
- ✅ Port 8080 available for the application

---

## Part 1: DNS Configuration (Do This First!)

### Option A: Using Cloudflare (Recommended - Easier)

1. **Add your domain to Cloudflare** (if not already)
   - Go to https://dash.cloudflare.com
   - Click "Add a Site"
   - Enter: `mitsukijp.com`

2. **Add DNS records:**
   - Click on your domain → DNS → Records
   - Add these A records:

   ```
   Type    Name        Content (Your Server IP)    Proxy Status
   A       admin       YOUR_SERVER_IP              Proxied (Orange)
   A       quiz        YOUR_SERVER_IP              Proxied (Orange)
   A       register    YOUR_SERVER_IP              Proxied (Orange)
   A       @           YOUR_SERVER_IP              Proxied (Orange)
   A       www         YOUR_SERVER_IP              Proxied (Orange)
   ```

3. **Update nameservers at your domain registrar**
   - Cloudflare will show you 2 nameservers
   - Go to your domain registrar
   - Change nameservers to Cloudflare's

### Option B: Using Your Domain Registrar

1. Go to your domain registrar's DNS settings
2. Add these A records:

   ```
   Type    Name        Value
   A       admin       YOUR_SERVER_IP
   A       quiz        YOUR_SERVER_IP
   A       register    YOUR_SERVER_IP
   A       @           YOUR_SERVER_IP
   A       www         YOUR_SERVER_IP
   ```

3. Wait 5-60 minutes for DNS propagation

---

## Part 2: aaPanel Website Setup

### Step 1: Create Main Domain Website

1. **Login to aaPanel**
   - Go to: `http://YOUR_SERVER_IP:7800`

2. **Create website for main domain:**
   - Click **"Website"** → **"Add site"**
   - **Domain name**: `mitsukijp.com`
   - **Remarks**: `Mitsuki Quiz Main`
   - **Root directory**: `/home/lainlain/Desktop/Go Lang /quiz/web`
   - **PHP Version**: `Pure static`
   - **Database**: None
   - Click **Submit**

### Step 2: Create Admin Subdomain

1. **Add admin subdomain:**
   - Click **"Website"** → **"Add site"**
   - **Domain name**: `admin.mitsukijp.com`
   - **Remarks**: `Mitsuki Quiz Admin`
   - **Root directory**: `/home/lainlain/Desktop/Go Lang /quiz/web`
   - **PHP Version**: `Pure static`
   - Click **Submit**

### Step 3: Create Quiz Subdomain

1. **Add quiz subdomain:**
   - Click **"Website"** → **"Add site"**
   - **Domain name**: `quiz.mitsukijp.com`
   - **Remarks**: `Mitsuki Quiz Student`
   - **Root directory**: `/home/lainlain/Desktop/Go Lang /quiz/web`
   - **PHP Version**: `Pure static`
   - Click **Submit**

### Step 4: Create Register Subdomain

1. **Add register subdomain:**
   - Click **"Website"** → **"Add site"**
   - **Domain name**: `register.mitsukijp.com`
   - **Remarks**: `Mitsuki Quiz Registration`
   - **Root directory**: `/home/lainlain/Desktop/Go Lang /quiz/web`
   - **PHP Version**: `Pure static`
   - Click **Submit**

---

## Part 3: Configure Reverse Proxy (Critical!)

### For Admin Subdomain (admin.mitsukijp.com)

1. **Go to Website settings:**
   - Click **"Website"** → Find `admin.mitsukijp.com` → Click **"Settings"**

2. **Setup Reverse Proxy:**
   - Click **"Reverse Proxy"** tab
   - Click **"Add Reverse Proxy"**
   - **Proxy name**: `Admin Backend`
   - **Target URL**: `http://127.0.0.1:8080`
   - **Send domain**: `admin.mitsukijp.com`
   - **Advanced settings:**
     ```nginx
     proxy_set_header Host $host;
     proxy_set_header X-Real-IP $remote_addr;
     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
     proxy_set_header X-Forwarded-Proto $scheme;
     ```
   - Click **Submit**

### For Quiz Subdomain (quiz.mitsukijp.com)

1. **Go to Website settings:**
   - Click **"Website"** → Find `quiz.mitsukijp.com` → Click **"Settings"**

2. **Setup Reverse Proxy:**
   - Click **"Reverse Proxy"** tab
   - Click **"Add Reverse Proxy"**
   - **Proxy name**: `Quiz Backend`
   - **Target URL**: `http://127.0.0.1:8080`
   - **Send domain**: `quiz.mitsukijp.com`
   - **Advanced settings:**
     ```nginx
     proxy_set_header Host $host;
     proxy_set_header X-Real-IP $remote_addr;
     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
     proxy_set_header X-Forwarded-Proto $scheme;
     ```
   - Click **Submit**

### For Register Subdomain (register.mitsukijp.com)

1. **Go to Website settings:**
   - Click **"Website"** → Find `register.mitsukijp.com` → Click **"Settings"**

2. **Setup Reverse Proxy:**
   - Click **"Reverse Proxy"** tab
   - Click **"Add Reverse Proxy"**
   - **Proxy name**: `Register Backend`
   - **Target URL**: `http://127.0.0.1:8080`
   - **Send domain**: `register.mitsukijp.com`
   - **Advanced settings:**
     ```nginx
     proxy_set_header Host $host;
     proxy_set_header X-Real-IP $remote_addr;
     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
     proxy_set_header X-Forwarded-Proto $scheme;
     ```
   - Click **Submit**

### For Main Domain (mitsukijp.com)

1. **Go to Website settings:**
   - Click **"Website"** → Find `mitsukijp.com` → Click **"Settings"**

2. **Setup Reverse Proxy:**
   - Click **"Reverse Proxy"** tab
   - Click **"Add Reverse Proxy"**
   - **Proxy name**: `Main Backend`
   - **Target URL**: `http://127.0.0.1:8080`
   - **Send domain**: `mitsukijp.com`
   - **Advanced settings:**
     ```nginx
     proxy_set_header Host $host;
     proxy_set_header X-Real-IP $remote_addr;
     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
     proxy_set_header X-Forwarded-Proto $scheme;
     ```
   - Click **Submit**

---

## Part 4: Install SSL Certificates (Free!)

### For Each Subdomain:

1. **Go to Website settings:**
   - Click **"Website"** → Find domain → Click **"Settings"**

2. **Get SSL Certificate:**
   - Click **"SSL"** tab
   - Click **"Let's Encrypt"**
   - Check the domain you want to secure
   - Enter your email
   - Click **"Apply"**
   - Wait 1-2 minutes

3. **Enable Force HTTPS:**
   - After SSL is installed
   - Toggle **"Force HTTPS"** to ON

4. **Repeat for all domains:**
   - ✅ admin.mitsukijp.com
   - ✅ quiz.mitsukijp.com
   - ✅ register.mitsukijp.com
   - ✅ mitsukijp.com

---

## Part 5: Deploy Application

### Method 1: Using aaPanel Process Manager (Recommended)

1. **Install PM2 Manager (if not installed):**
   - Go to **"App Store"**
   - Search for **"PM2 Manager"**
   - Click **"Install"**

2. **Add your application:**
   - Go to **"Website"** → **"PM2 Manager"**
   - Click **"Add Project"**
   - **Project Name**: `mitsukijp-quiz`
   - **Startup File**: `/home/lainlain/Desktop/Go Lang /quiz/bin/quiz-server`
   - **Run Dir**: `/home/lainlain/Desktop/Go Lang /quiz`
   - **Run User**: `www`
   - **Port**: Leave empty (we use 8080 internally)
   - **Environment Variables** (click Add):
     ```
     GIN_MODE=release
     SERVER_PORT=8080
     JWT_SECRET=your-secret-key-change-in-production
     DATABASE_URL=/home/lainlain/Desktop/Go Lang /quiz/quiz.db
     JWT_EXPIRE_HOURS=24
     ```
   - Click **Submit**

3. **Build the binary first:**
   ```bash
   cd "/home/lainlain/Desktop/Go Lang /quiz"
   go build -o bin/quiz-server cmd/server/main.go
   chmod +x bin/quiz-server
   ```

4. **Start the application:**
   - In PM2 Manager, click **"Start"** next to your project

### Method 2: Using Systemd (Alternative)

1. **Create systemd service:**
   ```bash
   sudo cp mitsukijp-quiz.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl start mitsukijp-quiz
   sudo systemctl enable mitsukijp-quiz
   ```

2. **Check status:**
   ```bash
   sudo systemctl status mitsukijp-quiz
   ```

---

## Part 6: Open Firewall Port

1. **In aaPanel:**
   - Go to **"Security"**
   - Add port **8080**
   - **Remark**: `Quiz App Internal`
   - Click **Submit**

2. **Note:** This is only for internal communication. Users will access via:
   - Port 80 (HTTP) - handled by Nginx
   - Port 443 (HTTPS) - handled by Nginx

---

## Part 7: Testing

### Test Each Subdomain:

1. **Admin Dashboard:**
   - Open: `https://admin.mitsukijp.com`
   - Should show admin login page
   - Login with: `admin@mitsuki-jpy.com` / `admin123`

2. **Quiz Interface:**
   - Open: `https://quiz.mitsukijp.com`
   - Should show quiz selection page

3. **Registration:**
   - Open: `https://register.mitsukijp.com`
   - Should show course registration form

4. **Main Domain:**
   - Open: `https://mitsukijp.com`
   - Should redirect to quiz subdomain

### Check Application Logs:

**If using PM2:**
```bash
# In aaPanel → Website → PM2 Manager → Click "Log" button
```

**If using Systemd:**
```bash
sudo journalctl -u mitsukijp-quiz -f
```

---

## Troubleshooting

### Problem 1: 502 Bad Gateway

**Cause:** Application not running

**Solution:**
1. Check if app is running:
   ```bash
   sudo systemctl status mitsukijp-quiz
   # OR check PM2 Manager in aaPanel
   ```

2. Check application port:
   ```bash
   netstat -tlnp | grep 8080
   # Should show your application
   ```

3. Restart application:
   ```bash
   sudo systemctl restart mitsukijp-quiz
   # OR restart in PM2 Manager
   ```

### Problem 2: SSL Certificate Error

**Cause:** DNS not propagated or wrong domain

**Solution:**
1. Verify DNS:
   ```bash
   nslookup admin.mitsukijp.com
   nslookup quiz.mitsukijp.com
   ```

2. Wait 5-60 minutes for DNS propagation

3. Try SSL installation again in aaPanel

### Problem 3: Subdomain Shows Wrong Content

**Cause:** Reverse proxy not configured correctly

**Solution:**
1. Go to Website → Settings → Reverse Proxy
2. Verify:
   - Target URL: `http://127.0.0.1:8080`
   - Send domain matches the subdomain
   - Headers are set correctly

3. Click **"Edit"** → **"Submit"** to refresh

### Problem 4: Can't Access aaPanel

**Cause:** Firewall blocking port 7800

**Solution:**
```bash
sudo ufw allow 7800/tcp
# OR in cloud provider's security group, allow port 7800
```

---

## Quick Command Reference

### Application Management (Systemd)

```bash
# Start application
sudo systemctl start mitsukijp-quiz

# Stop application
sudo systemctl stop mitsukijp-quiz

# Restart application
sudo systemctl restart mitsukijp-quiz

# Check status
sudo systemctl status mitsukijp-quiz

# View logs
sudo journalctl -u mitsukijp-quiz -f

# Enable auto-start
sudo systemctl enable mitsukijp-quiz
```

### Application Management (PM2 via aaPanel)

- Go to **Website** → **PM2 Manager**
- Use buttons: Start / Stop / Restart / Log

### Rebuild Application

```bash
cd "/home/lainlain/Desktop/Go Lang /quiz"
go build -o bin/quiz-server cmd/server/main.go
chmod +x bin/quiz-server
sudo systemctl restart mitsukijp-quiz
# OR restart in PM2 Manager
```

### Check If App Is Running

```bash
# Check port
netstat -tlnp | grep 8080

# Check process
ps aux | grep quiz-server

# Test locally
curl http://localhost:8080
```

---

## Security Checklist

- [ ] Change default admin password
- [ ] Update JWT_SECRET in `.env` file
- [ ] Enable Force HTTPS on all domains
- [ ] Set GIN_MODE=release
- [ ] Configure aaPanel security settings
- [ ] Enable aaPanel Two-Factor Authentication
- [ ] Regular database backups
- [ ] Monitor logs for suspicious activity

---

## Backup Configuration

### Create Backup Script

Create file: `backup-quiz.sh`

```bash
#!/bin/bash

BACKUP_DIR="/www/backup/quiz"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup database
cp "/home/lainlain/Desktop/Go Lang /quiz/quiz.db" \
   "$BACKUP_DIR/quiz_$DATE.db"

# Backup uploads
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" \
   "/home/lainlain/Desktop/Go Lang /quiz/web/uploads"

# Keep only last 7 days
find "$BACKUP_DIR" -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

### Add to aaPanel Cron:

1. Go to **"Cron"**
2. Click **"Add Task"**
3. **Type**: Shell Script
4. **Name**: Quiz Backup
5. **Script**: `/home/lainlain/Desktop/Go Lang /quiz/backup-quiz.sh`
6. **Period**: Daily at 2:00 AM
7. Click **Submit**

---

## Performance Optimization

### 1. Enable Nginx Caching

For each website in aaPanel:
- Go to **Settings** → **Configuration File**
- Add before `location /`:

```nginx
# Cache static files
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
    expires 7d;
    add_header Cache-Control "public, immutable";
}
```

### 2. Enable Gzip Compression

Already enabled by default in aaPanel Nginx, but verify:
- Go to **Settings** → **Configuration File**
- Check for:

```nginx
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

### 3. Increase Worker Processes

If you have high traffic:
1. Go to **"App Store"** → **Nginx**
2. Click **"Settings"**
3. Increase **Worker Processes** to number of CPU cores

---

## Monitoring

### Setup aaPanel Monitoring

1. **Enable System Monitoring:**
   - Go to **"Monitor"**
   - Enable **CPU**, **Memory**, **Disk** monitoring

2. **Setup Alerts:**
   - Go to **"Monitor"** → **"Alarm"**
   - Add alert rules:
     - CPU usage > 80%
     - Memory usage > 90%
     - Disk usage > 85%

3. **Application Monitoring:**
   - Use PM2 Manager to monitor app status
   - Set up email alerts if app crashes

---

## Summary - What You Need to Do

### ✅ One-Time Setup:

1. **Configure DNS** (10 minutes)
   - Add A records for subdomains

2. **Create websites in aaPanel** (15 minutes)
   - Create 4 websites (admin, quiz, register, main)

3. **Setup reverse proxy** (10 minutes)
   - Configure proxy for each subdomain → localhost:8080

4. **Install SSL certificates** (10 minutes)
   - Use Let's Encrypt in aaPanel

5. **Deploy application** (5 minutes)
   - Use PM2 Manager or systemd

### ⏱️ Total Time: ~50 minutes

---

## Support Resources

- **aaPanel Documentation**: https://www.aapanel.com/reference.html
- **aaPanel Forum**: https://forum.aapanel.com/
- **Cloudflare Docs**: https://developers.cloudflare.com/dns/

---

**Last Updated**: December 10, 2025

🎉 **Your quiz system will be live with beautiful subdomains using aaPanel!**

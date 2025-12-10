# Quick Start - Subdomain Setup

## What Has Been Created

✅ **Subdomain Middleware** (`internal/middleware/subdomain.go`)  
✅ **Nginx Configuration** (`nginx-subdomain.conf`)  
✅ **Systemd Service** (`mitsukijp-quiz.service`)  
✅ **Deployment Script** (`deploy-subdomain.sh`)  
✅ **Complete Documentation** (`SUBDOMAIN_SETUP_GUIDE.md`)

---

## Your Subdomains

- **admin.mitsukijp.com** → Admin Dashboard
- **quiz.mitsukijp.com** → Quiz Taking Interface  
- **register.mitsukijp.com** → Course Registration
- **mitsukijp.com** → Redirects to quiz subdomain

---

## 3-Step Quick Setup

### Step 1: DNS Configuration (Do This First!)

Go to your domain registrar and add these A records:

```
Type    Name        Value (Your Server IP)
A       admin       YOUR_SERVER_IP
A       quiz        YOUR_SERVER_IP
A       register    YOUR_SERVER_IP
A       @           YOUR_SERVER_IP
A       www         YOUR_SERVER_IP
```

**Example:**
If your server IP is `203.0.113.45`:
```
A       admin       203.0.113.45
A       quiz        203.0.113.45
A       register    203.0.113.45
```

### Step 2: Run Deployment Script

```bash
cd "/home/lainlain/Desktop/Go Lang /quiz"
chmod +x deploy-subdomain.sh
./deploy-subdomain.sh
```

This script will:
- ✅ Build your application
- ✅ Install and configure Nginx
- ✅ Create systemd service
- ✅ Start the application
- ✅ Configure firewall

### Step 3: Install SSL Certificate (HTTPS)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificates for all subdomains
sudo certbot --nginx -d admin.mitsukijp.com -d quiz.mitsukijp.com -d register.mitsukijp.com -d mitsukijp.com -d www.mitsukijp.com
```

**Done!** Your subdomains are now live with HTTPS! 🎉

---

## Testing

### Before DNS Propagates (Local Testing)

Edit `/etc/hosts`:
```bash
sudo nano /etc/hosts
```

Add:
```
127.0.0.1   admin.mitsukijp.local
127.0.0.1   quiz.mitsukijp.local  
127.0.0.1   register.mitsukijp.local
```

Test:
- http://admin.mitsukijp.local
- http://quiz.mitsukijp.local
- http://register.mitsukijp.local

### After DNS Propagates

```bash
# Check DNS
nslookup admin.mitsukijp.com
nslookup quiz.mitsukijp.com
nslookup register.mitsukijp.com

# Test sites
curl -I https://admin.mitsukijp.com
curl -I https://quiz.mitsukijp.com
curl -I https://register.mitsukijp.com
```

---

## Useful Commands

### Application Management

```bash
# Check status
sudo systemctl status mitsukijp-quiz

# View logs
sudo journalctl -u mitsukijp-quiz -f

# Restart application
sudo systemctl restart mitsukijp-quiz

# Stop application
sudo systemctl stop mitsukijp-quiz

# Start application
sudo systemctl start mitsukijp-quiz
```

### Nginx Management

```bash
# Check nginx status
sudo systemctl status nginx

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/admin.mitsukijp.access.log
sudo tail -f /var/log/nginx/quiz.mitsukijp.access.log
sudo tail -f /var/log/nginx/register.mitsukijp.access.log
```

---

## Subdomain Behavior

### admin.mitsukijp.com
- **Access**: Admin dashboard and management
- **Routes**: `/admin/*`, `/api/admin/*`
- **Redirect**: Root `/` → `/admin/login`

### quiz.mitsukijp.com
- **Access**: Quiz taking interface
- **Routes**: `/quiz/*`, `/api/quiz/*`, `/api/student/*`
- **Redirect**: Root `/` → `/quiz`

### register.mitsukijp.com
- **Access**: Course registration
- **Routes**: `/register/*`, `/api/register/*`
- **Redirect**: Root `/` → `/register/1`

### mitsukijp.com / www.mitsukijp.com
- **Redirect**: → `https://quiz.mitsukijp.com`

---

## Troubleshooting

### Problem: 502 Bad Gateway
**Solution:**
```bash
# Check if app is running
sudo systemctl status mitsukijp-quiz

# Check app logs
sudo journalctl -u mitsukijp-quiz -n 50
```

### Problem: DNS not working
**Solution:**
```bash
# Wait 5-60 minutes for DNS propagation
# Check DNS
dig admin.mitsukijp.com
nslookup admin.mitsukijp.com
```

### Problem: SSL certificate error
**Solution:**
```bash
# Renew certificate
sudo certbot renew
sudo systemctl restart nginx
```

### Problem: Subdomain routing not working
**Solution:**
```bash
# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Verify subdomain middleware is active
sudo journalctl -u mitsukijp-quiz -f
```

---

## File Locations

- **Application Binary**: `/home/lainlain/Desktop/Go Lang /quiz/bin/quiz-server`
- **Nginx Config**: `/etc/nginx/sites-available/mitsukijp.com`
- **Systemd Service**: `/etc/systemd/system/mitsukijp-quiz.service`
- **SSL Certificates**: `/etc/letsencrypt/live/mitsukijp.com/`
- **Application Logs**: `sudo journalctl -u mitsukijp-quiz`
- **Nginx Logs**: `/var/log/nginx/`

---

## Security Checklist

- [ ] Change JWT_SECRET in `.env` file
- [ ] Change default admin password
- [ ] Enable firewall (UFW)
- [ ] Install SSL certificate (Let's Encrypt)
- [ ] Set GIN_MODE=release in production
- [ ] Regular backup of database
- [ ] Monitor logs for suspicious activity

---

## Next Steps After Setup

1. ✅ Verify all subdomains work
2. ✅ Test admin login at `https://admin.mitsukijp.com`
3. ✅ Test quiz at `https://quiz.mitsukijp.com`
4. ✅ Test registration at `https://register.mitsukijp.com`
5. ✅ Set up regular database backups
6. ✅ Configure monitoring/alerts
7. ✅ Update DNS TTL to longer value (after testing)

---

**For detailed information, see `SUBDOMAIN_SETUP_GUIDE.md`**

🎉 Congratulations! Your quiz system is now running with subdomains!

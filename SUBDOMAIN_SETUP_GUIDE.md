# Subdomain Setup Guide - Mitsuki JPY Quiz System

**Date:** December 10, 2025  
**Subdomains to Configure:**
- `admin.mitsukijp.com` - Admin Dashboard
- `quiz.mitsukijp.com` - Quiz Taking Interface
- `register.mitsukijp.com` - Course Registration
- `www.mitsukijp.com` or `mitsukijp.com` - Main landing page (optional)

---

## Table of Contents
1. [DNS Configuration](#1-dns-configuration)
2. [Application Code Changes](#2-application-code-changes)
3. [Nginx Configuration](#3-nginx-reverse-proxy-configuration)
4. [SSL Certificate Setup](#4-ssl-certificate-setup)
5. [Testing](#5-testing)

---

## 1. DNS Configuration

### Step 1: Add DNS A Records
Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and add these DNS records:

```
Type    Host/Name       Value/Points To         TTL
A       admin           YOUR_SERVER_IP          3600
A       quiz            YOUR_SERVER_IP          3600
A       register        YOUR_SERVER_IP          3600
A       @               YOUR_SERVER_IP          3600
A       www             YOUR_SERVER_IP          3600
```

**Example with IP `203.0.113.45`:**
```
A       admin           203.0.113.45            3600
A       quiz            203.0.113.45            3600
A       register        203.0.113.45            3600
```

### Step 2: Verify DNS Propagation
After adding records, wait 5-60 minutes and verify:

```bash
# Check if DNS is working
nslookup admin.mitsukijp.com
nslookup quiz.mitsukijp.com
nslookup register.mitsukijp.com

# Or use dig
dig admin.mitsukijp.com
dig quiz.mitsukijp.com
dig register.mitsukijp.com
```

---

## 2. Application Code Changes

### Option A: Subdomain-Based Routing (Recommended)

Create a new middleware to handle subdomain routing:

**File: `internal/middleware/subdomain.go`**

```go
package middleware

import (
	"strings"
	"github.com/gin-gonic/gin"
)

// SubdomainRouter redirects based on subdomain
func SubdomainRouter() gin.HandlerFunc {
	return func(c *gin.Context) {
		host := c.Request.Host
		
		// Remove port if exists (localhost:8080 -> localhost)
		if strings.Contains(host, ":") {
			host = strings.Split(host, ":")[0]
		}
		
		// Extract subdomain
		parts := strings.Split(host, ".")
		
		// Handle different subdomains
		if len(parts) >= 2 {
			subdomain := parts[0]
			
			switch subdomain {
			case "admin":
				// Admin subdomain - only allow admin routes
				if !strings.HasPrefix(c.Request.URL.Path, "/admin") && 
				   !strings.HasPrefix(c.Request.URL.Path, "/api/admin") &&
				   !strings.HasPrefix(c.Request.URL.Path, "/static") {
					c.Redirect(302, "/admin/login")
					c.Abort()
					return
				}
				
			case "quiz":
				// Quiz subdomain - only allow quiz routes
				if !strings.HasPrefix(c.Request.URL.Path, "/quiz") &&
				   !strings.HasPrefix(c.Request.URL.Path, "/api/quiz") &&
				   !strings.HasPrefix(c.Request.URL.Path, "/api/student") &&
				   !strings.HasPrefix(c.Request.URL.Path, "/static") &&
				   !strings.HasPrefix(c.Request.URL.Path, "/uploads") {
					c.Redirect(302, "/quiz")
					c.Abort()
					return
				}
				
			case "register":
				// Register subdomain - only allow registration routes
				if !strings.HasPrefix(c.Request.URL.Path, "/register") &&
				   !strings.HasPrefix(c.Request.URL.Path, "/api/register") &&
				   !strings.HasPrefix(c.Request.URL.Path, "/api/student/courses") &&
				   !strings.HasPrefix(c.Request.URL.Path, "/static") {
					c.Redirect(302, "/register/1")
					c.Abort()
					return
				}
			}
		}
		
		c.Next()
	}
}
```

### Update `cmd/server/main.go`

Add the subdomain middleware:

```go
package main

import (
	"log"
	"mitsuki-jpy-quiz/config"
	"mitsuki-jpy-quiz/internal/database"
	"mitsuki-jpy-quiz/internal/handlers"
	"mitsuki-jpy-quiz/internal/middleware"
	
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()
	
	// Initialize database
	database.Init(cfg.DatabaseURL)
	if err := database.Migrate(); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}
	
	// Initialize handlers
	authHandler := handlers.NewAuthHandler(cfg)
	courseHandler := handlers.NewCourseHandler()
	quizPackageHandler := handlers.NewQuizPackageHandler()
	questionHandler := handlers.NewQuestionHandler()
	studentHandler := handlers.NewStudentHandler()
	webHandler := handlers.NewWebHandler()
	imageHandler := handlers.NewImageHandler()
	
	// Setup router
	router := gin.Default()
	
	// ADD SUBDOMAIN MIDDLEWARE HERE
	router.Use(middleware.SubdomainRouter())
	
	// Load templates
	router.LoadHTMLGlob("web/templates/**/*")
	
	// Static files
	router.Static("/static", "./web/static")
	router.Static("/uploads", "./web/uploads")
	
	// ... rest of your routes ...
	
	log.Printf("Server starting on port %s", cfg.ServerPort)
	router.Run(":" + cfg.ServerPort)
}
```

---

## 3. Nginx Reverse Proxy Configuration

### Install Nginx (if not installed)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### Create Nginx Configuration

**File: `/etc/nginx/sites-available/mitsukijp.com`**

```nginx
# Admin Subdomain
server {
    listen 80;
    server_name admin.mitsukijp.com;
    
    # Redirect to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Quiz Subdomain
server {
    listen 80;
    server_name quiz.mitsukijp.com;
    
    # Redirect to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Register Subdomain
server {
    listen 80;
    server_name register.mitsukijp.com;
    
    # Redirect to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Main Domain (optional)
server {
    listen 80;
    server_name mitsukijp.com www.mitsukijp.com;
    
    # Redirect to quiz subdomain or show landing page
    return 301 http://quiz.mitsukijp.com;
}
```

### Enable the Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/mitsukijp.com /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Enable nginx to start on boot
sudo systemctl enable nginx
```

---

## 4. SSL Certificate Setup (HTTPS)

### Option A: Let's Encrypt (Free & Recommended)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificates for all subdomains
sudo certbot --nginx -d admin.mitsukijp.com -d quiz.mitsukijp.com -d register.mitsukijp.com -d mitsukijp.com -d www.mitsukijp.com

# Certbot will automatically update your nginx config for HTTPS
```

### Option B: Manual SSL Certificate

If you have SSL certificates from another provider:

**Update Nginx Config:**

```nginx
server {
    listen 443 ssl http2;
    server_name admin.mitsukijp.com;
    
    ssl_certificate /etc/ssl/certs/mitsukijp.com.crt;
    ssl_certificate_key /etc/ssl/private/mitsukijp.com.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name admin.mitsukijp.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 5. Testing

### Local Testing (Before DNS is Ready)

Edit your local `/etc/hosts` file:

```bash
sudo nano /etc/hosts
```

Add these lines (replace with your server IP):

```
127.0.0.1   admin.mitsukijp.local
127.0.0.1   quiz.mitsukijp.local
127.0.0.1   register.mitsukijp.local
```

Then test:
- `http://admin.mitsukijp.local`
- `http://quiz.mitsukijp.local`
- `http://register.mitsukijp.local`

### Production Testing

Once DNS is propagated:

```bash
# Test each subdomain
curl -I http://admin.mitsukijp.com
curl -I http://quiz.mitsukijp.com
curl -I http://register.mitsukijp.com

# Test HTTPS (after SSL setup)
curl -I https://admin.mitsukijp.com
curl -I https://quiz.mitsukijp.com
curl -I https://register.mitsukijp.com
```

---

## 6. Alternative: Cloudflare Setup (Easiest)

If you use Cloudflare for DNS:

### Step 1: Add DNS Records in Cloudflare Dashboard

```
Type    Name        Content             Proxy Status
A       admin       YOUR_SERVER_IP      Proxied (Orange Cloud)
A       quiz        YOUR_SERVER_IP      Proxied (Orange Cloud)
A       register    YOUR_SERVER_IP      Proxied (Orange Cloud)
```

### Step 2: Enable SSL in Cloudflare
- Go to SSL/TLS tab
- Set SSL mode to "Flexible" or "Full"
- Cloudflare will handle SSL automatically

### Benefits:
✅ Free SSL certificate  
✅ DDoS protection  
✅ CDN/Caching  
✅ Faster DNS propagation  

---

## 7. Systemd Service for Auto-Start

Create a systemd service to keep your Go app running:

**File: `/etc/systemd/system/mitsukijp-quiz.service`**

```ini
[Unit]
Description=Mitsuki JPY Quiz Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/home/lainlain/Desktop/Go Lang /quiz
ExecStart=/home/lainlain/Desktop/Go Lang /quiz/bin/quiz-server
Restart=always
RestartSec=5
Environment="GIN_MODE=release"

[Install]
WantedBy=multi-user.target
```

### Build and Enable Service

```bash
# Build production binary
cd "/home/lainlain/Desktop/Go Lang /quiz"
go build -o bin/quiz-server cmd/server/main.go

# Reload systemd
sudo systemctl daemon-reload

# Start service
sudo systemctl start mitsukijp-quiz

# Enable on boot
sudo systemctl enable mitsukijp-quiz

# Check status
sudo systemctl status mitsukijp-quiz

# View logs
sudo journalctl -u mitsukijp-quiz -f
```

---

## 8. Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Summary - Quick Setup Checklist

- [ ] 1. Add DNS A records for subdomains
- [ ] 2. Wait for DNS propagation (5-60 minutes)
- [ ] 3. Create `internal/middleware/subdomain.go`
- [ ] 4. Update `cmd/server/main.go` to use subdomain middleware
- [ ] 5. Install and configure Nginx
- [ ] 6. Create Nginx config file
- [ ] 7. Enable Nginx site
- [ ] 8. Install SSL certificate (Let's Encrypt)
- [ ] 9. Create systemd service
- [ ] 10. Test all subdomains
- [ ] 11. Configure firewall

---

## Troubleshooting

### Issue: "502 Bad Gateway"
**Solution:** Make sure your Go app is running on port 8080
```bash
sudo systemctl status mitsukijp-quiz
sudo journalctl -u mitsukijp-quiz -f
```

### Issue: "DNS_PROBE_FINISHED_NXDOMAIN"
**Solution:** DNS not propagated yet, wait longer or check DNS records

### Issue: Subdomain routing not working
**Solution:** Check nginx logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Issue: SSL certificate error
**Solution:** Renew certificate
```bash
sudo certbot renew --dry-run
sudo certbot renew
```

---

**Need Help?** Check the logs:
- Nginx: `/var/log/nginx/error.log`
- Application: `sudo journalctl -u mitsukijp-quiz -f`
- DNS: `dig admin.mitsukijp.com`

